import React from "react";
import { useAccount } from "wagmi";
import { ExternalLink } from "lucide-react";
import { contractAddresses, OPENSEA_URL_CREATOR } from "@/config/constants";

const ViewOnOpenseaButton: React.FC<{ tokenId: string }> = ({ tokenId }) => {
  const { chainId } = useAccount();
  const contract = chainId ? contractAddresses[chainId]?.CommunitasNFT?.General : undefined;
  if (!contract) return null;

  return (
    <a
      href={OPENSEA_URL_CREATOR(contract, tokenId)}
      target="_blank"
      rel="noopener noreferrer"
      className="
        inline-flex items-center justify-center gap-1.5 sm:gap-2 w-full min-h-[44px]
        px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg select-none
        bg-transparent text-[var(--color-primary-400)] border border-[var(--color-primary-500)]/30
        hover:bg-[var(--color-primary-500)]/10 hover:border-[var(--color-primary-500)]/50
        active:bg-[var(--color-primary-500)]/15 transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)]
      "
    >
      OpenSea
      <ExternalLink size={16} className="shrink-0" />
    </a>
  );
};

export default ViewOnOpenseaButton;
