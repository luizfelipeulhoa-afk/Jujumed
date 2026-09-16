export default function EcgStrip({ className }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none ${className ?? "absolute inset-x-0 top-0 h-10 w-full text-uerj-red/40"}`}
      viewBox="0 0 620 40"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        className="ecg-line"
        d="M0 22 H70 L80 22 L88 8 L96 32 L104 22 H150 L158 22 L164 14 L170 28 L176 22 H240 L250 22 L258 4 L266 34 L274 22 H330 L338 22 L344 15 L350 29 L356 22 H420 L430 22 L438 6 L446 33 L454 22 H520 L528 22 L534 14 L540 28 L546 22 H620"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
