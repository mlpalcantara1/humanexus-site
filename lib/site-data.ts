export type NavItem = {
  href: string;
  label: string;
};

export const navigation: NavItem[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Instituto" },
  { href: "/servicos", label: "Programas" },
  { href: "/formacao", label: "Formação" },
  { href: "/pesquisa", label: "Teoria" },
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
  "Desenvolvimento humano aplicado",
  "Riscos psicossociais",
  "Operações aéreas e aeromédicas",
  "Teoria da Inteligência Regulatória Humana",
  "Reunião institucional"
];
