import React, { useEffect } from "react";
import { Box, Select, Text } from "@chakra-ui/react"; // Added Text import
import { contractAddresses, EthereumAddress } from "../constants/config";
import { useAccount } from "wagmi";
import { useAppContext } from "./AppContext";
import { fetchUserCountry } from "@/utils/fetchUserCountry";

const RegionDropdownList: React.FC = () => {
  const { isConnected, chainId } = useAccount();

  const { setEnergyMarketAddress, energyMarketAddress } = useAppContext();

  const [energyMarketAddresses, setEnergyMarketAddresses] =
    React.useState<any>(undefined);

  const fetchCountryAndSetEnergyMarketAddress = async () => {
    if (!chainId || !isConnected) return;
    const country = await fetchUserCountry();
    if (!country || !Object.entries(contractAddresses[chainId]["EnergyBiddingMarket"]).some((key,) => key[0] == country)) {
      console.log(Object.values(contractAddresses[chainId]["EnergyBiddingMarket"])[0])
      setEnergyMarketAddress(Object.values(contractAddresses[chainId]["EnergyBiddingMarket"])[0]);
      return;
    }
    setEnergyMarketAddress(contractAddresses[chainId]["EnergyBiddingMarket"][country]);
  };

  useEffect(() => {
    if (!chainId || !isConnected || !contractAddresses[chainId] || !contractAddresses[chainId]["EnergyBiddingMarket"]) {
      setEnergyMarketAddresses(undefined);
      return;
    }
    setEnergyMarketAddresses(contractAddresses[chainId]["EnergyBiddingMarket"]);
    fetchCountryAndSetEnergyMarketAddress();
  }, [isConnected, chainId]);

  return (
      <Box width="130px" marginRight="16px" display="flex" flexDirection="column" alignItems="flex-start">
        <Text color="white" marginBottom="4px" width="200px">
          Select Region:
        </Text>
        <Select
            value={energyMarketAddress}
            variant="outline"
            size="md"
            borderColor="gray.400"
            backgroundColor="white"
            _hover={{ borderColor: "gray.600" }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px blue.500",
            }}
            onChange={(e) =>
                setEnergyMarketAddress(e.target.value as `0x${string}`)
            }
        >
          <option value="" disabled>
            Select a region
          </option>
          {energyMarketAddresses &&
              Object.entries(energyMarketAddresses).map(([country, address]) => (
                  <option key={country} value={address as string}>
                    {country}
                  </option>
              ))}
        </Select>
      </Box>

  );
};

export default RegionDropdownList;
