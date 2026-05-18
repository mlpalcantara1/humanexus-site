export type NavItem = {
  href: string;
  label: string;
};

export type SimpleCard = {
  title: string;
  description?: string;
};

export type ProgramCard = {
  name: string;
  description: string;
  items: string[];
  cta: string;
};

export const navigation: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/servicos", label: "Programas" },
  { href: "/formacao", label: "Formação" },
  { href: "/pesquisa", label: "Pesquisa" },
  { href: "/contato", label: "Contato" }
];

export const coreMessages: SimpleCard[] = [
  {
    title: "Autoridade operacional",
    description: "Fatores humanos, neurociência aplicada e leitura regulatória humana para organizações de alta exigência."
  },
  {
    title: "Exclusividade metodológica",
    description: "Arquitetura conceitual proprietária orientada a estabilidade funcional, adaptação sob pressão e performance sustentável."
  },
  {
    title: "Entrega institucional",
    description: "Posicionamento premium para programas contínuos, liderança institucional e evolução humana em ambientes críticos."
  }
];

export const serviceHighlights: SimpleCard[] = [
  {
    title: "Fatores Humanos",
    description: "Leitura aplicada de vulnerabilidades humanas, segurança operacional e estabilidade funcional."
  },
  {
    title: "CRM",
    description: "Programas voltados à coordenação, comunicação e tomada de decisão sob pressão."
  },
  {
    title: "EEG Operacional",
    description: "Neurotecnologia aplicada à observação de foco, mobilização interna e recuperação."
  },
  {
    title: "Performance Cognitiva",
    description: "Estruturas de desenvolvimento para ambientes de elevada exigência e alta responsabilidade."
  },
  {
    title: "Neuroergonomia",
    description: "Integração entre carga cognitiva, contexto operacional e estabilidade adaptativa."
  },
  {
    title: "Estrutura Estratégica",
    description: "Arquitetura aplicada para lideranças, organizações e decisões de alto impacto com acompanhamento contínuo."
  },
  {
    title: "Avaliação Operacional",
    description: "Leitura regulatória humana aplicada ao início de ciclos de desenvolvimento operacional."
  },
  {
    title: "Desenvolvimento Operacional",
    description: "Programas HUMANEXUS para aviação, CRM, segurança e performance sob pressão com progressão longitudinal."
  }
];

export const formationHighlights: SimpleCard[] = [
  {
    title: "Formação HUMANEXUS",
    description: "Programas para profissionais e organizações que desejam incorporar leitura regulatória humana a rotinas de desenvolvimento contínuo."
  },
  {
    title: "CRM aplicado",
    description: "Treinamentos com linguagem compatível com aviação, coordenação crítica e ambientes de risco."
  },
  {
    title: "Capacitação premium",
    description: "Estrutura institucional para elevar padrão técnico, cultura de segurança e diferenciação profissional."
  }
];

export const researchHighlights: SimpleCard[] = [
  {
    title: "Inteligência Regulatória Humana",
    description: "Arquitetura conceitual voltada à estabilidade funcional, adaptação operacional e decisão sob pressão."
  },
  {
    title: "EEG Operacional",
    description: "Uso estratégico de neurotecnologia para ampliar leitura aplicada sem expor engenharia proprietária."
  },
  {
    title: "Variabilidade humana",
    description: "Observação de mudanças funcionais, custo adaptativo e desempenho sustentável em ambientes críticos."
  },
  {
    title: "Estabilidade funcional",
    description: "Capacidade de sustentar consistência comportamental e operacional em cenários de alta exigência."
  },
  {
    title: "Adaptação operacional",
    description: "Reorganização sob pressão com foco em consciência situacional, coordenação e segurança."
  },
  {
    title: "Ambientes críticos",
    description: "Aplicação institucional em aviação, operações especiais, medicina, liderança e alta performance."
  }
];

export const problemCards: SimpleCard[] = [
  { title: "Fadiga operacional" },
  { title: "Sobrecarga cognitiva" },
  { title: "Pressão por decisão" },
  { title: "Risco psicossocial" },
  { title: "Perda de consciência situacional" },
  { title: "Degradação de performance" },
  { title: "Estresse ocupacional" },
  { title: "Vulnerabilidades humanas invisíveis" }
];

export const solutionCards: SimpleCard[] = [
  {
    title: "Avaliação regulatória humana",
    description: "Leitura aplicada da estabilidade funcional em contexto de pressão operacional."
  },
  {
    title: "Simulação neurooperacional",
    description: "Ambientes controlados para observar comportamento, adaptação e risco humano."
  },
  {
    title: "CRM HUMANEXUS",
    description: "Protocolos próprios voltados à comunicação, coordenação e decisão."
  },
  {
    title: "Risco psicossocial operacional",
    description: "Estruturação de evidências e ações para contextos de exigência elevada."
  },
  {
    title: "Treinamento de performance sob pressão",
    description: "Desenvolvimento de estabilidade adaptativa com protocolos orientados por dados."
  },
  {
    title: "Relatórios para gestão e segurança operacional",
    description: "Material executivo para liderança, compliance, segurança e tomada de decisão."
  }
];

