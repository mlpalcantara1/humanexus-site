import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gerarPdfVisualHumanexus } from "../lib/tirh-report-document.ts";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const saida = process.env.HXP_PDF_OUTPUT
  ? resolve(process.env.HXP_PDF_OUTPUT)
  : resolve(raiz, "../../HUMANEXUS_plataforma_nova_baseada_na_TIRH/output/pdf");

const vetores = [
  ["VH", "Vetor Humano", "Campo Humano", 72, .84],
  ["VT", "Vetor Tarefa", "Campo da Tarefa", 67, .81],
  ["VS", "Vetor Social", "Campo Estruturante", 76, .78],
  ["VSI", "Vetor Simbólico", "Campo Estruturante", 64, .75],
  ["VAR", "Vetor Autonômico", "Campo Neuroregulatório", 82, .88],
  ["VAM", "Vetor Ação/Motor", "Campo Neuroregulatório", 69, .79],
  ["VJ", "Vetor Julgamento", "Campo Neuroregulatório", 74, .83],
  ["VE", "Vetor Estabilidade", "Campo Humano", 71, .80],
  ["VR", "Vetor Recuperação", "Campo Humano", 79, .86],
  ["VEV", "Vetor Evolução", "Campo Humano", null, null]
].map(([codigo, nome, macrocampo, magnitude, confianca]) => ({
  codigo,
  nome,
  macrocampo,
  magnitude,
  confianca,
  estado: magnitude == null ? "NÃO DEFINIDO" : "CALCULÁVEL",
  motivo: magnitude == null ? "VEV não elegível antes de Baseline e quatro sessões válidas comparáveis." : undefined
}));

