export type NavItem = {
  href: string;
  label: string;
};

export const navigation: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Instituto" },
  { href: "/servicos", label: "Programas" },
  { href: "/formacao", label: "Formação" },
  { href: "/pesquisa", label: "Pesquisa" },
  { href: "/contato", label: "Contato" }
];

export const contactSegments = [
  "Operador aéreo",
  "Táxi aéreo",
  "Operações aeromédicas",
  "Operações críticas",
  "Saúde",
  "Segurança pública",
  "Indústria e energia",
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
    description: "Profissional preparado para acompanhar programas institucionais e conduzir desenvolvimento humano em ambientes críticos."
  },
  {
    title: "HUMANEXUS Strategic Partner",
    description: "Organização parceira que acompanha programas, relatórios e desenvolvimento humano em escala institucional."
  }
];

export const authorityPoints = [
  { title: "Psicólogo de aviação" },
  { title: "21 anos de atuação profissional" },
  { title: "Mestre e Doutor" },
  { title: "Operações críticas e segurança operacional" },
  { title: "Formação de equipes e lideranças" },
  { title: "Atuação com Forças Armadas" },
  { title: "Pesquisa aplicada ao fator humano" },
  { title: "Direção científica e institucional" }
];
