import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./DisputeModal.module.css";

const REASONS = [
  "Work not completed as agreed",
  "Work quality is unsatisfactory",
  "Payment not released after completion",
  "Worker didn't show up",
  "Employer unresponsive",
  "Scope of work changed unfairly",
  "Other",
];

export default function DisputeModal({ proposal, onClose }) {
  const { profile, raiseDispute, getDispute } = useAuth();
  const [reason,   setReason]   = useState("");
  const [details,  setDetails]  = useState("");
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async () => {
    if (!reason)        { setError("Please select a reason."); return; }
    if (!details.trim()) { setError("Please provide more details."); return; }
    setSaving(true);
    try {
      await raiseDispute({
        proposalId:   proposal.id,
        raisedBy:     profile.uid,
        raisedByName: profile.fullName,
        reason,
        details: details.trim(),
      });
      setDone(true);
    } catch (e) {
      setError("Failed to raise dispute. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Raise a Dispute</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>🛡️</div>
            <p className={styles.successTitle}>Dispute raised</p>
            <p className={styles.successSub}>
              HireSpace admin has been notified and will review your case shortly.
              Any escrow funds are now <strong>frozen</strong> until the dispute is resolved.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.warningBox}>
              ⚠️ Raising a dispute will <strong>freeze any escrow funds</strong> and alert HireSpace admin.
              Only raise a dispute if you cannot resolve the issue directly through chat.
            </div>

            <div className={styles.field}>
              <label>Reason for dispute</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select a reason...</option>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label>Describe the issue</label>
              <textarea
                placeholder="Please explain what happened and what outcome you are expecting..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={600}
              />
              <span className={styles.charCount}>{details.length}/600</span>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? "Raising dispute..." : "🛡️ Raise Dispute"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
