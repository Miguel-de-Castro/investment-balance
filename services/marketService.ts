import { AssetType, AssetData, StatisticsHistory } from '../types';

// ============================================================================
// CONFIGURAÇÃO DE CHAVES DE API
// ============================================================================

// Função auxiliar para ler variáveis de ambiente (Compatível com Vite e CRA)
const getEnvVar = (key: string, fallback: string = ''): string => {
  // Tenta Vite (import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}

  // Tenta Process (Create React App / Node)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[`REACT_APP_${key}`]) {
      // @ts-ignore
      return process.env[`REACT_APP_${key}`];
    }
  } catch (e) {}

  return fallback;
};

// Se a variável de ambiente não existir, usamos o valor placeholder 'YOUR_TOKEN'
// A lógica do código verifica se é diferente do placeholder para saber se é real.
const BRAPI_TOKEN = getEnvVar('BRAPI_TOKEN', 'YOUR_BRAPI_TOKEN');
const ALPHA_VANTAGE_KEY = getEnvVar('ALPHA_VANTAGE_KEY', 'YOUR_ALPHA_KEY');

const isBrapiEnabled = BRAPI_TOKEN && BRAPI_TOKEN !== 'YOUR_BRAPI_TOKEN';
const isAlphaEnabled = ALPHA_VANTAGE_KEY && ALPHA_VANTAGE_KEY !== 'YOUR_ALPHA_KEY';

// ============================================================================
// DADOS MOCK (FALLBACK)
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

  // Crypto (Sem yield via Bazin, mas mantemos estrutura)
  { ticker: 'BTC', name: 'Bitcoin', type: AssetType.CRYPTO, currentPrice: 64000, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'ETH', name: 'Ethereum', type: AssetType.CRYPTO, currentPrice: 3400, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'SOL', name: 'Solana', type: AssetType.CRYPTO, currentPrice: 145, lastUpdated: 'Simulado', dividendYield: 0 },

  // US Stocks
  { ticker: 'AAPL', name: 'Apple Inc.', type: AssetType.US_STOCK, currentPrice: 175.50, lastUpdated: 'Simulado', dividendYield: 0.5 },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: AssetType.US_STOCK, currentPrice: 180.20, lastUpdated: 'Simulado', dividendYield: 0 },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', type: AssetType.US_STOCK, currentPrice: 890.00, lastUpdated: 'Simulado', dividendYield: 0.02 },
];

// ============================================================================
// HELPERS
// ============================================================================

export const identifyAssetType = (ticker: string): AssetType => {
  const t = ticker.toUpperCase().trim();
  
  const cryptoTickers = ['BTC', 'ETH', 'SOL', 'USDT', 'BNB', 'XRP', 'ADA', 'DOGE'];
  if (cryptoTickers.includes(t)) return AssetType.CRYPTO;

  const brMatch = t.match(/^[A-Z]{4}(3|4|5|6|11|33|34)$/);
  if (brMatch) {
    const suffix = brMatch[1];
    if (suffix === '11') return AssetType.FII;
    return AssetType.BR_STOCK;
  }

  if (/^[A-Z]{1,5}$/.test(t)) return AssetType.US_STOCK;

  return AssetType.UNKNOWN;
};

function getTypeLogo(type: AssetType): string {
  switch (type) {
      case AssetType.BR_STOCK: return 'https://picsum.photos/40/40?grayscale';
      case AssetType.FII: return 'https://picsum.photos/40/40?blur';
      default: return 'https://picsum.photos/40/40';
  }
}

// ============================================================================
// SEARCH LOGIC
// ============================================================================

export const searchAssets = async (query: string): Promise<AssetData[]> => {
  if (!query) return [];
  const q = query.toUpperCase().trim();

  // Se tiver Token BRAPI configurado
  if (isBrapiEnabled && q.length >= 3) {
      try {
          const response = await fetch(`https://brapi.dev/api/quote/list?search=${q}&limit=5&token=${BRAPI_TOKEN}`);
          const data = await response.json();
          if (data.stocks) {
              return data.stocks.map((s: any) => ({
                  ticker: s.stock,
                  name: s.name,
                  type: s.stock.endsWith('11') ? AssetType.FII : AssetType.BR_STOCK,
                  currentPrice: s.close,
                  lastUpdated: 'Live API',
                  logoUrl: s.logo,
                  dividendYield: 0 // List endpoint usually doesn't have yield
              }));
          }
      } catch (e) {
          console.warn("Brapi search failed, falling back to mock");
      }
  }
  
  await new Promise(resolve => setTimeout(resolve, 150));
  return MOCK_DB.filter(asset => 
    asset.ticker.includes(q) || (asset.name && asset.name.toUpperCase().includes(q))
  ).slice(0, 6);
};

// ============================================================================
// PRICE FETCH LOGIC
// ============================================================================

