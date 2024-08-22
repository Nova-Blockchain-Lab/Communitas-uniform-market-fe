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
    if (!country) {
      setEnergyMarketAddress(Object.values(contractAddresses[chainId])[0]);
      return;
    }
    setEnergyMarketAddress(contractAddresses[chainId][country]);
  };

  useEffect(() => {
    if (!chainId || !isConnected || !contractAddresses[chainId]) {
      setEnergyMarketAddresses(undefined);
      return;
    }
    setEnergyMarketAddresses(contractAddresses[chainId]);
    fetchCountryAndSetEnergyMarketAddress();
  }, [isConnected, chainId]);

  console.log(energyMarketAddress);

  return (
    <Box width="250px" marginRight="16px" display="flex" alignItems="center">
      <Text color="white" marginRight="8px" width="200px">
        Select Region:
      </Text>
      <Select
        value={energyMarketAddress}
        variant="outline"
        size="md"
        borderColor="gray.400"
        backgroundColor={"white"}
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
