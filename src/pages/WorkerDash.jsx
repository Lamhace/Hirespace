import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import styles from "./WorkerDash.module.css";

export default function WorkerDash() {
  const { user, profile, getWorkerProposals, respondToProposal } = useAuth();
  const [tab, setTab] = useState("profile");
  const [activeChat, setActiveChat] = useState(null);

  if (!profile) return null;

  const proposals = getWorkerProposals();
  const pending   = proposals.filter((p) => p.status === "pending").length;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Hey, {profile.firstName} 👋</h2>
          <p>Manage your profile and incoming proposals.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "profile"  ? styles.activeTab : ""}`} onClick={() => setTab("profile")}>Profile</button>
          <button className={`${styles.tab} ${tab === "requests" ? styles.activeTab : ""}`} onClick={() => setTab("requests")}>
            Requests {pending > 0 && <span className={styles.badge}>{pending}</span>}
          </button>
        </div>

        {tab === "profile" && (
          <>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.profileAvatar}>{profile.initials}</div>
                <div className={styles.profileInfo}>
                  <h3>{profile.fullName}</h3>
                  <p>📍 {profile.location}</p>
                </div>
                <div className={styles.rateBadge}>${profile.rate}<span>/hr</span></div>
              </div>
              <div className={styles.divider} />
              <div className={styles.bioSection}>
                <label>About</label>
                <p>{profile.bio}</p>
              </div>
              <div className={styles.divider} />
              <div className={styles.profileGrid}>
                <div className={styles.field}>
                  <label>Email</label>
                  <p>{profile.email}</p>
                </div>
                <div className={styles.field}>
                  <label>Portfolio</label>
                  {profile.portfolio
                    ? <a href={profile.portfolio} target="_blank" rel="noreferrer" className={styles.link}>View portfolio →</a>
                    : <p className={styles.empty}>Not added</p>}
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.skillsSection}>
                <label>Skills</label>
                <div className={styles.skills}>
                  {profile.skills?.length > 0
                    ? profile.skills.map((s) => <span key={s} className={styles.skill}>{s}</span>)
                    : <span className={styles.empty}>No skills added</span>}
                </div>
              </div>
            </div>

            <div className={styles.tipCard}>
              <strong>Profile tip:</strong> Workers with 4+ skills and a portfolio link get <strong>3x more</strong> employer views.
            </div>

            <div className={styles.statsRow}>
              {[[proposals.length,"Total proposals"],[pending,"Pending requests"],[profile.skills?.length||0,"Skills listed"]].map(([n,l]) => (
                <div key={l} className={styles.statCard}>
                  <div className={styles.statNum}>{n}</div>
                  <div className={styles.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "requests" && (
          <div className={styles.requestsList}>
            {proposals.length === 0 ? (
              <div className={styles.emptyRequests}>
                <div className={styles.emptyIcon}>📬</div>
                <p>No proposals yet</p>
                <span>When employers contact you, their proposals will appear here.</span>
              </div>
            ) : (
              proposals.map((p) => (
                <div key={p.id} className={`${styles.proposalCard} ${styles[p.status]}`}>
                  <div className={styles.proposalTop}>
                    <div className={styles.proposalFrom}>
                      <div className={styles.empAvatar}>
                        {p.employerName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.empName}>{p.employerName}</div>
                        <div className={styles.empCompany}>{p.employerCompany}</div>
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[p.status]}`}>{p.status}</span>
                  </div>

                  <p className={styles.proposalMsg}>{p.message}</p>

                  <div className={styles.proposalMeta}>
                    {p.budget   && <span>💰 {p.budget}</span>}
                    {p.timeline && <span>🗓 {p.timeline}</span>}
                  </div>

                  {p.status === "pending" && (
                    <div className={styles.proposalActions}>
                      <button className={styles.declineBtn} onClick={() => respondToProposal(p.id, "declined")}>Decline</button>
                      <button className={styles.acceptBtn}  onClick={() => respondToProposal(p.id, "accepted")}>Accept →</button>
                    </div>
                  )}

                  {p.status === "accepted" && (
                    <div className={styles.acceptedSection}>
                      <button className={styles.chatBtn} onClick={() => setActiveChat(p)}>💬 Open Chat</button>
                    </div>
                  )}

                  {p.status === "declined" && (
                    <div className={styles.declinedNote}>You declined this proposal.</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeChat && <ChatBox proposal={activeChat} onClose={() => setActiveChat(null)} />}
    </div>
  );
}
