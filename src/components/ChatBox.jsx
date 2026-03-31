import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ChatBox.module.css";

const FLAG_PATTERNS = [
  /(\+?\d[\d\s\-().]{7,}\d)/g,
  /(@[a-zA-Z0-9_.]+)/g,
  /(wa\.me|whatsapp|instagram|telegram|snapchat|twitter|tiktok|facebook|linkedin\.com\/in)/gi,
  /\b(dm me|dm us|text me|call me|reach me|contact me outside|my number|my ig|my insta|my whatsapp)\b/gi,
];

function containsFlag(text) {
  return FLAG_PATTERNS.some((p) => p.test(text));
}

function highlightFlagged(text) {
  let result = text;
  FLAG_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, (match) => `%%FLAG%%${match}%%ENDFLAG%%`);
  });
  return result.split(/(%%FLAG%%.*?%%ENDFLAG%%)/g).map((part, i) => {
    if (part.startsWith("%%FLAG%%")) {
      const content = part.replace("%%FLAG%%", "").replace("%%ENDFLAG%%", "");
      return <mark key={i} className={styles.flaggedText}>{content}</mark>;
    }
    return part;
  });
}

export default function ChatBox({ proposal, onClose }) {
  const { user, getMessages, sendMessage, markAsRead } = useAuth();
  const [input, setInput] = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const bottomRef = useRef(null);

  const messages = getMessages(proposal.id);

  useEffect(() => {
    markAsRead(proposal.id);
  }, [proposal.id, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const flagged = containsFlag(text);
    sendMessage({
      id: Date.now(),
      proposalId: proposal.id,
      senderId: user.id,
      senderName: user.fullName,
      senderInitials: user.initials,
      senderRole: user.role,
      text,
      flagged,
      timestamp: new Date().toISOString(),
    });
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = user.role === "worker" ? proposal.employerName : proposal.workerName;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>

        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <div className={styles.headerAvatar}>
              {otherName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className={styles.headerName}>{otherName}</div>
              <div className={styles.headerSub}>
                Re: proposal · <span className={styles.accepted}>Accepted</span>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {user.role === "employer" && (
              <button className={styles.escrowBtn} onClick={() => setShowEscrow(true)}>
                💰 Escrow
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* FLAG WARNING BANNER */}
        {messages.some((m) => m.flagged) && (
          <div className={styles.flagBanner}>
            🚩 HireSpace detected contact info in this chat. For your protection, keep all communication and payments within the platform.
          </div>
        )}

        {/* MESSAGES */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyChat}>
              <p>Proposal accepted! 🎉</p>
              <span>Start the conversation to kick off your project.</span>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`${styles.msgRow} ${isMe ? styles.mine : styles.theirs}`}>
                {!isMe && (
                  <div className={styles.msgAvatar}>{msg.senderInitials}</div>
                )}
                <div className={styles.msgBubble}>
                  {msg.flagged && (
                    <div className={styles.flagPill}>🚩 Flagged — contact info detected</div>
                  )}
                  <p className={styles.msgText}>{highlightFlagged(msg.text)}</p>
                  <span className={styles.msgTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className={styles.inputArea}>
          <textarea
            className={styles.input}
            placeholder="Type a message... (Enter to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()}>
            ↑
          </button>
        </div>

        <p className={styles.disclaimer}>
          🔒 Sharing contact info outside HireSpace may result in account suspension.
        </p>
      </div>

      {/* ESCROW MODAL */}
      {showEscrow && (
        <EscrowModal
          proposal={proposal}
          onClose={() => setShowEscrow(false)}
        />
      )}
    </div>
  );
}

function EscrowModal({ proposal, onClose }) {
  const { depositEscrow, getEscrow } = useAuth();
  const escrow = getEscrow(proposal.id);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  const handleDeposit = () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    depositEscrow({
      id: Date.now(),
      proposalId: proposal.id,
      workerName: proposal.workerName,
      employerName: proposal.employerName,
      amount: Number(amount),
      status: "held",
      depositedAt: new Date().toISOString(),
    });
    setDone(true);
  };

  return (
    <div className={styles.escrowOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.escrowModal}>
        <div className={styles.escrowHeader}>
          <h3>HireSpace Escrow</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {escrow ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>${escrow.amount.toLocaleString()}</p>
            <p className={styles.escrowLabel}>Held in escrow</p>
            <p className={styles.escrowSub}>
              Funds will be released to <strong>{escrow.workerName}</strong> once you confirm the work is complete.
            </p>
            <div className={styles.escrowMeta}>
              <span>Deposited {new Date(escrow.depositedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              <span className={styles.heldBadge}>HELD</span>
            </div>
            {escrow.status === "held" && (
              <button
                className={styles.releaseBtn}
                onClick={() => {
                  depositEscrow({ ...escrow, status: "released", releasedAt: new Date().toISOString() });
                  onClose();
                }}
              >
                ✓ Release funds to {proposal.workerName.split(" ")[0]}
              </button>
            )}
            {escrow.status === "released" && (
              <div className={styles.releasedNote}>✓ Funds released to {escrow.workerName}</div>
            )}
          </div>
        ) : done ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>${Number(amount).toLocaleString()}</p>
            <p className={styles.escrowLabel}>Successfully deposited</p>
            <p className={styles.escrowSub}>
              Funds are safely held by HireSpace and will be released to <strong>{proposal.workerName}</strong> when you confirm job completion.
            </p>
            <button className={styles.releaseBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.escrowInfo}>
              <p>HireSpace holds your payment securely until the job is done. The worker gets paid only when you approve.</p>
            </div>
            <div className={styles.escrowForm}>
              <label>Deposit amount (USD)</label>
              <div className={styles.amountRow}>
                <span className={styles.dollar}>$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>
              <div className={styles.escrowBreakdown}>
                <div className={styles.bRow}><span>Worker receives</span><span>${amount ? (Number(amount) * 0.95).toFixed(2) : "—"}</span></div>
                <div className={styles.bRow}><span>HireSpace fee (5%)</span><span>${amount ? (Number(amount) * 0.05).toFixed(2) : "—"}</span></div>
                <div className={`${styles.bRow} ${styles.bTotal}`}><span>Total deposit</span><span>${amount ? Number(amount).toFixed(2) : "—"}</span></div>
              </div>
              <button
                className={styles.depositBtn}
                onClick={handleDeposit}
                disabled={!amount || Number(amount) <= 0}
              >
                🔒 Deposit to Escrow
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
