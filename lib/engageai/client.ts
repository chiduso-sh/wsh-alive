import { isFunctionName, type FunctionName } from "./manifest";

// Browser side of the EngageAI protocol. Talks only to our own /api/engageai
// route; the API key and app_id are added on the server.

type ActionType = "respond" | "function_call" | "confirm" | "clarify" | "error";

type FunctionCall = { function_name: string; arguments?: Record<string, unknown>; call_id?: string };

type ChatResponse = {
  session_id: string;
  action: {
    action_type: ActionType;
    message?: string | null;
    function_calls?: FunctionCall[];
    confirmation_prompt?: string | null;
    requires_input?: boolean;
  };
};

export type Handler = (args: Record<string, unknown>) => Promise<unknown>;
export type Handlers = Record<FunctionName, Handler>;

export type Outcome =
  | { kind: "reply"; text: string }
  | { kind: "confirm"; prompt: string; callId: string | null }
  | { kind: "error"; text: string };

// Stops a model that keeps asking for function calls from looping forever.
const MAX_FUNCTION_ROUNDS = 4;

export class EngageAIClient {
  constructor(private handlers: Handlers, private sessionId: string, private onSession: (id: string) => void) {}

  send(message: string) {
    return this.request({ action: "chat", message });
  }

  confirm(confirmed: boolean, callId: string | null) {
    return this.request({ action: "confirm", confirmed, call_id: callId });
  }

  private async request(payload: Record<string, unknown>, round = 0): Promise<Outcome> {
    const res = await fetch("/api/engageai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, session_id: this.sessionId }),
    });
    if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
    const data: ChatResponse = await res.json();
    if (data.session_id && data.session_id !== this.sessionId) {
      this.sessionId = data.session_id;
      this.onSession(data.session_id);
    }
    return this.resolve(data.action, round);
  }

  private async resolve(action: ChatResponse["action"], round: number): Promise<Outcome> {
    switch (action.action_type) {
      case "function_call": {
        if (round >= MAX_FUNCTION_ROUNDS) return { kind: "error", text: "I got a bit lost there. Could you ask that another way?" };
        const results = await Promise.all((action.function_calls ?? []).map(call => this.run(call)));
        return this.request({ action: "results", results, idempotency_key: crypto.randomUUID() }, round + 1);
      }
      case "confirm": {
        const pending = action.function_calls?.[0];
        return {
          kind: "confirm",
          prompt: action.confirmation_prompt || action.message || "Shall I go ahead?",
          callId: pending?.call_id || null,
        };
      }
      case "error":
        return { kind: "error", text: action.message || "Something went wrong on my side. Please try again." };
      default:
        // respond and clarify both carry a message for the user.
        return { kind: "reply", text: action.message ?? "" };
    }
  }

  private async run(call: FunctionCall) {
    const base = { call_id: call.call_id ?? "", function_name: call.function_name };
    if (!isFunctionName(call.function_name)) return { ...base, success: false, error: "Unknown function" };
    try {
      const result = await this.handlers[call.function_name](call.arguments ?? {});
      return { ...base, success: true, result };
    } catch (err) {
      return { ...base, success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
