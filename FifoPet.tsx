import { useEffect, useRef } from "react";

/*
 * ═══════════════════════════════════════════════════════════
 *  FifoPet ⚡ — mascote de estudos do Fífones
 *
 *  Monta o web component <fifo-pet> (esfera com olhos de mangá)
 *  e expõe uma API null-safe para o resto do app reagir:
 *
 *    fifo.setMood("focado")       // troca o clima (cor + olhos)
 *    fifo.say("texto")            // balão de fala
 *    fifo.alert("lembrete")       // pula com "!" até clicarem nela
 *    fifo.remind("água", 300)     // lembrete em segundos
 *
 *  O pet é 100% decorativo: se o script falhar, o app segue normal.
 * ═══════════════════════════════════════════════════════════
 */

type ElementoFifo = HTMLElement & {
  setMood?: (m: string) => void;
  say?: (t: string, ms?: number) => void;
  alert?: (t: string, ms?: number) => void;
  remind?: (t: string, s: number) => void;
};

let carga: Promise<void> | null = null;

function carregarScript(): Promise<void> {
  if (carga) return carga;
  carga = new Promise<void>((resolver, rejeitar) => {
    if (typeof customElements !== "undefined" && customElements.get("fifo-pet")) {
      resolver();
      return;
    }
    const s = document.createElement("script");
    s.src = "/fifo-pet-webcomponent.js";
    s.onload = () => resolver();
    s.onerror = () => rejeitar(new Error("não deu pra carregar o Fifo"));
    document.head.appendChild(s);
  });
  return carga;
}

function pet(): ElementoFifo | null {
  return document.querySelector("fifo-pet") as ElementoFifo | null;
}

/** API global null-safe — chame de qualquer lugar sem medo. */
export const fifo = {
  setMood(m: string): void {
    pet()?.setMood?.(m);
  },
  say(t: string, ms?: number): void {
    pet()?.say?.(t, ms);
  },
  alert(t: string, ms?: number): void {
    pet()?.alert?.(t, ms);
  },
  remind(t: string, segundos: number): void {
    pet()?.remind?.(t, segundos);
  },
};

export default function FifoPet() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let el: HTMLElement | null = null;
    let vivo = true;
    carregarScript()
      .then(() => {
        if (!vivo || !host.current) return;
        if (document.querySelector("fifo-pet")) return; // já montado (StrictMode etc.)
        el = document.createElement("fifo-pet");
        el.setAttribute("mic-button", "");
        host.current.appendChild(el);
      })
      .catch(() => {
        /* mascote é opcional: nunca derruba o app */
      });
    return () => {
      vivo = false;
      el?.remove();
    };
  }, []);

  return <div ref={host} aria-hidden />;
}
