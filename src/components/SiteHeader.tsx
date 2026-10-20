import EcgStrip from "./EcgStrip";
import { IconArrow, IconHeartPulse, IconStetho } from "./icons";

const LINKS = [
  { rota: "/", label: "Início" },
  { rota: "/discursivas", label: "Simulados Semanais" },
  { rota: "/enviar", label: "Enviar Prova" },
  { rota: "/caderno", label: "Caderno de Erros" },
];

interface Props {
  rota: string;
  navegar: (rota: string) => void;
  onExame: () => void;
  onAbrirBot?: () => void;
}

export default function SiteHeader({ rota, navegar, onExame, onAbrirBot }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-900/90 backdrop-blur-md">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <EcgStrip />
        <div className="flex items-center justify-between gap-3 py-3.5">
          <a href="#/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-uerj-red/50 bg-uerj-red/10">
              <IconHeartPulse className="h-6 w-6 text-uerj-red" />
            </span>
            <span className="hidden sm:block">
              <strong className="block font-display text-sm text-ink-100">
                Jujumed <span className="text-emer">UERJ 2027</span>
              </strong>
              <span className="text-[11px] text-ink-400">Medicina · 10 Bio (Peso 2) + 10 Quím + 1 Redação/sem</span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.rota}
                href={`#${l.rota}`}
                onClick={() => navegar(l.rota)}
                className={`rounded-md px-3 py-2 text-xs font-semibold ${
                  rota === l.rota ? "bg-ink-800 text-emer" : "text-ink-300"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {onAbrirBot && (
              <button
                onClick={onAbrirBot}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emer/50 bg-emer/10 px-3 py-2 text-xs font-bold text-emer hover:bg-emer/20 transition"
              >
                <IconStetho className="h-4 w-4" />
                <span className="hidden sm:inline">JujuBot IA</span>
              </button>
            )}
            <button
              onClick={onExame}
              className="inline-flex items-center gap-2 rounded-lg bg-emer px-4 py-2.5 text-xs font-bold text-ink-950"
            >
              Simulado da Semana <IconArrow className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}