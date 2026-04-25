import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const HEAD_KEY = "custom_code_head";
const BODY_KEY = "custom_code_body";
const HEAD_MARK = "data-custom-head";
const BODY_MARK = "data-custom-body";

/** Rotas (e seus prefixos) onde códigos personalizados nunca devem ser injetados. */
const PROTECTED_PREFIXES = ["/admin", "/auth"] as const;

/**
 * Normaliza um pathname para comparação segura:
 * - converte para minúsculas
 * - colapsa barras múltiplas ("//admin" → "/admin")
 * - remove barra final (exceto raiz)
 */
function normalizePath(pathname: string): string {
  try {
    // Trata pathname como URL relativa para resolver "/foo/../bar", "//admin" etc.
    const url = new URL(pathname, "http://_local_");
    let p = url.pathname.toLowerCase().replace(/\/{2,}/g, "/");
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  } catch {
    return pathname.toLowerCase();
  }
}

/** True se a rota atual (ou qualquer subrota) for área protegida. */
function isProtectedRoute(pathname: string): boolean {
  const p = normalizePath(pathname);
  return PROTECTED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`)
  );
}

/** Remove qualquer node previamente injetado pelo hook. */
function purgeInjectedNodes() {
  document
    .querySelectorAll(`[${HEAD_MARK}],[${BODY_MARK}]`)
    .forEach((n) => n.remove());
}

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
  const blocked = isProtectedRoute(pathname);

  useEffect(() => {
    // Sempre limpa antes de decidir injetar — evita resíduo ao navegar
    // de uma rota pública para uma protegida.
    purgeInjectedNodes();

    if (blocked) return;

    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", [HEAD_KEY, BODY_KEY]);
      // Reavalia a rota no momento da resposta — o usuário pode ter
      // navegado para /admin enquanto o fetch estava em andamento.
      if (cancelled || isProtectedRoute(window.location.pathname)) return;
      const head = data?.find((d) => d.key === HEAD_KEY)?.value ?? "";
      const body = data?.find((d) => d.key === BODY_KEY)?.value ?? "";
      applyHTML(head, HEAD_MARK, document.head);
      applyHTML(body, BODY_MARK, document.body);
    })();

    // Salvaguarda final: observa o DOM e remove qualquer nó marcado
    // que aparecer enquanto estivermos em rota protegida (ex: scripts
    // de terceiros que se auto-injetaram após carregamento).
    let observer: MutationObserver | null = null;
    if (blocked) {
      observer = new MutationObserver(() => purgeInjectedNodes());
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [pathname, blocked]);
}
