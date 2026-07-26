"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

type Registro = Record<string, unknown>;
type Painel = {
  versao: string;
  configuracoes: Registro[];
  dispositivos: Registro[];
  segmentos: Registro[];
  eventos: Registro[];
  diagnostico: Registro;
};

function csrf() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))
    ?.split("=")[1] ?? "";
}

export function ControleGravacaoMultimodal({ sessao }: { sessao: string }) {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [modo, setModo] = useState("AUDIO_E_VIDEO");
  const [link, setLink] = useState("");
  const [codigo, setCodigo] = useState("");
  const [qr, setQr] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregar() {
    const resposta = await fetch(
      `/api/plataforma/gravacao-multimodal?sessao=${encodeURIComponent(sessao)}`,
      { cache: "no-store" }
    );
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados?.erro?.mensagem ?? "Gravação indisponível.");
    setPainel(dados as Painel);
  }

  useEffect(() => {
    void carregar().catch((erro) => setMensagem(erro.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessao]);

  async function executar(acao: string, dados: Registro) {
    const resposta = await fetch("/api/plataforma/gravacao-multimodal", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-humanexus-csrf": csrf()
      },
      body: JSON.stringify({ acao, sessao, dados })
    });
    const corpo = await resposta.json();
    if (!resposta.ok) throw new Error(corpo?.erro?.mensagem ?? "Operação recusada.");
    await carregar();
    return corpo as Registro;
  }

  async function configurar() {
    try {
      await executar("configurar", {
        fases: Object.fromEntries(
          ["BASELINE", "PRE", "TREINO", "POS"].map((fase) => [
            fase,
            {
              modo,
              qualidade: "ADAPTATIVA",
              orientacao: "AUTOMATICA",
              finalidade: "REGISTRO_AUDIO_IMAGEM_REPLAY_DA_SESSAO"
            }
          ])
        )
      });
      setMensagem("Configuração por fase preservada no núcleo.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Falha de configuração.");
    }
  }

  async function criarDispositivo() {
    try {
      const corpo = await executar("dispositivo", {
        validade_minutos: 120,
        usos_permitidos: 40
      });
      const bruto = String(corpo.token_de_entrega_unica ?? "");
      const endereco = `${window.location.origin}/captura-sessao?token=${encodeURIComponent(bruto)}`;
      setLink(endereco);
      setCodigo(String(corpo.codigo_de_entrega_unica ?? ""));
      setQr(await QRCode.toDataURL(endereco, {
        width: 260,
        margin: 1,
        color: { dark: "#071116", light: "#F3EFE2" }
      }));
      setMensagem("Link e código exibidos uma única vez. Compartilhe por canal seguro.");
    } catch (erro) {
      setMensagem(erro instanceof Error ? erro.message : "Falha ao criar dispositivo.");
    }
  }

  return (
    <section className="hx-media-control">
      <header>
        <div><small>CAPTURA REAL · {painel?.versao ?? "CARREGANDO"}</small><h3>Áudio, vídeo e sincronização privada</h3></div>
        <span>{String(painel?.diagnostico?.persistidos ?? 0)} segmento(s) persistido(s)</span>
      </header>
      <div className="hx-media-control__grid">
        <article>
          <small>CONFIGURAÇÃO POR FASE</small>
          <label>Modo<select value={modo} onChange={(evento) => setModo(evento.target.value)}>
            <option>NENHUM</option>
            <option>AUDIO</option>
            <option>VIDEO</option>
            <option>AUDIO_E_VIDEO</option>
          </select></label>
          <button onClick={() => void configurar()}>Aplicar a BASELINE / PRÉ / TREINO / PÓS</button>
          <p>As transições finalizam segmentos e preservam lacunas sem interpolação.</p>
        </article>
        <article>
          <small>DISPOSITIVO SEPARADO</small>
          <button onClick={() => void criarDispositivo()} disabled={!painel?.configuracoes?.length}>Gerar acesso limitado</button>
          <p>O dispositivo de captura não recebe sessão nem menu profissional.</p>
        </article>
        <article>
          <small>DIAGNÓSTICO</small>
          <dl>
            {Object.entries(painel?.diagnostico ?? {}).map(([chave, valor]) => <div key={chave}><dt>{chave.replaceAll("_", " ")}</dt><dd>{String(valor)}</dd></div>)}
          </dl>
        </article>
      </div>
      {link ? <div className="hx-media-control__invite">
        {qr ? <img src={qr} alt="QR Code do dispositivo de captura" /> : null}
        <div><small>ENTREGA ÚNICA</small><strong>{codigo}</strong><input readOnly value={link} /><button onClick={() => void navigator.clipboard.writeText(link)}>Copiar link</button></div>
      </div> : null}
      <div className="hx-media-control__states">
        {(painel?.dispositivos ?? []).map((item) => <span key={String(item.identificador)}>{String(item.estado)} · {String(item.identificador)}</span>)}
      </div>
      <p role="status">{mensagem}</p>
    </section>
  );
}
