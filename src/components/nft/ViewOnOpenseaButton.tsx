import React, { useCallback, useMemo } from "react";
import { contractAddresses, OPENSEA_URL_CREATOR } from "@/config";
import { useAccount } from "wagmi";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";

interface ViewOnOpenseaButtonProps {
  tokenId: string;
}

const ViewOnOpenseaButton: React.FC<ViewOnOpenseaButtonProps> = ({ tokenId }) => {
  const { chainId } = useAccount();

  const openseaLink = useMemo(() => {
    if (!chainId) return undefined;
    const contractAddress = contractAddresses[chainId]?.["CommunitasNFT"]?.["General"];
    if (!contractAddress) return undefined;
    return OPENSEA_URL_CREATOR(contractAddress, tokenId);
  }, [chainId, tokenId]);

  const handleClick = useCallback(() => {
    if (openseaLink) {
      window.open(openseaLink, "_blank", "noopener,noreferrer");
    }
  }, [openseaLink]);

  return (
    <Button
      variant="outline"
      size="sm"
      fullWidth
      onClick={handleClick}
      disabled={!openseaLink}
      icon={<ExternalLink size={16} />}
      iconPosition="right"
      className="min-h-[44px]"
    >
      OpenSea
    </Button>
  );
};

export default ViewOnOpenseaButton;
