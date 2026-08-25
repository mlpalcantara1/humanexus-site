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

/**
 * Proteção final da camada de apresentação. Não altera dados, valores de
 * formulários, rotas, identificadores, contratos ou conteúdo persistido.
 */
export function CamadaPortuguesVisivel() {
  useEffect(() => {
    traduzirArvore(document.body);
    const observador = new MutationObserver((alteracoes) => {
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
    return () => observador.disconnect();
  }, []);
  return null;
}
