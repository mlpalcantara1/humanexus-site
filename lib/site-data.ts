export type NavItem = {
  href: string;
  label: string;
};

export const navigation: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/#programa", label: "Programa" },
  { href: "/#plataforma", label: "Plataforma" },
  { href: "/#areas", label: "Áreas de Atuação" },
  { href: "/#autoridade", label: "Autoridade Técnica" },
  { href: "/contato", label: "Contato" }
];

export const contactSegments = [
  "Aviação operacional",
  "Táxi aéreo",
  "Operações críticas",
  "Saúde",
  "Segurança pública",
  "Corporativo",
  "Outro"
];

export const contactInterests = [
  "Programa institucional",
  "Desenvolvimento humano operacional",
  "Riscos psicossociais",
  "Operações aéreas e aeromédicas",
  "Pesquisa aplicada",
  "Reunião institucional"
];

export const areaProfiles = [
  {
    title: "HUMANEXUS Operator",
    description: "Usuário em acompanhamento, avaliação ou desenvolvimento operacional dentro de programas institucionais."
  },
  {
    title: "HUMANEXUS Specialist",
    description: "Profissional preparado para aplicação de protocolos, leitura de indicadores e condução de programas HUMANEXUS."
  },
  {
    title: "HUMANEXUS Strategic Partner",
    description: "Organização parceira que acompanha programas, relatórios e desenvolvimento humano em escala institucional."
  }
];

export const authorityPoints = [
  { title: "Psicólogo" },
  { title: "Especialista em Psicologia da Aviação" },
  { title: "Mestre e Doutor em Educação" },
  { title: "Formação em Fatores Humanos" },
  { title: "Investigação e prevenção de acidentes aeronáuticos" },
  { title: "Experiência aplicada à segurança operacional" },
  { title: "Atuação com Forças Armadas" },
  { title: "Criador da Teoria da Inteligência Regulatória Humana" }
];
