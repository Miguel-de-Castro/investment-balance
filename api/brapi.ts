// Tipos mínimos do runtime Node da Vercel (req.query e res.status/json são
// fornecidos pela própria plataforma). Declarados aqui para não depender do
// pacote @vercel/node só por causa de tipos.
type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};
type VercelResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(body: unknown): VercelResponse;
};

// ============================================================================
// Proxy restrito para a Brapi
// ----------------------------------------------------------------------------
// O token (BRAPI_TOKEN) fica apenas no servidor. Para evitar que este endpoint
// seja usado como uma "Brapi grátis" por terceiros, ele:
//   1. Aceita SOMENTE os endpoints e parâmetros que o frontend realmente usa
//      (allowlist) e monta a URL externa a partir de valores validados.
//   2. Faz cache das respostas na CDN da Vercel, então consultas repetidas ao
//      mesmo ativo não consomem a cota da Brapi.
// ============================================================================

// Tickers brasileiros: 4 letras + sufixo (3,4,5,6 = ações | 11 = FIIs/units | 33,34 = BDRs)
const TICKER_REGEX = /^[A-Z]{4}(3|4|5|6|11|33|34)$/;
// Termo de busca do autocomplete
const SEARCH_REGEX = /^[A-Z0-9]{3,12}$/;
const MAX_SEARCH_LIMIT = 5;

// Tempo de cache na CDN (segundos)
const CACHE_QUOTE = 300; // cotações: 5 min
const CACHE_SEARCH = 3600; // busca/autocomplete: 1 h
const CACHE_CLIENT_ERROR = 3600; // 400/403/404 da Brapi são estáveis (ticker inválido, limite de plano)

type Query = VercelRequest['query'];

const fail = (response: VercelResponse, status: number, error: string) => {
  response.setHeader('Cache-Control', 'no-store');
  return response.status(status).json({ error });
};

/** Garante que só existam os parâmetros permitidos e que cada um seja uma string única. */
const readParams = (query: Query, allowed: string[]): Record<string, string> | null => {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.includes(key) || typeof value !== 'string') return null;
    params[key] = value;
  }
  return params;
};

/** Valida a requisição e devolve o path + query da Brapi, ou null se não for permitida. */
const buildUpstream = (query: Query): { path: string; search: URLSearchParams; maxAge: number } | null => {
  const { endpoint } = query;
  if (typeof endpoint !== 'string') return null;

  // GET /api/brapi?endpoint=quote/list&search=PETR&limit=5
  if (endpoint === 'quote/list') {
    const params = readParams(query, ['endpoint', 'search', 'limit']);
    if (!params || !SEARCH_REGEX.test(params.search ?? '')) return null;

    const limit = params.limit === undefined ? MAX_SEARCH_LIMIT : Number(params.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_LIMIT) return null;

    return {
      path: 'quote/list',
      search: new URLSearchParams({ search: params.search, limit: String(limit) }),
      maxAge: CACHE_SEARCH,
    };
  }

  // GET /api/brapi?endpoint=quote/PETR4&fundamental=true[&modules=defaultKeyStatisticsHistory]
  const match = endpoint.match(/^quote\/([A-Z0-9]+)$/);
  if (match && TICKER_REGEX.test(match[1])) {
    const params = readParams(query, ['endpoint', 'fundamental', 'modules']);
    if (!params) return null;
    if (params.fundamental !== undefined && params.fundamental !== 'true') return null;
    if (params.modules !== undefined && params.modules !== 'defaultKeyStatisticsHistory') return null;

    const search = new URLSearchParams();
    if (params.fundamental) search.set('fundamental', 'true');
    if (params.modules) search.set('modules', params.modules);

    return { path: `quote/${match[1]}`, search, maxAge: CACHE_QUOTE };
  }

  return null;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return fail(response, 405, 'Method not allowed.');
  }

  // O token é lido apenas no servidor
  const token = process.env.BRAPI_TOKEN;
  if (!token) {
    return fail(response, 500, 'Server Misconfiguration: BRAPI_TOKEN is missing.');
  }

  const upstream = buildUpstream(request.query);
  if (!upstream) {
    return fail(response, 400, 'Request not allowed.');
  }

  const query = upstream.search.toString();
  const externalUrl = `https://brapi.dev/api/${upstream.path}${query ? `?${query}` : ''}`;

  try {
    const apiRes = await fetch(externalUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await apiRes.json();

    // Cache na CDN da Vercel: sucesso e erros "estáveis" ficam em cache;
    // rate limit (429) e falhas do servidor (5xx) nunca são cacheados.
    if (apiRes.ok) {
      response.setHeader(
        'Cache-Control',
        `public, max-age=60, s-maxage=${upstream.maxAge}, stale-while-revalidate=${upstream.maxAge}`
      );
    } else if ([400, 403, 404].includes(apiRes.status)) {
      response.setHeader('Cache-Control', `public, s-maxage=${CACHE_CLIENT_ERROR}`);
    } else {
      response.setHeader('Cache-Control', 'no-store');
    }

    return response.status(apiRes.status).json(data);
  } catch (error) {
    console.error('Brapi Proxy Error:', error);
    return fail(response, 502, 'Failed to fetch data from Brapi provider.');
  }
}
