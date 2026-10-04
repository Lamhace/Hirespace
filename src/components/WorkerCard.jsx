import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProposalModal from "./ProposalModal";
import ProofOfWorkModal, { getWorkerProjects } from "./ProofOfWorkModal";
import Avatar from "./Avatar";
import styles from "./WorkerCard.module.css";

const CURRENCY_SYMBOLS = { NGN:"₦", USD:"$", GBP:"£" };

export default function WorkerCard({ worker, distance }) {
  const { profile, sendProposal } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showPowModal, setShowPowModal] = useState(false);
  const sym = CURRENCY_SYMBOLS[worker.currency] || "₦";

  const projects = getWorkerProjects(worker);

  const handleHireForProject = (proj) => {
    setShowPowModal(false);
    setShowModal(true);
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.top}>
          <div className={styles.avatarWrap}>
            <Avatar avatarBase64={worker.avatarBase64} initials={worker.initials} size={44} />
            {/* Availability dot on avatar */}
            <span className={`${styles.availDot} ${worker.available ? styles.availOn : styles.availOff}`} title={worker.available ? "Available" : "Unavailable"} />
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div className={styles.nameRow}>
              <div className={styles.name}>{worker.fullName}</div>
              {worker.available && <span className={styles.availBadge}>Available</span>}
            </div>
            {/* Trust & Verification Badge */}
            <div className={styles.trustBadge}>
              <span className={styles.trustIcon}>{worker.trustTier === 3 ? "🛡️" : "✓"}</span>
              <span>{worker.verifiedBadge || "ID & Phone Verified"}</span>
            </div>
            <div className={styles.location}>
              📍 {worker.location}
            </div>
            {distance && (
              <div className={styles.proximityBadge}>
                <span className={styles.proximityPulse} />
                <span>⚡ {distance} away · Same-Day Dispatch</span>
              </div>
            )}
            {/* Star rating */}
            {worker.reviewCount > 0 && (
              <div className={styles.rating}>
                <span className={styles.star}>★</span>
                <span className={styles.ratingNum}>{worker.avgRating?.toFixed(1)}</span>
                <span className={styles.ratingCount}>({worker.reviewCount})</span>
              </div>
            )}
          </div>
        </div>

        <p className={styles.bio}>{worker.bio}</p>

        {/* Proof of Work Showcase Strip */}
        {projects.length > 0 && (
          <div className={styles.powTeaser} onClick={() => setShowPowModal(true)}>
            <div className={styles.powHeader}>
              <span className={styles.powTitle}>📸 Proof of Work ({projects.length})</span>
              <span className={styles.powLink}>Inspect Work →</span>
            </div>
            <div className={styles.powThumbs}>
              {projects.slice(0, 2).map((p, i) => (
                <div key={p.id} className={styles.powThumb}>
                  <img src={p.afterImg} alt={p.title} />
                  <span className={styles.powThumbTag}>{i === 0 ? "Latest Job" : "Verified"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.skills}>
          {worker.skills?.slice(0,4).map((s) => <span key={s} className={styles.skill}>{s}</span>)}
          {worker.skills?.length > 4 && <span className={styles.more}>+{worker.skills.length-4} more</span>}
        </div>

        <div className={styles.footer}>
          <span className={styles.rate}>{sym}{Number(worker.rate||0).toLocaleString()}<span>/hr</span></span>
          <button
            type="button"
            className={styles.powBtn}
            onClick={() => setShowPowModal(true)}
          >
            📸 View Portfolio
          </button>
        </div>

        <div className={styles.cardActions}>
          <button className={styles.hireBtn} onClick={() => setShowModal(true)}>Contact Worker →</button>
          {distance && (
            <button
              type="button"
              className={styles.urgentDispatchBtn}
              onClick={() => setShowModal(true)}
              title="Request same-day fast dispatch"
            >
              ⚡ Instant Request
            </button>
          )}
        </div>
      </div>

      {showPowModal && (
        <ProofOfWorkModal
          worker={worker}
          onClose={() => setShowPowModal(false)}
          onHireForProject={handleHireForProject}
        />
      )}

      {showModal && (
        <ProposalModal
          worker={worker}
          employer={profile}
          onClose={() => setShowModal(false)}
          onSend={sendProposal}
        />
      )}
    </>
  );
}