export const pillarCards: SimpleCard[] = [
  {
    title: "Inteligência Regulatória",
    description: "Capacidade humana de manter estabilidade funcional sob pressão operacional."
  },
  {
    title: "Performance Operacional",
    description: "Capacidade adaptativa aplicada à execução de tarefas críticas."
  },
  {
    title: "Estabilidade Cognitiva",
    description: "Funcionalidade decisória em ambientes de elevada exigência."
  },
  {
    title: "Performance Sustentável",
    description: "Alta performance sem degradação adaptativa progressiva."
  },
  {
    title: "Vetores Humanos",
    description: "Forças humanas que influenciam comportamento, decisão e adaptação."
  },
  {
    title: "Adaptação Sob Pressão",
    description: "Reorganização funcional diante de complexidade, risco e carga cognitiva."
  }
];

export const technologyItems: SimpleCard[] = [
  { title: "EEG EPOC X" },
  { title: "HRV" },
  { title: "Cockpit de simulação" },
  { title: "Dashboard HUMANEXUS" },
  { title: "Indicadores fisiológicos" },
  { title: "Protocolos cognitivos" },
  { title: "Simulação de carga operacional" },
  { title: "Relatórios executivos" }
];

export const audiences: SimpleCard[] = [
  { title: "Táxi aéreo" },
  { title: "Aviação operacional" },
  { title: "Pilotos e tripulações" },
  { title: "Segurança pública" },
  { title: "Forças policiais" },
  { title: "Operações táticas" },
  { title: "Medicina de alta demanda" },
  { title: "Automobilismo" },
  { title: "Alta performance esportiva" },
  { title: "Lideranças operacionais" },
  { title: "Ambientes corporativos" }
];

export const benefitCards: SimpleCard[] = [
  { title: "Redução de vulnerabilidades humanas" },
  { title: "Apoio à segurança operacional" },
  { title: "Desenvolvimento de pilotos e operadores" },
  { title: "Fortalecimento de programas de fatores humanos" },
  { title: "Identificação de fadiga e sobrecarga" },
  { title: "Apoio à gestão de riscos psicossociais" },
  { title: "Treinamentos com maior evidência operacional" },
  { title: "Relatórios executivos para tomada de decisão" },
  { title: "Maior percepção de cuidado institucional" },
  { title: "Diferenciação perante clientes, auditorias e mercado" }
];

export const regulatoryCards: SimpleCard[] = [
  { title: "Segurança operacional" },
  { title: "Fatores humanos" },
  { title: "CRM" },
  { title: "Riscos psicossociais" },
  { title: "NR-1" },
  { title: "NR-17" },
  { title: "Gestão de fadiga" },
  { title: "Cultura de segurança" },
  { title: "Tomada de decisão" }
];

export const programCards: ProgramCard[] = [
  {
    name: "HUMANEXUS Aviation Essential",
    description:
      "Programa inicial para avaliação e desenvolvimento de performance operacional humana.",
    items: [
      "Análise inicial de fatores humanos",
      "Avaliação regulatória operacional",
      "Baseline cognitivo e fisiológico",
      "Janela de simulação aplicada",
      "Rastreio de fadiga e carga cognitiva",
      "Relatório executivo",
      "Reunião técnica de devolutiva"
    ],
    cta: "Solicitar Avaliação Estratégica"
  },
  {
    name: "HUMANEXUS Operational Shield",
    description:
      "Programa ampliado para organizações que desejam fortalecer segurança operacional, CRM, risco psicossocial e desenvolvimento humano sob pressão.",
    items: [
      "Tudo do Essential",
      "CRM HUMANEXUS",
      "Vistoria de risco psicossocial operacional",
      "Análise ergonômica cognitiva",
      "Matriz de vulnerabilidade humana",
      "Workshop com liderança",
      "Relatório estratégico para gestão",
      "Plano de ação executivo"
    ],
    cta: "Implementar o Programa"
  },
  {
    name: "Programa HUMANEXUS de Riscos Psicossociais e Estabilidade Operacional",
    description:
      "Programa contínuo voltado à leitura regulatória humana, identificação de vulnerabilidades psicossociais, análise de carga operacional, desenvolvimento de lideranças e fortalecimento de práticas preventivas em ambientes de elevada exigência.",
    items: [
      "NR-1 / GRO / PGR",
      "NR-17 / ergonomia organizacional e cognitiva",
      "CLT / prevenção de adoecimento ocupacional",
      "ANAC / SGSO / fatores humanos / segurança operacional",
      "Cultura de segurança e gestão de fadiga",
      "Liderança sob pressão e equipes críticas",
      "Operadores expostos a alta carga decisória"
    ],
    cta: "Implementar o Programa HUMANEXUS"
  }
];

