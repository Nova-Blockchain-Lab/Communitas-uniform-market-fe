import React from "react";
import { ArrowDown, ArrowUp, Clock, RefreshCw, Wallet } from "lucide-react";
import { BigNumber, type providers } from "ethers";
import { EthBridger, EthDepositMessageStatus, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "motion/react";
import { useAccount, useSwitchChain } from "wagmi";

import { defaultChain } from "@/config/chains";
import { l1Provider, l2Provider } from "@/config/providers";
import { useEthersSigner } from "@/utils/ethersHelper";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";
import { TransactionModal } from "@/components/ui/TransactionModal";

interface SubmitButtonProps {
  originNetwork: number;
  amount: bigint;
  hasEnoughBalance: boolean;
}

/**
 * maxFeePerGas = 5x the latest base fee and no tip. The Arbitrum sequencer ignores tips, and
 * the ethers default (2x base fee) lands below the next block's base fee often enough to
 * revert with "max fee per gas less than block base fee" (bug of 2026-05-20). Read through
 * our own provider, not the wallet, whose shared RPC rate-limits (Aug 2026).
 */
async function gasOverrides(provider: providers.Provider) {
  const baseFee = (await provider.getBlock("latest")).baseFeePerGas ?? BigNumber.from(0);
  return { maxFeePerGas: baseFee.mul(5), maxPriorityFeePerGas: BigNumber.from(0) };
}

const BUTTON_BASE = `
  w-full flex items-center justify-center gap-2
  min-h-[48px] px-5 sm:px-6 py-3 sm:py-4
  text-white font-semibold text-sm sm:text-base
  rounded-xl transition-all duration-200
  focus-visible:outline-none focus-visible:ring-2
`;
const BUTTON_DISABLED = "bg-gray-600 cursor-not-allowed opacity-50";
const SPINNER = <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />;

const SubmitButton: React.FC<SubmitButtonProps> = ({ originNetwork, amount, hasEnoughBalance }) => {
  const { isConnected, chain, address } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const signer = useEthersSigner();
  const tx = useTransactionFeedback();
  const isWithdrawal = originNetwork === defaultChain.id;

  const submit = () =>
    tx.run(async (update) => {
      if (!signer || !address) throw new Error("Connect your wallet first");
      const bridger = new EthBridger(getArbitrumNetwork(defaultChain.id));
      const value = BigNumber.from(amount.toString());

      if (isWithdrawal) {
        const sent = await bridger.withdraw({
          from: address,
          amount: value,
          childSigner: signer,
          destinationAddress: address,
          overrides: await gasOverrides(l2Provider),
        });
        update({ hash: sent.hash, status: "confirming" });
        // The withdrawal itself completes on Arbitrum after the challenge period.
        await sent.wait();
        return;
      }

      const overrides: Awaited<ReturnType<typeof gasOverrides>> & { gasLimit?: BigNumber } =
        await gasOverrides(l1Provider);
      try {
        // Estimate on our RPC so ethers does not ask the wallet; getDepositRequest only encodes.
        const { txRequest } = await bridger.getDepositRequest({ amount: value, from: address });
        overrides.gasLimit = (await l1Provider.estimateGas(txRequest)).mul(3).div(2);
      } catch {
        // Leave gasLimit unset and let ethers estimate through the wallet.
      }
      const sent = await bridger.deposit({ amount: value, parentSigner: signer, overrides });
      update({ hash: sent.hash, status: "confirming" });
      const receipt = await sent.wait();
      update({ status: "bridging" });
      const result = await receipt.waitForChildTransactionReceipt(l2Provider);
      if (!result.complete) {
        throw new Error(`Bridge failed. Status: ${EthDepositMessageStatus[await result.message.status()]}`);
      }
    });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 w-full">
        <div className="p-3 rounded-full bg-emerald-500/10">
          <Wallet size={24} className="text-emerald-400" />
        </div>
        <p className="text-sm text-gray-400">Connect wallet to bridge</p>
        <appkit-button />
      </div>
    );
  }

  if (originNetwork !== chain?.id) {
    return (
      <motion.button
        whileHover={isSwitching ? {} : { scale: 1.02 }}
        whileTap={isSwitching ? {} : { scale: 0.98 }}
        onClick={() => switchChain({ chainId: originNetwork })}
        disabled={isSwitching}
        className={`${BUTTON_BASE} focus-visible:ring-amber-400/60 ${
          isSwitching
            ? BUTTON_DISABLED
            : "bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg hover:shadow-xl hover:shadow-amber-500/25"
        }`}
      >
        {isSwitching ? SPINNER : <RefreshCw size={18} className="shrink-0" />}
        <span className="truncate">
          {isSwitching ? "Switching..." : `Switch to ${isWithdrawal ? "Nova Cidade" : "Arbitrum"}`}
        </span>
      </motion.button>
    );
  }

  const isDisabled = tx.isBusy || !hasEnoughBalance || amount === 0n;
  let label = isWithdrawal ? "Withdraw to Arbitrum" : "Deposit to Nova Cidade";
  if (tx.status === "pending") label = "Confirm in Wallet...";
  else if (tx.status === "bridging") label = "Bridging...";
  else if (tx.isBusy) label = "Processing...";
  else if (amount === 0n) label = "Enter an amount";
  else if (!hasEnoughBalance) label = "Insufficient balance";

  return (
    <div className="space-y-3">
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        onClick={submit}
        disabled={isDisabled}
        aria-busy={tx.isBusy}
        className={`${BUTTON_BASE} ${
          isWithdrawal ? "focus-visible:ring-blue-400/60" : "focus-visible:ring-emerald-400/60"
        } ${
          isDisabled
            ? BUTTON_DISABLED
            : isWithdrawal
              ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
              : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
        }`}
      >
        {tx.isBusy ? SPINNER : isWithdrawal ? <ArrowDown size={18} className="shrink-0" /> : <ArrowUp size={18} className="shrink-0" />}
        <span className="truncate">{label}</span>
      </motion.button>

      {isWithdrawal && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          <Clock size={14} className="shrink-0" />
          <span>Withdrawals take ~7 days due to the challenge period</span>
        </div>
      )}

      <TransactionModal
        isOpen={tx.isOpen}
        status={tx.status}
        hash={tx.hash}
        error={tx.error}
        details={{
          type: isWithdrawal ? "bridge_withdraw" : "bridge_deposit",
          totalCost: (Number(amount) / 1e18).toFixed(6),
          currency: "ETH",
        }}
        onClose={tx.close}
        onRetry={submit}
      />
    </div>
  );
};

export default SubmitButton;
