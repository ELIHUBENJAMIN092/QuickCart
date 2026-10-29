import { isValidSessionId } from "./session";

const MAX_CONTENT = 4000;
const MAX_PRODUCTS = 8;

/**
 * Guarda un turno de conversación mediante la RPC chat_append_message.
 * Es best-effort: un fallo de persistencia nunca debe romper el chat.
 */
export async function persistChatTurn({
  supabase,
  sessionId,
  user,
  userMessage,
  assistantMessage,
  products = [],
}) {
  if (!supabase || !isValidSessionId(sessionId)) return false;
  if (typeof userMessage !== "string" || !userMessage.trim()) return false;

  const safeProducts = (Array.isArray(products) ? products : []).slice(0, MAX_PRODUCTS);
  const rows = [
    { role: "user", content: userMessage.trim().slice(0, MAX_CONTENT), products: [] },
  ];
  if (typeof assistantMessage === "string" && assistantMessage.trim()) {
    rows.push({
      role: "assistant",
      content: assistantMessage.trim().slice(0, MAX_CONTENT),
      products: safeProducts,
    });
  }

  try {
    for (const row of rows) {
      const { error } = await supabase.rpc("chat_append_message", {
        p_session_id: sessionId,
        p_user_id: user?.id || null,
        p_role: row.role,
        p_content: row.content,
        p_products: row.products,
      });
      if (error) throw error;
    }
    return true;
  } catch (error) {
    console.error("No se pudo guardar la conversación del chat:", error.message);
    return false;
  }
}
