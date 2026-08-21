# Plano de integracao com o GOLDEN funcional

## Pre-condicao

`GOLDEN_FUNCIONAL=PENDENTE_HOMOLOGACAO_FISICA`

Nenhuma integracao da UI operacional ou da candidata de Relatorios deve ocorrer antes da declaracao formal do SHA funcional final.

## Fluxo obrigatorio

1. Concluir a homologacao fisica real.
2. Obter o SHA funcional final.
3. Declarar esse SHA como GOLDEN funcional.
4. Congelar e criar tag imutavel do GOLDEN funcional.
5. Criar branch/worktree isolado a partir do GOLDEN funcional.
6. Sincronizar a UI operacional aprovada `79202dd...` **sobre** o GOLDEN.
7. Sincronizar a candidata de Relatorios `96d5f6e...` sobre o resultado funcional.
8. Resolver todos os conflitos em favor do GOLDEN funcional e do canone cientifico.
9. Executar o Gate de Diff com classificacao de cada arquivo.
10. Exigir `FUNCIONAL=ZERO` para as camadas visuais.
11. Executar regressao automatizada completa, TypeScript e build oficial.
12. Criar Preview integrada isolada.
13. Executar inspecao humana de desktop, zoom de 90% e mobile.
14. Executar homologacao fisica curta de nao regressao com sensores reais.
15. Publicar em Production somente em missao separada e autorizada.

## Estrategia de sincronizacao

- Nunca fazer merge da branch funcional dentro de um checkout visual e declarar esse resultado soberano.
- Iniciar sempre pelo SHA funcional final.
- Preferir reaplicacao controlada das camadas CSS isoladas e das minimas alteracoes apresentacionais.
- Revisar componentes compartilhados antes de aceitar qualquer conflito.
- Manter `app/(participant)` e o site institucional fora do diff quando nao fizerem parte do escopo.
- Manter Relatorios isolados ate a inspecao humana final.

## Regra de conflitos

**GOLDEN FUNCIONAL VENCE.**

Nunca:

- adaptar ciencia ao CSS;
- substituir logica nova por markup antigo;
- restaurar handler antigo para preservar aparencia;
- apagar validacao funcional para acomodar layout;
- reduzir rastreabilidade para simplificar a tela.

Se uma melhoria visual nao sobreviver ao contrato funcional atual, remover a melhoria visual.

## Gate de Diff esperado

| Classe | Resultado permitido |
| --- | --- |
| `VISUAL_PURO` | Permitido com teste visual |
| `APRESENTACIONAL_EM_COMPONENTE_FUNCIONAL` | Permitido somente com revisao linha a linha e regressao |
| `FUNCIONAL` | ZERO |

## Regressao minima integrada

- Login, 2FA, logout e expiracao.
- Organizacoes, participantes, escopo e permissoes.
- Anamnese, convite, resposta e revisao.
- Sessao, Baseline, PRE, TREINO, POS e encerramento.
- Cortex, EPOC X, Polar H10, EEG, FC, RR e RMSSD.
- Evidencia Profissional, Perfil da Tarefa, Vetores, Resultante, IIRH e Zona.
- ARR/RRO/NRA, CTR/THX, Longitudinal e Replay.
- Cinco produtos de Relatorios, PDF, impressao, linhagem e versoes.

## Saida esperada

A candidata integrada so pode avancar quando funcionar de forma equivalente ao GOLDEN funcional e mantiver os checkpoints visuais sem regressao cientifica, operacional ou de dados.
