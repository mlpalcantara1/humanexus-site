const ENTIDADES_HTML: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
};

export function escaparHtml(valor: unknown) {
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ENTIDADES_HTML[caractere]);
}