export const fetchAssetPrice = async (ticker: string): Promise<AssetData> => {
  const t = ticker.toUpperCase().trim();
  const type = identifyAssetType(t);
  let apiData: Partial<AssetData> | null = null;

  try {
    // --- STRATEGY: BRAZILIAN ASSETS (BRAPI) ---
    if ((type === AssetType.BR_STOCK || type === AssetType.FII) && isBrapiEnabled) {
        
        // Tentativa primária: Com histórico estatístico
        let targetUrl = `https://brapi.dev/api/quote/${t}?token=${BRAPI_TOKEN}&fundamental=true&defaultKeyStatisticsHistory=true`;
        let response = await fetch(targetUrl);

        // Se der 403 (Proibido/Plano insuficiente), tenta sem o histórico
        if (response.status === 403) {
           console.warn(`BRAPI: 403 em ${targetUrl}. Tentando fallback sem histórico.`);
           targetUrl = `https://brapi.dev/api/quote/${t}?token=${BRAPI_TOKEN}&fundamental=true`;
           response = await fetch(targetUrl);
        }

        const json = await response.json();
        
        if (json.results && json.results.length > 0) {
            const res = json.results[0];
            
            // Parse history if available
            let statisticsHistory: StatisticsHistory[] = [];
            if (res.defaultKeyStatisticsHistory && Array.isArray(res.defaultKeyStatisticsHistory)) {
                statisticsHistory = res.defaultKeyStatisticsHistory.map((item: any) => ({
                    year: new Date(item.updatedAt).getFullYear().toString(),
                    dividendYield: item.dividendYield || 0
                }));
            }

            apiData = {
                ticker: res.symbol,
                name: res.longName || res.shortName,
                currentPrice: res.regularMarketPrice,
                lastUpdated: new Date(res.regularMarketTime).toLocaleTimeString(),
                logoUrl: res.logourl,
                type: type,
                dividendYield: 0, // Será preenchido ou deixado 0 se não encontrar
                statisticsHistory: statisticsHistory
            };
            
            // Tenta pegar o DY mais recente do histórico, se disponível
            if (statisticsHistory.length > 0) {
               apiData.dividendYield = statisticsHistory[0].dividendYield;
            }
        }
    }

    // --- STRATEGY: US STOCKS (ALPHA VANTAGE) ---
    else if (type === AssetType.US_STOCK && isAlphaEnabled) {
        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${t}&apikey=${ALPHA_VANTAGE_KEY}`);
        const json = await response.json();
        const quote = json['Global Quote'];
        if (quote) {
             apiData = {
                ticker: quote['01. symbol'],
                name: t,
                currentPrice: parseFloat(quote['05. price']),
                lastUpdated: 'Agora (AlphaVantage)',
                type: AssetType.US_STOCK,
                logoUrl: 'https://picsum.photos/40/40',
                dividendYield: 0 // Alpha Vantage free tier global quote doesn't have DY
             };
        }
    }

    // --- STRATEGY: CRYPTO (CoinGecko is Free/Public mostly) ---
    else if (type === AssetType.CRYPTO) {
        const idMap: Record<string, string> = { 
            'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana', 
            'USDT': 'tether', 'BNB': 'binancecoin', 'XRP': 'ripple'
        };
        const id = idMap[t];
        if (id) {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
            const json = await response.json();
            if (json[id]) {
                apiData = {
                    ticker: t,
                    name: id.charAt(0).toUpperCase() + id.slice(1),
                    currentPrice: json[id].usd,
                    lastUpdated: 'Agora (CoinGecko)',
                    type: AssetType.CRYPTO,
                    logoUrl: `https://assets.coingecko.com/coins/images/1/small/${id}.png`,
                    dividendYield: 0
                };
            }
        }
    }

  } catch (error) {
      console.error("API Fetch Error:", error);
  }

  // --- MERGE OR FALLBACK TO MOCK ---
  const mockAsset = MOCK_DB.find(a => a.ticker === t);
  
  if (apiData && apiData.currentPrice) {
      // If API didn't provide yield but we have a mock for it, lets use the mock yield 
      // just to demonstrate the Bazin feature if the user hasn't set up paid API keys yet.
      if ((!apiData.dividendYield || apiData.dividendYield === 0) && mockAsset) {
         apiData.dividendYield = mockAsset.dividendYield;
      }
      return apiData as AssetData;
  }

  // FALLBACK
  console.warn(`Using Mock Data for ${t}`);
  await new Promise(resolve => setTimeout(resolve, 600));

  if (mockAsset) {
      const variance = (Math.random() * 2 - 1) * (mockAsset.currentPrice * 0.01);
      return {
          ...mockAsset,
          currentPrice: parseFloat((mockAsset.currentPrice + variance).toFixed(2)),
          lastUpdated: 'Simulado',
          logoUrl: getTypeLogo(type)
      }
  }

  // Generative
  let price = 100;
  if (type === AssetType.BR_STOCK) price = Math.random() * 50 + 10;
  return {
    ticker: t,
    type,
    currentPrice: parseFloat(price.toFixed(2)),
    lastUpdated: 'Simulado (Gerado)',
    name: t,
    logoUrl: getTypeLogo(type),
    dividendYield: 0
  };
};