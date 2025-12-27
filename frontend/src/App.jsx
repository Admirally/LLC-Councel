import React, { useState } from "react";

const BACKEND_URL = "http://localhost:8010";

export default function App() {
  const [conversationId, setConversationId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [stage1, setStage1] = useState([]);
  const [stage2, setStage2] = useState([]);
  const [stage3, setStage3] = useState(null);
  const [metadata, setMetadata] = useState({});

  const [history, setHistory] = useState([]); // [{question, answer}]

  // Ensure we have a conversation ID (reused for follow-ups)
  const ensureConversation = async () => {
    if (conversationId) return conversationId;

    const resp = await fetch(`${BACKEND_URL}/api/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}", // empty JSON object
    });

    if (!resp.ok) {
      throw new Error(`Failed to create conversation: ${resp.status}`);
    }

    const data = await resp.json();
    setConversationId(data.id);
    return data.id;
  };

  const sendQuestion = async () => {
    setError("");

    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);

    try {
      const convId = await ensureConversation();

      setCurrentQuestion(trimmed);

      const resp = await fetch(
        `${BACKEND_URL}/api/conversations/${convId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: trimmed }),
        }
      );

      if (!resp.ok) {
        throw new Error(`Backend error: ${resp.status}`);
      }

      const data = await resp.json();

      const s1 = data.stage1 || [];
      const s2 = data.stage2 || [];
      const s3 = data.stage3 || null;
      const meta = data.metadata || {};

      setStage1(s1);
      setStage2(s2);
      setStage3(s3);
      setMetadata(meta);

      const finalAnswer =
        s3 && s3.response
          ? s3.response
          : "No Stage 3 final answer was returned.";

      setHistory((prev) => [
        { question: trimmed, answer: finalAnswer },
        ...prev,
      ]);

      setInput("");
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setCurrentQuestion("");
    setInput("");
    setError("");
    setStage1([]);
    setStage2([]);
    setStage3(null);
    setMetadata({});
    setHistory([]);
  };

  const renderStage1 = () => {
    if (!stage1 || stage1.length === 0) {
      return (
        <div style={{ fontSize: 14, color: "#666" }}>
          No Stage 1 responses yet. Ask a question to see each model's answer.
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {stage1.map((r, idx) => (
          <div
            key={idx}
            style={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              padding: 8,
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 4,
                color: "#111827",
              }}
            >
              {idx + 1}. {r.model}
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#111827" }}>
              {r.response}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStage2 = () => {
    const aggregate = metadata?.aggregate_rankings || [];
    const chairman = metadata?.chairman_model || (stage3 && stage3.model) || "unknown";

    if (!stage2 || stage2.length === 0) {
      return (
        <div style={{ fontSize: 14, color: "#666" }}>
          No Stage 2 rankings yet. Ask a question to trigger the council.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Peer Rankings (each model as a judge)
          </div>
          <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>
            {stage2.map((r, idx) => {
              const parsed = r.parsed_ranking || [];
              const shortOrder = parsed.length
                ? parsed.join(" > ")
                : "(could not parse ranking)";
              return (
                <div key={idx} style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 500 }}>Judge: {r.model}</div>
                  <div>Ranking: {shortOrder}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Aggregate Model Ranking
          </div>
          {aggregate.length === 0 ? (
            <div style={{ fontSize: 13, color: "#666" }}>
              No aggregate ranking available.
            </div>
          ) : (
            <ul style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
              {aggregate.map((row, idx) => (
                <li key={idx}>
                  {idx + 1}. {row.model} — avg rank: {row.average_rank} (votes:{" "}
                  {row.rankings_count})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ fontSize: 13, color: "#374151" }}>
          <strong>Chairman model chosen:</strong> {chairman}
        </div>
      </div>
    );
  };

  const finalAnswerText =
    stage3 && stage3.response
      ? stage3.response
      : "Ask the council something to see the final answer here.";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        background: "#f3f4f6",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>LLM Council</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Conversation ID: {conversationId || "not created yet"}
          </div>
        </div>
        <button
          onClick={handleNewConversation}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            background: "#f9fafb",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          New Conversation
        </button>
      </header>

      {/* Main layout */}
      <main
        style={{
          flex: 1,
          display: "flex",
          padding: 16,
          gap: 16,
        }}
      >
        {/* Left side: question + stages */}
        <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Question input */}
          <div
            style={{
              borderRadius: 12,
              background: "#ffffff",
              padding: 16,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
              Ask the Council
            </div>
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                loading
                  ? "Council is thinking..."
                  : "Type a question. Ask follow-ups in the same conversation for context..."
              }
              style={{
                width: "100%",
                resize: "none",
                fontSize: 14,
                padding: 8,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                marginBottom: 8,
              }}
            />
            {error && (
              <div style={{ color: "#b91c1c", fontSize: 12, marginBottom: 8 }}>
                {error}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {currentQuestion
                  ? `Last question: "${currentQuestion}"`
                  : "No questions yet."}
              </div>
              <button
                onClick={sendQuestion}
                disabled={loading || !input.trim()}
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "none",
                  background: loading ? "#e5e7eb" : "#2563eb",
                  color: loading ? "#4b5563" : "#ffffff",
                  cursor: loading ? "default" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {loading ? "Thinking…" : "Ask Council"}
              </button>
            </div>
          </div>

          {/* Stage 3 final answer */}
          <div
            style={{
              borderRadius: 12,
              background: "#ffffff",
              padding: 16,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
              Stage 3 — Final Council Answer
            </div>
            <div
              style={{
                fontSize: 14,
                whiteSpace: "pre-wrap",
                color: "#111827",
              }}
            >
              {finalAnswerText}
            </div>
          </div>

          {/* Stage 1 + Stage 2 panels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr",
              gap: 16,
            }}
          >
            {/* Stage 1 */}
            <div
              style={{
                borderRadius: 12,
                background: "#ffffff",
                padding: 16,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Stage 1 — Individual Model Answers
              </div>
              {renderStage1()}
            </div>

            {/* Stage 2 */}
            <div
              style={{
                borderRadius: 12,
                background: "#ffffff",
                padding: 16,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>
                Stage 2 — Peer Review & Voting
              </div>
              {renderStage2()}
            </div>
          </div>
        </div>

        {/* Right side: history */}
        <aside
          style={{
            flex: 1,
            borderRadius: 12,
            background: "#ffffff",
            padding: 12,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            Conversation History
          </div>
          {history.length === 0 ? (
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Ask something to start a conversation. Follow-ups re-use the same council
              and context.
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: 8,
                  fontSize: 13,
                  background: "#f9fafb",
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Q: {item.question}
                </div>
                <div
                  style={{
                    color: "#111827",
                    whiteSpace: "pre-wrap",
                    maxHeight: 160,
                    overflow: "auto",
                  }}
                >
                  {item.answer}
                </div>
              </div>
            ))
          )}
        </aside>
      </main>
    </div>
  );
}
