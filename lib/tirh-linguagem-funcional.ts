/** Conteúdo explicativo da TIRH. Não calcula nem modifica indicadores. */
export const NOMES_DOS_MACROCAMPOS: Record<string, string> = {
  MCH: "Campo Humano", MCT: "Campo da Tarefa", MCE: "Campo Estruturante", MCN: "Campo Neuroregulatório",
};
export const LEITURA_DOS_MACROCAMPOS: Record<string, string> = {
  MCH: "Recursos que o participante mobilizou diante da exigência, estabilidade do funcionamento e capacidade de recuperação.",
  MCT: "Exigências da tarefa e resposta do participante: tempo de reação, decisões, acertos, erros, omissões e manutenção do desempenho.",
  MCE: "Condições sociais, relacionais e simbólicas que sustentaram ou dificultaram o funcionamento na situação.",
  MCN: "Mobilização autonômica e cognitiva, organização da ação e julgamento. O Polar H10 informa a resposta autonômica; as ondas EEG do EPOC X informam a mobilização neurocognitiva.",
};

export const SIGNIFICADOS_FUNCIONAIS_DOS_VETORES: Record<string, string> = {
  VH: "Recursos humanos mobilizados para responder à exigência e sustentar o funcionamento.",
  VT: "Exigência da tarefa em relação aos recursos mobilizados para responder a ela.",
  VS: "Participação das relações, da coordenação e do contexto social no funcionamento.",
  VSI: "Participação do significado atribuído à situação na organização da resposta.",
  VAR: "Mobilização autonômica diante da exigência, observada nos sinais cardíacos do Polar H10.",
  VAM: "Organização da ação: precisão, execução e sustentação da resposta diante da tarefa.",
  VJ: "Discriminação da situação e organização das decisões diante da exigência.",
  VE: "Sustentação da organização regulatória durante a exigência, incluindo oscilações do funcionamento.",
  VR: "Reorganização e recuperação após exigência, erro ou perturbação efetivamente registrados.",
  VEV: "Mudança do funcionamento ao longo de sessões válidas e comparáveis, além do resultado de uma única sessão.",
};

export const EXPLICACAO_DA_RESULTANTE = "A Resultante Regulatória reúne a organização momentânea dos Vetores nos quatro Macrocampos. Sua leitura mostra quais forças contribuíram, como se relacionaram e em que direção o funcionamento se organizou diante da exigência.";
