import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ChatBox.module.css";

const FLAG_PATTERNS = [
  /(\+?\d[\d\s\-().]{7,}\d)/g,
  /(@[a-zA-Z0-9_.]+)/g,
  /(wa\.me|whatsapp|instagram|telegram|snapchat|twitter|tiktok|facebook)/gi,
  /\b(dm me|text me|call me|my number|my ig|my whatsapp)\b/gi,
];

function containsFlag(text) {
  return FLAG_PATTERNS.some((p) => { p.lastIndex = 0; return p.test(text); });
}

function renderText(text) {
  let result = text;
  FLAG_PATTERNS.forEach((p) => {
    p.lastIndex = 0;
    result = result.replace(p, (m) => `__FLAG__${m}__ENDFLAG__`);
  });
  return result.split(/(__FLAG__.*?__ENDFLAG__)/g).map((part, i) => {
    if (part.startsWith("__FLAG__")) {
      return <mark key={i} style={{ background:"rgba(251,191,36,0.2)", color:"#fbbf24", borderRadius:"3px", padding:"0 2px" }}>{part.replace("__FLAG__","").replace("__ENDFLAG__","")}</mark>;
    }
    return part;
  });
}

export default function ChatBox({ proposal, onClose }) {
  const { profile, sendMessage, subscribeToMessages, depositEscrow, getEscrow } = useAuth();
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const [escrow,     setEscrow]     = useState(null);
  const [sending,    setSending]    = useState(false);
  const [error,      setError]      = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!proposal?.id) return;
    const unsubscribe = subscribeToMessages(proposal.id, (msgs) => {
      setMessages(msgs);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [proposal.id]);

  // Load escrow status
  useEffect(() => {
    if (!proposal?.id) return;
    getEscrow(proposal.id).then((e) => setEscrow(e)).catch(console.error);
  }, [proposal.id]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !profile || sending) return;

    setError("");
    setSending(true);
    setInput("");

    try {
      await sendMessage(proposal.id, {
        senderId:       profile.uid,
        senderName:     profile.fullName,
        senderInitials: profile.initials || "U",
        senderRole:     profile.role,
        text,
        flagged:        containsFlag(text),
        timestamp:      Date.now(),
      });
    } catch (e) {
      console.error("Send error:", e);
      setError("Failed to send message. Please try again.");
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName  = profile?.role === "worker" ? proposal.employerName : proposal.workerName;
  const hasFlagged = messages.some((m) => m.flagged);

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>

        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerAvatar}>
              {otherName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </div>
            <div>
              <div className={styles.headerName}>{otherName || "Chat"}</div>
              <div className={styles.headerSub}>
                Proposal chat · <span className={styles.accepted}>Active</span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {profile?.role === "employer" && (
              <button className={styles.escrowBtn} onClick={() => setShowEscrow(true)}>
                💰 Escrow
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* FLAG BANNER */}
        {hasFlagged && (
          <div className={styles.flagBanner}>
            🚩 Contact info detected. Keep all communication within HireSpace.
          </div>
        )}

        {/* MESSAGES */}
        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.emptyChat}>
              <p>Proposal accepted! 🎉</p>
              <span>Say hello to kick things off.</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === profile?.uid;
              return (
                <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.mine : styles.theirs}`}>
                  {!isMe && (
                    <div className={styles.msgAvatar}>
                      {msg.senderInitials || msg.senderName?.[0] || "?"}
                    </div>
                  )}
                  <div className={styles.msgBubble}>
                    {msg.flagged && (
                      <div className={styles.flagPill}>🚩 Flagged — contact info detected</div>
                    )}
                    <p className={styles.msgText}>{renderText(msg.text)}</p>
                    <span className={styles.msgTime}>
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* ERROR */}
        {error && (
          <div style={{ padding:"0.5rem 1.25rem", fontFamily:"var(--mono)", fontSize:"0.68rem", color:"#fca5a5", background:"rgba(239,68,68,0.1)" }}>
            {error}
          </div>
        )}

        {/* INPUT */}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Type a message... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? "•" : "↑"}
          </button>
        </div>

        <p className={styles.disclaimer}>
          🔒 Keep all communication within HireSpace for your protection.
        </p>
      </div>

      {/* ESCROW MODAL */}
      {showEscrow && (
        <EscrowModal
          proposal={proposal}
          existingEscrow={escrow}
          onClose={() => {
            setShowEscrow(false);
            getEscrow(proposal.id).then(setEscrow).catch(console.error);
          }}
        />
      )}
    </div>
  );
}

// ── Escrow Modal ─────────────────────────────────────────────────────────────
function EscrowModal({ proposal, existingEscrow, onClose }) {
  const { depositEscrow } = useAuth();
  const [amount,   setAmount]   = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [done,     setDone]     = useState(false);
  const [saving,   setSaving]   = useState(false);

  const CURRENCIES = [
    { code:"NGN", symbol:"₦" },
    { code:"USD", symbol:"$" },
    { code:"GBP", symbol:"£" },
  ];
  const sym        = CURRENCIES.find((c) => c.code === currency)?.symbol || "₦";
  const fee        = amount ? (Number(amount) * 0.05).toFixed(2) : "—";
  const workerGets = amount ? (Number(amount) * 0.95).toFixed(2) : "—";

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setSaving(true);
    await depositEscrow({
      proposalId:   proposal.id,
      workerName:   proposal.workerName,
      employerName: proposal.employerName,
      amount:       Number(amount),
      currency,
      status:       "held",
      depositedAt:  new Date().toISOString(),
    });
    setSaving(false);
    setDone(true);
  };

  const handleRelease = async () => {
    await depositEscrow({ ...existingEscrow, status: "released", releasedAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div className={styles.escrowOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.escrowModal}>
        <div className={styles.escrowHeader}>
          <h3>HireSpace Escrow</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {existingEscrow ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>
              {existingEscrow.currency === "GBP" ? "£" : existingEscrow.currency === "USD" ? "$" : "₦"}
              {existingEscrow.amount?.toLocaleString()}
            </p>
            <p className={styles.escrowLabel}>Held in escrow</p>
            <p className={styles.escrowSub}>
              Funds will be released to <strong>{existingEscrow.workerName}</strong> once you confirm work is complete.
            </p>
            <div className={styles.escrowMeta}>
              <span>
                {existingEscrow.depositedAt
                  ? new Date(existingEscrow.depositedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })
                  : ""}
              </span>
              <span className={styles.heldBadge}>{existingEscrow.status?.toUpperCase()}</span>
            </div>
            {existingEscrow.status === "held" && (
              <button className={styles.releaseBtn} onClick={handleRelease}>
                ✓ Release funds to {proposal.workerName?.split(" ")[0]}
              </button>
            )}
            {existingEscrow.status === "released" && (
              <div className={styles.releasedNote}>✓ Funds released to {existingEscrow.workerName}</div>
            )}
          </div>
        ) : done ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>{sym}{Number(amount).toLocaleString()}</p>
            <p className={styles.escrowLabel}>Successfully deposited</p>
            <p className={styles.escrowSub}>
              Funds safely held by HireSpace. Released to <strong>{proposal.workerName}</strong> when you approve.
            </p>
            <button className={styles.releaseBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.escrowInfo}>
              <p>HireSpace holds your payment securely until the job is done. HireSpace takes a 5% service fee.</p>
            </div>
            <div className={styles.escrowForm}>
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ marginBottom:"1rem" }}>
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pounds (£)</option>
              </select>
              <label>Deposit amount ({sym})</label>
              <div className={styles.amountRow}>
                <span className={styles.dollar}>{sym}</span>
                <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
              </div>
              <div className={styles.escrowBreakdown}>
                <div className={styles.bRow}><span>Worker receives</span><span>{sym}{workerGets}</span></div>
                <div className={styles.bRow}><span>HireSpace fee (5%)</span><span>{sym}{fee}</span></div>
                <div className={`${styles.bRow} ${styles.bTotal}`}><span>Total deposit</span><span>{sym}{amount ? Number(amount).toFixed(2) : "—"}</span></div>
              </div>
              <button
                className={styles.depositBtn}
                onClick={handleDeposit}
                disabled={!amount || Number(amount) <= 0 || saving}
              >
                {saving ? "Processing..." : "🔒 Deposit to Escrow"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
