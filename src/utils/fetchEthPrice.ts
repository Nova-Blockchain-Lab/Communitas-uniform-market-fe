import axios from 'axios';

export const fetchEthPrice = async (): Promise<number | undefined> => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur'
    );
    return response.data.ethereum.eur;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
  }
};
