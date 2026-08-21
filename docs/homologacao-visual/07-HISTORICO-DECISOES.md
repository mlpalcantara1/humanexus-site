# Historico de decisoes

## 1. Base funcional inicial

- Repositorio: `humanexus-site`.
- Branch historica: `integracao/passos-1-22`.
- SHA adotado no inicio da missao visual: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- Decisao: registrar como referencia inicial, nunca como GOLDEN funcional final.

## 2. Missao visual da Plataforma Nova

- Trabalho executado em worktree e branch isolados.
- Site institucional, participante e backend permaneceram fora do escopo.
- Regra adotada: funcionamento, fluxo, operacionalidade, TIRH, dados, estabilidade e desempenho acima de UI.
- Candidata intermediaria: `3938ca91af5074cedd5ac6444ad6cfcf369bafc8`.

## 3. Inspecao e refinamento

- A candidata foi disponibilizada em Preview isolada.
- A inspecao humana orientou refinamentos finais de hierarquia, proporcao, densidade e Cockpit.
- Nenhum deploy de Production foi autorizado nessa etapa.

## 4. Aprovacao da UI operacional

- Branch: `visual/platform-premium-ui-safe-v1`.
- Checkpoint: `79202dd6441f4e0f987e50f0140aea7d7fa60684`.
- Status: aprovada visualmente.
- Decisao: congelar como checkpoint visual, sem promover sobre a frente funcional em andamento.

## 5. Missao da camada de Relatorios

- Branch: `visual/platform-reports-premium-v1`.
- Checkpoint: `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86`.
- Status: pronta para inspecao humana final.
- Decisao: preservar sem usar `approved` na tag e sem integrar antes do GOLDEN funcional.

## 6. Recuperacao forense do site institucional

- Base visual forense comprovada: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- Evidencias consideradas: deployment source=git, origem de Production, equivalencia de HERO, header, fotografias, movimentos, paginas, mobile, portal, CSS e chunks.
- Alteracao final autorizada: CTA publico `ENTRAR NA PLATAFORMA ->` com destino existente preservado.
- Commit GOLDEN: `e9bee1b5339920ecbfba9f2163662bd8d28ac32d`.

## 7. Versao do site explicitamente reprovada

- Branch: `visual/site-platform-cta-safe-v1`.
- Commit: `d0426e1589136261ff5a2c7f221a4606c6c8854c`.
- Decisao: nao promover, mergear, publicar, taguear como aprovada, usar como fallback ou base visual futura.
- A branch permanece preservada apenas como evidencia historica.

## 8. Homologacao fisica

- Status: pendente em frente operacional separada.
- Decisao: nenhuma UI ou camada de Relatorios sera integrada antes do SHA funcional final.
- Placeholder: `GOLDEN_FUNCIONAL=PENDENTE_HOMOLOGACAO_FISICA`.

## 9. Preservacao Git

- Site: tag `site-institucional-golden-v1`.
- UI operacional: tag `platform-ui-operational-approved-v1`.
- Relatorios: tag `platform-reports-final-candidate-v1`.
- Documentacao: branch `docs/platform-preservation-v1`.
- Regra: sem merge, sem force-push, sem Production e sem movimento posterior das tags.
