import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const HEAD_KEY = "custom_code_head";
const BODY_KEY = "custom_code_body";
const HEAD_MARK = "data-custom-head";
const BODY_MARK = "data-custom-body";

function applyHTML(html: string, mark: string, target: HTMLElement) {
  // Remove qualquer node previamente injetado por nós
  document.querySelectorAll(`[${mark}]`).forEach((n) => n.remove());
  if (!html.trim()) return;

  // Faz o parse usando um <template> para preservar <script>/<noscript>/<meta>
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const nodes = Array.from(tpl.content.childNodes);

  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      // Re-cria <script> para que executem
      if (el.tagName === "SCRIPT") {
        const s = document.createElement("script");
        for (const attr of Array.from(el.attributes)) {
          s.setAttribute(attr.name, attr.value);
        }
        s.text = el.textContent ?? "";
        s.setAttribute(mark, "");
        target.appendChild(s);
      } else {
        const clone = el.cloneNode(true) as Element;
        clone.setAttribute(mark, "");
        target.appendChild(clone);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      // ignora texto solto
    }
  });
}

export function useCustomCodeInjector() {
  useEffect(() => {
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
  }, []);
}
