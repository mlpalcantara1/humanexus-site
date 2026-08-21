# Checkpoints e versoes

## Referencias preservadas

| Camada | Status | Branch | SHA | Tag |
| --- | --- | --- | --- | --- |
| Site institucional | GOLDEN aprovado | `recovery/site-approved-production-2026-08-21` | `e9bee1b5339920ecbfba9f2163662bd8d28ac32d` | `site-institucional-golden-v1` |
| Frontend funcional inicial | Referencia inicial da missao visual | `integracao/passos-1-22` | `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57` | - |
| Backend de referencia | Publicado | - | `b9ae30713fe201c7e0be1327f8131c50760a8998` | - |
| UI operacional premium | APROVADA visualmente | `visual/platform-premium-ui-safe-v1` | `79202dd6441f4e0f987e50f0140aea7d7fa60684` | `platform-ui-operational-approved-v1` |
| Relatorios premium | INSPECAO FINAL | `visual/platform-reports-premium-v1` | `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86` | `platform-reports-final-candidate-v1` |
| GOLDEN funcional final | PENDENTE | - | - | - |

## Regra de leitura

**CHECKPOINT VISUAL NAO E GOLDEN FUNCIONAL.**

O SHA `580ea6b...` e a base funcional inicial da missao visual, nao o GOLDEN funcional final. O futuro SHA homologado fisicamente sera soberano e devera receber as camadas visuais por sincronizacao controlada.

## Site institucional GOLDEN

- Base forense comprovada: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- GOLDEN aprovado: `e9bee1b5339920ecbfba9f2163662bd8d28ac32d`.
- Diferenca autorizada: CTA publico `ENTRAR NA PLATAFORMA ->`, com destino funcional preservado.
- HERO, cockpit visual, HUMAN PERFORMANCE SYSTEM, headline, fotografias, movimentos, paginas internas, responsividade, `AGENDAR` e login interno foram preservados.

## Versao reprovada

- Branch: `visual/site-platform-cta-safe-v1`.
- Commit: `d0426e1589136261ff5a2c7f221a4606c6c8854c`.
- Status: REPROVADA.
- Proibicoes: nao promover, mergear, publicar, taguear como aprovada, usar como fallback ou utilizar como base visual futura.
- A branch nao deve ser deletada automaticamente, pois integra o historico forense.

## GOLDEN funcional

`GOLDEN_FUNCIONAL=PENDENTE_HOMOLOGACAO_FISICA`

Nenhum documento, tag visual ou candidata de Relatorios pode preencher esse campo sem declaracao explicita posterior baseada na homologacao fisica real.
