"use client";

import { FormEvent, useEffect, useState } from "react";

type Registro = Record<string, unknown>;
type Painel = {
  versao: string;
  configuracao: Registro | null;
  servicos: Registro[];
  segredos_no_navegador: false;
  credenciais_locais: Record<string, boolean>;
};

function csrf() {
  return document.cookie
    .split("; ")
    .find((item) => item.startsWith("humanexus_csrf="))
    ?.split("=")[1] ?? "";
}

function objeto(valor: unknown): Registro {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Registro
    : {};
}

export function ConfiguracaoEstacaoHumanexus({
  organizacao
}: {
  organizacao: string;
}) {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function carregar() {
    if (!organizacao) return;
    const resposta = await fetch(
      `/api/plataforma/estacao-humanexus?organizacao=${
        encodeURIComponent(organizacao)
      }`,
      { cache: "no-store" }
    );
    const corpo = await resposta.json();
    if (!resposta.ok) {
      throw new Error(corpo?.erro?.mensagem ?? "Estação indisponível.");
    }
    setPainel(corpo as Painel);
  }

  useEffect(() => {
    void carregar().catch((erro) => setMensagem(erro.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizacao]);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setOcupado(true);
    setMensagem("");
    const form = new FormData(evento.currentTarget);
    const referencias = Object.fromEntries(
      ["CORTEX_CLIENT_ID_REF", "CORTEX_SECRET_REF", "BRIDGE_SECRET_REF"]
        .map((chave) => [chave, String(form.get(chave) ?? "").trim()])
        .filter(([, valor]) => valor)
    );
    const sensores = form.getAll("sensores").map(String);
    try {
      const resposta = await fetch("/api/plataforma/estacao-humanexus", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-humanexus-csrf": csrf()
        },
        body: JSON.stringify({
          identificador_da_organizacao: organizacao,
          nome_da_estacao: form.get("nome"),
          modalidade_padrao_de_midia: form.get("midia"),
          dispositivos_preferenciais: {
            camera: form.get("camera"),
            microfone: form.get("microfone")
          },
          dispositivos_de_contingencia: {
            camera: form.get("camera_contingencia"),
            microfone: form.get("microfone_contingencia")
          },
          politica_de_reconexao: {
            tentativas: Number(form.get("tentativas") ?? 3),
            intervalo_em_segundos: Number(form.get("intervalo") ?? 5),
            reconexao_infinita: false
          },
          diretorios_protegidos: {
            midia: "RUNTIME_PRIVADO:MIDIAS",
            temporarios: "RUNTIME_PRIVADO:TEMPORARIOS"
          },
          politica_de_retencao: {
            politica: form.get("retencao")
          },
          sensores_homologados: sensores,
          simuladores_cadastrados: String(
            form.get("simuladores") ?? ""
          )
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          referencias_de_credenciais: referencias,
          verificacoes_de_saude: {
            nucleo: "/api/v1/saude",
            intervalo_em_segundos: 15,
            impedir_instancia_duplicada: true,
            impedir_conflito_de_porta: true
          }
        })
      });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        throw new Error(corpo?.erro?.mensagem ?? "Configuração recusada.");
      }
      setMensagem(
        "Estação configurada. Nenhum segredo foi devolvido ao navegador."
      );
      await carregar();
    } catch (erro) {
      setMensagem(
        erro instanceof Error ? erro.message : "Configuração recusada."
      );
    } finally {
      setOcupado(false);
    }
  }

  const configuracao = painel?.configuracao;
  const preferenciais = objeto(configuracao?.dispositivos_preferenciais_json);
  const contingencia = objeto(
    configuracao?.dispositivos_de_contingencia_json
  );
  const reconexao = objeto(configuracao?.politica_de_reconexao_json);
  const sensores = Array.isArray(configuracao?.sensores_homologados_json)
    ? configuracao.sensores_homologados_json.map(String)
    : [];
  const simuladores = Array.isArray(configuracao?.simuladores_cadastrados_json)
    ? configuracao.simuladores_cadastrados_json.map(String).join(", ")
    : "";

  return (
    <section className="hx-station" aria-label="Configuração da estação HUMANEXUS">
      <header>
        <div>
          <small>EXCLUSIVO DO ADMINISTRADOR PROPRIETÁRIO</small>
          <h4>Configuração da Estação HUMANEXUS</h4>
          <p>
            Preferências persistentes, módulos opcionais e referências seguras.
            Valores de credenciais nunca são enviados de volta ao navegador.
          </p>
        </div>
        <strong>{painel?.versao ?? "CARREGANDO"}</strong>
      </header>

      <form onSubmit={(evento) => void salvar(evento)}>
        <fieldset>
          <legend>Identidade e padrões</legend>
          <label>
            Nome da estação
            <input
              name="nome"
              defaultValue={String(
                configuracao?.nome_da_estacao ?? "ESTACAO-PRINCIPAL"
              )}
              required
            />
          </label>
          <label>
            Mídia padrão
            <select
              name="midia"
              defaultValue={String(
                configuracao?.modalidade_padrao_de_midia ?? "NENHUM"
              )}
            >
              <option value="NENHUM">SEM GRAVAÇÃO</option>
              <option value="AUDIO">SOMENTE ÁUDIO</option>
              <option value="VIDEO">SOMENTE VÍDEO</option>
              <option value="AUDIO_E_VIDEO">ÁUDIO E VÍDEO</option>
            </select>
          </label>
          <label>
            Política de retenção
            <select name="retencao" defaultValue="NAO_ARMAZENAR">
              <option value="NAO_ARMAZENAR">Não armazenar mídia</option>
              <option value="DURANTE_A_SESSAO">Durante a sessão</option>
              <option value="ATE_VALIDACAO_DO_RELATORIO">
                Até validação do relatório
              </option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Preferência e contingência</legend>
          <label>
            Câmera preferencial
            <select
              name="camera"
              defaultValue={String(preferenciais.camera ?? "MAC")}
            >
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
              <option value="AUTOMATICA">Escolher no dispositivo</option>
            </select>
          </label>
          <label>
            Câmera de contingência
            <select
              name="camera_contingencia"
              defaultValue={String(contingencia.camera ?? "NENHUMA")}
            >
              <option value="NENHUMA">Nenhuma</option>
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
            </select>
          </label>
          <label>
            Microfone preferencial
            <select
              name="microfone"
              defaultValue={String(preferenciais.microfone ?? "MAC")}
            >
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
              <option value="AUTOMATICO">Escolher no dispositivo</option>
            </select>
          </label>
          <label>
            Microfone de contingência
            <select
              name="microfone_contingencia"
              defaultValue={String(contingencia.microfone ?? "NENHUM")}
            >
              <option value="NENHUM">Nenhum</option>
              <option value="MAC">Mac</option>
              <option value="IPHONE">iPhone</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Reconexão controlada</legend>
          <label>
            Tentativas
            <input
              name="tentativas"
              type="number"
              min="0"
              max="12"
              defaultValue={Number(reconexao.tentativas ?? 3)}
            />
          </label>
          <label>
            Intervalo em segundos
            <input
              name="intervalo"
              type="number"
              min="1"
              max="120"
              defaultValue={Number(reconexao.intervalo_em_segundos ?? 5)}
            />
          </label>
          <p>Reconexão infinita: PROIBIDA</p>
        </fieldset>

        <fieldset>
          <legend>Módulos homologados</legend>
          {["POLAR_H10", "EPOC_X", "OUTRO_EEG_HOMOLOGADO"].map(
            (sensor) => (
              <label className="hx-station__check" key={sensor}>
                <input
                  type="checkbox"
                  name="sensores"
                  value={sensor}
                  defaultChecked={sensores.includes(sensor)}
                />
                {sensor.replaceAll("_", " ")}
              </label>
            )
          )}
          <label>
            Simuladores cadastrados
            <input
              name="simuladores"
              defaultValue={simuladores}
              placeholder="Alias separados por vírgula"
            />
          </label>
        </fieldset>

        <fieldset>
          <legend>Referências protegidas — nunca valores secretos</legend>
          <label>
            Cortex Client ID
            <input
              name="CORTEX_CLIENT_ID_REF"
              placeholder="ENV:HUMANEXUS_CORTEX_CLIENT_ID"
            />
          </label>
          <label>
            Cortex Secret
            <input
              name="CORTEX_SECRET_REF"
              placeholder="KEYCHAIN:HUMANEXUS_CORTEX"
            />
          </label>
          <label>
            Telemetria Bridge
            <input
              name="BRIDGE_SECRET_REF"
              placeholder="ENV:HUMANEXUS_BRIDGE_SECRET"
            />
          </label>
        </fieldset>

        <button disabled={ocupado}>
          SALVAR CONFIGURAÇÃO DA ESTAÇÃO
        </button>
      </form>

      <footer>
        <div>
          <small>SAÚDE LOCAL</small>
          {Object.entries(painel?.credenciais_locais ?? {}).map(
            ([chave, valor]) => (
              <span key={chave}>
                {chave.toUpperCase()} · {valor ? "CONFIGURADA" : "NÃO CONFIGURADA"}
              </span>
            )
          )}
        </div>
        <div>
          <small>SERVIÇOS REGISTRADOS</small>
          {(painel?.servicos ?? []).length ? (
            painel?.servicos.map((servico) => (
              <span key={String(servico.identificador)}>
                {String(servico.codigo)} · {String(servico.estado)}
              </span>
            ))
          ) : (
            <span>Nenhuma preparação executada nesta estação.</span>
          )}
        </div>
      </footer>
      {mensagem ? <p role="status">{mensagem}</p> : null}
    </section>
  );
}
