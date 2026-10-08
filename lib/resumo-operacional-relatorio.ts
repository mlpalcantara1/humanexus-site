import { formatarDuracaoCanonica } from "./duracao-canonica.ts";
import { nomeDaZona, NOMES_DAS_ZONAS } from "./tirh-zone-nomenclature.ts";
import { projetarMacrotrajetoriaRegulatoria } from "./projecao-narrativa-relatorio.ts";

type Registro = Record<string, unknown>;
const obj = (v: unknown): Registro => v && typeof v === "object" && !Array.isArray(v) ? v as Registro : {};
const rows = (v: unknown): Registro[] => Array.isArray(v) ? v.map(obj) : [];
const text = (v: unknown, falta = "não registrado") => typeof v === "string" && v.trim() ? v : falta;
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) ? v : null;
const valor = (v: unknown) => num(v)?.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) ?? "indisponível";
const horario = (v: unknown) => typeof v === "string" && Number.isFinite(Date.parse(v))
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Manaus" }).format(new Date(v)) : "horário não registrado";
export type SecaoOperacional = { titulo: string; itens: string[] };

const jsonObj = (v: unknown): Registro => {
  if (typeof v !== "string") return obj(v);
  try { return obj(JSON.parse(v)); } catch { return {}; }
};

/** Exibe medidas de tarefa já admissíveis; não conta pacotes como respostas. */
export function respostaAosEstimulosNoRelatorio(entrada: {
  evidencias?: unknown; sessao?: unknown; participante?: unknown; organizacao?: unknown;
}): SecaoOperacional {
  const evidencias = rows(entrada.evidencias).filter(e =>
    e.estado_de_validade === "VALIDO"
    && e.identificador_da_sessao === entrada.sessao
    && e.identificador_do_participante === entrada.participante
    && e.identificador_da_organizacao === entrada.organizacao
    && e.origem === "task_profile"
  );
  const campos = [
    ["reaction_time_ms", "Tempo de reação", " ms"],
    ["decision_time_ms", "Tempo de decisão", " ms"],
    ["errors", "Erros registrados", ""],
    ["omissions", "Omissões registradas", ""],
    ["false_positives", "Falsos positivos registrados", ""],
    ["accuracy", "Acurácia", "%"],
  ];
  return { titulo: "Resposta aos estímulos e desempenho", itens: [
    ...["PRE", "TREINO", "POS"].map(fase => {
      const registros = evidencias.filter(e => jsonObj(e.valor_json).fase === fase)
        .sort((a, b) => String(a.criado_em).localeCompare(String(b.criado_em)));
      const medidas = Object.assign({}, ...registros.map(e => obj(jsonObj(e.valor_json).task))) as Registro;
      const nome = fase === "PRE" ? "PRÉ" : fase === "POS" ? "PÓS" : fase;
      return `${nome}: ${campos.map(([codigo, rotulo, unidade]) => `${rotulo}: ${num(medidas[codigo]) === null ? "não medido neste recorte" : valor(medidas[codigo]) + unidade}`).join("; ")}.`;
    }),
    "Acertos: contagem de respostas corretas não recebida neste contrato. Acurácia percentual não é quantidade de acertos.",
    "Sem tentativas de tarefa com estímulo e resposta, os sensores fisiológicos não informam tempo de reação, acertos, erros ou omissões. Ausência de medida não significa desempenho zero."
  ] };
}

