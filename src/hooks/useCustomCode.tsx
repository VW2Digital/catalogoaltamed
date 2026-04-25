import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HEAD_KEY = "custom_code_head";
const BODY_KEY = "custom_code_body";
const HEAD_MARK = "data-custom-head";
const BODY_MARK = "data-custom-body";

/**
 * Recursivamente reescreve <script> em qualquer profundidade dentro de `node`,
 * substituindo-os por scripts criados via document.createElement, que são
 * os únicos que o navegador executa após inserção dinâmica.
 */
function rewriteScripts(node: Node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  // Itera sobre uma cópia: vamos modificar o DOM
  const children = Array.from(el.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === "SCRIPT") {
      const orig = child as HTMLScriptElement;
      const fresh = document.createElement("script");
      for (const attr of Array.from(orig.attributes)) {
        fresh.setAttribute(attr.name, attr.value);
      }
      fresh.text = orig.textContent ?? "";
      el.replaceChild(fresh, orig);
    } else {
      rewriteScripts(child);
    }
  }
}

function applyHTML(html: string, mark: string, target: HTMLElement) {
  // Remove qualquer node previamente injetado por nós
  document.querySelectorAll(`[${mark}]`).forEach((n) => n.remove());
  if (!html.trim()) return;

  // Faz o parse usando um <template> para preservar <script>/<noscript>/<meta>
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  const nodes = Array.from(tpl.content.childNodes);
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName === "SCRIPT") {
        const orig = el as HTMLScriptElement;
        const fresh = document.createElement("script");
        for (const attr of Array.from(orig.attributes)) {
          fresh.setAttribute(attr.name, attr.value);
        }
        fresh.text = orig.textContent ?? "";
        fresh.setAttribute(mark, "");
        target.appendChild(fresh);
      } else {
        // Para wrappers (div, noscript, etc.), reescreve scripts internos antes de inserir
        rewriteScripts(el);
        el.setAttribute(mark, "");
        target.appendChild(el);
      }
    }
  }
}

export function useCustomCodeInjector() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Não injetar nas rotas administrativas/autenticação
    const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/auth");

    if (isAdminArea) {
      // Garante limpeza ao navegar para o admin
      document.querySelectorAll(`[${HEAD_MARK}],[${BODY_MARK}]`).forEach((n) => n.remove());
      return;
    }

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", [HEAD_KEY, BODY_KEY]);
      if (cancelled) return;
      const head = data?.find((d) => d.key === HEAD_KEY)?.value ?? "";
      const body = data?.find((d) => d.key === BODY_KEY)?.value ?? "";
      applyHTML(head, HEAD_MARK, document.head);
      applyHTML(body, BODY_MARK, document.body);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);
}
