# Preservacao tecnica HUMANEXUS

Esta pasta preserva os checkpoints visuais e documentais do ecossistema HUMANEXUS. Ela existe para permitir recuperacao objetiva por SHA, branch e tag, sem depender de conversas, memoria humana, worktrees locais ou Previews temporarias.

Nenhum documento desta pasta declara um GOLDEN funcional final. A homologacao fisica continua pendente e o futuro SHA funcional homologado sera soberano sobre qualquer checkpoint visual.

## Estado atual

- Site institucional: GOLDEN aprovado e preservado em `e9bee1b5339920ecbfba9f2163662bd8d28ac32d`.
- UI operacional da Plataforma Nova: aprovada visualmente em `79202dd6441f4e0f987e50f0140aea7d7fa60684`.
- Camada premium de Relatorios: candidata final aguardando inspecao humana em `96d5f6e3d32a8b02dd24a7d9c9c09bc2f1e97b86`.
- Base funcional inicial da missao visual: `580ea6bccffa5b9251b7ca99356f0ab2c41cbf57`.
- Backend publicado de referencia: `b9ae30713fe201c7e0be1327f8131c50760a8998`.
- GOLDEN funcional final: `PENDENTE_HOMOLOGACAO_FISICA`.

## Ordem de autoridade

1. GOLDEN funcional homologado.
2. Canone cientifico TIRH vigente.
3. Contratos funcionais.
4. Checkpoint visual aprovado.
5. Documentacao tecnica.
6. Preferencia estetica.

Um checkpoint visual registra apresentacao aprovada. Ele nao substitui nem antecede a declaracao do GOLDEN funcional.

## Sequencia futura

1. Concluir a homologacao fisica.
2. Declarar e taguear o SHA funcional final.
3. Sincronizar a UI operacional aprovada sobre esse SHA.
4. Sincronizar a candidata de Relatorios.
5. Resolver conflitos em favor do funcional e da ciencia.
6. Executar Gate de Diff, regressao, Preview, inspecao humana e homologacao curta.
7. Publicar somente em missao separada e explicitamente autorizada.

## Indice

- [Checkpoints e versoes](./01-CHECKPOINTS-E-VERSOES.md)
- [Matriz da UI operacional](./02-MATRIZ-UI-OPERACIONAL.md)
- [Relatorios e produtos](./03-RELATORIOS-E-PRODUTOS.md)
- [Regras de nao regressao](./04-REGRAS-DE-NAO-REGRESSAO.md)
- [Plano de integracao com o GOLDEN](./05-PLANO-INTEGRACAO-GOLDEN.md)
- [Inventario tecnico](./06-INVENTARIO-TECNICO.md)
- [Historico de decisoes](./07-HISTORICO-DECISOES.md)
- [Runbook de homologacao final](./08-RUNBOOK-HOMOLOGACAO-FINAL.md)
- [Evidencias e validacoes](./09-EVIDENCIAS-E-VALIDACOES.md)
- [Checkpoints legiveis por maquina](./CHECKPOINTS.json)
- [Estado atual legivel por maquina](./STATUS-ATUAL.json)

## Restricoes permanentes

- A versao `d0426e1589136261ff5a2c7f221a4606c6c8854c`, branch `visual/site-platform-cta-safe-v1`, esta reprovada. Nao promover, publicar, mergear, usar como fallback ou adotar como base visual.
- Nao mover tags de checkpoint existentes.
- Nao adaptar ciencia ou funcionamento para preservar CSS.
- Nao promover Relatorios antes da inspecao humana final.
- Nao alterar Production como consequencia automatica de preservacao Git.
