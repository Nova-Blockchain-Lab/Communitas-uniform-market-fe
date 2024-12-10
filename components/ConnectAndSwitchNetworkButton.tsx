import React, {useEffect} from 'react';
import {useAccount, useSwitchChain} from 'wagmi';
import {Button, Box, Text} from '@chakra-ui/react';
import {defaultChain} from '../constants/config';

const ConnectAndSwitchNetworkButton: React.FC = () => {
  const {isConnected, chain} = useAccount();
  const {switchChain} = useSwitchChain();
  const {id: defaultChainId, name: defaultChainName} = defaultChain;

  useEffect(() => {
    if (isConnected && chain?.id !== defaultChainId) {
      // Optionally prompt the user to switch networks when connected
      console.warn('Connected to the wrong network. Prompting switch.');
    }
  }, [isConnected, chain]);

  return (
    <Box>
      {!isConnected ? (
        <w3m-connect-button/>
      ) : chain?.id !== defaultChainId ? (
        <Box textAlign="center" mt={2}>
          <Text fontStyle="Georgia" margin={2} color="red.600">
            Please switch to the {defaultChainName} network.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => {
              switchChain({chainId: defaultChainId});
            }}
          >
            Switch Network
          </Button>
        </Box>
      ) : (
        <Text color="green.500">Connected to the correct network!</Text>
      )}
    </Box>
  );
};

export default ConnectAndSwitchNetworkButton;
