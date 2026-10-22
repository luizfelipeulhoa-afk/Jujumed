import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "../integrations/supabase/client";

/** Only the already-public mascot chat can run without a Supabase client.
 * Every other RPC keeps the original session lookup and token attachment.
 * Server authentication middleware and CSRF protections are unchanged. */
export const attachMascotAwareAuth = createMiddleware({ type: "function" }).client(
  async ({ next, serverFnMeta }) => {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url && !key) {
      const { conversarComJuju } = await import("./tutor-chat.functions");
      const chatId = decodeURIComponent(conversarComJuju.url.split("/").pop() ?? "");
      if (chatId === serverFnMeta.id) return next();
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
