import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProposalModal from "./ProposalModal";
import styles from "./WorkerCard.module.css";

export default function WorkerCard({ worker }) {
  const { user, sendProposal } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className={styles.card}>
        <div className={styles.top}>
          <div className={styles.avatar}>{worker.initials}</div>
          <div>
            <div className={styles.name}>{worker.fullName}</div>
            <div className={styles.location}>📍 {worker.location}</div>
          </div>
        </div>

        <p className={styles.bio}>{worker.bio}</p>

        <div className={styles.skills}>
          {worker.skills.slice(0, 4).map((s) => (
            <span key={s} className={styles.skill}>{s}</span>
          ))}
          {worker.skills.length > 4 && (
            <span className={styles.more}>+{worker.skills.length - 4}</span>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.rate}>${worker.rate}<span>/hr</span></span>
          {worker.portfolio && (
            <a href={worker.portfolio} target="_blank" rel="noreferrer" className={styles.portfolioLink}>
              Portfolio →
            </a>
          )}
        </div>

        <button className={styles.hireBtn} onClick={() => setShowModal(true)}>
          Contact Worker →
        </button>
      </div>

      {showModal && (
        <ProposalModal
          worker={worker}
          employer={user}
          onClose={() => setShowModal(false)}
          onSend={(proposal) => {
            sendProposal(proposal);
          }}
        />
      )}
    </>
  );
}
