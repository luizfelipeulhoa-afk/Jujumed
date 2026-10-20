import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({ server: { entry: "server" } }),
    nitro({ preset: "cloudflare_module" }),
    viteReact(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
