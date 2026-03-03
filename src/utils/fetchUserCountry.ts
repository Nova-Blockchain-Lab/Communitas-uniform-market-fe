import axios from 'axios';

interface CountryResponse {
    country_name: string;
  }

export const fetchUserCountry = async (): Promise<string | undefined> => {
    try {
      const response = await axios.get<CountryResponse>('https://ipapi.co/json/', {
        timeout: 5000,
      });
      return response.data.country_name;
    } catch {
      // Silently fall back — region will default to first available
      return undefined;
    }
  }
  