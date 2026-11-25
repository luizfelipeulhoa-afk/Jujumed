import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "../integrations/supabase/client";

/** Public study functions can run in builds without a Supabase client.
 * Functions that require a session still use the standard token attachment. */
export const attachMascotAwareAuth = createMiddleware({ type: "function" }).client(
  async ({ next, serverFnMeta }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) {
      const [{ conversarComJuju }, { corrigirDiscursivaIA }] = await Promise.all([
        import("./tutor-chat.functions"),
        import("./correcao-ai.functions"),
      ]);
      const funcaoPublica = [conversarComJuju, corrigirDiscursivaIA].some(({ url }) => {
        const id = decodeURIComponent(url.split("/").pop() ?? "");
        return id === serverFnMeta.id;
      });
      if (funcaoPublica) return next();
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
