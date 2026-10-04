import { useState } from "react";
import styles from "./ProposalModal.module.css";

const CURRENCIES = [
  { code: "NGN", symbol: "₦" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
];

export default function ProposalModal({ worker, employer, onClose, onSend }) {
  const [currency, setCurrency] = useState(worker.currency || "NGN");
  const [budgetVal, setBudgetVal] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [milestonePlan, setMilestonePlan] = useState("3_stage"); // "3_stage" | "full"
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || "₦";

  // Parse numeric budget
  const numericBudget = parseFloat(budgetVal.toString().replace(/[^0-9.]/g, "")) || 0;
  const platformFee = Math.round(numericBudget * 0.05);
  const totalEscrow = numericBudget + platformFee;

  const m1 = Math.round(numericBudget * 0.4);
  const m2 = Math.round(numericBudget * 0.3);
  const m3 = Math.max(0, numericBudget - m1 - m2);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSaving(true);
    await onSend({
      workerId: worker.id,
      workerName: worker.fullName,
      employerId: employer.uid,
      employerName: employer.fullName,
      employerCompany: employer.company || "Independent",
      message: message.trim(),
      budget: numericBudget > 0 ? `${sym}${numericBudget.toLocaleString()}` : budgetVal,
      budgetAmount: numericBudget,
      currency,
      platformFee,
      totalEscrow,
      milestonePlan,
      milestones: milestonePlan === "3_stage" && numericBudget > 0 ? [
        { id: 1, title: "Mobilization & Initial Materials", pct: 40, amount: m1, status: "pending" },
        { id: 2, title: "Mid-Point Quality Inspection", pct: 30, amount: m2, status: "pending" },
        { id: 3, title: "Final Handover & Sign-Off", pct: 30, amount: m3, status: "pending" },
      ] : [
        { id: 1, title: "Full Project Completion", pct: 100, amount: numericBudget, status: "pending" }
      ],
      timeline,
    });
    setSaving(false);
    setSent(true);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Send Proposal & Escrow Quote</h3>
            <p className={styles.sub}>To <span>{worker.fullName}</span></p>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successTitle}>Proposal & Escrow Plan Sent!</p>
            <p className={styles.successSub}>
              {worker.firstName || worker.fullName.split(" ")[0]} has been notified.
              Once accepted, you can safely fund escrow with full milestone protection.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.workerPreview}>
              <div className={styles.wAvatar}>{worker.initials}</div>
              <div>
                <div className={styles.wName}>{worker.fullName}</div>
                <div className={styles.wSkills}>
                  {worker.skills?.slice(0, 3).map((s) => <span key={s} className={styles.wSkill}>{s}</span>)}
                </div>
              </div>
              <div className={styles.wRate}>
                {sym}{Number(worker.rate || 0).toLocaleString()}/hr
              </div>
            </div>

            <div className={styles.field}>
              <label>Project Scope & Requirements *</label>
              <textarea
                rows={3}
                placeholder={`Describe what you need done, site location, and expectations for ${worker.firstName || worker.fullName.split(" ")[0]}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Currency & Budget</label>
                <div className={styles.budgetRow}>
                  <select
                    className={styles.currencySelect}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="NGN">NGN (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                  <input
                    type="number"
                    placeholder="e.g. 75000"
                    value={budgetVal}
                    onChange={(e) => setBudgetVal(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Expected Timeline</label>
                <select value={timeline} onChange={(e) => setTimeline(e.target.value)}>
                  <option value="">Select...</option>
                  <option>Less than 1 week</option>
                  <option>1–2 weeks</option>
                  <option>1 month</option>
                  <option>2–3 months</option>
                </select>
              </div>
            </div>

            {/* Real-time Escrow & Milestone Breakdown */}
            {numericBudget > 0 && (
              <div className={styles.escrowCard}>
                <div className={styles.escrowHeader}>
                  <span className={styles.escrowTitle}>🛡️ Nigerian Escrow Protection</span>
                  <div className={styles.planToggle}>
                    <button
                      type="button"
                      className={`${styles.planBtn} ${milestonePlan === "3_stage" ? styles.planActive : ""}`}
                      onClick={() => setMilestonePlan("3_stage")}
                    >
                      3 Milestones
                    </button>
                    <button
                      type="button"
                      className={`${styles.planBtn} ${milestonePlan === "full" ? styles.planActive : ""}`}
                      onClick={() => setMilestonePlan("full")}
                    >
                      Single Payout
                    </button>
                  </div>
                </div>

                <div className={styles.escrowTable}>
                  <div className={styles.eRow}>
                    <span>Artisan Fee:</span>
                    <strong>{sym}{numericBudget.toLocaleString()}</strong>
                  </div>
                  <div className={styles.eRow}>
                    <span>HireSpace Escrow Fee (5%):</span>
                    <span>{sym}{platformFee.toLocaleString()}</span>
                  </div>
                  <div className={`${styles.eRow} ${styles.eTotal}`}>
                    <span>Total Protected in Escrow:</span>
                    <strong style={{ color: "var(--cyan)" }}>{sym}{totalEscrow.toLocaleString()}</strong>
                  </div>
                </div>

                {milestonePlan === "3_stage" && (
                  <div className={styles.milestonesList}>
                    <div className={styles.mItem}>
                      <span className={styles.mStage}>Stage 1 (40%)</span>
                      <span className={styles.mDesc}>Mobilization & Materials</span>
                      <span className={styles.mAmt}>{sym}{m1.toLocaleString()}</span>
                    </div>
                    <div className={styles.mItem}>
                      <span className={styles.mStage}>Stage 2 (30%)</span>
                      <span className={styles.mDesc}>Mid-Point Inspection</span>
                      <span className={styles.mAmt}>{sym}{m2.toLocaleString()}</span>
                    </div>
                    <div className={styles.mItem}>
                      <span className={styles.mStage}>Stage 3 (30%)</span>
                      <span className={styles.mDesc}>Final Handover & Sign-Off</span>
                      <span className={styles.mAmt}>{sym}{m3.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <p className={styles.guaranteeText}>
                  🔒 Funds are held safely in escrow. You release payouts step-by-step only after inspecting each milestone.
                </p>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button
                className={styles.sendBtn}
                onClick={handleSend}
                disabled={!message.trim() || saving}
              >
                {saving ? "Sending..." : "Send Proposal with Escrow →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
