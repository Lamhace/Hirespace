import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "./ReviewModal.module.css";

export default function ReviewModal({ proposal, onClose, onSubmitted }) {
  const { profile, submitReview } = useAuth();
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!rating) { setError("Please select a star rating."); return; }
    if (!comment.trim()) { setError("Please write a short review."); return; }
    setSaving(true);
    try {
      await submitReview({
        workerId:     proposal.workerId,
        proposalId:   proposal.id,
        rating,
        comment:      comment.trim(),
        reviewerName: profile.fullName,
      });
      setDone(true);
      if (onSubmitted) onSubmitted();
    } catch (e) {
      setError("Failed to submit review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const stars = [1, 2, 3, 4, 5];
  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Rate & Review</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>⭐</div>
            <p className={styles.successTitle}>Review submitted!</p>
            <p className={styles.successSub}>
              Thank you for rating <strong>{proposal.workerName}</strong>.
              Your review helps other employers make better hiring decisions.
            </p>
            <button className={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.workerInfo}>
              <div className={styles.workerAvatar}>
                {proposal.workerName?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className={styles.workerName}>{proposal.workerName}</p>
                <p className={styles.workerJob}>{proposal.timeline} project</p>
              </div>
            </div>

            <div className={styles.starsSection}>
              <label>How was your experience?</label>
              <div className={styles.stars}>
                {stars.map((s) => (
                  <button
                    key={s}
                    className={`${styles.star} ${(hovered || rating) >= s ? styles.starFilled : ""}`}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>
              {(hovered || rating) > 0 && (
                <p className={styles.ratingLabel}>{ratingLabels[hovered || rating]}</p>
              )}
            </div>

            <div className={styles.commentSection}>
              <label>Write a review</label>
              <textarea
                placeholder={`Describe your experience working with ${proposal.workerName?.split(" ")[0]}...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={400}
              />
              <span className={styles.charCount}>{comment.length}/400</span>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={saving}>
                {saving ? "Submitting..." : "Submit Review →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
