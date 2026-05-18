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
    title: "Inteligência operacional humana",
    description: "Fatores humanos, segurança operacional e leitura estratégica para ambientes onde a decisão custa caro."
  },
  {
    title: "Método proprietário",
    description: "Protocolos HUMANEXUS desenhados para desenvolvimento contínuo, confidencialidade metodológica e valor institucional."
  },
  {
    title: "Programa contínuo",
    description: "Acompanhamento longitudinal, relatórios executivos e evolução operacional humana para contratos recorrentes."
  }
];

export const serviceHighlights: SimpleCard[] = [
  {
    title: "Programa de Desenvolvimento Humano Operacional",
    description: "Estrutura longitudinal para estabilidade humana, liderança, cultura operacional e performance sob pressão."
  },
  {
    title: "Riscos Psicossociais e Estabilidade Operacional",
    description: "Programa contínuo para vulnerabilidades humanas, carga operacional e ações preventivas documentadas."
  },
  {
    title: "Formação em Fatores Humanos e CRM",
    description: "Capacitação institucional para equipes críticas, coordenação, decisão e cultura de segurança."
  },
  {
    title: "Pesquisa Aplicada e Inteligência Regulatória Humana",
    description: "Base conceitual, leitura estratégica e indicadores executivos para organizações de elevada exigência."
  }
];

export const formationHighlights: SimpleCard[] = [
  {
    title: "Formação HUMANEXUS",
    description: "Capacitação premium para organizações que desejam incorporar fatores humanos, liderança e inteligência operacional ao desenvolvimento contínuo."
  },
  {
    title: "CRM aplicado",
    description: "Estrutura de formação para coordenação, tomada de decisão, consciência situacional e performance em equipe."
  },
  {
    title: "Presença institucional",
    description: "Programas sob demanda para cultura de segurança, liderança sob pressão e maturidade operacional."
  }
];

export const researchHighlights: SimpleCard[] = [
  {
    title: "Inteligência Regulatória Humana",
    description: "Arquitetura conceitual orientada a estabilidade funcional, decisão sob pressão e desenvolvimento institucional."
  },
  {
    title: "Pesquisa aplicada",
    description: "Ciência comportamental, fatores humanos e ambientes críticos apresentados com discrição tecnológica e rigor institucional."
  },
  {
    title: "Estabilidade funcional",
    description: "Leitura estratégica de variabilidade humana, carga operacional e performance sustentável."
  },
  {
    title: "Ambientes críticos",
    description: "Aplicação em aviação, saúde, segurança, educação corporativa e operações de alta responsabilidade."
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
    name: "Programa HUMANEXUS de Desenvolvimento Humano Operacional",
    description:
      "Estrutura contínua para desenvolver estabilidade humana, cultura operacional, liderança e capacidade decisória em ambientes críticos.",
    items: [
      "Leitura inicial de maturidade operacional",
      "Mapeamento de vulnerabilidades humanas",
      "Acompanhamento longitudinal",
      "Reuniões executivas de devolutiva",
      "Relatórios institucionais",
      "Plano de evolução operacional"
    ],
    cta: "Agendar Reunião Institucional"
  },
  {
    name: "Programa HUMANEXUS de Riscos Psicossociais e Estabilidade Operacional",
    description:
      "Programa contínuo voltado à leitura regulatória humana, vulnerabilidades psicossociais, carga operacional e fortalecimento de práticas preventivas.",
    items: [
      "NR-1 / GRO / PGR",
      "NR-17 / ergonomia organizacional e cognitiva",
      "Cultura de segurança e gestão de fadiga",
      "Liderança sob pressão",
      "Evidências de ações preventivas",
      "Plano de mitigação operacional"
    ],
    cta: "Implementar o Programa"
  },
  {
    name: "Formação em Fatores Humanos, CRM e Liderança Operacional",
    description:
      "Formação executiva e institucional para equipes críticas que precisam elevar coordenação, cultura operacional e maturidade decisória.",
    items: [
      "CRM e tomada de decisão",
      "Fatores humanos aplicados",
      "Cultura de reporte e coordenação",
      "Liderança operacional",
      "Treinamentos sob demanda",
      "Workshops institucionais"
    ],
    cta: "Agendar Reunião Institucional"
  },
  {
    name: "Pesquisa Aplicada e Inteligência Regulatória Humana",
    description:
      "Frente institucional para organizações que desejam sustentar programas com base conceitual, evidências executivas e linguagem compatível com contextos de alta exigência.",
    items: [
      "Arquitetura conceitual HUMANEXUS",
      "Leitura estratégica de indicadores humanos",
      "Roteiros de desenvolvimento institucional",
      "Produção de evidências executivas",
      "Apoio à comunicação com liderança",
      "Direção científica aplicada"
    ],
    cta: "Conhecer os Programas HUMANEXUS"
  },
  {
    name: "Núcleo Aviation HUMANEXUS",
    description:
      "Núcleo dedicado a operadores aéreos, táxi aéreo, DSO, CRM, segurança operacional e desenvolvimento longitudinal de equipes de voo e solo.",
    items: [
      "Fatores humanos para operação aérea",
      "CRM e coordenação crítica",
      "Gestão de fadiga e decisão",
      "Cultura operacional",
      "Leitura executiva para DSO",
      "Acompanhamento contínuo"
    ],
    cta: "Falar com o Instituto"
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
  { title: "Psicólogo e Psicólogo de Aviação" },
  { title: "Mestre e Doutor em Educação — UFAM" },
  { title: "Especialista em Psicologia da Aviação — IPA/FAB" },
  { title: "Fatores Humanos e Segurança Operacional" },
  { title: "Investigação e Prevenção de Acidentes Aeronáuticos — CENIPA" },
  { title: "Atuação operacional em ambientes militares e críticos" },
  { title: "SERIPA VII e cultura de segurança" },
  { title: "CRM, liderança e gestão de equipes" },
  { title: "Formação, ensino e presença institucional" },
  { title: "Desenvolvimento de metodologia própria" },
  { title: "Teoria da Inteligência Regulatória Humana" },
  { title: "Direção científica HUMANEXUS" }
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
    description: "Para transformar vulnerabilidade humana em governança, evidência, liderança e desenvolvimento contínuo."
  },
  {
    title: "Problemas que resolvemos",
    description: "Fadiga, carga cognitiva, risco psicossocial, instabilidade decisória e fragilidade de cultura operacional."
  },
  {
    title: "Entregáveis",
    description: "Relatórios executivos, leituras institucionais, trilhas de desenvolvimento e protocolos HUMANEXUS."
  },
  {
    title: "Assinatura institucional",
    description: "Programas recorrentes, ciclos de acompanhamento e evolução progressiva para equipes críticas."
  },
  {
    title: "Reunião estratégica inicial",
    description: "Conversa executiva para leitura do cenário, escopo, aderência e prioridade institucional."
  },
  {
    title: "Plano de implementação",
    description: "Estrutura comercial e técnica orientada a cronograma, fases, recorrência e implantação do programa."
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
  "Programa institucional",
  "Formação / CRM",
  "Riscos psicossociais",
  "Aviation",
  "Pesquisa aplicada",
  "Reunião estratégica"
];
