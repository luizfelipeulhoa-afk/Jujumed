import { useState } from "react";
import type { Perfil } from "../lib/profiles";

interface Props {
  perfil: Perfil;
  onTrocarPerfil: () => void;
}

export default function ProfileBadge({ perfil, onTrocarPerfil }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="group inline-flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px] font-semibold text-ink-200 hover:border-ink-600 transition-colors"
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm"
          style={{
            background: `${perfil.cor}20`,
            border: `1.5px solid ${perfil.cor}60`,
          }}
        >
          {perfil.avatar}
        </span>
        <span className="hidden sm:inline">{perfil.nome}</span>
        <svg
          className={`w-3.5 h-3.5 text-ink-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-56 rounded-lg border border-ink-600 bg-ink-850 shadow-2xl shadow-black/60 animate-panel-in">
            <div className="px-4 py-3 border-b border-ink-700">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400 mb-1">
                Perfil ativo
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-base"
                  style={{
                    background: `${perfil.cor}20`,
                    border: `1.5px solid ${perfil.cor}60`,
                  }}
                >
                  {perfil.avatar}
                </span>
                <span className="font-display font-bold text-sm text-ink-100">
                  {perfil.nome}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onTrocarPerfil();
              }}
              className="w-full text-left px-4 py-3 text-[13px] font-semibold text-ink-200 hover:bg-ink-800 hover:text-uerj-red transition-colors"
            >
              Trocar de perfil
            </button>
          </div>
        </>
      )}
    </div>
  );
}
