# Evidencias e validacoes

## UI operacional

- Checkpoint: `79202dd6441f4e0f987e50f0140aea7d7fa60684`.
- Branch: `visual/platform-premium-ui-safe-v1`.
- Inspecao humana: aprovada.
- Testes: 194/194 PASS.
- TypeScript: PASS.
- Build: PASS.
- Alteracao funcional declarada: zero.
- Diff: camada CSS isolada, import escopado e rotulo apresentacional protegido por teste.

## Relatorios

- Checkpoint: `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86`.
- Branch: `visual/platform-reports-premium-v1`.
- Inspecao humana final: pendente.
- Testes: 194/194 PASS.
- TypeScript: PASS.
- Build: PASS.
- Produtos verificados: 5.
- Fixtures: 20 paginas A4.
- Conteudo cientifico: preservado.
- Calculos: preservados.
- Diff: camada CSS de Relatorios e import escopado no layout da Plataforma.

## Site institucional

- Base forense: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- GOLDEN: `e9bee1b5339920ecbfba9f2163662bd8d28ac32d`.
- Branch: `recovery/site-approved-production-2026-08-21`.
- HERO: preservado.
- Cockpit visual e HUMAN PERFORMANCE SYSTEM: preservados.
- Headline: preservada.
- Fotografias: preservadas.
- Movimentos: preservados.
- Paginas internas: preservadas.
- CTA final: `ENTRAR NA PLATAFORMA ->`.
- Destino funcional: preservado.
- Botao `AGENDAR`: preservado.
- Login `Entre na Area HUMANEXUS`: preservado.
- Testes: 194/194 PASS.
- TypeScript: PASS.
- Build local: PASS.
- Build Vercel Preview: PASS.
- Desktop: 1440 e 1280 px sem overflow.
- Mobile: 430 e 390 px sem overflow e CTA diretamente acessivel.
- Console da Preview: sem erros observados.

## Backend e ciencia

- Backend de referencia: `b9ae30713fe201c7e0be1327f8131c50760a8998`.
- Backend alterado pelas missoes visuais: nao.
- Sensores alterados pelas missoes visuais: nao.
- TIRH alterada pelas missoes visuais: nao.
- Calculos alterados pelas missoes visuais: nao.
- Banco, APIs e persistencia alterados pelas missoes visuais: nao.

## Estado de homologacao

- GOLDEN funcional: nao declarado.
- Homologacao fisica: pendente.
- Integracao das camadas: bloqueada ate o GOLDEN funcional.
- Production alterada por esta preservacao: nao.

## Evidencia de recuperabilidade

As referencias permanentes sao branch, SHA e tag. Previews sao evidencias temporarias e nao constituem fonte de verdade. A recuperacao deve partir das referencias Git registradas em `CHECKPOINTS.json` e validada contra as tags remotas.
