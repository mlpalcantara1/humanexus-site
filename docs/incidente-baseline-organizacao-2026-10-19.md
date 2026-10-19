# Início da referência pela preparação — 19/10/2026

A homologação do Genesis reproduziu a recusa “Sessão fora da organização selecionada” ao iniciar pela preparação. O cockpit iniciou a mesma sessão e recebeu Polar H10 e EPOC X. A rota de gravação não transmitia o contexto organizacional; o comando do cockpit transmitia.

O proxy agora consulta a sessão com a autenticação existente, confirma sua identidade e encaminha a organização retornada pelo núcleo em todos os comandos de gravação. Não altera permissões, não assume uma organização padrão e recusa contexto ausente ou divergente. A correção é global.

As recusas de negócio da gestão operacional passam a mostrar a mensagem segura do núcleo (400/409/422), evitando o pedido genérico de repetir uma operação inválida.

Validação: 506 testes do portal aprovados e build de produção concluído. Referência física do Genesis preservada; EEG observado em 0% não constitui validação dos cálculos de EEG. PRÉ/TREINO/PÓS posteriores à retirada dos sensores são teste de fluxo sem dados fisiológicos atuais.

## Resultado observado em produção

- Correção publicada no deployment `dpl_BEEbUB2cncjgc96GyYcmUkm2DPVV`, commit `dea618a`, com o ramo de produção alinhado.
- Referência física `f8af9abd-fea0-4af6-8eda-2887a9bc2889`: FINALIZADA, registros preservados.
- Sessão fictícia `b31ebcd3-3056-42f2-adc1-2191c8210e49`: preparação aceita, PRÉ, TREINO e PÓS iniciados e encerrados pelo Chrome; estado FINALIZADA confirmado em leitura do banco.
- THX-AER-008 hidratou sem digitação: complexidade 50, ambiguidade 50, consequência do erro 25, coordenação 50, comunicação 0 e contexto simbólico 25. O evento PERFIL_TAREFA preserva a origem programada, não uma medida do participante.
- Relatório aberto e rascunho salvo. Conclusão e limitações identificam expressamente o teste operacional sem sensores nas três fases. A aprovação profissional final/PDF não foi realizada nesta verificação.
- Os seis testes do catálogo foram executados com sucesso: integridade dos 400 protocolos (300 THX e 100 THX-AER), precedência dos ajustes, idempotência e ausência de desempenho fabricado.

## Alcance e limites

O encaminhamento organizacional usa a sessão autenticada em todos os comandos da rota compartilhada, sem condições por nome, participante ou organização. A hidratação usa o catálogo e o THX vinculado a qualquer sessão elegível. Genesis é somente o cenário de homologação.

A referência já fixada na preparação da sessão de treinamento foi preservada (14/10), sem substituição silenciosa pela captura posterior de 19/10. EEG elegível e continuidade física entre PRÉ/TREINO/PÓS ainda exigem outra captura: o operador retirou os sensores e autorizou concluir como teste de fluxo. Não há alegação de validação fisiológica completa.
