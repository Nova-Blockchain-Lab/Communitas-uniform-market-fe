/** Country name from the visitor's IP, or undefined (the region then defaults to the first one). */
export const fetchUserCountry = async (): Promise<string | undefined> => {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    return res.ok ? (await res.json()).country_name : undefined;
  } catch {
    return undefined;
  }
};
