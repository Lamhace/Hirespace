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
  const [amount,   setAmount]   = useState(proposal.budgetAmount || "");
  const [currency, setCurrency] = useState(proposal.currency || "NGN");
  const [plan,     setPlan]     = useState("3_stage");
  const [done,     setDone]     = useState(false);
  const [saving,   setSaving]   = useState(false);

  const CURRENCIES = [{ code:"NGN",symbol:"₦" },{ code:"USD",symbol:"$" },{ code:"GBP",symbol:"£" }];
  const sym        = CURRENCIES.find((c) => c.code === currency)?.symbol || "₦";

  const numAmt = Number(amount) || 0;
  const m1Amt = Math.round(numAmt * 0.4);
  const m2Amt = Math.round(numAmt * 0.3);
  const m3Amt = Math.max(0, numAmt - m1Amt - m2Amt);

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;
    setSaving(true);
    const milestones = plan === "3_stage" ? [
      { id: 1, name: "Stage 1: Mobilization & Initial Materials", pct: 40, amount: m1Amt, released: false },
      { id: 2, name: "Stage 2: Mid-Point Quality Inspection", pct: 30, amount: m2Amt, released: false },
      { id: 3, name: "Stage 3: Final Handover & Sign-Off", pct: 30, amount: m3Amt, released: false },
    ] : [
      { id: 1, name: "Full Project Completion", pct: 100, amount: numAmt, released: false }
    ];

    await depositEscrow({
      proposalId: proposal.id,
      workerName: proposal.workerName,
      employerName: proposal.employerName,
      amount: numAmt,
      currency,
      status: "held",
      depositedAt: new Date().toISOString(),
      milestonePlan: plan,
      milestones,
      releasedAmount: 0,
    });
    setSaving(false);
    setDone(true);
  };

  const handleReleaseMilestone = async (mId) => {
    if (!existingEscrow?.milestones) return;
    setSaving(true);
    const updatedMilestones = existingEscrow.milestones.map((m) =>
      m.id === mId ? { ...m, released: true, releasedAt: new Date().toISOString() } : m
    );
    const newReleasedAmount = updatedMilestones
      .filter((m) => m.released)
      .reduce((sum, m) => sum + (m.amount || 0), 0);
    const allDone = updatedMilestones.every((m) => m.released);

    await depositEscrow({
      ...existingEscrow,
      milestones: updatedMilestones,
      releasedAmount: newReleasedAmount,
      status: allDone ? "released" : "partial",
      releasedAt: allDone ? new Date().toISOString() : existingEscrow.releasedAt || null,
    });
    setSaving(false);
    onClose();
  };

  const handleReleaseFull = async () => {
    setSaving(true);
    const updatedMilestones = existingEscrow.milestones?.map((m) => ({
      ...m,
      released: true,
      releasedAt: new Date().toISOString(),
    })) || [];

    await depositEscrow({
      ...existingEscrow,
      milestones: updatedMilestones,
      releasedAmount: existingEscrow.amount,
      status: "released",
      releasedAt: new Date().toISOString(),
    });
    setSaving(false);
    onClose();
  };

  const existingSym = existingEscrow?.currency === "GBP" ? "£" : existingEscrow?.currency === "USD" ? "$" : "₦";
  const releasedSoFar = existingEscrow?.releasedAmount || (existingEscrow?.status === "released" ? existingEscrow.amount : 0);
  const totalAmt = existingEscrow?.amount || 0;
  const pctReleased = totalAmt > 0 ? Math.round((releasedSoFar / totalAmt) * 100) : 0;

  return (
    <div className={styles.escrowOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.escrowModal}>
        <div className={styles.escrowHeader}>
          <h3>🛡️ HireSpace Escrow Protection</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {existingEscrow ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>
              {existingSym}{Number(existingEscrow.amount || 0).toLocaleString()}
            </p>
            <p className={styles.escrowLabel}>
              {existingEscrow.status === "released" ? "Fully Released" : "Protected in Escrow"}
            </p>

            {/* Progress bar */}
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "10px", height: "8px", overflow: "hidden", margin: "0.75rem 0 0.5rem" }}>
              <div style={{ background: "#4ade80", height: "100%", width: `${pctReleased}%`, transition: "width 0.4s ease" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--muted)", marginBottom: "1rem" }}>
              <span>{pctReleased}% Released ({existingSym}{releasedSoFar.toLocaleString()})</span>
              <span>Remaining: {existingSym}{(totalAmt - releasedSoFar).toLocaleString()}</span>
            </div>

            {/* Milestones checklist */}
            {existingEscrow.milestones && existingEscrow.milestones.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem", textAlign: "left" }}>
                {existingEscrow.milestones.map((m) => (
                  <div key={m.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px", padding: "0.5rem 0.75rem", fontSize: "0.75rem"
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#fff" }}>{m.name}</div>
                      <div style={{ color: "var(--cyan)", fontSize: "0.7rem", fontFamily: "var(--mono)" }}>
                        {existingSym}{m.amount?.toLocaleString()} ({m.pct}%)
                      </div>
                    </div>
                    {m.released ? (
                      <span style={{ color: "#4ade80", fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", background: "rgba(74,222,128,0.1)", borderRadius: "20px" }}>
                        ✓ Paid
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReleaseMilestone(m.id)}
                        disabled={saving}
                        style={{
                          background: "#4ade80", color: "#052e16", border: "none",
                          borderRadius: "15px", padding: "0.3rem 0.75rem", fontSize: "0.7rem",
                          fontWeight: 700, cursor: "pointer"
                        }}
                      >
                        {saving ? "Releasing..." : "Release Payout"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {existingEscrow.status !== "released" && (
              <button className={styles.releaseBtn} onClick={handleReleaseFull} disabled={saving} style={{ marginTop: "0.5rem" }}>
                {saving ? "Processing..." : `✓ Release Full Balance (${existingSym}${(totalAmt - releasedSoFar).toLocaleString()})`}
              </button>
            )}

            {existingEscrow.status === "released" && (
              <div className={styles.releasedNote}>
                ✓ 100% of project funds have been safely released to {existingEscrow.workerName}.
              </div>
            )}
          </div>
        ) : done ? (
          <div className={styles.escrowStatus}>
            <div className={styles.escrowIconHeld}>🔒</div>
            <p className={styles.escrowAmount}>{sym}{Number(amount).toLocaleString()}</p>
            <p className={styles.escrowLabel}>Successfully deposited to Escrow</p>
            <p className={styles.escrowSub}>
              Funds are securely locked in Nigerian escrow. You can release milestone payouts
              as <strong>{proposal.workerName}</strong> completes each phase.
            </p>
            <button className={styles.releaseBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className={styles.escrowInfo}>
              <p>HireSpace holds payments securely until work is inspected and signed off. A 5% platform guarantee fee applies.</p>
            </div>
            <div className={styles.escrowForm}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div>
                  <label>Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label>Milestone Plan</label>
                  <select value={plan} onChange={(e) => setPlan(e.target.value)} style={{ width: "100%", padding: "0.5rem" }}>
                    <option value="3_stage">3-Stage (40/30/30)</option>
                    <option value="full">100% Handover</option>
                  </select>
                </div>
              </div>

              <label>Deposit amount ({sym})</label>
              <div className={styles.amountRow}>
                <span className={styles.dollar}>{sym}</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>

              <div className={styles.escrowBreakdown}>
                <div className={styles.bRow}>
                  <span>Worker receives</span>
                  <span>{sym}{numAmt ? (numAmt * 0.95).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}</span>
                </div>
                <div className={styles.bRow}>
                  <span>HireSpace Escrow Guarantee (5%)</span>
                  <span>{sym}{numAmt ? (numAmt * 0.05).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}</span>
                </div>
                <div className={`${styles.bRow} ${styles.bTotal}`}>
                  <span>Total Escrow Deposit</span>
                  <span>{sym}{numAmt ? numAmt.toLocaleString() : "—"}</span>
                </div>
              </div>

              {plan === "3_stage" && numAmt > 0 && (
                <div style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: "8px", padding: "0.6rem 0.8rem", marginBottom: "1rem", fontSize: "0.72rem" }}>
                  <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "0.25rem" }}>3-Stage Payout Plan:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted2)" }}>
                    <span>Stage 1 (40%): {sym}{m1Amt.toLocaleString()}</span>
                    <span>Stage 2 (30%): {sym}{m2Amt.toLocaleString()}</span>
                    <span>Stage 3 (30%): {sym}{m3Amt.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                className={styles.depositBtn}
                onClick={handleDeposit}
                disabled={!amount || Number(amount) <= 0 || saving}
              >
                {saving ? "Securing Funds..." : "🔒 Fund Nigerian Escrow"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