export const psychosocialPainCards: SimpleCard[] = [
  { title: "Fadiga operacional" },
  { title: "Sobrecarga cognitiva" },
  { title: "Pressão por produtividade" },
  { title: "Riscos psicossociais" },
  { title: "Falhas de comunicação" },
  { title: "Baixa cultura de reporte" },
  { title: "Instabilidade decisória" },
  { title: "Liderança despreparada" },
  { title: "Vulnerabilidades humanas invisíveis" },
  { title: "Dificuldade de comprovar ações preventivas" }
];

export const psychosocialSolutionCards: SimpleCard[] = [
  { title: "Leitura regulatória humana" },
  { title: "Acompanhamento contínuo" },
  { title: "Protocolos HUMANEXUS" },
  { title: "Relatórios executivos" },
  { title: "Desenvolvimento de lideranças" },
  { title: "Fortalecimento de cultura operacional" },
  { title: "Análise de carga cognitiva" },
  { title: "Inteligência aplicada à estabilidade humana" },
  { title: "Ações preventivas documentadas" },
  { title: "Plano de desenvolvimento operacional" }
];

export const psychosocialDeliverables: SimpleCard[] = [
  { title: "Mapeamento inicial de vulnerabilidades humanas e psicossociais" },
  { title: "Leitura operacional de fatores humanos" },
  { title: "Acompanhamento longitudinal" },
  { title: "Reuniões executivas de devolutiva" },
  { title: "Relatórios institucionais" },
  { title: "Trilha de desenvolvimento humano operacional" },
  { title: "Programas de treinamento e formação" },
  { title: "Apoio à cultura de segurança" },
  { title: "Indicadores para tomada de decisão" },
  { title: "Recomendações estratégicas de mitigação" }
];

export const psychosocialAudiences: SimpleCard[] = [
  { title: "Operadores aéreos" },
  { title: "Táxi aéreo" },
  { title: "Empresas com equipes sob pressão" },
  { title: "Segurança pública" },
  { title: "Saúde" },
  { title: "Liderança operacional" },
  { title: "Ambientes industriais" },
  { title: "Operações críticas" },
  { title: "Organizações com exigência de prevenção psicossocial" },
  { title: "Empresas que precisam estruturar ações contínuas de fatores humanos" }
];

export const authorityPoints: SimpleCard[] = [
  { title: "Psicólogo" },
  { title: "Mestre e Doutor em Educação — UFAM" },
  { title: "Especialista em Psicologia da Aviação — IPA/FAB" },
  { title: "Formação em Fatores Humanos" },
  { title: "Investigação e Prevenção de Acidentes Aeronáuticos — CENIPA" },
  { title: "Experiência operacional na FAB" },
  { title: "Atuação no SERIPA VII" },
  { title: "CRM e Gestão de Equipes" },
  { title: "Ergonomia e Fatores Humanos" },
  { title: "Professor universitário" },
  { title: "Desenvolvimento de metodologia própria" },
  { title: "Inteligência Regulatória Humana" }
];

export const galleryItems: SimpleCard[] = [
  { title: "Operador com EEG" },
  { title: "Cockpit simulador" },
  { title: "Dashboard HUMANEXUS" },
  { title: "Leitura operacional em notebook" },
  { title: "Identidade visual HUMANEXUS" },
  { title: "Simulação com TV 50 polegadas" }
];

export const instituteValues: SimpleCard[] = [
  { title: "Segurança Operacional" },
  { title: "Excelência" },
  { title: "Inovação" },
  { title: "Inteligência Regulatória" },
  { title: "Ética" },
  { title: "Performance Sustentável" }
];

export const solutionPageCards: SimpleCard[] = [
  { title: "HUMANEXUS Aviation" },
  { title: "CRM HUMANEXUS" },
  { title: "Simulação Neurooperacional" },
  { title: "Avaliação de Riscos Psicossociais Operacionais" },
  { title: "Programas de Performance sob Pressão" },
  { title: "Treinamentos e Workshops Corporativos" }
];

