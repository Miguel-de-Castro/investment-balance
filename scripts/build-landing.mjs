// Copia a landing page estática (landing/) para a raiz do build (dist/).
// O app em si é gerado pelo Vite em dist/app/ (base '/app/').
//
// Resultado do deploy na Vercel:
//   /         → landing page (pública)
//   /app/     → o app (protegível por senha via middleware.ts)
//   /api/...  → funções serverless (idem)
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const SRC = 'landing';
const OUT = 'dist';
// Arquivos de configuração/documentação da landing que não devem ser publicados
const SKIP = new Set(['vercel.json', 'README.md']);

mkdirSync(OUT, { recursive: true });

if (existsSync(SRC)) {
  cpSync(SRC, OUT, {
    recursive: true,
    filter: (src) => src === SRC || !SKIP.has(basename(src)),
  });
  console.log(`landing/ copiada para ${OUT}/`);
} else {
  // Sem landing: a raiz apenas redireciona para o app.
  writeFileSync(
    join(OUT, 'index.html'),
    '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=/app/">' +
      '<title>Investment Balance</title><a href="/app/">Abrir o app</a>\n'
  );
  console.log('landing/ não encontrada: raiz redireciona para /app/');
}
