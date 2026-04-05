import { useState } from "react";
import styles from "./ProposalModal.module.css";

export default function ProposalModal({ worker, employer, onClose, onSend }) {
  const [form, setForm] = useState({ message:"", budget:"", timeline:"" });
  const [sent, setSent]     = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSend = async () => {
    if (!form.message.trim()) return;
    setSaving(true);
    await onSend({
      workerId:       worker.id,
      workerName:     worker.fullName,
      employerId:     employer.uid,
      employerName:   employer.fullName,
      employerCompany: employer.company || "Independent",
      message:        form.message,
      budget:         form.budget,
      timeline:       form.timeline,
    });
    setSaving(false);
    setSent(true);
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Send Proposal</h3>
            <p className={styles.sub}>To <span>{worker.fullName}</span></p>
          </div>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {sent ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successTitle}>Proposal sent!</p>
            <p className={styles.successSub}>{worker.firstName || worker.fullName.split(" ")[0]} will be notified and can accept or decline your proposal.</p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.workerPreview}>
              <div className={styles.wAvatar}>{worker.initials}</div>
              <div>
                <div className={styles.wName}>{worker.fullName}</div>
                <div className={styles.wSkills}>{worker.skills?.slice(0,3).map((s) => <span key={s} className={styles.wSkill}>{s}</span>)}</div>
              </div>
              <div className={styles.wRate}>${worker.rate}/hr</div>
            </div>

            <div className={styles.field}>
              <label>Your message *</label>
              <textarea placeholder={`Hi ${worker.firstName || worker.fullName.split(" ")[0]}, I came across your profile...`} value={form.message} onChange={set("message")} />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Budget (USD)</label>
                <input placeholder="e.g. 500 or $25/hr" value={form.budget} onChange={set("budget")} />
              </div>
              <div className={styles.field}>
                <label>Timeline</label>
                <select value={form.timeline} onChange={set("timeline")}>
                  <option value="">Select...</option>
                  <option>Less than 1 week</option>
                  <option>1–2 weeks</option>
                  <option>1 month</option>
                  <option>2–3 months</option>
                </select>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.sendBtn} onClick={handleSend} disabled={!form.message.trim() || saving}>
                {saving ? "Sending..." : "Send Proposal →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
