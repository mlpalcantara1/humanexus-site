# Início da referência pela preparação — 19/10/2026

A homologação do Genesis reproduziu a recusa “Sessão fora da organização selecionada” ao iniciar pela preparação. O cockpit iniciou a mesma sessão e recebeu Polar H10 e EPOC X. A rota de gravação não transmitia o contexto organizacional; o comando do cockpit transmitia.

O proxy agora consulta a sessão com a autenticação existente, confirma sua identidade e encaminha a organização retornada pelo núcleo em todos os comandos de gravação. Não altera permissões, não assume uma organização padrão e recusa contexto ausente ou divergente. A correção é global.

As recusas de negócio da gestão operacional passam a mostrar a mensagem segura do núcleo (400/409/422), evitando o pedido genérico de repetir uma operação inválida.

Validação: 506 testes do portal aprovados e build de produção concluído. Referência física do Genesis preservada; EEG observado em 0% não constitui validação dos cálculos de EEG. PRÉ/TREINO/PÓS posteriores à retirada dos sensores são teste de fluxo sem dados fisiológicos atuais.
