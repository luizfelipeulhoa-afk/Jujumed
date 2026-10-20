import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jujumed | Tutora UERJ Medicina" },
      {
        name: "description",
        content: "Simulados discursivos de Biologia, Química e Redação para Medicina UERJ 2027.",
      },
      { property: "og:title", content: "Jujumed | Tutora UERJ Medicina" },
      {
        property: "og:description",
        content: "Simulados discursivos de Biologia, Química e Redação para Medicina UERJ 2027.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const JujumedApp = lazy(() => import("../App"));

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-ink-950" />}>
      <Suspense fallback={<div className="min-h-screen bg-ink-950" />}>
        <JujumedApp />
      </Suspense>
    </ClientOnly>
  );
}
