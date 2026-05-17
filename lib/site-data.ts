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
  { href: "/instituto", label: "Instituto" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/aviation", label: "Aviation" },
  { href: "/tecnologia", label: "Tecnologia" },
  { href: "/empresas", label: "Empresas" },
  { href: "/area-humanexus", label: "Área HUMANEXUS" },
  { href: "/contato", label: "Contato" }
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
      "Sessão de simulação",
      "Rastreio de fadiga e carga cognitiva",
      "Relatório executivo",
      "Reunião técnica de devolutiva"
    ],
    cta: "Solicitar proposta"
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
    cta: "Agendar apresentação"
  }
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
    description: "Visualização premium de sessão, vetores humanos, risco e síntese regulatória."
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
    description: "Treinamento, gestão de risco, fatores humanos, performance sustentável e leitura de vulnerabilidade."
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
    title: "Por que contratar o HUMANEXUS",
    description: "Para transformar fatores humanos em ação prática, evidência e governança operacional."
  },
  {
    title: "Problemas que resolvemos",
    description: "Fadiga, carga cognitiva, decisão sob pressão, risco psicossocial operacional e degradação silenciosa."
  },
  {
    title: "Entregáveis",
    description: "Relatórios executivos, leituras regulatórias, protocolos, workshops e planos orientados a risco humano."
  },
  {
    title: "Formatos de contratação",
    description: "Projetos institucionais, programas por ciclo, workshops, leitura operacional inicial e desenvolvimento continuado."
  },
  {
    title: "Reunião estratégica inicial",
    description: "Conversa inicial para leitura do cenário operacional, risco humano e aderência de escopo."
  },
  {
    title: "Proposta institucional",
    description: "Documento comercial e técnico orientado a contrato, entregáveis e cronograma."
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
  "Programa Aviation Essential",
  "Programa Operational Shield",
  "Reunião estratégica inicial",
  "Parceria institucional"
];
