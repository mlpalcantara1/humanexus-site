"use client";

import { useEffect } from "react";
import {
  portuguesVisivel,
  portuguesVisivelPreservandoEspacos
} from "@/lib/portugues-visivel";

const ATRIBUTOS_VISIVEIS = ["alt", "title", "placeholder", "aria-label"] as const;
const ELEMENTOS_PRESERVADOS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

function podeTraduzirNoElemento(elemento: Element | null) {
  if (!elemento || ELEMENTOS_PRESERVADOS.has(elemento.tagName)) return false;
  return !elemento.closest("[data-portugues-preservar='true']");
}

function traduzirTexto(no: Text) {
  if (!podeTraduzirNoElemento(no.parentElement)) return;
  if (
    no.parentElement instanceof HTMLOptionElement
    && !no.parentElement.hasAttribute("value")
  ) {
    // Em <option> sem atributo value, o navegador deriva o valor do texto.
    // Preserve o contrato canônico antes de traduzir apenas o rótulo visível.
    no.parentElement.setAttribute("value", no.parentElement.value);
  }
  const atual = no.nodeValue ?? "";
  const traduzido = portuguesVisivelPreservandoEspacos(atual);
  if (traduzido !== atual) no.nodeValue = traduzido;
}

function traduzirAtributos(elemento: Element) {
  if (!podeTraduzirNoElemento(elemento)) return;
  for (const atributo of ATRIBUTOS_VISIVEIS) {
    const atual = elemento.getAttribute(atributo);
    if (atual == null) continue;
    const traduzido = portuguesVisivel(atual, "");
    if (traduzido !== atual) elemento.setAttribute(atributo, traduzido);
  }
  if (
    elemento instanceof HTMLInputElement
    && ["button", "submit", "reset"].includes(elemento.type)
  ) {
    const traduzido = portuguesVisivel(elemento.value, "");
    if (traduzido !== elemento.value) elemento.value = traduzido;
  }
}

function traduzirArvore(raiz: Node) {
  if (raiz instanceof Text) traduzirTexto(raiz);
  if (raiz instanceof Element) traduzirAtributos(raiz);

  const textos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let textoAtual = textos.nextNode();
  while (textoAtual) {
    traduzirTexto(textoAtual as Text);
    textoAtual = textos.nextNode();
  }

  if (raiz instanceof Element || raiz instanceof DocumentFragment) {
    raiz.querySelectorAll("*").forEach(traduzirAtributos);
  }
}

type JanelaComPeriodoOcioso = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ) => number;
  cancelIdleCallback?: (identificador: number) => void;
};

/**
 * A árvore inicial pertence ao React até o fim da hidratação. A tradução
 * imperativa só pode começar depois do carregamento completo, de dois quadros
 * de pintura e de um período ocioso; assim nenhum texto emitido pelo servidor
 * é alterado enquanto ainda está sendo reconciliado no navegador.
 */
function ativarTraducaoDepoisDaHidratacaoInicial(
  ativar: () => void
) {
  const janela = window as JanelaComPeriodoOcioso;
  let primeiroQuadro = 0;
  let segundoQuadro = 0;
  let periodoOcioso = 0;
  let temporizador = 0;
  let cancelado = false;

  const concluir = () => {
    if (!cancelado) ativar();
  };
  const depoisDoCarregamento = () => {
    primeiroQuadro = window.requestAnimationFrame(() => {
      segundoQuadro = window.requestAnimationFrame(() => {
        if (janela.requestIdleCallback) {
          periodoOcioso = janela.requestIdleCallback(concluir, {
            timeout: 1_500
          });
          return;
        }
        temporizador = window.setTimeout(concluir, 0);
      });
    });
  };

  if (document.readyState === "complete") depoisDoCarregamento();
  else window.addEventListener("load", depoisDoCarregamento, { once: true });

  return () => {
    cancelado = true;
    window.removeEventListener("load", depoisDoCarregamento);
    if (primeiroQuadro) window.cancelAnimationFrame(primeiroQuadro);
    if (segundoQuadro) window.cancelAnimationFrame(segundoQuadro);
    if (periodoOcioso && janela.cancelIdleCallback) {
      janela.cancelIdleCallback(periodoOcioso);
    }
    if (temporizador) window.clearTimeout(temporizador);
  };
}

/**
 * Proteção final da camada de apresentação. Não altera dados, valores de
 * formulários, rotas, identificadores, contratos ou conteúdo persistido.
 */
export function CamadaPortuguesVisivel() {
  useEffect(() => {
    let observador: MutationObserver | null = null;
    const cancelarAtivacao = ativarTraducaoDepoisDaHidratacaoInicial(() => {
      traduzirArvore(document.body);
      observador = new MutationObserver((alteracoes) => {
        for (const alteracao of alteracoes) {
          if (alteracao.type === "characterData") {
            traduzirTexto(alteracao.target as Text);
            continue;
          }
          if (alteracao.type === "attributes") {
            traduzirAtributos(alteracao.target as Element);
            continue;
          }
          alteracao.addedNodes.forEach(traduzirArvore);
        }
      });
      observador.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...ATRIBUTOS_VISIVEIS]
      });
    });
    return () => {
      cancelarAtivacao();
      observador?.disconnect();
    };
  }, []);
  return null;
}
