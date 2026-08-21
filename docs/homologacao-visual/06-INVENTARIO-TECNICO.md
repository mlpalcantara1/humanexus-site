# Inventario tecnico

## Repositorios

### Frontend

- Nome: `humanexus-site`.
- Remote: `https://github.com/mlpalcantara1/humanexus-site.git`.
- Framework: Next.js 15, React 19 e TypeScript.
- Build local: `npm run build`.
- Build Vercel: `npm run build:vercel`.

### Backend

- Nome: `humanexus-core`.
- SHA publicado de referencia: `b9ae30713fe201c7e0be1327f8131c50760a8998`.
- Status nesta missao: nao alterado.
- Sensores, TIRH, calculos, APIs, banco e persistencia: nao alterados.

## Produtos no frontend

- `app/(site)`: site institucional.
- `app/(platform)`: Plataforma Nova e superficies operacionais.
- `app/(participant)`: consentimento, anamnese por convite, instrumento e captura.

## Componentes criticos conhecidos

- `components/modulo-integrado.tsx`.
- `components/gestao-operacional.tsx`.
- `components/painel-profissional.tsx`.
- `components/governanca-anamnese.tsx`.
- `components/operacao-homologacao.tsx`.
- `components/cockpit-operacional-vivo.tsx`.
- `components/painel-administrador.tsx`.
- `components/parametrizacao-prospectiva.tsx`.
- `components/platform-navigation.tsx`.
- `components/formulario-entrada.tsx`.

## Arquivos compartilhados de alto risco

- `app/layout.tsx`.
- `app/globals.css`.
- `lib/`.

Alteracoes nesses caminhos exigem prova de escopo, revisao de regressao no site, Plataforma e participante, e classificacao no Gate de Diff.

## Camadas visuais preservadas

### UI operacional

- Branch: `visual/platform-premium-ui-safe-v1`.
- SHA: `79202dd6441f4e0f987e50f0140aea7d7fa60684`.
- Principal ativo: `app/(platform)/platform-command.css`.
- Layout de carregamento: `app/(platform)/layout.tsx`.
- Alteracao apresentacional controlada: `components/cockpit-operacional-vivo.tsx`.
- Teste correspondente: `tests/operacao-homologacao.test.mjs`.

### Relatorios

- Branch: `visual/platform-reports-premium-v1`.
- SHA: `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86`.
- Principal ativo: `app/(platform)/report-command.css`.
- Layout de carregamento: `app/(platform)/layout.tsx`.

### Site institucional

- Branch: `recovery/site-approved-production-2026-08-21`.
- Base forense: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- GOLDEN: `e9bee1b5339920ecbfba9f2163662bd8d28ac32d`.
- Arquivos da alteracao final: `components/site-header.tsx`, `app/globals.css` e `tests/portal-integration.test.mjs`.

## Referencias Git

| Referencia | SHA |
| --- | --- |
| Site GOLDEN | `e9bee1b5339920ecbfba9f2163662bd8d28ac32d` |
| UI operacional aprovada | `79202dd6441f4e0f987e50f0140aea7d7fa60684` |
| Relatorios candidata final | `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86` |
| Base funcional inicial | `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57` |
| Backend de referencia | `b9ae30713fe201c7e0be1327f8131c50760a8998` |

## Operacoes proibidas

- Force-push.
- Movimento de tags aprovadas.
- Merge automatico em `main` ou `integracao/passos-1-22`.
- Deploy decorrente apenas de criacao de tag.
- Uso da branch reprovada como fallback.
- Integracao visual antes do GOLDEN funcional.
