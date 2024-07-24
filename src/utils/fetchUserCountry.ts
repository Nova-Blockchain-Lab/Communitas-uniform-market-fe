import axios from 'axios';

interface CountryResponse {
    country_name: string;
  }

export const fetchUserCountry = async (): Promise<string | undefined> => {
    try {
      const response = await axios.get<CountryResponse>('https://ipapi.co/json/');
      return response.data.country_name;
    } catch (error) {
      console.error('Error fetching user country:', error);
      return undefined;
    }
  }
  