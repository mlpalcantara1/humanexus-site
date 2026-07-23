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
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
      body: JSON.stringify({ acao: "criar_organizacao", nome: nomeOrganizacao })
    });
    setMensagem(resposta.ok ? "Organização criada." : "Operação recusada.");
    if (resposta.ok) { setNomeOrganizacao(""); await carregar(); }
  }

  async function alterarAcesso(usuario: Usuario) {
    const resposta = await fetch("/api/administracao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
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
      headers: { "content-type": "application/json", "x-csrf-token": csrf },
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
    <div className="mt-10 space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {dados?.resumo ? Object.entries(dados.resumo).filter(([, valor]) => typeof valor === "number").map(([chave, valor]) => (
          <article key={chave} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-wider text-[#8F949C]">{chave.replaceAll("_", " ")}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{valor}</p>
          </article>
        )) : null}
      </section>
      <section className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <div className="space-y-6">
          <form onSubmit={criarOrganizacao} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-xl font-semibold text-white">Nova organização</h2>
            <input required value={nomeOrganizacao} onChange={(e) => setNomeOrganizacao(e.target.value)} placeholder="Nome institucional" className="mt-5 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white" />
            <button className="mt-4 w-full rounded-full bg-[#C9A34E] px-5 py-3 font-semibold text-black">Criar organização</button>
          </form>
          <form onSubmit={criarUsuario} className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-xl font-semibold text-white">Novo usuário</h2>
            {(["nome", "email", "senha_inicial"] as const).map((campo) => (
              <input key={campo} required type={campo === "senha_inicial" ? "password" : campo === "email" ? "email" : "text"} minLength={campo === "senha_inicial" ? 10 : undefined} value={novoUsuario[campo]} onChange={(e) => setNovoUsuario({ ...novoUsuario, [campo]: e.target.value })} placeholder={campo.replace("_", " ")} className="mt-4 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white" />
            ))}
            <select value={novoUsuario.perfil} onChange={(e) => setNovoUsuario({ ...novoUsuario, perfil: e.target.value })} className="mt-4 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white">
              {["ADMINISTRADOR_DO_SISTEMA","GOVERNANCA_CIENTIFICA","ADMINISTRADOR_DA_ORGANIZACAO","PROFISSIONAL_HUMANEXUS","VISUALIZADOR_OPERACIONAL","AUDITOR"].map((perfil) => <option key={perfil}>{perfil}</option>)}
            </select>
            <select value={novoUsuario.identificador_da_organizacao} onChange={(e) => setNovoUsuario({ ...novoUsuario, identificador_da_organizacao: e.target.value })} className="mt-4 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white">
              <option value="">Escopo sistêmico</option>
              {dados?.organizacoes.map((org) => <option key={org.identificador} value={org.identificador}>{org.nome}</option>)}
            </select>
            <button className="mt-4 w-full rounded-full bg-[#C9A34E] px-5 py-3 font-semibold text-black">Criar usuário</button>
            <p aria-live="polite" className="mt-4 text-sm text-[#AEB2B9]">{mensagem}</p>
          </form>
        </div>
        <article className="overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <h2 className="text-xl font-semibold text-white">Usuários e acessos</h2>
          <table className="mt-5 w-full min-w-[680px] text-left text-sm">
            <thead className="text-[#8F949C]"><tr><th>Nome</th><th>Perfil</th><th>Organização</th><th>Acesso</th></tr></thead>
            <tbody className="text-[#D5D7DB]">{dados?.usuarios.map((usuario) => (
              <tr key={usuario.identificador} className="border-t border-white/10">
                <td className="py-4"><div>{usuario.nome}</div><div className="text-xs text-[#8F949C]">{usuario.email}</div></td>
                <td>{usuario.perfil}</td>
                <td>{dados.organizacoes.find((org) => org.identificador === usuario.identificador_da_organizacao)?.nome ?? "Sistema"}</td>
                <td><button onClick={() => alterarAcesso(usuario)} className="rounded-full border border-white/15 px-3 py-2">{usuario.ativo ? "Suspender" : "Reativar"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </article>
      </section>
    </div>
  );
}