export const aviationPainPoints: SimpleCard[] = [
  {
    title: "Dores da operação aérea",
    description: "Complexidade, tomada de decisão sob pressão, vulnerabilidade silenciosa e exposição a risco humano."
  },
  {
    title: "Fadiga e tomada de decisão",
    description: "Leitura aplicada de desgaste, estabilidade funcional e custo adaptativo."
  },
  {
    title: "CRM HUMANEXUS",
    description: "Integração entre fatores humanos, coordenação, decisão e segurança operacional."
  },
  {
    title: "Simulação aplicada",
    description: "Ambiente controlado para treino, observação e evidência operacional."
  },
  {
    title: "Relatórios executivos",
    description: "Leituras orientadas para gestores, DSO, líderes e programas internos."
  },
  {
    title: "Benefícios para gestores, DSO, pilotos e operadores",
    description: "Desenvolvimento humano aplicado à segurança, cultura e performance sustentável."
  }
];

export const technologyBlocks: SimpleCard[] = [
  {
    title: "Cockpit de simulação",
    description: "Estruturas visuais e operacionais para induzir carga, ambiguidade e tomada de decisão."
  },
  {
    title: "EEG EPOC X",
    description: "Leituras neurofisiológicas aplicadas à observação de foco, mobilização, recuperação e carga."
  },
  {
    title: "HRV",
    description: "Análise cardiovascular voltada à estabilidade adaptativa, custo interno e flexibilidade funcional."
  },
  {
    title: "Dashboard HUMANEXUS",
    description: "Visualização premium de ciclos operacionais, vetores humanos, risco e síntese regulatória."
  },
  {
    title: "Protocolos de simulação",
    description: "Estruturas proprietárias para desenvolver performance sob pressão com critério técnico."
  },
  {
    title: "Relatórios executivos",
    description: "Entrega institucional com leitura operacional clara para liderança e tomada de decisão."
  }
];

export const irhSections: SimpleCard[] = [
  {
    title: "O que é",
    description: "Capacidade de manter estabilidade funcional, consciência situacional, adaptação e decisão sob pressão."
  },
  {
    title: "Por que importa",
    description: "Porque grande parte do risco operacional emerge da degradação humana antes de virar incidente."
  },
  {
    title: "Aplicações",
    description: "Programas operacionais, gestão de risco, fatores humanos, performance sustentável e leitura de vulnerabilidade."
  },
  {
    title: "Relação com segurança operacional",
    description: "Fortalece programas internos ao organizar evidências, ações e leitura aplicada do fator humano."
  },
  {
    title: "Relação com performance sustentável",
    description: "Alta performance com menor custo adaptativo progressivo."
  },
  {
    title: "Vetores humanos",
    description: "Estruturas que organizam foco, carga interna, recuperação, motivação e decisão."
  },
  {
    title: "Estabilidade adaptativa",
    description: "Reorganização funcional diante de pressão, incerteza e complexidade."
  }
];

export const companySections: SimpleCard[] = [
  {
    title: "Por que implementar o HUMANEXUS",
    description: "Para transformar fatores humanos em desenvolvimento contínuo, evidência e governança operacional."
  },
  {
    title: "Problemas que resolvemos",
    description: "Fadiga, carga cognitiva, decisão sob pressão, risco psicossocial operacional e degradação silenciosa."
  },
  {
    title: "Entregáveis",
    description: "Relatórios executivos, leituras regulatórias, protocolos, workshops e planos orientados a evolução operacional humana."
  },
  {
    title: "Estruturas de desenvolvimento",
    description: "Programas por ciclo, jornadas regulatórias, leitura operacional inicial e acompanhamento contínuo."
  },
  {
    title: "Reunião estratégica inicial",
    description: "Conversa inicial para leitura do cenário operacional, risco humano e aderência do programa."
  },
  {
    title: "Plano de implementação",
    description: "Estrutura comercial e técnica orientada a cronograma, fases e implantação institucional do programa."
  }
];

export const areaProfiles: SimpleCard[] = [
  {
    title: "HUMANEXUS Operator",
    description: "Usuário final em acompanhamento, avaliação ou treinamento de performance operacional."
  },
  {
    title: "HUMANEXUS Specialist",
    description: "Profissional formado ou credenciado para aplicar protocolos, acompanhar indicadores e conduzir programas HUMANEXUS."
  },
  {
    title: "HUMANEXUS Strategic Partner",
    description: "Organizações parceiras que utilizam o HUMANEXUS para programas internos de performance, segurança e desenvolvimento humano."
  }
];

export const contactSegments = [
  "Aviação",
  "Táxi aéreo",
  "Segurança pública",
  "Medicina de alta demanda",
  "Esporte de alta performance",
  "Corporativo",
  "Outro"
];

export const contactInterests = [
  "Apresentação institucional",
  "Avaliação estratégica",
  "Formação HUMANEXUS",
  "CRM e fatores humanos",
  "Reunião estratégica inicial",
  "Implementação do Programa HUMANEXUS"
];
