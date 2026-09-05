import EcgStrip from "./EcgStrip";
import { IconArrow, IconHeartPulse } from "./icons";

const LINKS = [
  { rota: "/", label: "Início" },
  { rota: "/enviar", label: "Enviar Prova" },
  { rota: "/caderno", label: "Caderno de Erros" },
];

interface Props {
  rota: string;
  navegar: (rota: string) => void;
  onProvaDomingo: () => void;
}

export default function SiteHeader({ rota, navegar, onProvaDomingo }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/85 backdrop-blur-md">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <EcgStrip />
        <div className="flex items-center justify-between gap-3 py-3.5">
          <a href="#/" className="flex items-center gap-3 min-w-0 group">
            <span className="relative shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[rgba(224,58,72,0.14)] border border-uerj-red/50 transition-transform duration-300 group-hover:scale-105">
              <IconHeartPulse className="w-6 h-6 text-uerj-red" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emer animate-pulse-dot border-2 border-ink-900" />
            </span>
            <span className="min-w-0 hidden sm:block">
              <span className="block font-display font-extrabold text-[15px] leading-tight text-ink-100 truncate">
                Rumo ao Conceito <span className="text-emer">A</span>
              </span>
              <span className="block text-[11px] text-ink-400 truncate">
                Tutora pessoal · Medicina UERJ
              </span>
            </span>
          </a>

          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            {LINKS.map((l) => {
              const ativo = rota === l.rota;
              return (
                <a
                  key={l.rota}
                  href={`#${l.rota}`}
                  onClick={() => navegar(l.rota)}
                  className={`relative hidden md:inline-flex items-center px-3 py-2 text-[13px] font-semibold rounded-md transition-colors ${
                    ativo ? "text-emer" : "text-ink-300 hover:text-ink-100"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full bg-emer transition-transform duration-300 origin-left ${
                      ativo ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              );
            })}
            {/* navegação compacta no mobile */}
            <select
              value={rota}
              onChange={(e) => navegar(e.target.value)}
              className="md:hidden bg-ink-800 border border-ink-700 rounded-md px-2 py-1.5 text-[12px] font-semibold text-ink-200"
              aria-label="Navegação"
            >
              {LINKS.map((l) => (
                <option key={l.rota} value={l.rota}>
                  {l.label}
                </option>
              ))}
            </select>
          </nav>

          <button
            onClick={onProvaDomingo}
            className="group inline-flex items-center gap-2 rounded-lg bg-emer hover:bg-emer-deep text-ink-950 font-display font-bold text-[13px] px-3.5 sm:px-4 py-2.5 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(47,191,143,0.35)] active:scale-[0.97] shrink-0"
          >
            Fazer Prova de Domingo
            <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
