export type LinhaDoLote = {
  numero: number;
  nome: string;
  email: string;
  referencia: string;
  cargo: string;
  funcao: string;
  matricula: string;
  unidade: string;
  setor: string;
};

const ALIASES: Record<string, keyof Omit<LinhaDoLote, "numero">> = {
  nome: "nome", nomes: "nome", nome_completo: "nome", participante: "nome",
  email: "email", correio_eletronico: "email", e_mail: "email",
  referencia: "referencia", referencia_externa: "referencia",
  cargo: "cargo", funcao: "funcao", matricula: "matricula",
  unidade: "unidade", setor: "setor"
};

function chave(valor: string) {
  return valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function linhasCsv(conteudo: string, separador: string): string[][] {
  const linhas: string[][] = [];
  let campos: string[] = [];
  let campo = "";
  let entreAspas = false;
  for (let indice = 0; indice < conteudo.length; indice += 1) {
    const caractere = conteudo[indice];
    if (caractere === '"') {
      if (entreAspas && conteudo[indice + 1] === '"') {
        campo += '"';
        indice += 1;
      } else {
        entreAspas = !entreAspas;
      }
    } else if (caractere === separador && !entreAspas) {
      campos.push(campo.trim());
      campo = "";
    } else if ((caractere === "\n" || caractere === "\r") && !entreAspas) {
      if (caractere === "\r" && conteudo[indice + 1] === "\n") indice += 1;
      campos.push(campo.trim());
      if (campos.some(Boolean)) linhas.push(campos);
      campos = [];
      campo = "";
    } else {
      campo += caractere;
    }
  }
  if (entreAspas) throw new Error("CSV contém campo com aspas sem fechamento.");
  campos.push(campo.trim());
  if (campos.some(Boolean)) linhas.push(campos);
  return linhas;
}

export function lerLoteCsv(conteudo: string): LinhaDoLote[] {
  const texto = conteudo.replace(/^\uFEFF/, "");
  const cabecalho = texto.split(/\r?\n/, 1)[0] ?? "";
  const separador = (cabecalho.match(/;/g) ?? []).length
    >= (cabecalho.match(/,/g) ?? []).length ? ";" : ",";
  const [titulos, ...registros] = linhasCsv(texto, separador);
  if (!titulos) throw new Error("CSV vazio.");
  const indices = new Map<keyof Omit<LinhaDoLote, "numero">, number>();
  titulos.forEach((titulo, indice) => {
    const campo = ALIASES[chave(titulo)];
    if (campo && !indices.has(campo)) indices.set(campo, indice);
  });
  if (!indices.has("nome") || !indices.has("email")) {
    throw new Error("O CSV precisa das colunas nome e email.");
  }
  const emails = new Set<string>();
  const referencias = new Set<string>();
  return registros.map((registro, indice) => {
    const valor = (campo: keyof Omit<LinhaDoLote, "numero">) =>
      registro[indices.get(campo) ?? -1]?.trim() ?? "";
    const linha: LinhaDoLote = {
      numero: indice + 2,
      nome: valor("nome"), email: valor("email").toLowerCase(),
      referencia: valor("referencia"), cargo: valor("cargo"),
      funcao: valor("funcao"), matricula: valor("matricula"),
      unidade: valor("unidade"), setor: valor("setor")
    };
    if (linha.nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linha.email)) {
      throw new Error(`Linha ${linha.numero}: nome ou e-mail inválido.`);
    }
    if (emails.has(linha.email)) {
      throw new Error(`Linha ${linha.numero}: e-mail repetido neste lote.`);
    }
    if (linha.referencia && referencias.has(linha.referencia.toLowerCase())) {
      throw new Error(`Linha ${linha.numero}: referência repetida neste lote.`);
    }
    emails.add(linha.email);
    if (linha.referencia) referencias.add(linha.referencia.toLowerCase());
    return linha;
  });
}

export async function referenciaDoLote(linha: LinhaDoLote): Promise<string> {
  if (linha.referencia) return linha.referencia;
  const bytes = new TextEncoder().encode(linha.email);
  const resumo = await crypto.subtle.digest("SHA-256", bytes);
  return "B2B-" + Array.from(new Uint8Array(resumo)).slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function dadosDoParticipanteDoLote(
  linha: LinhaDoLote, organizacao: string, nomeDaOrganizacao: string,
  referencia: string
) {
  return {
    identificador_da_organizacao: organizacao,
    referencia_externa: referencia,
    tipo_atendimento: "ORGANIZACIONAL",
    tipo_de_vinculo: "ORGANIZACIONAL",
    identificador_da_organizacao_de_vinculo: organizacao,
    dados_minimizados: {
      referencia_operacional: referencia,
      nome_preferencial: linha.nome
    },
    dados_cadastrais: { nome_completo: linha.nome, email: linha.email },
    dados_profissionais: {
      empresa: nomeDaOrganizacao, cargo: linha.cargo,
      funcao: linha.funcao, matricula: linha.matricula,
      unidade: linha.unidade, setor: linha.setor
    },
    contatos: [], documentos: [], elegibilidade: "PENDENTE",
    justificativa: "Cadastro organizacional para apresentação do instrumento integrado.",
    ativo: true
  };
}

export function dadosDaApresentacaoGeral(
  organizacao: string, participante: string, entregarPorEmail = false
) {
  return {
    versao_do_instrumento: "1.4",
    identificador_da_organizacao: organizacao,
    identificador_do_participante: participante,
    identificador_da_sessao: null,
    finalidade: "Escolhas independentes para recursos facultativos HUMANEXUS, antes da atividade indicada.",
    validade_em_horas: 72,
    entregar_por_email: entregarPorEmail,
    recursos: {
      dados_sensiveis: true, polar: true, eeg: true,
      telemetria: true, audio: true, video: true,
      replay: true, relatorio: true, longitudinal: true,
      coletivo: false, pesquisa: false,
      modalidade_de_midia: "AUDIO_E_VIDEO",
      politica_de_retencao: "PRESERVACAO_MANUAL"
    }
  };
}

export function nichoDaOrganizacao(setor: string): string | null {
  const normalizado = setor.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (/AVIAC|AERONAUT|AEREO/.test(normalizado)) return "AVIACAO";
  if (/SAUDE|CLINIC|HOSPITAL/.test(normalizado)) return "SAUDE";
  if (/TRANSPORTE|LOGISTIC/.test(normalizado)) return "TRANSPORTE";
  if (/MARITIM|NAVAL/.test(normalizado)) return "MARITIMO";
  if (/SEGURANCA PUBLICA|POLIC/.test(normalizado)) return "SEGURANCA_PUBLICA";
  if (/EMPRESARIAL|CORPORATIV/.test(normalizado)) return "EMPRESARIAL";
  return null;
}
