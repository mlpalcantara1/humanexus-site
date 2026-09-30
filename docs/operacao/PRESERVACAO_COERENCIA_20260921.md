# Preservação e coerência operacional — somente local

Base preservada: 126131797392dde0872f166aa2625568fb6e5c67.

Escopo autorizado: notas pendentes no logout; ingestão temporal independente da interface; encerramento por incidente; coerência HUD/gráfico; instrumentos indisponíveis visíveis; distribuição temporal no Replay/longitudinal; acesso explícito à repetição já existente.

Nenhuma alteração em fórmulas, pesos, elegibilidade, taxonomia, THX, IICCA ou migrations. Nenhum push/deploy. Fixtures somente em testes descartáveis.

A chave dos novos diários locais é derivada com separação de domínio do segredo de autenticação existente e da identidade autenticada. AES-GCM inclui o contexto organização/participante/sessão/profissional como dado autenticado. A chave não é persistida no navegador; o ciphertext sobrevive ao logout. Legados são migrados apenas pelo seu titular, após confirmar a cópia protegida. Preservar o segredo existente: sua rotação exige planejamento da recuperação dos diários pendentes. Não registrar essa chave em logs.

O processamento temporal reutiliza o motor e o acumulador existentes ao receber amostras da ponte e registros profissionais. GET do Cockpit não acumula duração. Sem ingestão/qualificação real não há duração nova. Repetição depende da validação científica existente, motivo profissional e executor idempotente; não é automática.

A distribuição apresentada no longitudinal é lida do único registro durável de eventos canônicos. Não se duplica essa distribuição nas referências documentais, preservando a idempotência e as versões anteriores. Sem linha temporal não se infere predominância de snapshots.

Resultados e identificação exata das execuções ficam em output/preservacao-coerencia-20260921 na raiz do workspace, com cópias descartáveis, logs, manifests de conteúdo, resultados e retomada adicional. A retomada de 18/09 permanece intacta.

Preview sem comprovação de isolamento de banco: não testado. Homologação física, voz real, sessão autenticada e medição dos três minutos continuam pendentes. Não executar launcher/supervisor padrão, pois apontam para Produção.

Se o armazenamento recusar a gravação do diário, a cópia cifrada permanece em memória para exportação antes do logout e recuperação explícita pelo mesmo profissional/contexto. Nenhuma falha local é tratada como sincronização confirmada. A interface distingue a validade da Zona da validade do IIRH, rejeitando uma Zona histórica como atual.
