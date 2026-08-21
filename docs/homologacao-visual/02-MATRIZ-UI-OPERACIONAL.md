# Matriz da UI operacional

Checkpoint aprovado: `79202dd6441f4e0f987e50f0140aea7d7fa60684`

Branch: `visual/platform-premium-ui-safe-v1`

Tag: `platform-ui-operational-approved-v1`

Esta matriz registra beneficios de apresentacao aprovados sem transformar o checkpoint visual em autoridade funcional. Fluxos, estados, contratos, payloads, persistencia, sensores e calculos permanecem sob autoridade do GOLDEN funcional.

## Login e 2FA

- Centralizacao, alinhamento e proporcao mais consistentes.
- Campos, hierarquia, legibilidade e acabamento premium.
- Integracao visual coerente com o cockpit.
- Fluxo de login, 2FA, sessao e permissoes preservado.

## Painel de Comando

- Contexto operacional mais claro.
- Hierarquia executiva para indicadores, alertas, atividade e acoes.
- Melhor leitura da situacao atual sem criar dado novo.

## Organizacoes

Tela critica de UX.

- Melhor uso da largura e reducao de areas mortas.
- Campos mais legiveis e agrupamento institucional mais claro.
- Contato, endereco, responsavel, bases operacionais e historico/versionamento organizados.
- Maior equilibrio entre colunas.
- Cadastro, edicao, versao, persistencia, bases e ativacao preservados.

## Clientes e participantes

- Melhor leitura de cadastro e do vinculo organizacional ou particular.
- Instrumento Integrado, filtros, listagem, situacao, organizacao, unidade e acoes reorganizados visualmente.
- Identidade, escopo, persistencia e isolamento preservados.

## Anamnese Regulatoria

- Convite, entrega, QR, codigo, status e acompanhamento mais legiveis.
- Revisao, auditoria e estados vazios com proporcao adequada.
- Respostas, governanca e contratos preservados.

## Sessoes

Tela critica de UX.

- Criacao e historico visualmente diferenciados.
- Melhor hierarquia de sessao, estado, acoes, preparacao, Baseline e fases PRE/TREINO/POS.
- Comandos equilibrados e menor espaco morto.
- FSM, transicoes, comandos, idempotencia e persistencia preservados.

## Treinamentos

- Projecao Regulatoria e biblioteca THX com melhor densidade cientifica.
- Recomendados, compativeis e oficiais diferenciados.
- Codigo, duracao, CTR, finalidade e estado mais legiveis.
- Matching, catalogo e decisao profissional preservados.

## Cockpit Vivo

- Hierarquia, indicadores e estabilidade visual refinados.
- Evidencia Profissional e Perfil da Tarefa com protagonismo adequado.
- Telemetria, Resultante, Vetores e resposta a intervencao mais legiveis.
- Dados, atualizacao, comandos e projecao cientifica permanecem canonicos.

## EEG e Neurodinamica

- Titulo publico: `ATIVIDADE DAS BANDAS EEG`.
- Graficos com maior largura e area util.
- Melhor leitura temporal e indicador digital complementar equilibrado.
- Sinais, integridade e eventos preservados.
- Nenhuma serie, frequencia, sensor, polling ou calculo foi alterado.

## Regulação cardiovascular

- Composicao harmonizada com o painel EEG.
- Estado vazio mais proporcional.
- FC, RR e RMSSD preservados, sem calculo ou fallback local.

## Vetores

- Radar, rotulos, barras e percentuais com melhor hierarquia.
- Melhor relacao visual entre radar e listagem.
- `AUSENTE` e `NAO CALCULAVEL` preservados como estados distintos de zero.

## Resultante

- Estado, magnitude, direcao, cobertura, confianca, IIRH e Zona com maior hierarquia.
- Calculo, proveniencia e separacao ontologica preservados.

## Inspecao TIRH

A arquitetura cientifica foi deliberadamente preservada.

- Barra cientifica, tipografia, legibilidade, densidade, navegacao e estados refinados.
- Nenhuma regra TIRH, evidencia, vetor ou classificacao foi reconstruida no frontend.

## Evidencias e limitacoes

- Ausencia preservada como informacao epistemologica.
- Sem evidencia continua sem ser valor zero ou conclusao.
- Limitacoes e cobertura permanecem explicitas.

## Constituicao Operacional

- Melhor leitura dos postulados.
- Conteudo, autoridade e relacao entre postulados preservados.

## Matriz Vetorial Viva

- Formato tabular preservado.
- Melhor densidade, alinhamento e leitura sem alterar valores ou interdependencias.

## Trajetoria

- `NAO OBSERVADO` preservado.
- Temporalidade e historico nao foram fabricados.

## PRE, TREINO e POS

- Governanca, fases e comparabilidade preservadas.
- A apresentacao nao altera tempo canonico, transicoes ou validade cientifica.

## ARR, RRO e NRA

- Sequencia e decisao profissional preservadas.
- Nenhuma decisao automatica foi introduzida pela UI.

## CTR, THX e THX-AER

- Matching e biblioteca oficial preservados.
- A UI nao cria protocolo, compatibilidade ou recomendacao.

## Longitudinal

- Temporalidade e evidencia preservadas.
- Sessao isolada nao foi apresentada como longitudinalidade.

## Replay

- Rastreabilidade temporal preservada.
- Controles visuais nao alteram registros, fases ou eventos.

## HUMANEXUS LAB

- Hierarquia cientifica, modulos, estados, fontes, auditoria e dados tecnicos refinados.
- JSON permanece preservado e legivel.
- Nenhum dado tecnico foi inventado ou persistido pela camada visual.

## Administracao

- Identidade, permissoes efetivas, usuarios e novo usuario com melhor hierarquia e equilibrio.
- Autoridade exclusiva do Administrador Proprietario preservada.
- Autenticacao, autorizacao e escopo organizacional permanecem funcionais e canonicos.

## Configuracoes

- Vinculos, contratos, historico, versionamento e estados vazios mais proporcionais.
- Nenhum contrato ou vinculo e inferido pela apresentacao.

## Evidencia tecnica do diff

Comparacao entre a base funcional inicial `580ea6b...` e o checkpoint `79202dd...`:

- `app/(platform)/platform-command.css`: camada visual isolada.
- `app/(platform)/layout.tsx`: carregamento escopado da camada visual.
- `components/cockpit-operacional-vivo.tsx`: remocao apenas do sufixo publico `EMOTIV CORTEX` no subtitulo.
- `tests/operacao-homologacao.test.mjs`: protecao correspondente do rotulo.
- Diff registrado: 4 arquivos, 1.777 insercoes e 2 remocoes.

Classificacao do checkpoint:

- `VISUAL_PURO`: camada CSS da Plataforma.
- `APRESENTACIONAL_EM_COMPONENTE_FUNCIONAL`: rotulo do subtitulo EEG.
- `FUNCIONAL`: ZERO.
