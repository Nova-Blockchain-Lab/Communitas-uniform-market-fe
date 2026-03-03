import type { NextApiRequest, NextApiResponse } from "next";

const EXPLORER_API = "https://testnet.explorer.novaims.unl.pt/api";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ...query } = req.query;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string") params.set(key, value);
  }

  try {
    const response = await fetch(`${EXPLORER_API}?${params.toString()}`);
    if (!response.ok) {
      res.status(response.status).json({ status: "0", message: `Blockscout ${response.status}`, result: [] });
      return;
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Blockscout proxy error:", error);
    res.status(502).json({ status: "0", message: "Proxy error", result: [] });
  }
}
