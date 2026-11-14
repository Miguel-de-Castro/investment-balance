import { AssetType, AssetData, StatisticsHistory } from '../types';

// ============================================================================
// FONTES DE DADOS
// ----------------------------------------------------------------------------
// - Ações BR e FIIs: Brapi, via proxy serverless em /api/brapi (o token fica
//   apenas no servidor).
// - Criptomoedas: CoinGecko (API pública, sem chave).
// - Ações EUA: sem fonte de dados real; apenas alguns tickers de demonstração.
//
// Quando a fonte real não responde, usamos os dados de demonstração abaixo,
// SEMPRE marcados com `isSimulated: true` para a interface avisar o usuário.
// Ticker sem fonte real e sem dado de demonstração gera erro: nunca
// inventamos preços.
// ============================================================================

const MOCK_DB: AssetData[] = [
  // BR Stocks
  { ticker: 'PETR4', name: 'Petrobras PN', type: AssetType.BR_STOCK, currentPrice: 31.26, lastUpdated: 'Simulado', dividendYield: 18.5 },
  { ticker: 'PETR3', name: 'Petrobras ON', type: AssetType.BR_STOCK, currentPrice: 38.20, lastUpdated: 'Simulado', dividendYield: 17.2 },
  { ticker: 'VALE3', name: 'Vale ON', type: AssetType.BR_STOCK, currentPrice: 62.30, lastUpdated: 'Simulado', dividendYield: 8.4 },
  { ticker: 'ITUB4', name: 'Itaú Unibanco PN', type: AssetType.BR_STOCK, currentPrice: 33.10, lastUpdated: 'Simulado', dividendYield: 6.5 },

  // FIIs
  { ticker: 'MXRF11', name: 'Maxi Renda FII', type: AssetType.FII, currentPrice: 10.45, lastUpdated: 'Simulado', dividendYield: 12.3 },
  { ticker: 'HGLG11', name: 'CSHG Logística FII', type: AssetType.FII, currentPrice: 162.50, lastUpdated: 'Simulado', dividendYield: 9.1 },

  // Crypto
  { ticker: 'BTC', name: 'Bitcoin', type: AssetType.CRYPTO, currentPrice: 64000, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'ETH', name: 'Ethereum', type: AssetType.CRYPTO, currentPrice: 3400, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'SOL', name: 'Solana', type: AssetType.CRYPTO, currentPrice: 145, lastUpdated: 'Simulado', dividendYield: 0 },

  // US Stocks (apenas demonstração)
  { ticker: 'AAPL', name: 'Apple Inc.', type: AssetType.US_STOCK, currentPrice: 175.50, lastUpdated: 'Simulado', dividendYield: 0.5 },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: AssetType.US_STOCK, currentPrice: 180.20, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', type: AssetType.US_STOCK, currentPrice: 890.00, lastUpdated: 'Simulado', dividendYield: 0.02 },
].map(asset => ({ ...asset, isSimulated: true }));

// Tickers de cripto suportados → id na CoinGecko
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
};

export class AssetNotFoundError extends Error {
  constructor(ticker: string) {
    super(`Não encontramos cotação para "${ticker}". Verifique o código do ativo e tente novamente.`);
    this.name = 'AssetNotFoundError';
  }
}

// ============================================================================
// HELPERS
// ============================================================================

export const identifyAssetType = (ticker: string): AssetType => {
  const t = ticker.toUpperCase().trim();

  if (t in COINGECKO_IDS) return AssetType.CRYPTO;

  const brMatch = t.match(/^[A-Z]{4}(3|4|5|6|11|33|34)$/);
  if (brMatch) {
    return brMatch[1] === '11' ? AssetType.FII : AssetType.BR_STOCK;
  }

  if (/^[A-Z]{1,5}$/.test(t)) return AssetType.US_STOCK;

  return AssetType.UNKNOWN;
};

// ============================================================================
// SEARCH LOGIC
// ============================================================================

