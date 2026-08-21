# Runbook de homologacao final

Este runbook deve ser executado sobre uma candidata integrada criada a partir do GOLDEN funcional final. Nenhuma etapa autoriza fallback, dado simulado ou alteracao silenciosa de contrato.

## Preparacao

- [ ] Confirmar repositorio, branch e SHA da candidata.
- [ ] Confirmar tag do GOLDEN funcional.
- [ ] Confirmar worktree limpo.
- [ ] Confirmar remote correto.
- [ ] Confirmar diff classificado e `FUNCIONAL=ZERO` para a missao visual.
- [ ] Confirmar ambiente, backend, banco e sensores reais autorizados.

## Autenticacao

- [ ] Login com credencial real.
- [ ] 2FA pelo fluxo oficial.
- [ ] Renovacao e expiracao de sessao.
- [ ] Logout.
- [ ] Ausencia de bypass, usuario fake ou token no navegador.

## Organizacoes e participantes

- [ ] Abrir organizacao real.
- [ ] Validar cadastro, edicao, versao e ativacao.
- [ ] Abrir participante real.
- [ ] Validar vinculo organizacional ou particular.
- [ ] Validar permissoes e isolamento entre organizacoes.
- [ ] Confirmar acoes criticas do Administrador Proprietario.

## Anamnese Regulatoria

- [ ] Criar convite pelo fluxo oficial.
- [ ] Responder sem dados ficticios.
- [ ] Confirmar entrega e status.
- [ ] Revisar e auditar.
- [ ] Validar QR e codigo quando aplicaveis.

## Sessoes

- [ ] Criar nova sessao sem ID fixo.
- [ ] Preparar fontes e contexto.
- [ ] Executar Baseline pelo comando canonico.
- [ ] Abrir Cockpit sem iniciar fase indevida.
- [ ] Confirmar FSM, estado e idempotencia.

## Fluxo PRE, TREINO e POS

- [ ] Iniciar PRE.
- [ ] Pausar.
- [ ] Retomar.
- [ ] Encerrar PRE conforme contrato.
- [ ] Iniciar e concluir TREINO.
- [ ] Iniciar e concluir POS.
- [ ] Encerrar sessao.
- [ ] Confirmar tempo canonico, comparabilidade e persistencia.

## Sensores

- [ ] EPOC X detectado e conectado.
- [ ] Cortex autenticado e transmitindo.
- [ ] Polar H10 conectado.
- [ ] EEG real presente e continuo.
- [ ] FC real presente.
- [ ] RR real presente.
- [ ] RMSSD real presente quando calculavel.
- [ ] Perdas e degradacoes explicitamente sinalizadas.
- [ ] Nenhum fallback, preenchimento ou mascaramento.

## Ciencia

- [ ] Evidencia Profissional preservada.
- [ ] Perfil da Tarefa preservado.
- [ ] Ausencia distinta de zero.
- [ ] Vetores canônicos.
- [ ] Resultante canônica.
- [ ] IIRH e Zona separados da Resultante.
- [ ] ARR/RRO/NRA com decisao profissional.
- [ ] CTR/THX/THX-AER com biblioteca oficial.
- [ ] Longitudinal apenas com base temporal valida.
- [ ] Replay com rastreabilidade temporal.

## Cockpit e UI

- [ ] Modo Operacional.
- [ ] Inspecao TIRH.
- [ ] `ATIVIDADE DAS BANDAS EEG`.
- [ ] Graficos EEG amplos e indicador digital complementar.
- [ ] Painel cardiovascular.
- [ ] Evidencias, comandos, fases e estados.
- [ ] Vetores e Resultante.
- [ ] Desktop em 1440 e 1280 px.
- [ ] Navegador em zoom de 90%.
- [ ] Mobile em 430 e 390 px.
- [ ] Sem overflow, clipping ou quebra de foco.
- [ ] Reduced motion respeitado.

## Relatorios

- [ ] Operacional TIRH.
- [ ] Cientifico TIRH.
- [ ] Executivo.
- [ ] Tecnico.
- [ ] Formulacao Regulatoria.
- [ ] Biblioteca e leitura detalhada.
- [ ] Governanca e acessos nominais.
- [ ] Linhagem, proveniencia e versoes.
- [ ] PDF.
- [ ] Impressao web e A4.
- [ ] Tabelas, graficos e paginacao.
- [ ] Nenhum produto condicionado apresentado sem dados/contrato.

## Regressao automatizada

- [ ] `npm test`.
- [ ] TypeScript sem emissao.
- [ ] Build oficial.
- [ ] Fixtures dos cinco PDFs.
- [ ] Testes da Evidence Palette.
- [ ] Testes do Cockpit.
- [ ] Testes de integracao.

## Gate final

- [ ] Preview isolada pronta.
- [ ] Inspecao humana aprovada.
- [ ] Homologacao fisica curta aprovada.
- [ ] Nenhuma regressao funcional, cientifica ou de dados.
- [ ] Autorizacao explicita de Production registrada.

Se qualquer item critico falhar, bloquear a promocao e registrar a causa tecnica. Nao contornar o gate.
