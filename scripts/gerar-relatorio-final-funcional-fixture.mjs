import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { gerarPdfVisualHumanexus } from "../lib/tirh-report-document.ts";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const saida = resolve(
  process.env.HXP_FINAL_PDF_OUTPUT
    ?? resolve(raiz, "output/relatorio-final-funcional-fixture.pdf")
);

const vetores = Object.fromEntries([
  ["VH", 72, .84], ["VT", 67, .81], ["VS", 76, .78],
  ["VSI", 64, .75], ["VAR", 82, .88], ["VAM", 69, .79],
  ["VJ", 74, .83], ["VE", 71, .80], ["VR", 79, .86]
].map(([codigo, valor, confianca]) => [codigo, {
  codigo, valor, confianca, estado: "CALCULADO",
  motivo: "Fonte controlada e admissível da fixture funcional."
}]));

const consolidacao = {
  contexto_e_objetivo: "Compreender a organização regulatória no ciclo controlado e preparar uma devolutiva profissional.",
  evidencias_utilizadas: [
    "Fases PRÉ, TREINO e PÓS preservadas",
    "Observação profissional estruturada HX-OBS",
    "Projeção canônica TIRH V1"
  ],
  observacoes_por_fase: {
    PRE: "Demanda elevada com estabilidade reduzida e recuperação disponível.",
    TREINO: "Intervenção breve seguida de reorganização progressiva.",
    POS: "Recuperação preservada, ainda dependente de confirmação longitudinal."
  },
  intervencao: "Ajuste controlado de previsibilidade e orientação atencional breve.",
  resposta_observada: "Reorganização progressiva durante o TREINO e recuperação preservada no PÓS.",
  interpretacao_profissional: "O funcionamento mobilizou recursos de recuperação diante da demanda, sem autorizar generalização para outros contextos.",
  recursos_regulatorios_observados: "Recuperação, estabilidade progressiva e capacidade de reorganizar a ação.",
  pontos_de_atencao: "Sustentação da organização sob pressão temporal e confirmação em tarefa comparável.",
  limitacoes: "Fixture controlada, sem pessoa real; um único ciclo não sustenta trajetória longitudinal.",
  conclusao: "A sessão documenta reorganização funcional contextual após a intervenção registrada.",
  justificativa: "A conclusão integra fases, vetores, resposta observada e limites explicitamente preservados.",
  recomendacao: "Realizar novo ciclo comparável antes de confirmar consolidação longitudinal.",
  proximo_passo_regulatorio: "Repetir tarefa equivalente com o mesmo contrato científico e registrar HX-OBS por fase.",
  conteudo_da_devolutiva_ao_participante: "Nesta sessão, você mobilizou recursos de recuperação diante de uma demanda elevada. A leitura descreve apenas este contexto e orienta observar como essa organização se sustenta em um próximo ciclo comparável."
};

const tirhV1 = {
  versao_cientifica: "TIRH-OPERACIONAL-AUTORAL-1.0.0",
  sintese: {
    versao_cientifica: "TIRH-OPERACIONAL-AUTORAL-1.0.0",
    vetores: {
      ...vetores,
      VEV: {
        codigo: "VEV",
        estado: "NAO_ELEGIVEL",
        motivo: "Gate longitudinal ainda não atendido."
      }
    },
    resultante: {
      estado: "PLENA",
      motivo: "Configuração multivetorial estrutural materializada; não é nota global."
    },
    iirh: {
      estado: "NAO_CALCULAVEL",
      valor: null,
      motivo: "Cobertura funcional insuficiente dos Macrocampos."
    },
    zona: {
      estado: "NAO_CLASSIFICAVEL",
      codigo: null,
      motivo: "IIRH Operacional V1 não materializado."
    },
    trajetoria: [],
    claims: [{
      claim_id: "CLM-FIXTURE-FINAL-001",
      estado_da_validacao_profissional: "VALIDADO_PROFISSIONALMENTE",
      validacao_profissional: {
        decisao: "VALIDAR",
        estado: "VALIDADO_PROFISSIONALMENTE",
        versao_da_validacao: 1
      }
    }]
  }
};

const pdf = await gerarPdfVisualHumanexus({
  contratoDocumental: "TIRH_V1",
  tipoDocumento: "OPERACIONAL_TIRH",
  usuario: {
    identificador: "fixture-profissional-001",
    nome: "Profissional de Verificação"
  },
  participante: {
    identificador: "fixture-participante-001",
    referencia_externa: "HX-FIXTURE-001",
    perfil_operacional: {
      dados_cadastrais: {
        nome_completo: "Participante de Verificação",
        cpf: "00000000000"
      },
      documentos: []
    }
  },
  sessao: {
    identificador: "fixture-sessao-001",
    nome_operacional: "Ciclo Regulatório Controlado",
    criado_em: "2026-08-23T14:00:00-04:00",
    finalizado_em: "2026-08-23T14:45:00-04:00"
  },
  execucao: { estado: "CONCLUIDA" },
  ciclo: {
    momentos: [
      { momento: "PRÉ", cobertura: .72, confiabilidade: .78, ausencias_json: [] },
      { momento: "TREINO", cobertura: .86, confiabilidade: .82, ausencias_json: [] },
      { momento: "PÓS", cobertura: .81, confiabilidade: .80, ausencias_json: ["Trajetória longitudinal"] }
    ]
  },
  telemetria: [],
  eventos: [],
  gravacao: {},
  contratoCientifico: { versao: "TIRH V1" },
  tirhV1,
  cockpitOperacional: {
    cadeia_cientifica: {
      arr: {
        estado: "PARCIAL",
        motivo: "Respostas admissíveis preservadas.",
        gri: { estado: "SUGERIDO", motivo: "Aguarda consolidação longitudinal." },
        crl: { estado: "NAO_CALCULAVEL", motivo: "Base longitudinal insuficiente." }
      },
      rota_dominante: {
        estado: "VALIDADA",
        motivo: "Decisão profissional preservada na fixture."
      },
      nra: {
        estado: "NAO_CALCULAVEL",
        motivo: "Exige confirmação longitudinal."
      },
      tcr: "TRAJETÓRIA EM OBSERVAÇÃO",
      icr: "NÃO CALCULÁVEL"
    }
  },
  relatorio: {
    identificador: "fixture-relatorio-final-001",
    codigo_publico: "HXP-REL-FIXTURE-V02",
    numero_da_versao: 2,
    tipo: "OPERACIONAL",
    destinatario: "PARTICIPANTE",
    titulo: "Relatório Operacional TIRH — Participante de Verificação",
    titulo_humano: "Relatório Operacional TIRH — Participante de Verificação",
    estado_documental: "CONCLUIDO",
    criado_em: "2026-08-23T15:00:00-04:00",
    identidade_documental: {
      nome_completo: "Participante de Verificação",
      cpf: "000.000.000-00",
      organizacao: "Organização de Verificação"
    },
    contexto_json: { consolidacao_profissional: consolidacao }
  }
});

await mkdir(dirname(saida), { recursive: true });
await writeFile(saida, pdf);
console.log(saida);
