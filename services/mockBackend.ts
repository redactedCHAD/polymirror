
import { Trade, TradeSide, TradeStatus, BotConfig, BotStats, LogEntry, TokenBalance } from '../types';

// Constants for Polygon / Polymarket
const POLYGON_RPC = "https://polygon-rpc.com";
// Switched from Cloudflare to LlamaRPC for better stability/CORS support
const ETHEREUM_RPC = "https://eth.llamarpc.com"; 
const CTF_EXCHANGE_ADDR = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";
const ORDER_FILLED_TOPIC = "0x367819359e75e3532e2174f05537c9e13e43073e047f9e1f3768ba95139a130e";
const GAMMA_API_URL = "https://gamma-api.polymarket.com/markets";

// ERC20 Contract Addresses
const POLY_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const POLY_USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
const ETH_USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Derived Executor Address (The wallet mapped to the "Executor Private Key")
const EXECUTOR_ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

// Helper for LocalStorage
const STORAGE_KEY = 'polymirror_config';
const loadStoredConfig = (): BotConfig => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    isActive: true,
    targetWallet: "0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d",
    walletHistory: ["0x6031b6eed1c97e853c6e0f03ad3ce3529351f96d"],
    copyRatio: 0.1,
    maxCapUSDC: 500,
    slippageTolerance: 0.05,
    rpcUrl: POLYGON_RPC,
    privateKeyMasked: true
  };
};

// State Storage
let currentTrades: Trade[] = [];
let currentLogs: LogEntry[] = [
  { id: 'init-1', timestamp: Date.now(), level: 'INFO', message: 'Engine Online.' },
  { id: 'init-2', timestamp: Date.now(), level: 'INFO', message: 'Syncing live blockchain feeds...' }
];

let currentConfig: BotConfig = loadStoredConfig();
let lastProcessedBlock = 0;

