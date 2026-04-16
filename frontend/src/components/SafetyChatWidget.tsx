import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, MessageCircleMore, SendHorizonal, Stethoscope, X } from "lucide-react";
import { api } from "../lib/api";
import { productLensOptions } from "../lib/constants";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function makeMessage(role: ChatMessage["role"], text: string): ChatMessage {
  return { id: crypto.randomUUID(), role, text };
}

function mentionsSymptoms(input: string) {
  return /rash|itch|eczema|reaction|burning|swelling|hives|breathing|wheezing|vomit|sick/i.test(input);
}

function asksForMedicalAdvice(input: string) {
  return /doctor|allergist|medicine|treatment|hospital|consult/i.test(input);
}

export function SafetyChatWidget({
  userId,
  profileIds,
  lens,
  setLens
}: {
  userId?: string;
  profileIds: string[];
  lens: "packaged-food" | "cosmetic";
  setLens: (value: "packaged-food" | "cosmetic") => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatScope, setChatScope] = useState<"selected" | "all" | null>(null);

  // ✅ UI Fix — settings panel collapses once scope is chosen, freeing space for messages
  const [settingsOpen, setSettingsOpen] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    makeMessage(
      "assistant",
      "Choose whether I should answer for the current selected profiles or for all saved profiles, then ask about a product, ingredient, cosmetic fit, or food allergen question."
    )
  ]);

  // Auto-collapse settings once scope is picked
  useEffect(() => {
    if (chatScope !== null) {
      setSettingsOpen(false);
    }
  }, [chatScope]);

  // Auto-scroll to latest message
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const disclaimer = useMemo(
    () =>
      "Medical disclaimer: this chat is educational only. Severe allergy reactions, active symptoms, or treatment decisions should be reviewed with a licensed doctor.",
    []
  );

  // Compact summary shown when settings panel is collapsed
  const settingsSummary = useMemo(() => {
    const lensLabel = lens === "cosmetic" ? "Cosmetic" : "Packaged food";
    const scopeLabel =
      chatScope === "selected" ? "Selected profiles" : chatScope === "all" ? "All profiles" : "No scope set";
    return `${lensLabel} · ${scopeLabel}`;
  }, [lens, chatScope]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!chatScope) {
      setMessages((prev) => [
        ...prev,
        makeMessage("user", trimmed),
        makeMessage("assistant", "Before I answer, choose whether I should answer for the selected profiles or for all saved profiles.")
      ]);
      setInput("");
      setSettingsOpen(true); // re-open settings so user can pick scope
      return;
    }

    if (chatScope === "selected" && profileIds.length === 0) {
      setMessages((prev) => [
        ...prev,
        makeMessage("user", trimmed),
        makeMessage(
          "assistant",
          "There are no selected profiles on the page right now. Choose a profile first or switch this chat to all profiles."
        )
      ]);
      setInput("");
      return;
    }

    const lower = trimmed.toLowerCase();

    if (mentionsSymptoms(lower) || asksForMedicalAdvice(lower)) {
      setMessages((prev) => [
        ...prev,
        makeMessage("user", trimmed),
        makeMessage(
          "assistant",
          "If someone is already having symptoms like rash, swelling, breathing trouble, or a strong reaction, stop using the product and speak with a doctor as soon as possible. I can explain safety signals, but treatment decisions should come from a clinician."
        )
      ]);
      setInput("");
      return;
    }

    // Route all questions directly to Sarvam.
    // A previous version tried a product-keyword search first, but this caused
    // wrong answers — e.g. "can hari eat milk" matched "milk", the search returned
    // an unrelated top-rated product (like Tropicana), and that was shown as the
    // answer. Sarvam already has the full profile context in its system prompt and
    // handles both dietary questions and product safety questions correctly.
    setMessages((prev) => [...prev, makeMessage("user", trimmed)]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));

      const response = await api.post<{ reply: string }>("/api/chat", {
        userId,
        scope: chatScope,
        profileIds: chatScope === "selected" ? profileIds : [],
        messages: [...history, { role: "user", text: trimmed }]
      });

      setMessages((prev) => [...prev, makeMessage("assistant", response.data.reply)]);
    } catch {
      setMessages((prev) => [
        ...prev,
        makeMessage("assistant", "The AI assistant couldn't respond right now. Please try again in a moment.")
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-3 right-3 z-[60] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-3 sm:bottom-5 sm:right-5">
      {open ? (
        <div className="chat-shell flex max-h-[min(72vh,560px)] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-[#d7e2eb] bg-white/96 shadow-[0_24px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl">

          {/* ─── Header ─── */}
          <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">Safety assistant</p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug">
                Smart local chat with profile-aware guidance
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-[#dbeafe] text-[#1d4ed8]"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* ─── Disclaimer ─── */}
          <div className="mx-4 mt-3 shrink-0 rounded-[16px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Stethoscope size={13} className="mt-0.5 shrink-0 text-[#2563eb]" />
              <p className="text-xs leading-5 text-ink/65">{disclaimer}</p>
            </div>
          </div>

          {/* ─── Settings panel (collapsible) ─── */}
          <div className="mx-4 mt-3 shrink-0 overflow-hidden rounded-[16px] bg-white/80 panel-outline">
            {/* Toggle bar — always visible */}
            <button
              onClick={() => setSettingsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink/45">Settings</span>
                <span className="truncate rounded-full bg-[#edf4f8] px-2.5 py-0.5 text-xs font-medium text-[#334155]">
                  {settingsSummary}
                </span>
              </div>
              {settingsOpen
                ? <ChevronUp size={13} className="shrink-0 text-ink/35" />
                : <ChevronDown size={13} className="shrink-0 text-ink/35" />
              }
            </button>

            {/* Expanded controls */}
            {settingsOpen && (
              <div className="border-t border-[#eef1f5] px-3 pb-3 pt-2.5">
                <p className="mb-1.5 text-xs font-medium text-ink/45">Product type</p>
                {/*
                  ✅ Critical UI Fix:
                  Was `sm:grid-cols-2` which NEVER fires inside a 360px widget
                  (Tailwind sm = 640px breakpoint). Changed to plain `grid-cols-2`
                  so the two buttons always sit side by side. Without this,
                  the 4 picker buttons stacked vertically and consumed ~280px,
                  leaving almost zero space for the message list.
                */}
                <div className="grid grid-cols-2 gap-2">
                  {productLensOptions.map((option) => {
                    const active = lens === option;
                    const title = option === "cosmetic" ? "Cosmetic" : "Packaged food";
                    const desc = option === "cosmetic" ? "Beauty & skin care." : "Food & pantry safety.";
                    return (
                      <button
                        key={option}
                        onClick={() => setLens(option)}
                        className={`rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                          active ? "bg-[#0f172a] text-white" : "bg-[#edf4f8] text-[#334155]"
                        }`}
                      >
                        <p className="text-sm font-semibold">{title}</p>
                        <p className={`mt-0.5 text-xs ${active ? "text-white/65" : "text-ink/45"}`}>{desc}</p>
                      </button>
                    );
                  })}
                </div>

                <p className="mb-1.5 mt-2.5 text-xs font-medium text-ink/45">Answer scope</p>
                {/* ✅ Same fix: grid-cols-2 not sm:grid-cols-2 */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setChatScope("selected")}
                    className={`rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                      chatScope === "selected" ? "bg-[#0f172a] text-white" : "bg-[#edf4f8] text-[#334155]"
                    }`}
                  >
                    <p className="text-sm font-semibold">Selected</p>
                    <p className={`mt-0.5 text-xs ${chatScope === "selected" ? "text-white/65" : "text-ink/45"}`}>
                      Profiles on page.
                    </p>
                  </button>
                  <button
                    onClick={() => setChatScope("all")}
                    className={`rounded-[12px] px-3 py-2.5 text-left transition-colors ${
                      chatScope === "all" ? "bg-[#2563eb] text-white" : "bg-[#edf4f8] text-[#334155]"
                    }`}
                  >
                    <p className="text-sm font-semibold">All profiles</p>
                    <p className={`mt-0.5 text-xs ${chatScope === "all" ? "text-white/70" : "text-ink/45"}`}>
                      Whole account.
                    </p>
                  </button>
                </div>

                {chatScope === "selected" && (
                  <p className="mt-2 rounded-[10px] bg-[#f1f7fb] px-3 py-2 text-xs text-ink/55">
                    {profileIds.length
                      ? `${profileIds.length} profile${profileIds.length > 1 ? "s" : ""} selected on page.`
                      : "No profiles selected yet."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ─── Message list — the only scrollable region ─── */}
          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-[16px] px-3.5 py-2.5 text-sm leading-[1.6] ${
                  message.role === "assistant"
                    ? "bg-white text-ink/75 panel-outline"
                    : "ml-6 bg-[#0f172a] text-white"
                }`}
              >
                {message.text}
              </div>
            ))}

            {/* ✅ UI Fix — animated dots instead of full-block pulse */}
            {loading && (
              <div className="flex items-center gap-2 rounded-[16px] bg-white px-3.5 py-3 panel-outline">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/25 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/25 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/25 [animation-delay:300ms]" />
                </span>
                <span className="text-sm text-ink/45">Thinking…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ─── Input footer (fixed, separated by top border) ─── */}
          <div className="shrink-0 border-t border-[#e8eef3] px-4 pb-4 pt-3">
            {/* Suggestion chips */}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["Fragrance daily?", "Dry hair shampoo?", "Moderate risk?"].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="rounded-full bg-[#edf4f8] px-2.5 py-1 text-xs font-medium text-[#334155] transition-colors hover:bg-[#dbeafe]"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* ✅ UI Fix — items-end so send button is always bottom-aligned */}
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Ask about a product, ingredient, or safety concern…"
                rows={2}
                // ✅ UI Fix — resize-none prevents user dragging the textarea and breaking layout
                className="panel-outline min-h-[56px] flex-1 resize-none rounded-[16px] bg-white px-3.5 py-2.5 text-sm leading-5 outline-none"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#0f172a] text-white transition-opacity hover:opacity-85 disabled:opacity-40"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </div>

        </div>
      ) : null}

      {/* ─── FAB ─── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="chat-fab inline-flex items-center gap-2.5 rounded-full bg-[#0f172a] px-5 py-3.5 text-sm font-medium text-white shadow-lg"
      >
        <MessageCircleMore size={17} />
        Safety chat
      </button>
    </div>
  );
}
