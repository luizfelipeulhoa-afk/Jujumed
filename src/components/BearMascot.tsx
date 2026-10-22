import { lazy, Suspense } from "react";
const Bear3D = lazy(() => import("./Bear3D"));
interface Props {
  pequeno?: boolean;
  falando?: boolean;
  gesto?: "idle" | "wave" | "stethoscope" | "breathe";
}

/** Load the interactive model separately from the app's initial bundle. */
export default function BearMascot({ pequeno = false, falando = false, gesto = "idle" }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`bear-mascot ${pequeno ? "bear-small" : "bear-model"} bear-${gesto} ${falando ? "bear-speaking" : ""}`}
    >
      {pequeno ? (
        <span className="bear-sprite" />
      ) : (
        <Suspense fallback={<span className="bear-sprite" />}>
          <Bear3D falando={falando} gesto={gesto} />
        </Suspense>
      )}
    </span>
  );
}