/** Apresentação da autoridade existente. Não recalcula escores, duração ou recomendações. */
export function resumoOperacionalDoRelatorio(entrada: {
  cockpit?: unknown; ciclo?: unknown; gravacao?: unknown; protocolo?: unknown;
  ctr?: unknown; longitudinal?: unknown;
}): SecaoOperacional[] {
  const cockpit = obj(entrada.cockpit), leitura = obj(cockpit.leitura_cientifica);
  const temporal = obj(leitura.distribuicao_temporal_das_zonas);
  const revisao = obj(leitura.reprocessamento_eeg);
  const fases = ["PRE", "TREINO", "POS"];
  const faseNome = (f: string) => f === "PRE" ? "PRÉ" : f === "POS" ? "PÓS" : f;
  const tempos = (bruto: unknown) => Object.entries(NOMES_DAS_ZONAS).map(([codigo, nome]) =>
    `${nome}: ${formatarDuracaoCanonica(obj(bruto)[codigo]) ?? "sem duração válida registrada"}`).join("; ");
  const emissoes = rows(temporal.emissoes);
  const momentos = rows(obj(entrada.ciclo).momentos);
  const antesDuranteDepois = fases.map((fase) => {
    const pontos = emissoes.filter(e => e.fase === fase).sort((a,b) => Date.parse(String(a.fim_da_janela)) - Date.parse(String(b.fim_da_janela)));
    const ultimo = pontos.at(-1);
    const momento = momentos.find(m => m.momento === fase || m.momento === faseNome(fase));
    if (!ultimo && !momento) return `${faseNome(fase)}: sem resultado registrado. Não é possível concluir a comparação desta etapa.`;
    const iirh = obj(ultimo?.iirh), zona = obj(ultimo?.zona);
    return `${faseNome(fase)}: último IIRH registrado ${valor(iirh.valor)}; Zona ${nomeDaZona(zona.codigo) ?? "indisponível"} (${text(zona.estado, "classificação não registrada")}); ${horario(ultimo?.fim_da_janela ?? momento?.coletado_em)}. Zona predominante: ${nomeDaZona(obj(temporal.zona_predominante_por_fase)[fase]) ?? "indisponível"}. ${tempos(obj(temporal.tempo_por_fase)[fase])}.`;
  });
  const fontesHistoricas = rows(revisao.fontes_da_ultima_janela_historica);
  const fontes = fontesHistoricas.length ? fontesHistoricas : rows(cockpit.fontes);
  const eeg = fontes.find(f => f.codigo === "EMOTIV_EPOC_X") ?? {};
  const polar = fontes.find(f => f.codigo === "POLAR_H10") ?? {};
  const eegValores = obj(eeg.valores), atividade = obj(eeg.atividade_de_bandas_eeg);
  const ultimoPolar = obj(polar.ultima_leitura_registrada);
  const polarValores = fontesHistoricas.length ? obj(polar.valores) : obj(ultimoPolar.valores);
  const fonteHorario = fontesHistoricas.length ? revisao.hora_da_ultima_janela_recalculada : ultimoPolar.timestamp;
  const bandas = rows(atividade.bandas);
  const protocolo = obj(entrada.protocolo), ctr = obj(entrada.ctr);
  const baseline = obj(obj(entrada.gravacao).baseline), referencia = obj(baseline.referencia), registro = obj(baseline.registro);
  const longitudinal = projetarMacrotrajetoriaRegulatoria(entrada.longitudinal);
  return [
    { titulo: "Antes, durante e depois — IIRH e Zonas", itens: antesDuranteDepois },
    { titulo: "Zona Regulatória dominante e tempos", itens: [
      `Zona predominante da sessão: ${nomeDaZona(temporal.zona_predominante) ?? "indisponível"}. ${temporal.inclui_leituras_provisorias === true ? "Inclui classificações provisórias." : ""}`,
      tempos(temporal.tempo_por_zona_segundos),
      "Somente os intervalos válidos emitidos pelo Núcleo; pausas e lacunas não são completadas. São registros históricos, não leituras atuais.",
      ...(Object.keys(revisao).length ? ["Os tempos e as classificações originais foram preservados. A reavaliação EEG é uma revisão derivada identificada, não uma reemissão dos eventos de zona."] : [])
    ] },
    { titulo: "EEG — bandas e qualidade", itens: [
      ...[ ["theta", "Theta"], ["alpha", "Alfa"], ["beta_baixa", "Beta baixa"], ["beta_alta", "Beta alta"], ["gamma", "Gama"] ].map(([codigo,nome]) => {
        const banda = bandas.find(b => b.codigo === codigo || b.nome === codigo) ?? {};
        const unidade = banda.unidade === "potencia_espectral_nativa_cortex" ? "(potência espectral nativa Cortex)" : text(banda.unidade,"unidade não informada");
        if (num(banda.valor_agregado) === null) return `${nome}: indisponível · sem valor de potência registrado neste recorte.`;
        return `${nome}: ${valor(banda.valor_agregado)} ${unidade} · ${horario(atividade.timestamp)}. Potência recebida; não equivale, isoladamente, a conclusão ou vetor.`;
      }),
      `Qualidade EEG: ${num(eegValores.qualidade_eeg) === null ? "indisponível" : valor(eegValores.qualidade_eeg)+"%"}; contato: ${num(eegValores.qualidade_de_contato) === null ? "indisponível" : valor(eegValores.qualidade_de_contato)+"%"}; amostragem: ${num(eegValores.qualidade_da_taxa_de_amostragem) === null ? "indisponível" : valor(eegValores.qualidade_da_taxa_de_amostragem)+"%"}. Medidas distintas; contato não substitui validade EEG.`,
      fontesHistoricas.length ? "Recorte histórico reavaliado, com qualidade, fase, horário e associação verificados; não é uma leitura atual nem a média de toda a sessão." : "A disponibilidade e a elegibilidade dos indicadores são independentes da presença de valores de bandas."
    ] },
    { titulo: "Polar e HRV — registro fisiológico", itens: [
      `FC: ${valor(polarValores.hr_bpm)} bpm; RR médio: ${valor(polarValores.rr_ms)} ms; RMSSD: ${valor(polarValores.rmssd_tecnico_ms)} ms. ${horario(fonteHorario)}. Último recorte registrado, não média da fase nem leitura atual.`,
      "O Polar é independente do EEG. HRV indisponível não é zero; nenhuma interpretação clínica é inferida apenas destes números."
    ] },
    { titulo: "CTR, THX ou THX AER", itens: [
      `CTR vinculado: ${text(ctr.codigo ?? ctr.identificador)} · ${text(ctr.nome)}.`,
      `Protocolo selecionado: ${text(protocolo.codigo)} · ${text(protocolo.nome)}. Seleção não comprova execução ou efeito. As indicações de treinamento e intervenções registradas permanecem na leitura profissional deste relatório; não são inventadas a partir do nome do protocolo.`
    ] },
    { titulo: "Baseline individual e comparação longitudinal", itens: [
      `Referência inicial: ${text(referencia.estado)}; registro ${text(registro.identificador)}; ${horario(registro.finalizado_em)}.`,
      "O Baseline individual é preservado e reutilizado. Uma nova referência exige decisão justificada e nova versão; não substitui a anterior. A existência do registro não garante comparabilidade para todos os indicadores.",
      ...longitudinal.flatMap(e => e.itens.map(t => `${e.rotulo}: ${t}`)),
      ...(!longitudinal.length ? ["Comparação desde a primeira sessão indisponível neste documento: não foi recebida uma evolução longitudinal admissível. Não se afirma melhora ou piora sem referência e sessões comparáveis."] : [])
    ] }
  ];
}
