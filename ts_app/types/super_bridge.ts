interface TransactionStatus {
  timestamp: number;
  status: string;
  transactionHash: string;
}

interface TokenInfo {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
  coinGeckoId: string;
  chainId: number;
  logoURI: string;
  bridges: number[];
  usd: number;
}

interface ProveInfo {
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  status: string;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  send: TransactionStatus;
  receive: TransactionStatus;
  fromChainId: number;
  toChainId: number;
  duration: number;
  token: string;
  receiveToken: string;
  amount: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  type: string;
  provider: string;
  status: number;
  deploymentId: string;
  prove?: ProveInfo;
  l2TransactionHash?: string;
}

export interface TransactionsResponse {
  total: number;
  transactions: Transaction[];
  actionRequiredCount: number;
  inProgressCount: number;
  hasWithdrawalReadyToFinalize: null | boolean;
  recipients: string[];
}
