/**
 * PeaceBackground — Fundo meditativo com mandalas, folhas ao vento e partículas de brisa.
 *
 * Camadas (de trás para frente):
 * 1. Gradiente base (verde musgo → marrom terra)
 * 2. Mandalas SVG girando lentamente (rotação meditativa, 120-180s)
 * 3. Linhas de brisa ondulantes
 * 4. Partículas de vento (pontos sutis se movendo horizontalmente)
 * 5. Folhas flutuando com trajetórias variadas
 *
 * Tudo em SVG + CSS puro para máxima performance (GPU-accelerated).
 */

// Mandala: padrão geométrico concêntrico (estilo yantra)
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
        {/* Círculos concêntricos */}
        <circle cx={size / 2} cy={size / 2} r={size * 0.48} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.38} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.18} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.08} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.7" />

        {/* Pétalas */}
        {petalPaths}

        {/* Centro */}
        <circle cx={size / 2} cy={size / 2} r={size * 0.03} fill="currentColor" opacity="0.5" />
      </svg>
    </div>
  );
}

// Folha SVG com formato orgânico
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
        opacity: 0.35,
      }}
    >
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <path
          d="M20 5 C 12 10, 8 18, 10 28 C 12 32, 16 34, 20 35 C 24 34, 28 32, 30 28 C 32 18, 28 10, 20 5 Z"
          fill={color}
          opacity="0.8"
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

// Partícula de vento (ponto pequeno se movendo horizontalmente)
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
        background: "rgba(240, 232, 216, 0.3)",
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

// Linha de brisa (ondulação sutil)
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
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.15), transparent)",
        animationDelay: `${delay}s`,
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

      {/* Camada 1.5: Véu sutil para garantir legibilidade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(26, 36, 24, 0.3) 0%, rgba(26, 36, 24, 0.6) 100%)",
        }}
      />

      {/* Camada 2: Mandalas girando lentamente */}
      <Mandala size={600} x="15%" y="20%" duration={180} opacity={0.08} />
      <Mandala size={450} x="85%" y="75%" duration={150} opacity={0.06} />
      <Mandala size={350} x="50%" y="50%" duration={200} opacity={0.05} />
      <Mandala size={280} x="70%" y="15%" duration={160} opacity={0.07} />
      <Mandala size={320} x="25%" y="80%" duration={170} opacity={0.06} />

      {/* Camada 3: Linhas de brisa */}
      <BreezeLine y="25%" delay={0} duration={12} />
      <BreezeLine y="45%" delay={3} duration={15} />
      <BreezeLine y="65%" delay={6} duration={13} />
      <BreezeLine y="85%" delay={9} duration={14} />

      {/* Camada 4: Partículas de vento */}
      <WindParticle y="20%" delay={0} duration={18} size={3} />
      <WindParticle y="35%" delay={4} duration={22} size={2} />
      <WindParticle y="50%" delay={8} duration={20} size={3} />
      <WindParticle y="65%" delay={2} duration={24} size={2} />
      <WindParticle y="80%" delay={6} duration={19} size={3} />
      <WindParticle y="15%" delay={10} duration={21} size={2} />
      <WindParticle y="40%" delay={14} duration={23} size={2} />
      <WindParticle y="70%" delay={12} duration={17} size={3} />

      {/* Camada 5: Folhas flutuando */}
      <Leaf x="10%" y="30%" size={40} color="#6ba344" delay={0} duration={25} variant={1} />
      <Leaf x="80%" y="20%" size={35} color="#8b6f47" delay={5} duration={28} variant={2} />
      <Leaf x="60%" y="70%" size={45} color="#6ba344" delay={10} duration={30} variant={3} />
      <Leaf x="30%" y="85%" size={38} color="#8b6f47" delay={15} duration={26} variant={4} />
      <Leaf x="90%" y="55%" size={42} color="#6ba344" delay={8} duration={29} variant={5} />
      <Leaf x="45%" y="15%" size={36} color="#8b6f47" delay={12} duration={27} variant={1} />
      <Leaf x="20%" y="60%" size={40} color="#6ba344" delay={18} duration={31} variant={2} />
      <Leaf x="75%" y="90%" size={34} color="#8b6f47" delay={22} duration={24} variant={3} />
    </div>
  );
}