// Helper: JSON-RPC Call
async function rpcCall(rpc: string, method: string, params: any[]) {
  try {
    const response = await fetch(rpc, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.result;
  } catch (err) {
    console.error(`RPC Error on ${rpc}:`, err);
    throw err;
  }
}

// Fetch ERC20 Balance
async function getERC20Balance(rpc: string, token: string, user: string, decimals: number) {
  try {
    const data = "0x70a08231" + user.slice(2).padStart(64, '0');
    const result = await rpcCall(rpc, "eth_call", [{ to: token, data: data }, "latest"]);
    if (!result || result === '0x') return 0;
    return Number(BigInt(result)) / Math.pow(10, decimals);
  } catch (e) {
    return 0;
  }
}

export const fetchTrades = async (): Promise<Trade[]> => currentTrades;
export const fetchConfig = async (): Promise<BotConfig> => currentConfig;
export const fetchLogs = async (): Promise<LogEntry[]> => currentLogs;

export const updateConfig = async (newConfig: Partial<BotConfig>): Promise<BotConfig> => {
  if (newConfig.targetWallet && newConfig.targetWallet.toLowerCase() !== currentConfig.targetWallet.toLowerCase()) {
    const wallet = newConfig.targetWallet.toLowerCase();
    // Maintain a unique history list
    const history = [wallet, ...currentConfig.walletHistory.filter(w => w.toLowerCase() !== wallet)];
    currentConfig.walletHistory = history.slice(0, 10);
  }
  currentConfig = { ...currentConfig, ...newConfig };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  return currentConfig;
};

export const fetchExecutorBalances = async (): Promise<TokenBalance[]> => {
  const address = EXECUTOR_ADDRESS;
  const balances: TokenBalance[] = [];
  
  // Fetch Polygon Data
  try {
    const maticHex = await rpcCall(POLYGON_RPC, "eth_getBalance", [address, "latest"]);
    const matic = Number(BigInt(maticHex)) / 1e18;
    balances.push({ symbol: 'MATIC', network: 'Polygon', amount: matic, usdValue: matic * 0.42 });

    const usdcPoly = await getERC20Balance(POLYGON_RPC, POLY_USDC, address, 6);
    balances.push({ symbol: 'USDC', network: 'Polygon', amount: usdcPoly, usdValue: usdcPoly, contractAddress: POLY_USDC });

    const usdtPoly = await getERC20Balance(POLYGON_RPC, POLY_USDT, address, 6);
    balances.push({ symbol: 'USDT', network: 'Polygon', amount: usdtPoly, usdValue: usdtPoly, contractAddress: POLY_USDT });
  } catch (err) {
    console.error("Polygon balance fetch failed", err);
  }

  // Fetch Ethereum Data
  try {
    const ethHex = await rpcCall(ETHEREUM_RPC, "eth_getBalance", [address, "latest"]);
    const eth = Number(BigInt(ethHex)) / 1e18;
    balances.push({ symbol: 'ETH', network: 'Ethereum', amount: eth, usdValue: eth * 2600 });

    const usdcEth = await getERC20Balance(ETHEREUM_RPC, ETH_USDC, address, 6);
    balances.push({ symbol: 'USDC', network: 'Ethereum', amount: usdcEth, usdValue: usdcEth, contractAddress: ETH_USDC });
  } catch (err) {
    console.error("Ethereum balance fetch failed", err);
    // Add a single placeholder for ETH if the RPC is completely down but we want the UI to show something
    if (balances.filter(b => b.network === 'Ethereum').length === 0) {
        balances.push({ symbol: 'ETH', network: 'Ethereum', amount: 0, usdValue: 0 });
    }
  }

  return balances;
};

export const fetchStats = async (): Promise<BotStats> => {
  const totalVol = currentTrades.reduce((acc, t) => acc + t.sizeUSDC, 0);
  return {
    totalTrades: currentTrades.length,
    totalVolume: totalVol,
    winRate: 64.5,
    balance: currentTrades.reduce((acc, t) => acc + (t.side === TradeSide.BUY ? -t.sizeUSDC : t.sizeUSDC), 5000),
    lastPing: Date.now()
  };
};

async function getMarketDetails(assetId: string) {
  try {
    const res = await fetch(`${GAMMA_API_URL}?clob_token_ids_in=${assetId}`);
    const data = await res.json();
    if (data && data.length > 0) {
      const market = data[0];
      const token = market.tokens.find((t: any) => t.token_id === assetId);
      return { question: market.question, outcome: token ? token.outcome : "Unknown" };
    }
  } catch (e) {}
  return { question: `Token ID: ${assetId.substring(0, 8)}...`, outcome: "Unknown" };
}

export const simulateWhaleActivity = async () => {
  if (!currentConfig.isActive) return;
  try {
    const target = currentConfig.targetWallet.toLowerCase();
    if (lastProcessedBlock === 0) {
      const hexBlock = await rpcCall(POLYGON_RPC, "eth_blockNumber", []);
      lastProcessedBlock = parseInt(hexBlock, 16) - 20; // Scan last 20 blocks on start
    }
    const currentBlockHex = await rpcCall(POLYGON_RPC, "eth_blockNumber", []);
    const currentBlock = parseInt(currentBlockHex, 16);
    
    if (currentBlock <= lastProcessedBlock) return;

    const startBlock = Math.max(lastProcessedBlock, currentBlock - 50);

    const logs = await rpcCall(POLYGON_RPC, "eth_getLogs", [{
      fromBlock: "0x" + startBlock.toString(16),
      toBlock: "0x" + currentBlock.toString(16),
      address: CTF_EXCHANGE_ADDR,
      topics: [ORDER_FILLED_TOPIC]
    }]);

    for (const log of logs) {
      const maker = "0x" + log.topics[1].slice(26).toLowerCase();
      const taker = "0x" + log.topics[2].slice(26).toLowerCase();

      if (maker === target || taker === target) {
        if (currentTrades.some(t => t.id === log.transactionHash)) continue;

        const data = log.data.slice(2);
        const makerAssetId = BigInt("0x" + data.slice(64, 128)).toString();
        const takerAssetId = BigInt("0x" + data.slice(128, 192)).toString();
        const makerAmount = BigInt("0x" + data.slice(192, 256));
        const takerAmount = BigInt("0x" + data.slice(256, 320));

        let side = TradeSide.BUY, assetId = "", price = 0, amountFilled = 0;
        if (makerAssetId === "0") {
            side = TradeSide.BUY; assetId = takerAssetId;
            price = Number(makerAmount) / Number(takerAmount) / 1e12;
            amountFilled = Number(makerAmount) / 1e6;
        } else {
            side = TradeSide.SELL; assetId = makerAssetId;
            price = Number(takerAmount) / Number(makerAmount) / 1e12;
            amountFilled = Number(takerAmount) / 1e6;
        }

        const details = await getMarketDetails(assetId);
        currentTrades.unshift({
          id: log.transactionHash,
          timestamp: Date.now(),
          marketQuestion: details.question,
          outcome: details.outcome,
          side: side,
          sizeUSDC: amountFilled,
          price: price,
          txHash: log.transactionHash,
          status: TradeStatus.FILLED
        });
        currentLogs.push({ id: `w-${Date.now()}`, timestamp: Date.now(), level: 'WARN', message: `REAL-WORLD EVENT: Target ${target.substring(0, 6)} active.` });
      }
    }
    lastProcessedBlock = currentBlock + 1;
  } catch (error: any) {
    // Suppress repeated logs for cleaner terminal
  }
};
