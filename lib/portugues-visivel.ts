const EQUIVALENCIAS_EXATAS: Record<string, string> = {
  ACTIVE: "ATIVO",
  BASELINE: "REFERÊNCIA INICIAL",
  CANCELLED: "CANCELADO",
  CANCELED: "CANCELADO",
  CLAIM: "AFIRMAÇÃO CIENTÍFICA",
  CLAIMS: "AFIRMAÇÕES CIENTÍFICAS",
  COMPLETED: "CONCLUÍDO",
  CREATED: "CRIADO",
  DASHBOARD: "PAINEL",
  ERROR: "ERRO",
  FAILED: "FALHOU",
  FAILURE: "FALHA",
  INACTIVE: "INATIVO",
  LIVE: "AO VIVO",
  LOADING: "CARREGANDO",
  OFFLINE: "SEM REDE",
  PENDING: "PENDENTE",
  POS: "PÓS",
  PRE: "PRÉ",
  PREVIEW: "HOMOLOGAÇÃO",
  PRINT: "IMPRESSÃO",
  PRODUCTION: "PRODUÇÃO",
  READY: "PRONTO",
  REPLAY: "REPRODUÇÃO HISTÓRICA",
  STATUS: "SITUAÇÃO",
  SUCCESS: "SUCESSO",
  VALIDATED: "VALIDADO"
};

const SUBSTITUICOES_VISIVEIS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bhuman performance intelligence\b/gi, "inteligência do desempenho humano"],
  [/\bhuman performance system\b/gi, "sistema de desempenho humano"],
  [/\breal time\b/gi, "tempo real"],
  [/\bregulatory intelligence\b/gi, "inteligência regulatória"],
  [/\binstrução crm\b/gi, "instrução em gerenciamento de recursos de equipes"],
  [/\bcrm humanexus\b/gi, "gerenciamento de recursos de equipes HUMANEXUS"],
  [/\bcommand center\b/gi, "centro de comando"],
  [/\bdesign system\b/gi, "sistema visual"],
  [/\bperformance metrics\b/gi, "métricas de desempenho"],
  [/\bclaims\b/gi, "afirmações científicas"],
  [/\bclaim\b/gi, "afirmação científica"],
  [/\bbaselines\b/gi, "referências iniciais"],
  [/\bbaseline\b/gi, "referência inicial"],
  [/\breplays\b/gi, "reproduções históricas"],
  [/\breplay\b/gi, "reprodução histórica"],
  [/\bcockpits\b/gi, "painéis operacionais"],
  [/\bcockpit\b/gi, "painel operacional"],
  [/\bsnapshots\b/gi, "registros congelados"],
  [/\bsnapshot\b/gi, "registro congelado"],
  [/\bdashboards\b/gi, "painéis"],
  [/\bdashboard\b/gi, "painel"],
  [/\bperformance\b/gi, "desempenho"],
  [/\bregulatory\b/gi, "regulatório"],
  [/\bcognitive\b/gi, "cognitivo"],
  [/\bautonomic\b/gi, "autonômico"],
  [/\badaptive\b/gi, "adaptativo"],
  [/\baviation\b/gi, "aviação"],
  [/\bhrv\b/gi, "VFC"],
  [/\bcrm\b/gi, "gerenciamento de recursos de equipes"],
  [/\bstatus\b/gi, "situação"],
  [/\bfallback\b/gi, "substituição implícita"],
  [/\bprint\b/gi, "impressão"],
  [/\bpreview\b/gi, "homologação"],
  [/\bproduction\b/gi, "produção"],
  [/\bcore\b/gi, "núcleo"],
  [/\bruntime\b/gi, "ambiente de execução"],
  [/\bpayload\b/gi, "conteúdo da requisição"],
  [/\bendpoint\b/gi, "endereço do serviço"],
  [/\bpolling\b/gi, "atualização periódica"],
  [/\bcache\b/gi, "armazenamento temporário"],
  [/\bfeedback\b/gi, "devolutiva"],
  [/\bintelligence\b/gi, "inteligência"],
  [/\bcommand\b/gi, "comando"],
  [/\bexperience\b/gi, "experiência"],
  [/\bsystem\b/gi, "sistema"],
  [/\bdesign\b/gi, "concepção visual"],
  [/\bdemo(?:nstration)?\b/gi, "demonstração"],
  [/\bradar\b/gi, "gráfico radial"],
  [/\bhud\b/gi, "painel resumido"],
  [/\blab\b/gi, "laboratório"],
  [/\bbridge\b/gi, "ponte"],
  [/\balias\b/gi, "nome alternativo"],
  [/\bclient\b/gi, "cliente"],
  [/\bsecret\b/gi, "segredo"],
  [/\bpower\b/gi, "potência"],
  [/\braw\b/gi, "bruto"],
  [/\bmock\b/gi, "modelo demonstrativo"],
  [/\bscrubber\b/gi, "controle temporal"],
  [/\bzoom\b/gi, "ampliação"],
  [/\btablet\b/gi, "dispositivo portátil"],
  [/\bnotebook\b/gi, "computador portátil"],
  [/\bqr code\b/gi, "código QR"],
  [/\be-?mail\b/gi, "correio eletrônico"],
  [/\boffline\b/gi, "sem rede"],
  [/\btoken\b/gi, "código secreto"],
  [/\bworker\b/gi, "processador de tarefas"],
  [/\bschema\b/gi, "estrutura"],
  [/\bquery\b/gi, "consulta"],
  [/\bboolean\b/gi, "valor lógico"],
  [/\bhash\b/gi, "resumo de integridade"],
  [/\bappend-only\b/gi, "somente por acréscimo"],
  [/\bread-only\b/gi, "somente leitura"],
  [/\bbackend\b/gi, "servidor"],
  [/\bfrontend\b/gi, "interface"],
  [/\bhardware\b/gi, "equipamento"],
  [/\bsoftware\b/gi, "sistema"],
  [/\bhandoff\b/gi, "transferência de contexto"],
  [/\blease\b/gi, "vínculo exclusivo"],
  [/\bstale\b/gi, "desatualizado"],
  [/\bstream\b/gi, "fluxo"],
  [/\bhttponly\b/gi, "protegido do navegador"],
  [/\bcsrf\b/gi, "proteção contra requisições indevidas"],
  [/\bapi\b/gi, "interface de serviço"],
  [/\bjson\b/gi, "estrutura de dados"],
  [/\bdom\b/gi, "estrutura da página"],
  [/\burl\b/gi, "endereço"],
  [/\bgit\b/gi, "repositório de código"],
  [/\blink\b/gi, "ligação"],
  [/\bdesktop\b/gi, "computador"],
  [/\be-book\b/gi, "livro digital"],
  [/\bpremium\b/gi, "de qualidade superior"],
  [/\bsite\b/gi, "portal digital"],
  [/\bweb\b/gi, "rede"],
  [/\bgate\b/gi, "critério"],
  [/\blogout\b/gi, "saída"],
  [/\blogin\b/gi, "entrada"],
  [/\bloading\b/gi, "carregamento"],
  [/\bdownload\b/gi, "baixar"],
  [/\bupload\b/gi, "enviar arquivo"],
  [/\bsubmit\b/gi, "enviar"],
  [/\bsave\b/gi, "salvar"],
  [/\bcancel\b/gi, "cancelar"],
  [/\bmobile\b/gi, "dispositivo móvel"],
  [/\btooltip\b/gi, "dica contextual"],
  [/\blayout\b/gi, "disposição visual"],
  [/\bonline\b/gi, "conectado"],
  [/\blive\b/gi, "ao vivo"],
  [/\bscore\b/gi, "pontuação"],
  [/\binsights\b/gi, "compreensões"],
  [/\bbenchmark\b/gi, "referência comparativa"]
];

