import React, { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useConfig,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { Image as ImageIcon, RefreshCw, Plus, AlertCircle } from "lucide-react";
import { Spinner, Switch } from "@chakra-ui/react";
import { motion } from "framer-motion";

import { contractAddresses, defaultChain } from "@/config";
import CommunitasNFTAbi from "@/../abi/CommunitasNFT.json";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import NFTCard from "@/components/nft/NFTCard";
import PendingNFTs from "@/components/nft/PendingNFTBox";
import { Card, CardHeader, Button, TransactionModal, TransactionStatus } from "@/components/ui";
import { AbiFunction } from "viem";
import { NFTData } from "@/utils/executeMessageL2ToL1Helper";

const NFTBox: React.FC = () => {
  const { address, isConnected, chainId, chain } = useAccount();
  const { chains } = useConfig();
  const { switchChain } = useSwitchChain();

  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Get NFT contract address based on chain
  const nftContractAddress =
    isConnected && chainId && chains.map((c) => c.id).includes(chainId)
      ? (contractAddresses[chainId]?.["CommunitasNFT"]?.["General"] as `0x${string}`)
      : undefined;

  const isL2 = chainId === defaultChain.id;
  const otherChainId = chains.find((c) => c.id !== chainId)?.id;

  // Contract reads
  const {
    data: nftsBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract(
    nftContractAddress
      ? {
          address: nftContractAddress,
          abi: CommunitasNFTAbi.abi,
          functionName: "balanceOf",
          args: [address],
        }
      : undefined
  );

  const tokenIdsConfig = nftsBalance
    ? Array.from({ length: Number(nftsBalance) }, (_, i) => ({
        abi: CommunitasNFTAbi.abi as AbiFunction[],
        address: nftContractAddress,
        functionName: "tokenOfOwnerByIndex",
        args: [address, i],
      }))
    : [];

  const { data: tokenIdsOwned, isLoading: isTokenIdsLoading, refetch: refetchTokenIds } = useReadContracts({
    contracts: tokenIdsConfig,
  });

  const tokenUrisConfig = tokenIdsOwned
    ? tokenIdsOwned
        .filter((item) => item.result != null)
        .map((item) => ({
          abi: CommunitasNFTAbi.abi as AbiFunction[],
          address: nftContractAddress,
          functionName: "tokenURI",
          args: [Number(item.result)],
        }))
    : [];

  const { data: tokenUris, isLoading: isTokenUrisLoading, refetch: refetchTokenUris } = useReadContracts({
    contracts: tokenUrisConfig,
  });

  // Mint NFT
  const { data: hash, writeContract: mintNFT, isPending: isMinting, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Update modal status based on transaction state
  useEffect(() => {
    if (isMinting) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      refetchAll();
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isMinting, isConfirming, isConfirmed, writeError, confirmError]);

  const handleMint = () => {
    if (!nftContractAddress) return;
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    mintNFT({
      abi: CommunitasNFTAbi.abi,
      address: nftContractAddress,
      functionName: "mint",
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const handleSwitchChain = () => {
    if (otherChainId) {
      switchChain({ chainId: otherChainId });
    }
  };

  const fetchNFTData = useCallback(async () => {
    if (!tokenIdsOwned || !tokenUris || tokenIdsOwned.length !== tokenUris.length) {
      setNfts([]);
      return;
    }

    setIsLoading(true);
    try {
      const tokenData = await Promise.all(
        tokenUris.map(async (tokenUri, i) => {
          if (!tokenUri.result) return null;
          const tokenId = String(tokenIdsOwned[i].result);
          try {
            const response = await fetch(tokenUri.result.toString());
            const metadata = await response.json();
            return {
              tokenId,
              name: metadata.name || `NFT #${tokenId}`,
              image: metadata.image || "",
              description: metadata.description || "",
            } as NFTData;
          } catch {
            return {
              tokenId,
              name: `NFT #${tokenId}`,
              image: "",
              description: "",
            } as NFTData;
          }
        })
      );
      setNfts(tokenData.filter(Boolean) as NFTData[]);
    } catch (error) {
      console.error("Error fetching NFT data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [tokenIdsOwned, tokenUris]);

  const refetchAll = useCallback(async () => {
    await refetchBalance();
  }, [refetchBalance]);

  // Effects
  useEffect(() => {
    if (isConnected && nftContractAddress) {
      refetchBalance();
    }
  }, [isConnected, address, chainId, nftContractAddress, refetchBalance]);

  useEffect(() => {
    if (nftsBalance) refetchTokenIds();
  }, [nftsBalance, refetchTokenIds]);

  useEffect(() => {
    if (tokenIdsOwned) refetchTokenUris();
  }, [tokenIdsOwned, refetchTokenUris]);

  useEffect(() => {
    if (tokenUris) fetchNFTData();
  }, [tokenUris, fetchNFTData]);

  useEffect(() => {
    setIsLoading(isBalanceLoading || isTokenIdsLoading || isTokenUrisLoading);
  }, [isBalanceLoading, isTokenIdsLoading, isTokenUrisLoading]);

  const needsConnection = !isConnected || !nftContractAddress;
  const nftCount = nftsBalance ? Number(nftsBalance) : 0;

  return (
    <>
      <div className="w-full max-w-5xl space-y-6">
        <Card padding="lg">
          <CardHeader
            title="Your NFTs"
            subtitle={`${nftCount} item${nftCount !== 1 ? "s" : ""} on ${chain?.name || "Network"}`}
            icon={<ImageIcon size={20} />}
            action={
              !needsConnection && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={refetchAll}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                  </button>
                </div>
              )
            }
          />

          {needsConnection ? (
            <div className="py-8">
              <ConnectAndSwitchNetworkButton />
            </div>
          ) : (
            <>
              {/* Chain Switcher */}
              <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl mb-6">
                <span className={`text-sm font-medium ${!isL2 ? "text-white" : "text-gray-400"}`}>
                  L1 (Arbitrum)
                </span>
                <Switch
                  isChecked={isL2}
                  onChange={handleSwitchChain}
                  colorScheme="blue"
                  size="lg"
                />
                <span className={`text-sm font-medium ${isL2 ? "text-white" : "text-gray-400"}`}>
                  L2 (Nova Cidade)
                </span>
              </div>

              {/* Mint Button (L2 only) */}
              {isL2 && (
                <div className="flex justify-center mb-6">
                  <Button
                    variant="primary"
                    onClick={handleMint}
                    loading={isMinting || isConfirming}
                    disabled={isMinting || isConfirming}
                    icon={<Plus size={18} />}
                  >
                    Mint Test NFT
                  </Button>
                </div>
              )}

              {/* NFT Grid */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Spinner size="xl" color="blue.400" />
                  <p className="mt-4 text-gray-400">Loading your NFTs...</p>
                </div>
              ) : nftCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-white/5 mb-4">
                    <AlertCircle size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No NFTs Found</h3>
                  <p className="text-gray-400 max-w-sm">
                    You do not have any NFTs on {chain?.name}.
                    {isL2 && " Mint a test NFT to get started!"}
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {nfts.map((nft, index) => (
                    <motion.div
                      key={nft.tokenId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <NFTCard
                        isL3={isL2}
                        nft={nft}
                        refetchNFTs={refetchAll}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </Card>

        {/* Pending NFTs Section */}
        {isConnected && <PendingNFTs refetchNFTs={refetchAll} />}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "mint",
        }}
        onClose={closeModal}
        onRetry={handleMint}
      />
    </>
  );
};

export default NFTBox;
