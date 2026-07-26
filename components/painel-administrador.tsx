"use client";

import { FormEvent, useEffect, useState } from "react";

type Organizacao = { identificador: string; nome: string; ativa: number };
type Usuario = {
  identificador: string;
  nome: string;
  email: string;
  perfil: string;
  identificador_da_organizacao: string | null;
  ativo: boolean;
};
type Resumo = Record<string, string | number>;

export function PainelAdministrador({ csrf }: { csrf: string }) {
  const [dados, setDados] = useState<{ resumo: Resumo; organizacoes: Organizacao[]; usuarios: Usuario[] } | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [nomeOrganizacao, setNomeOrganizacao] = useState("");
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "", email: "", senha_inicial: "", perfil: "PROFISSIONAL_HUMANEXUS",
    identificador_da_organizacao: ""
  });

  async function carregar() {
    const resposta = await fetch("/api/administracao", { cache: "no-store" });
    if (resposta.ok) setDados(await resposta.json());
    else setMensagem("Não foi possível carregar a administração.");
  }
  useEffect(() => { carregar(); }, []);

  async function criarOrganizacao(evento: FormEvent) {
    evento.preventDefault();
    const resposta = await fetch("/api/administracao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
      body: JSON.stringify({ acao: "criar_organizacao", nome: nomeOrganizacao })
    });
    setMensagem(resposta.ok ? "Organização criada." : "Operação recusada.");
    if (resposta.ok) { setNomeOrganizacao(""); await carregar(); }
  }

  async function alterarAcesso(usuario: Usuario) {
    const resposta = await fetch("/api/administracao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
      body: JSON.stringify({
        acao: "alterar_acesso",
        identificador: usuario.identificador,
        ativo: !usuario.ativo
      })
    });
    setMensagem(resposta.ok ? "Acesso atualizado." : "Operação recusada.");
    if (resposta.ok) await carregar();
  }

  async function criarUsuario(evento: FormEvent) {
    evento.preventDefault();
    const resposta = await fetch("/api/administracao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
      body: JSON.stringify({
        acao: "criar_usuario",
        usuario: {
          ...novoUsuario,
          identificador_da_organizacao:
            novoUsuario.identificador_da_organizacao || null
        }
      })
    });
    setMensagem(resposta.ok ? "Usuário criado com troca obrigatória de senha." : "Operação recusada.");
    if (resposta.ok) {
      setNovoUsuario({ nome: "", email: "", senha_inicial: "", perfil: "PROFISSIONAL_HUMANEXUS", identificador_da_organizacao: "" });
      await carregar();
    }
  }

  return (
    <div className="hx-admin">
      <section className="hx-admin__metrics">
        {dados?.resumo ? Object.entries(dados.resumo).filter(([, valor]) => typeof valor === "number").map(([chave, valor]) => (
          <article key={chave} className="hx-admin__metric">
            <p>{chave.replaceAll("_", " ")}</p>
            <strong>{valor}</strong>
            <small>ESTADO DO NÚCLEO</small>
          </article>
        )) : null}
      </section>
      <section className="hx-admin__layout">
        <div className="hx-admin__forms">
          <form onSubmit={criarOrganizacao} className="hx-admin__form">
            <p className="hx-admin__eyebrow">ESTRUTURA INSTITUCIONAL</p>
            <h2>Nova organização</h2>
            <input required value={nomeOrganizacao} onChange={(e) => setNomeOrganizacao(e.target.value)} placeholder="Nome institucional" />
            <button className="hx-admin__primary">Criar organização <span>→</span></button>
          </form>
          <form onSubmit={criarUsuario} className="hx-admin__form">
            <p className="hx-admin__eyebrow">ACESSO CONTROLADO</p>
            <h2>Novo usuário</h2>
            {(["nome", "email", "senha_inicial"] as const).map((campo) => (
              <input key={campo} required type={campo === "senha_inicial" ? "password" : campo === "email" ? "email" : "text"} minLength={campo === "senha_inicial" ? 10 : undefined} value={novoUsuario[campo]} onChange={(e) => setNovoUsuario({ ...novoUsuario, [campo]: e.target.value })} placeholder={campo.replace("_", " ")} />
            ))}
            <select value={novoUsuario.perfil} onChange={(e) => setNovoUsuario({ ...novoUsuario, perfil: e.target.value })}>
              {["ADMINISTRADOR_DO_SISTEMA","GOVERNANCA_CIENTIFICA","ADMINISTRADOR_DA_ORGANIZACAO","PROFISSIONAL_HUMANEXUS","VISUALIZADOR_OPERACIONAL","AUDITOR"].map((perfil) => <option key={perfil}>{perfil}</option>)}
            </select>
            <select value={novoUsuario.identificador_da_organizacao} onChange={(e) => setNovoUsuario({ ...novoUsuario, identificador_da_organizacao: e.target.value })}>
              <option value="">Escopo sistêmico</option>
              {dados?.organizacoes.map((org) => <option key={org.identificador} value={org.identificador}>{org.nome}</option>)}
            </select>
            <button className="hx-admin__primary">Criar usuário <span>→</span></button>
            <p aria-live="polite" className="hx-admin__message">{mensagem}</p>
          </form>
        </div>
        <article className="hx-admin__directory">
          <div className="hx-admin__directory-head"><div><p>GOVERNANÇA DE ACESSO</p><h2>Usuários e permissões</h2></div><span>CAMADA AUDITÁVEL</span></div>
          <div className="hx-admin__table-wrap"><table>
            <thead><tr><th>Identidade</th><th>Perfil</th><th>Organização</th><th>Acesso</th></tr></thead>
            <tbody>{dados?.usuarios.map((usuario) => (
              <tr key={usuario.identificador} className="border-t border-white/10">
                <td><div>{usuario.nome}</div><small>{usuario.email}</small></td>
                <td>{usuario.perfil}</td>
                <td>{dados.organizacoes.find((org) => org.identificador === usuario.identificador_da_organizacao)?.nome ?? "Sistema"}</td>
                <td><button onClick={() => alterarAcesso(usuario)}>{usuario.ativo ? "Suspender" : "Reativar"}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </article>
      </section>
    </div>
  );
}