const documento_tirh = {
  versao_biblioteca: "BIBLIOTECA-REGULATORIA-OFICIAL-TIRH-1.0",
  versao_motor: "MOTOR-REGULATORIO-OFICIAL-1.1.0",
  estado_inicial: "Organização funcional sob demanda elevada, com recuperação preservada",
  metodologia: "Integração multivetorial contextualizada com qualidade, cobertura, confiança e temporalidade preservadas por fonte.",
  criterios_admissibilidade: [
    "Evidências pertencem à mesma organização, participante, sessão e fase.",
    "Qualidade, cobertura e confiança são declaradas; ausência permanece nula.",
    "Resultante depende de configuração multivetorial admissível.",
    "Trajetória exige dois ou mais estados contextualizados e comparáveis.",
    "Toda recomendação permanece sujeita à validação profissional."
  ],
  evidencias: [
    { nome: "Variação autonômica agregada", origem: "Polar H10", estado: "VÁLIDA", qualidade: .93, cobertura: .91 },
    { nome: "Indicadores neuroregulatórios licenciados", origem: "EPOC X", estado: "VÁLIDA COM RESSALVA", qualidade: .74, cobertura: .82 },
    { nome: "Observação profissional estruturada", origem: "Profissional HUMANEXUS", estado: "VÁLIDA", qualidade: .95, cobertura: .90 },
    { nome: "Contexto da tarefa", origem: "Sessão estruturada", estado: "VÁLIDA", qualidade: .92, cobertura: .94 }
  ],
  fontes: [
    { nome: "Polar H10", estado: "ADMISSÍVEL", qualidade: .93, cobertura: .91 },
    { nome: "EPOC X", estado: "ADMISSÍVEL COM RESSALVA", qualidade: .74, cobertura: .82 },
    { nome: "Observação profissional", estado: "ADMISSÍVEL", qualidade: .95, cobertura: .90 },
    { nome: "Contexto da tarefa", estado: "ADMISSÍVEL", qualidade: .92, cobertura: .94 }
  ],
  fontes_tecnicas: [
    { nome: "Bridge Polar H10", estado: "ENCERRADA COM INTEGRIDADE", sincronizacao: "preservada" },
    { nome: "Bridge EPOC X", estado: "ENCERRADA COM INTEGRIDADE", sincronizacao: "preservada" }
  ],
  vetores,
  resultante: {
    magnitude: 74.2,
    direcao_graus: 38,
    sentido: "Organização funcional com recuperação ascendente",
    confianca: .82,
    versao: "HIPÓTESE OPERACIONAL v0.1 — EM VALIDAÇÃO EMPÍRICA"
  },
  iirh: 78.4,
  zona: { codigo: "ZA", nome: "Zona Adaptativa", confianca: .84 },
  trajetoria: [
    { rotulo: "PRÉ", valor: 58, zona: "ZI" },
    { rotulo: "TREINO", valor: 72, zona: "ZA" },
    { rotulo: "PÓS", valor: 83, zona: "ZO" }
  ],
  arr: {
    estado: "HIPÓTESE PROFISSIONALMENTE VALIDADA",
    descricao: "Rota inicial sensível a sobrecarga de demanda e redução da estabilidade."
  },
  rro: {
    estado: "REORGANIZAÇÃO OBSERVADA",
    descricao: "Mudança operacional sustentada após intervenção e ajuste da tarefa."
  },
  nra: {
    estado: "EM OBSERVAÇÃO LONGITUDINAL",
    descricao: "Nova Rota Adaptativa requer confirmação em ciclos comparáveis."
  },
  gatilhos: [
    { nome: "Elevação simultânea de demanda e pressão temporal", contexto: "Fase PRÉ" },
    { nome: "Quebra de previsibilidade da tarefa", contexto: "Transição para TREINO" },
    { nome: "Recuperação após orientação breve", contexto: "TREINO" }
  ],
  ganhos_regulatorios: [
    { rotulo: "Recuperação", valor: 82 },
    { rotulo: "Estabilidade", valor: 71 },
    { rotulo: "Julgamento", valor: 74 },
    { rotulo: "Autonômico", valor: 82 }
  ],
  intervencoes: [
    { nome: "THX-042 · Reorganização atencional", justificativa: "Selecionado e confirmado pelo profissional." },
    { nome: "Ajuste da previsibilidade da tarefa", justificativa: "Redução controlada de ambiguidade operacional." }
  ],
  respostas: [
    { momento: "TREINO", descricao: "Recuperação autonômica e estabilidade funcional progressivas." },
    { momento: "PÓS", descricao: "Configuração final compatível com tendência de reorganização." }
  ],
  conclusao_operacional: "A sessão demonstra reorganização funcional compatível com a intervenção validada, preservadas as limitações de uma observação contextual.",
  conclusao_cientifica: "As evidências admitem leitura multivetorial nesta fixture. O VEV permanece não definido e a Resultante conserva o status de hipótese operacional em validação empírica.",
  justificativa_profissional: "A recomendação foi acatada após confronto entre ARR, contexto da tarefa, configuração vetorial e resposta observada.",
  recomendacao: "Manter observação longitudinal em tarefa comparável antes de confirmar estabilidade da Nova Rota Adaptativa.",
  questao_regulatoria: "Como sustentar organização funcional diante de aumento de demanda sem perda de recuperação?",
  configuracao_inicial: "Sobrecarga contextual com estabilidade reduzida e capacidade de recuperação preservada.",
  hipoteses_regulatorias: [
    { nome: "Hipótese 01", fundamento: "Interação entre demanda, estabilidade e recuperação na fase PRÉ." },
    { nome: "Hipótese 02", fundamento: "Mudança contextual após intervenção validada no TREINO." }
  ],
  propostas_intervencao: [
    { nome: "THX-042", justificativa: "Compatibilidade oficial e decisão profissional explícita." },
    { nome: "Ajuste de demanda", justificativa: "Aplicação gradual e observação comparável." }
  ],
  decisao_profissional: "ACATAR RECOMENDAÇÃO COM MONITORAMENTO LONGITUDINAL",
  sintese_executiva: "Evolução favorável da organização funcional, com recuperação e estabilidade em tendência ascendente no ciclo observado.",
  evolucao_executiva: "FAVORÁVEL",
  estabilidade_executiva: "EM CONSOLIDAÇÃO",
  tendencia_executiva: "ASCENDENTE",
  tendencias: [
    { rotulo: "Organização funcional", valor: 78 },
    { rotulo: "Recuperação", valor: 82 },
    { rotulo: "Estabilidade", valor: 71 },
    { rotulo: "Adequação à tarefa", valor: 76 }
  ],
  riscos: [
    { nome: "Pressão temporal", descricao: "Pode reativar a rota inicial em contextos não comparáveis." },
    { nome: "Generalização precoce", descricao: "Uma sessão não confirma estabilidade longitudinal." }
  ],
  recomendacoes: [
    { nome: "Novo ciclo comparável", descricao: "Observar manutenção dos ganhos em contexto equivalente." },
    { nome: "Validação profissional", descricao: "Revisar a NRA somente após evidência longitudinal suficiente." }
  ],
  limitacoes: [
    "Fixture determinística, sem pessoa real e sem uso decisório.",
    "Sensores representam fontes parciais de evidência.",
    "Correlação observada não estabelece causalidade.",
    "VEV permanece não definido pela ciência vigente.",
    "Resultante v0.1 permanece hipótese operacional em validação empírica.",
    "Nenhuma recomendação constitui decisão profissional automática."
  ]
};

const telemetria = Array.from({ length: 18 }, (_, indice) => ({
  sequencia: indice + 1,
  timestamp_de_origem: new Date(Date.UTC(2026, 7, 5, 18, 0, indice * 2)).toISOString(),
  latencia_ms: 34 + (indice % 5) * 3,
  perda_detectada: indice === 11 ? 1 : 0,
  fora_de_ordem: false,
  hash_do_dado_bruto: `fixture-hash-${String(indice + 1).padStart(2, "0")}`,
  dado_normalizado_json: { valor: { buffer: 2 + indice % 3 } }
}));

