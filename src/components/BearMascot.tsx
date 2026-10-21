interface Props {
  pequeno?: boolean;
  falando?: boolean;
  gesto?: "idle" | "wave" | "stethoscope" | "breathe";
}

/** Three aligned poses created from the user's doctor-bear reference. */
export default function BearMascot({ pequeno = false, falando = false, gesto = "idle" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`bear-mascot ${pequeno ? "bear-small" : ""} bear-${gesto} ${falando ? "bear-speaking" : ""}`}
    >
      <span className="bear-sprite" />
    </span>
  );
}
