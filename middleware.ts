// ============================================================================
// Proteção opcional por senha (HTTP Basic Auth) — Vercel Routing Middleware
// ----------------------------------------------------------------------------
// DESLIGADA por padrão. Só passa a exigir login quando AMBAS as variáveis de
// ambiente abaixo estiverem definidas no projeto da Vercel:
//
//   BASIC_AUTH_USER       usuário
//   BASIC_AUTH_PASSWORD   senha
//
// Quando ativa, roda antes de qualquer resposta: HTML, JS/CSS e também as
// funções em /api (ninguém consome a cota da Brapi sem a senha).
// Para desligar, basta remover as variáveis e fazer um novo deploy.
//
// Para reutilizar em outro projeto na Vercel: copie este arquivo para a raiz.
// Funciona com qualquer framework (Vite, CRA, estático...), sem dependências.
// ============================================================================

export const config = {
  // Todas as rotas
  matcher: '/:path*',
};

const REALM = 'Investment Balance';

/** Continua para o destino original (equivalente ao `next()` de @vercel/functions). */
const next = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

const unauthorized = () =>
  new Response('Acesso restrito. Informe usuário e senha.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });

/** Comparação em tempo constante (para o mesmo tamanho), evitando timing attacks triviais. */
const safeEqual = (a: string, b: string): boolean => {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
};

/** Decodifica o header "Authorization: Basic base64(user:senha)" (aceita UTF-8). */
const parseBasicAuth = (header: string | null): { user: string; password: string } | null => {
  if (!header || !header.startsWith('Basic ')) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6).trim()), c => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const sep = decoded.indexOf(':');
    if (sep === -1) return null;
    return { user: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
};

export default function middleware(request: Request): Response {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  // Proteção desligada enquanto as variáveis não estiverem configuradas
  if (!expectedUser || !expectedPassword) return next();

  const credentials = parseBasicAuth(request.headers.get('authorization'));
  const userOk = safeEqual(credentials?.user ?? '', expectedUser);
  const passwordOk = safeEqual(credentials?.password ?? '', expectedPassword);

  return userOk && passwordOk ? next() : unauthorized();
}