const base = {
  usuario: { identificador: "fixture-profissional-001", nome: "Profissional Fictício HUMANEXUS" },
  participante: {
    identificador: "fixture-participante-001",
    nome: "Participante Fictício TIRH",
    referencia_externa: "FIXTURE-TIRH-001",
    nome_da_organizacao: "Organização Fictícia HUMANEXUS"
  },
  sessao: {
    identificador: "fixture-sessao-001",
    nome_operacional: "Ciclo Regulatório Demonstrativo",
    tipo_de_sessao: "TREINO",
    fase_atual: "PÓS",
    estado: "FINALIZADA",
    iniciado_em: "2026-08-05T18:00:00Z",
    finalizado_em: "2026-08-05T18:45:00Z",
    identificador_da_versao_cientifica: "TIRH-1.1.0"
  },
  execucao: { estado: "CONCLUÍDA" },
  ciclo: { momentos: documento_tirh.trajetoria.map((item) => ({ momento: item.rotulo, iirh: item.valor, zona: item.zona })) },
  telemetria,
  eventos: [
    { timestamp: "2026-08-05T18:00:00Z", tipo: "INÍCIO", estado: "CONFIRMADO" },
    { timestamp: "2026-08-05T18:22:00Z", tipo: "INTERVENÇÃO", estado: "REGISTRADA" },
    { timestamp: "2026-08-05T18:45:00Z", tipo: "ENCERRAMENTO", estado: "CONFIRMADO" }
  ],
  gravacao: { baseline: { referencia: { estado: "REFERÊNCIA PRESERVADA" } } },
  contratoCientifico: { versao: "CONTRATO-CIENTIFICO-TIRH-1.0" }
};

const documentos = [
  ["relatorio-operacional-tirh-fixture.pdf", "OPERACIONAL_TIRH", "Relatório Operacional TIRH · Ciclo Regulatório Demonstrativo"],
  ["relatorio-cientifico-tirh-fixture.pdf", "CIENTIFICO_TIRH", "Relatório Científico TIRH · Admissibilidade e Rastreabilidade"],
  ["relatorio-executivo-tirh-fixture.pdf", "EXECUTIVO", "Relatório Executivo · Evolução Regulatória"],
  ["relatorio-tecnico-sistema-fixture.pdf", "TECNICO", "Relatório Técnico do Sistema · Integridade da Aquisição"],
  ["formulacao-regulatoria-tirh-fixture.pdf", "FORMULACAO_REGULATORIA", "Formulação Regulatória · Síntese Profissional"]
];

await mkdir(saida, { recursive: true });
for (const [arquivo, tipoDocumento, titulo] of documentos) {
  const pdf = await gerarPdfVisualHumanexus({
    ...base,
    tipoDocumento,
    relatorio: {
      identificador: `fixture-${tipoDocumento.toLowerCase()}`,
      tipo: tipoDocumento,
      destinatario: tipoDocumento === "TECNICO" ? "ADMINISTRADOR_TECNICO" : "PROFISSIONAL",
      titulo,
      objetivo: "Demonstrar a arquitetura documental premium com dados exclusivamente fictícios.",
      interpretacao_profissional: documento_tirh.conclusao_operacional,
      criado_em: "2026-08-05T18:45:00Z",
      versao_do_contrato: "RELATORIOS-TIRH-TCO-2.0",
      numero_da_versao: 1,
      secoes: [
        {
          codigo: "IDENTIFICACAO",
          titulo: "Identificação",
          itens: ["Nome completo: Participante de Verificação", "CPF: 000.000.000-00"]
        },
        {
          codigo: "FUNDAMENTOS_TIRH",
          titulo: "Fundamentos da leitura TIRH",
          itens: [
            "A TIRH explica como o funcionamento se sustenta pela organização integrada dos recursos regulatórios.",
            "A leitura preserva os sete postulados, os quatro macrocampos, os Vetores, a Resultante, as Zonas e as Trajetórias Adaptativas."
          ]
        },
        {
          codigo: "SUSTENTACAO_DO_FUNCIONAMENTO",
          titulo: "Como o funcionamento se sustentou",
          itens: ["Dez Vetores Regulatórios foram confrontados com as evidências admissíveis."]
        },
        {
          codigo: "GATILHOS_E_EXIGENCIAS",
          titulo: "Gatilhos e exigências",
          itens: ["Pressão temporal registrada como exigência contextual."]
        },
        {
          codigo: "ROTAS_REGULATORIAS",
          titulo: "Rotas Regulatórias",
          itens: ["A Rota Regulatória observada permanece contextual."]
        },
        {
          codigo: "CONDICOES_REGULATORIAS",
          titulo: "Condições regulatórias",
          itens: ["Condições basais, autonômicas, cognitivas e neuroregulatórias preservadas por fonte."]
        },
        {
          codigo: "TREINAMENTO_COGNITIVO_OPERACIONAL",
          titulo: "Treinamento cognitivo operacional",
          itens: ["CTR, THX e resposta observada orientam a aquisição de Rotas Adaptativas."]
        },
        {
          codigo: "EVOLUCAO_LONGITUDINAL",
          titulo: "Evolução longitudinal",
          itens: ["VEV permanece não elegível antes de Baseline e quatro sessões válidas comparáveis."]
        }
      ],
      documento_tirh
    }
  });
  await writeFile(resolve(saida, arquivo), pdf);
}

console.log(JSON.stringify({ saida, documentos: documentos.map(([arquivo]) => arquivo) }, null, 2));
