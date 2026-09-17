/**
 * PeaceBackground — Fundo meditativo moderno com mandalas, folhas ao vento,
 * partículas de brisa, efeitos de luz (glow) e vento mais visível.
 *
 * Camadas (de trás para frente):
 * 1. Gradiente base (verde musgo → marrom terra)
 * 2. Orbes de luz (glow orbs) pulsando suavemente
 * 3. Mandalas SVG girando lentamente (rotação meditativa, 120-180s)
 * 4. Linhas de brisa ondulantes
 * 5. Partículas de vento (pontos sutis se movendo horizontalmente)
 * 6. Folhas flutuando com trajetórias variadas (MAIORES e MAIS VISÍVEIS)
 */

function Mandala({ size, x, y, duration, opacity }: {
  size: number;
  x: string;
  y: string;
  duration: number;
  opacity: number;
}) {
  const petals = 12;
  const petalPaths = Array.from({ length: petals }, (_, i) => {
    const angle = (i * 360) / petals;
    return (
      <g key={i} transform={`rotate(${angle} ${size / 2} ${size / 2})`}>
        <ellipse
          cx={size / 2}
          cy={size * 0.2}
          rx={size * 0.06}
          ry={size * 0.18}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity="0.6"
        />
      </g>
    );
  });

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full mandala-spin"
        style={{
          color: "#d4a574",
          opacity,
          animationDuration: `${duration}s`,
        }}
      >
        <circle cx={size / 2} cy={size / 2} r={size * 0.48} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.38} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.18} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.08} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />
        {petalPaths}
        <circle cx={size / 2} cy={size / 2} r={size * 0.03} fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}

function Leaf({ x, y, size, color, delay, duration, variant }: {
  x: string;
  y: string;
  size: number;
  color: string;
  delay: number;
  duration: number;
  variant: number;
}) {
  const animationName = `leaf-float-${variant}`;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        animation: `${animationName} ${duration}s ease-in-out ${delay}s infinite`,
        opacity: 0.55,
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path
          d="M20 5 C 12 10, 8 18, 10 28 C 12 32, 16 34, 20 35 C 24 34, 28 32, 30 28 C 32 18, 28 10, 20 5 Z"
          fill={color}
          opacity="0.9"
        />
        <path
          d="M20 5 L 20 35"
          stroke={color}
          strokeWidth="0.5"
          opacity="0.5"
          fill="none"
        />
        <path
          d="M20 15 L 14 12 M20 20 L 13 18 M20 25 L 14 24 M20 15 L 26 12 M20 20 L 27 18 M20 25 L 26 24"
          stroke={color}
          strokeWidth="0.3"
          opacity="0.4"
          fill="none"
        />
      </svg>
    </div>
  );
}

function WindParticle({ y, delay, duration, size }: {
  y: string;
  delay: number;
  duration: number;
  size: number;
}) {
  return (
    <div
      className="absolute pointer-events-none wind-particle"
      style={{
        top: y,
        left: "-5%",
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(240, 232, 216, 0.7), rgba(240, 232, 216, 0.1))`,
        boxShadow: `0 0 ${size * 2}px rgba(240, 232, 216, 0.4)`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

function BreezeLine({ y, delay, duration }: {
  y: string;
  delay: number;
  duration: number;
}) {
  return (
    <div
      className="absolute pointer-events-none breeze-line"
      style={{
        top: y,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.25), transparent)",
        boxShadow: "0 0 8px rgba(212, 165, 116, 0.15)",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

function GlowOrb({ x, y, size, color, duration }: {
  x: string;
  y: string;
  size: number;
  color: string;
  duration: number;
}) {
  return (
    <div
      className="absolute pointer-events-none animate-glow"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}40, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export default function PeaceBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Camada 1: Gradiente base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #1a2418 0%, #2a3428 50%, #1f2a1c 100%)",
        }}
      />

      {/* Camada 2: Orbes de luz (glow) */}
      <GlowOrb x="15%" y="25%" size={300} color="#4a7c2e" duration={8} />
      <GlowOrb x="85%" y="70%" size={250} color="#8b6f47" duration={10} />
      <GlowOrb x="50%" y="50%" size={400} color="#d4a574" duration={12} />
      <GlowOrb x="70%" y="20%" size={200} color="#6ba344" duration={9} />
      <GlowOrb x="30%" y="80%" size={280} color="#8b6f47" duration={11} />

      {/* Camada 3: Mandalas girando lentamente */}
      <Mandala size={600} x="15%" y="20%" duration={180} opacity={0.08} />
      <Mandala size={450} x="85%" y="75%" duration={150} opacity={0.06} />
      <Mandala size={350} x="50%" y="50%" duration={200} opacity={0.05} />
      <Mandala size={280} x="70%" y="15%" duration={160} opacity={0.07} />
      <Mandala size={320} x="25%" y="80%" duration={170} opacity={0.06} />

      {/* Camada 4: Linhas de brisa */}
      <BreezeLine y="25%" delay={0} duration={12} />
      <BreezeLine y="45%" delay={3} duration={15} />
      <BreezeLine y="65%" delay={6} duration={13} />
      <BreezeLine y="85%" delay={9} duration={14} />

      {/* Camada 5: Partículas de vento (MAIS VISÍVEIS) */}
      <WindParticle y="15%" delay={0} duration={14} size={5} />
      <WindParticle y="28%" delay={2} duration={16} size={4} />
      <WindParticle y="40%" delay={4} duration={18} size={6} />
      <WindParticle y="52%" delay={6} duration={15} size={4} />
      <WindParticle y="65%" delay={8} duration={17} size={5} />
      <WindParticle y="78%" delay={10} duration={19} size={6} />
      <WindParticle y="20%" delay={12} duration={16} size={4} />
      <WindParticle y="35%" delay={14} duration={18} size={5} />
      <WindParticle y="50%" delay={1} duration={15} size={6} />
      <WindParticle y="72%" delay={5} duration={17} size={4} />
      <WindParticle y="88%" delay={9} duration={14} size={5} />
      <WindParticle y="10%" delay={11} duration={16} size={6} />

      {/* Camada 6: Folhas flutuando (MAIORES e MAIS VISÍVEIS) */}
      <Leaf x="10%" y="25%" size={60} color="#6ba344" delay={0} duration={18} variant={1} />
      <Leaf x="80%" y="15%" size={55} color="#8b6f47" delay={3} duration={20} variant={2} />
      <Leaf x="60%" y="65%" size={65} color="#6ba344" delay={6} duration={22} variant={3} />
      <Leaf x="30%" y="80%" size={58} color="#8b6f47" delay={9} duration={19} variant={4} />
      <Leaf x="90%" y="50%" size={62} color="#6ba344" delay={12} duration={21} variant={5} />
      <Leaf x="45%" y="10%" size={56} color="#8b6f47" delay={15} duration={18} variant={1} />
      <Leaf x="20%" y="55%" size={60} color="#6ba344" delay={18} duration={23} variant={2} />
      <Leaf x="75%" y="85%" size={54} color="#8b6f47" delay={21} duration={20} variant={3} />
      <Leaf x="50%" y="40%" size={64} color="#6ba344" delay={4} duration={24} variant={4} />
      <Leaf x="15%" y="70%" size={58} color="#8b6f47" delay={8} duration={21} variant={5} />
    </div>
  );
}