/**
 * Traduz somente a camada de apresentação. Identificadores, rotas, contratos
 * e registros autoritativos permanecem inalterados.
 */
export function portuguesVisivel(valor: unknown, ausencia = "Não informado") {
  const original = String(valor ?? "").trim();
  if (!original) return ausencia;
  const preparado = /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]+(?:_[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]+)+$/.test(original)
    ? original.replaceAll("_", " ")
    : original;
  const exata = EQUIVALENCIAS_EXATAS[preparado.toUpperCase()];
  if (exata) return exata;
  return SUBSTITUICOES_VISIVEIS.reduce(
    (texto, [padrao, substituicao]) => texto.replace(
      padrao,
      (encontrado) => encontrado === encontrado.toUpperCase()
        ? substituicao.toUpperCase()
        : /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(encontrado)
          ? substituicao.charAt(0).toUpperCase() + substituicao.slice(1)
          : substituicao
    ),
    preparado
  );
}

export function portuguesVisivelPreservandoEspacos(valor: unknown) {
  const original = String(valor ?? "");
  if (!original.trim()) return original;
  const inicio = original.match(/^\s*/)?.[0] ?? "";
  const fim = original.match(/\s*$/)?.[0] ?? "";
  const miolo = original.slice(inicio.length, original.length - fim.length);
  return `${inicio}${portuguesVisivel(miolo, "")}${fim}`;
}

export function portuguesNoHtmlVisivel(html: string) {
  const atributosTraduzidos = html.replace(
    /\b(alt|title|placeholder|aria-label)=("[^"]*"|'[^']*')/gi,
    (_trecho, atributo: string, valorComAspas: string) => {
      const aspas = valorComAspas[0];
      const valor = valorComAspas.slice(1, -1);
      return `${atributo}=${aspas}${portuguesVisivel(valor, "")}${aspas}`;
    }
  );
  return atributosTraduzidos
    .split(/(<[^>]+>)/g)
    .map((trecho) => trecho.startsWith("<")
      ? trecho
      : portuguesVisivelPreservandoEspacos(trecho))
    .join("");
}

export function estruturaVisivelEmPortugues(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(estruturaVisivelEmPortugues);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
        portuguesVisivel(chave.replaceAll("_", " ")),
        estruturaVisivelEmPortugues(item)
      ])
    );
  }
  return typeof valor === "string" ? portuguesVisivel(valor) : valor;
}

export const TERMOS_ESTRANGEIROS_PROIBIDOS_NA_APRESENTACAO = [
  "baseline", "replay", "cockpit", "claim", "claims", "snapshot",
  "snapshots", "dashboard", "performance", "status", "fallback",
  "print", "preview", "production", "core", "runtime", "payload", "endpoint",
  "polling", "cache", "feedback", "loading", "download", "upload",
  "submit", "save", "cancel", "mobile", "tooltip", "layout", "benchmark",
  "e-book", "premium", "site", "web", "append-only", "read-only",
  "backend", "frontend", "hardware", "software", "handoff", "lease",
  "stale", "stream", "httponly", "csrf", "api", "json", "dom",
  "url", "git", "link", "desktop", "gate", "login", "logout",
  "online", "offline", "live", "score", "insights", "qr code",
  "email", "e-mail", "token", "worker", "schema", "query", "boolean",
  "hash", "command center", "design system", "intelligence", "command",
  "experience", "system", "design", "demo", "radar", "hud", "lab",
  "bridge", "alias", "client", "secret", "power", "raw", "mock",
  "scrubber", "zoom", "tablet", "notebook", "regulatory", "cognitive",
  "autonomic", "adaptive", "aviation",
  "real time", "hrv", "crm"
] as const;
