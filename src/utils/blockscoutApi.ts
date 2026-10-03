const BLOCKSCOUT_PROXY = "https://testnet.explorer.novaims.unl.pt/api";

interface BlockscoutLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  timeStamp: string;
  transactionHash: string;
  logIndex: string;
}

interface BlockscoutResponse {
  status: string;
  message: string;
  result: BlockscoutLog[];
}

export type { BlockscoutLog };

/** Block number closest to a unix time (Etherscan-style getblocknobytime). */
export async function fetchBlockByTime(timestamp: number, closest: "before" | "after"): Promise<number> {
  const params = new URLSearchParams({
    module: "block",
    action: "getblocknobytime",
    timestamp: String(timestamp),
    closest,
  });
  const response = await fetch(`${BLOCKSCOUT_PROXY}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Blockscout returned HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data.status !== "1") {
    throw new Error(`Blockscout error: ${data.message}`);
  }
  return Number(data.result.blockNumber);
}

export async function fetchLogsFromBlockscout({
  address,
  fromBlock = 0,
  toBlock = "latest",
  topic0,
  topic1,
  topic2,
  topic3,
}: {
  address: string;
  fromBlock?: number | string;
  toBlock?: number | string;
  topic0?: string;
  topic1?: string;
  topic2?: string;
  topic3?: string;
}): Promise<BlockscoutLog[]> {
  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    address,
    fromBlock: String(fromBlock),
    toBlock: String(toBlock),
  });

  if (topic0) params.set("topic0", topic0);
  if (topic1) {
    params.set("topic1", topic1);
    params.set("topic0_1_opr", "and");
  }
  if (topic2) {
    params.set("topic2", topic2);
    params.set("topic0_2_opr", "and");
  }
  if (topic3) {
    params.set("topic3", topic3);
    params.set("topic0_3_opr", "and");
  }

  const url = `${BLOCKSCOUT_PROXY}?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Blockscout returned HTTP ${response.status}`);
  }
  const data: BlockscoutResponse = await response.json();

  if (data.status !== "1" || !Array.isArray(data.result)) {
    // "No logs found" is a valid empty result, not an error
    if (data.message === "No logs found") return [];
    throw new Error(`Blockscout error: ${data.message}`);
  }

  return data.result;
}
