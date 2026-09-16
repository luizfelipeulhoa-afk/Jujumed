import { useState, useEffect } from "react";
import { carregarPerfis, carregarDadosPerfil, type Perfil } from "../lib/profiles";
import { IconArrow, IconHeartPulse, IconStar } from "./icons";

interface Props {
  onLogin: (perfil: Perfil) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPerfis(carregarPerfis());
    setTimeout(() => setMounted(true), 100);
  }, []);

  const getProgresso = (perfilId: string) => {
    const dados = carregarDadosPerfil(perfilId);
    if (!dados) return { respondidas: 0, acertos: 0, conceito: "—" };
    const total = Object.keys(dados.sessao.respostas).length;
    const acertos = Object.values(dados.sessao.respostas).filter((r) => r.is_correct).length;
    const taxa = total > 0 ? (acertos / total) * 100 : 0;
    const conceito = taxa >= 70 ? "A" : taxa >= 50 ? "B" : total > 0 ? "C" : "—";
    return { respondidas: total, acertos, conceito };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Fundo com efeitos de luz */}
      <div className="absolute inset-0 bg-ink-950" />
      <div
        className="absolute inset-0 animate-glow"
        style={{
          background: `
            radial-gradient(800px 500px at 20% 30%, rgba(74,124,46,0.25), transparent 60%),
            radial-gradient(900px 600px at 80% 70%, rgba(139,111,71,0.20), transparent 60%),
            radial-gradient(600px 400px at 50% 50%, rgba(212,165,116,0.15), transparent 60%)
          `,
        }}
      />
      <div className="absolute inset-0 grid-texture opacity-30" />

      {/* Mandalas de fundo */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full border border-uerj-gold/10 mandala-spin"
          style={{ animationDuration: "180s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full border border-emer/10 mandala-spin"
          style={{ animationDuration: "150s", animationDirection: "reverse" }}
        />
      </div>

      {/* Conteúdo */}
      <div
        className={`relative z-10 w-full max-w-4xl transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emer to-emer-deep mb-6 shadow-[0_0_60px_rgba(74,124,46,0.4)] animate-glow">
            <IconHeartPulse className="w-10 h-10 text-ink-100" />
          </div>
          <h1 className="font-display font-extrabold text-5xl md:text-6xl text-ink-100 mb-4 tracking-tight">
            Rumo ao Conceito{" "}
            <span className="text-emer inline-block animate-glow">A</span>
          </h1>
          <p className="text-ink-300 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Escolha seu perfil para continuar sua jornada rumo à Medicina na UERJ
          </p>
        </div>

        {/* Cards de perfis */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {perfis.map((perfil, index) => {
            const progresso = getProgresso(perfil.id);
            const isHovered = hoveredId === perfil.id;

            return (
              <button
                key={perfil.id}
                onClick={() => onLogin(perfil)}
                onMouseEnter={() => setHoveredId(perfil.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative overflow-hidden rounded-2xl border-2 p-8 text-left transition-all duration-500 ${
                  mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                } ${
                  isHovered
                    ? "border-emer/60 scale-105 shadow-[0_0_80px_rgba(74,124,46,0.3)]"
                    : "border-ink-700 hover:border-ink-600"
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`,
                  background: `linear-gradient(135deg, ${perfil.cor}15, ${perfil.cor}05)`,
                }}
              >
                {/* Efeito de brilho no hover */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${perfil.cor}20, transparent 70%)`,
                  }}
                />

                {/* Avatar */}
                <div className="relative z-10 mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl transition-all duration-500 ${
                      isHovered ? "scale-110 rotate-6" : ""
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${perfil.cor}30, ${perfil.cor}10)`,
                      border: `3px solid ${perfil.cor}60`,
                      boxShadow: isHovered ? `0 0 40px ${perfil.cor}40` : "none",
                    }}
                  >
                    {perfil.avatar}
                  </div>
                </div>

                {/* Nome */}
                <h2 className="relative z-10 font-display font-extrabold text-3xl text-ink-100 mb-2">
                  {perfil.nome}
                </h2>

                {/* Progresso */}
                <div className="relative z-10 space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">Questões respondidas</span>
                    <span className="font-mono font-bold text-ink-200">{progresso.respondidas}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">Acertos</span>
                    <span className="font-mono font-bold text-emer">{progresso.acertos}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-400">Conceito atual</span>
                    <span
                      className="font-display font-extrabold text-2xl"
                      style={{
                        color:
                          progresso.conceito === "A"
                            ? "#4a7c2e"
                            : progresso.conceito === "B"
                              ? "#6ba344"
                              : progresso.conceito === "C"
                                ? "#d4a574"
                                : "#5d7189",
                      }}
                    >
                      {progresso.conceito}
                    </span>
                  </div>
                </div>

                {/* Botão */}
                <div
                  className={`relative z-10 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-display font-bold text-sm transition-all duration-500 ${
                    isHovered
                      ? "bg-emer text-ink-950 shadow-[0_0_30px_rgba(74,124,46,0.5)]"
                      : "bg-ink-800 text-ink-300"
                  }`}
                >
                  Entrar
                  <IconArrow
                    className={`w-4 h-4 transition-transform duration-500 ${
                      isHovered ? "translate-x-1" : ""
                    }`}
                  />
                </div>

                {/* Decoração */}
                <div
                  className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full transition-all duration-700 ${
                    isHovered ? "opacity-20 scale-150" : "opacity-10 scale-100"
                  }`}
                  style={{ background: perfil.cor }}
                />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-ink-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            <IconStar className="w-4 h-4 text-uerj-gold animate-glow" />
            Cada perfil tem seu próprio progresso e caderno de erros
            <IconStar className="w-4 h-4 text-uerj-gold animate-glow" />
          </p>
        </div>
      </div>
    </div>
  );
}
