export enum AssetType {
  BR_STOCK = 'Ação BR',
  FII = 'FII',
  CRYPTO = 'Criptomoeda',
  US_STOCK = 'Ação EUA',
  UNKNOWN = 'Desconhecido'
}

export interface StatisticsHistory {
  year: string;
  dividendYield: number;
}

export interface AssetData {
  ticker: string;
  type: AssetType;
  currentPrice: number;
  lastUpdated: string;
  name?: string;
  /** true quando o dado é de demonstração (fonte real indisponível) */
  isSimulated?: boolean;
  dividendYield?: number; // Porcentagem (ex: 5.5 para 5.5%)
  statisticsHistory?: StatisticsHistory[];
}

export interface SimulationState {
  currentQty: number | string;
  currentAvgPrice: number | string;
  newQty: number | string;
}

export interface CalculationResult {
  newAvgPrice: number;
  totalInvestedOld: number;
  totalInvestedNew: number;
  totalInvestedTotal: number;
  totalQty: number;
  percentDiff: number;
  currentMarketValue: number;
  potentialProfit: number;
}