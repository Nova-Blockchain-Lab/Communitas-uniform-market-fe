import axios, { AxiosError } from "axios";

// Constants
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
const REQUEST_TIMEOUT = 10000; // 10 seconds
const DEFAULT_ETH_PRICE = 3000; // Fallback price if API fails

interface CoinGeckoResponse {
  ethereum?: {
    eur?: number;
  };
}

export interface FetchEthPriceResult {
  price: number | undefined;
  error: Error | null;
  isDefault: boolean;
}

/**
 * Fetches the current ETH price from CoinGecko API
 * Returns price in EUR
 *
 * @param useFallback - If true, returns default price on failure instead of undefined
 */
export const fetchEthPrice = async (useFallback: boolean = false): Promise<number | undefined> => {
  try {
    const response = await axios.get<CoinGeckoResponse>(COINGECKO_API_URL, {
      params: {
        ids: "ethereum",
        vs_currencies: "eur",
      },
      timeout: REQUEST_TIMEOUT,
    });

    const price = response.data?.ethereum?.eur;

    if (typeof price !== "number" || isNaN(price)) {
      console.error("Invalid ETH price response:", response.data);
      return useFallback ? DEFAULT_ETH_PRICE : undefined;
    }

    return price;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.code === "ECONNABORTED") {
        console.error("ETH price fetch timeout");
      } else if (error.response) {
        console.error(`ETH price API error: ${error.response.status}`);
      } else if (error.request) {
        console.error("ETH price network error - no response received");
      }
    } else {
      console.error("Error fetching ETH price:", error);
    }

    return useFallback ? DEFAULT_ETH_PRICE : undefined;
  }
};

/**
 * Fetches ETH price with detailed result including error information
 */
export const fetchEthPriceWithDetails = async (): Promise<FetchEthPriceResult> => {
  try {
    const response = await axios.get<CoinGeckoResponse>(COINGECKO_API_URL, {
      params: {
        ids: "ethereum",
        vs_currencies: "eur",
      },
      timeout: REQUEST_TIMEOUT,
    });

    const price = response.data?.ethereum?.eur;

    if (typeof price !== "number" || isNaN(price)) {
      return {
        price: DEFAULT_ETH_PRICE,
        error: new Error("Invalid price data received"),
        isDefault: true,
      };
    }

    return {
      price,
      error: null,
      isDefault: false,
    };
  } catch (error) {
    return {
      price: DEFAULT_ETH_PRICE,
      error: error instanceof Error ? error : new Error("Unknown error"),
      isDefault: true,
    };
  }
};
