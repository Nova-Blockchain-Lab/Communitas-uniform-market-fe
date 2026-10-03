import React from "react";
import { useAccount, useConfig } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { ParentToChildMessageGasEstimator, ParentToChildMessageStatus, ParentTransactionReceipt } from "@arbitrum/sdk";
import { getBaseFee } from "@arbitrum/sdk/dist/lib/utils/lib";
import { ethers } from "ethers";
import { ArrowUpDown } from "lucide-react";

import CommunitasNFTL1Abi from "@/../abi/CommunitasNFTL1.json";
import { contractAddresses } from "@/config/constants";
import { defaultChain } from "@/config/chains";
import { l1Provider, l2Provider } from "@/config/providers";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "@/components/ui/TransactionModal";

export interface BridgeNFTL1ToL2ButtonProps {
  tokenId: string;
  refetchNFTs: () => void;
}

const MINT_FROM_BRIDGE = new ethers.utils.Interface(["function mintFromBridge(address receiver, uint256 tokenId)"]);

const BridgeNFTL1ToL2Button: React.FC<BridgeNFTL1ToL2ButtonProps> = ({ tokenId, refetchNFTs }) => {
  const { isConnected, address, chain } = useAccount();
  const config = useConfig();
  const tx = useTransactionFeedback();

  const nftContractAddress = chain ? contractAddresses[chain.id]?.CommunitasNFT?.General : undefined;
  const nftContractAddressOnL2 = contractAddresses[defaultChain.id]?.CommunitasNFT?.General;

  const handleBridge = async () => {
    if (!address || !nftContractAddress || !nftContractAddressOnL2) return;
    const ok = await tx.run(async (update) => {
      // Price the retryable ticket that mints the NFT on Nova Cidade.
      const gasParams = await new ParentToChildMessageGasEstimator(l2Provider).estimateAll(
        {
          from: nftContractAddress,
          to: nftContractAddressOnL2,
          l2CallValue: ethers.BigNumber.from(0),
          excessFeeRefundAddress: address,
          callValueRefundAddress: address,
          data: MINT_FROM_BRIDGE.encodeFunctionData("mintFromBridge", [address, tokenId]),
        },
        await getBaseFee(l1Provider),
        l1Provider,
      );
      const gasPriceBid = await l2Provider.getGasPrice();

      const hash = await tx.writeContractAsync({
        abi: CommunitasNFTL1Abi.abi,
        address: nftContractAddress,
        functionName: "bridgeToL2",
        args: [tokenId, gasParams.maxSubmissionCost, gasParams.gasLimit, gasPriceBid],
        value: gasParams.deposit.toBigInt(),
      });
      update({ hash, status: "confirming" });
      await waitForTransactionReceipt(config, { hash });

      update({ status: "bridging" });
      const receipt = new ParentTransactionReceipt(await l1Provider.getTransactionReceipt(hash));
      const [message] = await receipt.getParentToChildMessages(l2Provider);
      if (!message) throw new Error("No bridge message found for this transaction");
      const result = await message.waitForStatus();
      if (result.status !== ParentToChildMessageStatus.REDEEMED) {
        throw new Error("Bridge confirmation failed. Please try again.");
      }
    });
    if (ok) refetchNFTs();
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleBridge}
        loading={tx.isBusy}
        disabled={tx.isBusy || !isConnected || !nftContractAddress}
        icon={<ArrowUpDown size={16} />}
        className="min-h-[44px]"
      >
        Bridge to L2
      </Button>

      <TransactionModal
        isOpen={tx.isOpen}
        status={tx.status}
        hash={tx.hash}
        error={tx.error}
        details={{ type: "bridge_nft_l1" }}
        onClose={tx.close}
        onRetry={handleBridge}
      />
    </>
  );
};

export default BridgeNFTL1ToL2Button;
