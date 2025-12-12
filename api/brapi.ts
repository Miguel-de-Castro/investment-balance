import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Segurança: O Token é lido apenas no servidor
  const token = process.env.BRAPI_TOKEN;

  if (!token) {
    return response.status(500).json({ 
      error: 'Server Misconfiguration: BRAPI_TOKEN is missing.' 
    });
  }

  // 2. Extração de parâmetros
  // O frontend enviará 'endpoint' (ex: 'quote/PETR4' ou 'quote/list') 
  // e outros parametros (search, fundamental, etc)
  const { endpoint, ...queryParams } = request.query;

  if (!endpoint || typeof endpoint !== 'string') {
    return response.status(400).json({ error: 'Endpoint parameter is required.' });
  }

  // 3. Construção da URL Externa
  const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
  const externalUrl = `https://brapi.dev/api/${endpoint}?${queryString}`;

  try {
    // 4. Chamada Segura à Brapi (Token no Header)
    const apiRes = await fetch(externalUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Repassa o status e o JSON da Brapi para o nosso frontend
    const data = await apiRes.json();
    return response.status(apiRes.status).json(data);

  } catch (error) {
    console.error('Brapi Proxy Error:', error);
    return response.status(500).json({ error: 'Failed to fetch data from Brapi provider.' });
  }
}