import React, { useEffect } from 'react';
import { Box, Select } from '@chakra-ui/react';
import { contractAddresses } from '../constants/config';
import { useAccount } from 'wagmi';
import { useAppContext } from './AppContext';

const RegionDropdownList: React.FC = () => {

    const { isConnected, chainId } = useAccount();

    const { setEnergyMarketAddress } = useAppContext();

    const [energyMarketAddresses, setEnergyMarketAddresses] = React.useState<any>(undefined);

    useEffect(() => {
        if (!chainId || !isConnected || !contractAddresses[chainId]) return;
        setEnergyMarketAddresses(contractAddresses[chainId].energyMarket);
        setEnergyMarketAddress(Object.values(contractAddresses[chainId].energyMarket)[0]);
    }, [isConnected, chainId]);

    return (
        <Box width="200px" marginRight="16px">
          <Select
            variant="outline"
            size="md"
            borderColor="gray.400"
            backgroundColor={"white"}
            _hover={{ borderColor: "gray.600" }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px blue.500",
            }}
            onChange={(e) => setEnergyMarketAddress(e.target.value as `0x${string}`)}
          >
            {energyMarketAddresses && (Object.entries(energyMarketAddresses).map(([country, address]) => (
              <option key={country} value={address as string}>
                {country}
              </option>
            )))}
          </Select>
        </Box>
      );
    };

    export default RegionDropdownList;