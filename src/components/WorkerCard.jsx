import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProposalModal from "./ProposalModal";
import Avatar from "./Avatar";
import styles from "./WorkerCard.module.css";

const CURRENCY_SYMBOLS = { NGN:"₦", USD:"$", GBP:"£" };

export default function WorkerCard({ worker, distance }) {
  const { profile, sendProposal } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const sym = CURRENCY_SYMBOLS[worker.currency] || "₦";

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
            <div className={styles.location}>
              📍 {worker.location}
              {distance && <span className={styles.distance}> · {distance} away</span>}
            </div>
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

        <div className={styles.skills}>
          {worker.skills?.slice(0,4).map((s) => <span key={s} className={styles.skill}>{s}</span>)}
          {worker.skills?.length > 4 && <span className={styles.more}>+{worker.skills.length-4} more</span>}
        </div>

        <div className={styles.footer}>
          <span className={styles.rate}>{sym}{Number(worker.rate||0).toLocaleString()}<span>/hr</span></span>
          {worker.portfolio && <a href={worker.portfolio} target="_blank" rel="noreferrer" className={styles.portfolioLink}>Portfolio →</a>}
        </div>

        <button className={styles.hireBtn} onClick={() => setShowModal(true)}>Contact Worker →</button>
      </div>

      {showModal && (
        <ProposalModal worker={worker} employer={profile} onClose={() => setShowModal(false)} onSend={sendProposal} />
      )}
    </>
  );
}