export const searchAssets = async (query: string, signal?: AbortSignal): Promise<AssetData[]> => {
  if (!query) return [];
  const q = query.toUpperCase().trim();

  // Busca real (Brapi) apenas para termos válidos para o proxy
  if (/^[A-Z0-9]{3,12}$/.test(q)) {
    try {
      const response = await fetch(`/api/brapi?endpoint=quote/list&search=${encodeURIComponent(q)}&limit=5`, { signal });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.stocks) && data.stocks.length > 0) {
          return data.stocks.map((s: any) => ({
            ticker: s.stock,
            name: s.name,
            type: s.stock.endsWith('11') ? AssetType.FII : AssetType.BR_STOCK,
            currentPrice: s.close,
            lastUpdated: 'Brapi',
            dividendYield: 0,
          }));
        }
      }
    } catch (e) {
      if (signal?.aborted) return [];
      console.warn('Search proxy failed, using demo data.');
    }
  }

  return MOCK_DB.filter(asset =>
    asset.ticker.includes(q) || (asset.name && asset.name.toUpperCase().includes(q))
  ).slice(0, 6);
};

// ============================================================================
// PRICE FETCH LOGIC
// ============================================================================

const fetchBrapiQuote = async (ticker: string, type: AssetType): Promise<AssetData | null> => {
  // Tentativa primária: com histórico de indicadores (DY por ano)
  let response = await fetch(`/api/brapi?endpoint=quote/${ticker}&fundamental=true&modules=defaultKeyStatisticsHistory`);

  // 403 = módulo não incluso no plano da Brapi para este ativo; tenta sem histórico
  if (response.status === 403) {
    response = await fetch(`/api/brapi?endpoint=quote/${ticker}&fundamental=true`);
  }
  if (!response.ok) {
    console.warn('API Brapi returned status:', response.status);
    return null;
  }

  const json = await response.json();
  const res = json.results?.[0];
  if (!res || typeof res.regularMarketPrice !== 'number') return null;

  // A Brapi devolve o DY como fração (0.1062 = 10,62%) e o período em `endDate`.
  // O app trabalha com DY em percentual, então convertemos aqui.
  // Anos sem DY informado (null) são descartados para não distorcer as médias.
  let statisticsHistory: StatisticsHistory[] = [];
  if (Array.isArray(res.defaultKeyStatisticsHistory)) {
    statisticsHistory = res.defaultKeyStatisticsHistory
      .filter((item: any) => typeof item.dividendYield === 'number')
      .map((item: any) => ({
        year: String(item.endDate ?? '').slice(0, 4),
        dividendYield: parseFloat((item.dividendYield * 100).toFixed(2)),
      }));
  }

  return {
    ticker: res.symbol,
    name: res.longName || res.shortName,
    currentPrice: res.regularMarketPrice,
    lastUpdated: new Date(res.regularMarketTime).toLocaleTimeString(),
    type,
    dividendYield: statisticsHistory[0]?.dividendYield ?? 0,
    statisticsHistory,
  };
};

const fetchCoinGeckoQuote = async (ticker: string): Promise<AssetData | null> => {
  const id = COINGECKO_IDS[ticker];
  if (!id) return null;

  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
  if (!response.ok) return null;

  const json = await response.json();
  if (typeof json[id]?.usd !== 'number') return null;

  return {
    ticker,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    currentPrice: json[id].usd,
    lastUpdated: 'CoinGecko',
    type: AssetType.CRYPTO,
    dividendYield: 0,
  };
};

export const fetchAssetPrice = async (ticker: string): Promise<AssetData> => {
  const t = ticker.toUpperCase().trim();
  const type = identifyAssetType(t);

  try {
    let live: AssetData | null = null;
    if (type === AssetType.BR_STOCK || type === AssetType.FII) {
      live = await fetchBrapiQuote(t, type);
    } else if (type === AssetType.CRYPTO) {
      live = await fetchCoinGeckoQuote(t);
    }
    if (live) return live;
  } catch (error) {
    console.error('API Fetch Error:', error);
  }

  // Sem dado real: usa o dado de demonstração, se existir
  const mockAsset = MOCK_DB.find(a => a.ticker === t);
  if (mockAsset) {
    console.warn(`Using demo data for ${t}`);
    return { ...mockAsset };
  }

  throw new AssetNotFoundError(t);
};
