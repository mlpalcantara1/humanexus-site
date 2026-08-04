"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { HxSectionHeader, HxSurface } from "@/components/hx-design-system";

type Organizacao = { identificador: string; nome: string; ativa: number };
type Usuario = {
  identificador: string;
  nome: string;
  email: string;
  perfil: string;
  identificador_da_organizacao: string | null;
  ativo: boolean;
  registro_profissional?: string | null;
  historico?: Record<string, unknown>[];
  administrador_proprietario?: boolean;
};
type Resumo = Record<string, string | number>;

type UsuarioAtual = {
  identificador: string;
  perfil: string;
};

function rotuloDoPerfil(perfil: string) {
  if (perfil === "ADMINISTRADOR_PROPRIETARIO") {
    return "Administrador Proprietário";
  }
  return perfil.replaceAll("_", " ");
}

export function PainelAdministrador({
  csrf,
  usuarioAtual
}: {
  csrf: string;
  usuarioAtual: UsuarioAtual;
}) {
  const [dados, setDados] = useState<{ resumo: Resumo; organizacoes: Organizacao[]; usuarios: Usuario[] } | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [usuarioSelecionado, setUsuarioSelecionado] = useState("");
  const [novoUsuario, setNovoUsuario] = useState({
    nome: "", email: "", senha_inicial: "", perfil: "PROFISSIONAL_HUMANEXUS",
    identificador_da_organizacao: "", registro_profissional: "",
    justificativa: ""
  });

  async function carregar() {
    const resposta = await fetch("/api/administracao", { cache: "no-store" });
    if (resposta.ok) setDados(await resposta.json());
    else setMensagem("Não foi possível carregar a administração.");
  }
  useEffect(() => { carregar(); }, []);

  async function alterarAcesso(usuario: Usuario) {
    if (usuario.administrador_proprietario) {
      setMensagem("O Administrador Proprietário possui acesso protegido.");
      return;
    }
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

  async function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    const usuarioEmEdicao = dados?.usuarios.find(
      (usuario) => usuario.identificador === usuarioSelecionado
    );
    if (
      usuarioEmEdicao?.administrador_proprietario
      && usuarioAtual.perfil !== "ADMINISTRADOR_PROPRIETARIO"
    ) {
      setMensagem(
        "Somente o próprio Administrador Proprietário pode atualizar sua ficha."
      );
      return;
    }
    const resposta = await fetch("/api/administracao", {
      method: "POST",
      headers: { "content-type": "application/json", "x-humanexus-csrf": csrf },
      body: JSON.stringify({
        acao: usuarioSelecionado ? "atualizar_usuario" : "criar_usuario",
        identificador: usuarioSelecionado || undefined,
        usuario: {
          ...novoUsuario,
          senha_inicial: usuarioSelecionado
            ? undefined
            : novoUsuario.senha_inicial,
          identificador_da_organizacao:
            novoUsuario.identificador_da_organizacao || null
        }
      })
    });
    setMensagem(
      resposta.ok
        ? usuarioSelecionado
          ? "Usuário atualizado e versionado."
          : "Usuário criado com troca obrigatória de senha."
        : "Operação recusada."
    );
    if (resposta.ok) {
      setUsuarioSelecionado("");
      setNovoUsuario({
        nome: "", email: "", senha_inicial: "",
        perfil: "PROFISSIONAL_HUMANEXUS",
        identificador_da_organizacao: "", registro_profissional: "",
        justificativa: ""
      });
      await carregar();
    }
  }

  function abrirUsuario(usuario: Usuario) {
    setUsuarioSelecionado(usuario.identificador);
    setNovoUsuario({
      nome: usuario.nome,
      email: usuario.email,
      senha_inicial: "",
      perfil: usuario.perfil,
      identificador_da_organizacao:
        usuario.identificador_da_organizacao ?? "",
      registro_profissional: usuario.registro_profissional ?? "",
      justificativa: ""
    });
  }

  const usuarioEmEdicao = dados?.usuarios.find(
    (usuario) => usuario.identificador === usuarioSelecionado
  );
  const edicaoProprietaria = Boolean(
    usuarioEmEdicao?.administrador_proprietario
  );
  const edicaoSomenteLeitura = Boolean(
    edicaoProprietaria
    && usuarioAtual.perfil !== "ADMINISTRADOR_PROPRIETARIO"
  );

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
          <HxSurface as="section" className="hx-admin__form">
            <HxSectionHeader
              eyebrow="ESTRUTURA INSTITUCIONAL"
              title="Organizações"
            />
            <p>
              O cadastro institucional completo possui uma única ficha e um
              único histórico.
            </p>
            <Link className="hx-admin__primary" href="/plataforma/organizacoes">
              Abrir gestão de organizações <span>→</span>
            </Link>
          </HxSurface>
          <form onSubmit={salvarUsuario} className="hx-admin__form">
            <HxSectionHeader
              eyebrow="ACESSO CONTROLADO"
              title={usuarioSelecionado ? "Ficha do usuário" : "Novo usuário"}
            />
            <input disabled={edicaoSomenteLeitura} required value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} placeholder="Nome completo" />
            <input disabled={edicaoSomenteLeitura} required type="email" value={novoUsuario.email} onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })} placeholder="E-mail" />
            {!usuarioSelecionado ? (
              <input required type="password" minLength={10} value={novoUsuario.senha_inicial} onChange={(e) => setNovoUsuario({ ...novoUsuario, senha_inicial: e.target.value })} placeholder="Senha inicial" />
            ) : null}
            <select disabled={edicaoProprietaria} value={novoUsuario.perfil} onChange={(e) => setNovoUsuario({ ...novoUsuario, perfil: e.target.value })}>
              {novoUsuario.perfil === "ADMINISTRADOR_PROPRIETARIO" ? (
                <option value="ADMINISTRADOR_PROPRIETARIO">
                  Administrador Proprietário
                </option>
              ) : null}
              {["ADMINISTRADOR_DO_SISTEMA","GOVERNANCA_CIENTIFICA","ADMINISTRADOR_DA_ORGANIZACAO","PROFISSIONAL_HUMANEXUS","VISUALIZADOR_OPERACIONAL","AUDITOR"].map((perfil) => <option key={perfil}>{perfil}</option>)}
            </select>
            <select disabled={edicaoProprietaria} value={novoUsuario.identificador_da_organizacao} onChange={(e) => setNovoUsuario({ ...novoUsuario, identificador_da_organizacao: e.target.value })}>
              <option value="">Escopo sistêmico</option>
              {dados?.organizacoes.map((org) => <option key={org.identificador} value={org.identificador}>{org.nome}</option>)}
            </select>
            {novoUsuario.perfil === "PROFISSIONAL_HUMANEXUS" ? (
              <input value={novoUsuario.registro_profissional} onChange={(e) => setNovoUsuario({ ...novoUsuario, registro_profissional: e.target.value })} placeholder="Registro profissional" />
            ) : null}
            {usuarioSelecionado ? (
              <textarea disabled={edicaoSomenteLeitura} required value={novoUsuario.justificativa} onChange={(e) => setNovoUsuario({ ...novoUsuario, justificativa: e.target.value })} placeholder="Justificativa da nova versão" />
            ) : null}
            {edicaoProprietaria ? (
              <p className="hx-admin__message">
                Administrador Proprietário · perfil e escopo protegidos por vínculo exclusivo.
              </p>
            ) : null}
            <button disabled={edicaoSomenteLeitura} className="hx-admin__primary">
              {usuarioSelecionado ? "Salvar nova versão" : "Criar usuário"} <span>→</span>
            </button>
            {usuarioSelecionado ? (
              <button type="button" onClick={() => {
                setUsuarioSelecionado("");
                setNovoUsuario({
                  nome: "", email: "", senha_inicial: "",
                  perfil: "PROFISSIONAL_HUMANEXUS",
                  identificador_da_organizacao: "",
                  registro_profissional: "", justificativa: ""
                });
              }}>Cancelar edição</button>
            ) : null}
            <p aria-live="polite" className="hx-admin__message">{mensagem}</p>
          </form>
        </div>
        <HxSurface as="article" className="hx-admin__directory">
          <HxSectionHeader
            className="hx-admin__directory-head"
            eyebrow="GOVERNANÇA DE ACESSO"
            title="Usuários e permissões"
            aside={<span>CAMADA AUDITÁVEL</span>}
          />
          <div className="hx-admin__table-wrap"><table>
            <thead><tr><th>Identidade</th><th>Perfil</th><th>Organização</th><th>Acesso</th></tr></thead>
            <tbody>{dados?.usuarios.map((usuario) => (
              <tr key={usuario.identificador} className="border-t border-white/10">
                <td><div>{usuario.nome}</div><small>{usuario.email}</small></td>
                <td>{rotuloDoPerfil(usuario.perfil)}</td>
                <td>{dados.organizacoes.find((org) => org.identificador === usuario.identificador_da_organizacao)?.nome ?? "Sistema"}</td>
                <td>
                  <button onClick={() => abrirUsuario(usuario)}>Abrir ficha</button>
                  <button
                    disabled={usuario.administrador_proprietario}
                    onClick={() => alterarAcesso(usuario)}
                  >{usuario.administrador_proprietario ? "Acesso protegido" : usuario.ativo ? "Suspender" : "Reativar"}</button>
                  <small>{usuario.historico?.length ?? 0} versão(ões)</small>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        </HxSurface>
      </section>
    </div>
  );
}
