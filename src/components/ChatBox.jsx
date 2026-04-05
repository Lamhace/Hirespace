import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ChatBox.module.css";

export default function ChatBox({ proposal, onClose }) {
  const { profile, sendMessage, subscribeToMessages, depositEscrow, getEscrow, markChatRead } = useAuth();
  const [messages,   setMessages]   = useState([]);
  const [input,      setInput]      = useState("");
  const [showEscrow, setShowEscrow] = useState(false);
  const [escrow,     setEscrow]     = useState(null);
  const [sending,    setSending]    = useState(false);
  const [blocked,    setBlocked]    = useState("");
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Prevent browser swipe-back gesture from exiting the site while chat is open
  useEffect(() => {
    // Push a history state so the back gesture hits this entry first
    window.history.pushState({ chatOpen: true }, "");

    const handlePopState = (e) => {
      // User swiped back — close chat instead of navigating away
      onClose();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Mark chat as read when opened
  useEffect(() => {
    if (proposal?.id) markChatRead(proposal.id);
  }, [proposal.id]);

  // Also mark as read whenever new messages arrive while chat is open
  useEffect(() => {
    if (proposal?.id && messages.length > 0) markChatRead(proposal.id);
  }, [messages.length]);

  useEffect(() => {
    if (!proposal?.id) return;
    const unsub = subscribeToMessages(proposal.id, setMessages);
    return () => { if (typeof unsub === "function") unsub(); };
  }, [proposal.id]);

  useEffect(() => {
    if (!proposal?.id) return;
    getEscrow(proposal.id).then(setEscrow).catch(console.error);
  }, [proposal.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-clear blocked warning after 4 seconds
  useEffect(() => {
    if (!blocked) return;
    const t = setTimeout(() => setBlocked(""), 4000);
    return () => clearTimeout(t);
  }, [blocked]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !profile || sending) return;
    setSending(true);
    setBlocked("");

    const result = await sendMessage(proposal.id, {
      senderId:       profile.uid,
      senderName:     profile.fullName,
      senderInitials: profile.initials || "U",
      senderRole:     profile.role,
      text,
      timestamp:      Date.now(),
    });

    if (result?.blocked) {
      setBlocked(result.reason);
    } else {
      setInput("");
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const otherName = profile?.role === "worker" ? proposal.employerName : proposal.workerName;

  // Group messages: stack consecutive messages from the same sender
  const groupedMessages = messages.reduce((groups, msg, i) => {
    const prev = messages[i - 1];
    const isSameSender = prev && prev.senderId === msg.senderId;
    const isCloseInTime = prev && (msg.timestamp - prev.timestamp) < 5 * 60 * 1000; // 5 min gap
    if (isSameSender && isCloseInTime) {
      groups[groups.length - 1].msgs.push(msg);
    } else {
      groups.push({ senderId: msg.senderId, senderInitials: msg.senderInitials, senderName: msg.senderName, msgs: [msg] });
    }
    return groups;
  }, []);

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
              <div className={styles.headerSub}>Proposal chat · <span className={styles.activeTag}>Active</span></div>
            </div>
          </div>
          <div className={styles.headerActions}>
            {profile?.role === "employer" && (
              <button className={styles.escrowBtn} onClick={() => setShowEscrow(true)}>💰 Escrow</button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyChat}>
              <p>Proposal accepted! 🎉</p>
              <span>Say hello to kick things off.</span>
            </div>
          )}

          {groupedMessages.map((group, gi) => {
            const isMe = group.senderId === profile?.uid;
            return (
              <div key={gi} className={`${styles.msgGroup} ${isMe ? styles.mine : styles.theirs}`}>
                {/* Avatar only shown once per group, on the last message for theirs */}
                {!isMe && (
                  <div className={styles.groupAvatar}>{group.senderInitials || "?"}</div>
                )}
                <div className={styles.groupBubbles}>
                  {!isMe && <div className={styles.senderName}>{group.senderName}</div>}
                  {group.msgs.map((msg, mi) => (
                    <div key={msg.id} className={styles.bubble}>
                      <p className={styles.msgText}>{msg.text}</p>
                      {/* Show time only on last message in group */}
                      {mi === group.msgs.length - 1 && (
                        <span className={styles.msgTime}>
                          {msg.timestamp
                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* BLOCKED WARNING */}
        {blocked && (
          <div className={styles.blockedBanner}>
            🚫 Message not sent — <strong>contact info (phone numbers, social media handles) is not allowed</strong> on HireSpace. Use the platform to communicate safely.
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
          <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim() || sending}>
            {sending ? "•" : "↑"}
          </button>
        </div>

        <p className={styles.disclaimer}>🔒 Contact info is blocked. Keep communication within HireSpace.</p>
      </div>

      {showEscrow && (
        <EscrowModal
          proposal={proposal}
          existingEscrow={escrow}
          onClose={() => { setShowEscrow(false); getEscrow(proposal.id).then(setEscrow).catch(console.error); }}
        />
      )}
    </div>
  );
}

function EscrowModal({ proposal, existingEscrow, onClose }) {
  const { depositEscrow } = useAuth();
  const [amount,   setAmount]   = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [done,     setDone]     = useState(false);
  const [saving,   setSaving]   = useState(false);

  const CURRENCIES = [{ code:"NGN",symbol:"₦" },{ code:"USD",symbol:"$" },{ code:"GBP",symbol:"£" }];
  const sym        = CURRENCIES.find((c) => c.code === currency)?.symbol || "₦";

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setSaving(true);
    await depositEscrow({ proposalId: proposal.id, workerName: proposal.workerName, employerName: proposal.employerName, amount: Number(amount), currency, status: "held", depositedAt: new Date().toISOString() });
    setSaving(false); setDone(true);
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
            <p className={styles.escrowAmount}>{existingEscrow.currency==="GBP"?"£":existingEscrow.currency==="USD"?"$":"₦"}{existingEscrow.amount?.toLocaleString()}</p>
            <p className={styles.escrowLabel}>Held in escrow</p>
            <p className={styles.escrowSub}>Funds released to <strong>{existingEscrow.workerName}</strong> when you confirm completion.</p>
            <span className={styles.heldBadge}>{existingEscrow.status?.toUpperCase()}</span>
            {existingEscrow.status === "held" && <button className={styles.releaseBtn} onClick={handleRelease}>✓ Release funds to {proposal.workerName?.split(" ")[0]}</button>}
            {existingEscrow.status === "released" && <div className={styles.releasedNote}>✓ Funds released to {existingEscrow.workerName}</div>}
          </div>
        ) : done ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>{sym}{Number(amount).toLocaleString()}</p>
            <p className={styles.escrowLabel}>Successfully deposited</p>
            <p className={styles.escrowSub}>Funds safely held. Released to <strong>{proposal.workerName}</strong> when you approve.</p>
            <button className={styles.releaseBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.escrowInfo}><p>HireSpace holds payment securely until the job is done. 5% service fee applies.</p></div>
            <div className={styles.escrowForm}>
              <label>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{marginBottom:"1rem"}}>
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
                <div className={styles.bRow}><span>Worker receives</span><span>{sym}{amount?(Number(amount)*0.95).toFixed(2):"—"}</span></div>
                <div className={styles.bRow}><span>HireSpace fee (5%)</span><span>{sym}{amount?(Number(amount)*0.05).toFixed(2):"—"}</span></div>
                <div className={`${styles.bRow} ${styles.bTotal}`}><span>Total</span><span>{sym}{amount?Number(amount).toFixed(2):"—"}</span></div>
              </div>
              <button className={styles.depositBtn} onClick={handleDeposit} disabled={!amount||Number(amount)<=0||saving}>{saving?"Processing...":"🔒 Deposit to Escrow"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
