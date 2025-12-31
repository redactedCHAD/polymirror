
export enum TradeSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

export enum TradeStatus {
  FILLED = 'FILLED',
  PENDING = 'PENDING',
  FAILED = 'FAILED'
}

export interface Trade {
  id: string;
  timestamp: number;
  marketQuestion: string;
  outcome: string; // "Yes" or "No"
  side: TradeSide;
  sizeUSDC: number;
  price: number;
  txHash: string;
  status: TradeStatus;
}

export interface TokenBalance {
  symbol: string;
  network: string;
  amount: number;
  usdValue: number;
  contractAddress?: string;
}

export interface BotConfig {
  isActive: boolean;
  targetWallet: string;
  walletHistory: string[];
  copyRatio: number; // 0.0 to 1.0
  maxCapUSDC: number;
  slippageTolerance: number;
  rpcUrl: string;
  privateKeyMasked: boolean;
}

export interface BotStats {
  totalTrades: number;
  totalVolume: number;
  winRate: number;
  balance: number;
  lastPing: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}
