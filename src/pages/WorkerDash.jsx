import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import styles from "./WorkerDash.module.css";

export default function WorkerDash() {
  const { user, getWorkerProposals, respondToProposal, getEscrow, getUnreadCount, markAsRead } = useAuth();
  const [tab, setTab] = useState("profile");
  const [activeChat, setActiveChat] = useState(null);

  if (!user) return null;

  const proposals = getWorkerProposals(user.id);
  const pending = proposals.filter((p) => p.status === "pending").length;

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Hey, {user.firstName} 👋</h2>
          <p>Manage your profile and incoming proposals.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "profile"  ? styles.activeTab : ""}`} onClick={() => setTab("profile")}>Profile</button>
          <button className={`${styles.tab} ${tab === "requests" ? styles.activeTab : ""}`} onClick={() => setTab("requests")}>
            Requests {pending > 0 && <span className={styles.badge}>{pending}</span>}
          </button>
        </div>

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <div className={styles.profileAvatar}>{user.initials}</div>
                <div className={styles.profileInfo}>
                  <h3>{user.fullName}</h3>
                  <p>📍 {user.location}</p>
                </div>
                <div className={styles.rateBadge}>${user.rate}<span>/hr</span></div>
              </div>
              <div className={styles.divider} />
              <div className={styles.bioSection}>
                <label>About</label>
                <p>{user.bio}</p>
              </div>
              <div className={styles.divider} />
              <div className={styles.profileGrid}>
                <div className={styles.field}>
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className={styles.field}>
                  <label>Portfolio</label>
                  {user.portfolio
                    ? <a href={user.portfolio} target="_blank" rel="noreferrer" className={styles.link}>View portfolio →</a>
                    : <p className={styles.empty}>Not added</p>}
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.skillsSection}>
                <label>Skills</label>
                <div className={styles.skills}>
                  {user.skills?.length > 0
                    ? user.skills.map((s) => <span key={s} className={styles.skill}>{s}</span>)
                    : <span className={styles.empty}>No skills added</span>}
                </div>
              </div>
            </div>

            <div className={styles.tipCard}>
              <strong>Profile tip:</strong> Workers with 4+ skills and a portfolio link get <strong>3x more</strong> employer views.
            </div>

            <div className={styles.statsRow}>
              {[[proposals.length, "Total proposals"], [pending, "Pending requests"], [user.skills?.length || "0", "Skills listed"]].map(([n, l]) => (
                <div key={l} className={styles.statCard}>
                  <div className={styles.statNum}>{n}</div>
                  <div className={styles.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REQUESTS TAB */}
        {tab === "requests" && (
          <div className={styles.requestsList}>
            {proposals.length === 0 ? (
              <div className={styles.emptyRequests}>
                <div className={styles.emptyIcon}>📬</div>
                <p>No proposals yet</p>
                <span>When employers contact you, their proposals will appear here.</span>
              </div>
            ) : (
              proposals.map((p) => {
                const escrow = getEscrow(p.id);
                return (
                  <div key={p.id} className={`${styles.proposalCard} ${styles[p.status]}`}>
                    <div className={styles.proposalTop}>
                      <div className={styles.proposalFrom}>
                        <div className={styles.empAvatar}>
                          {p.employerName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
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
                      <span className={styles.propDate}>
                        {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {p.status === "pending" && (
                      <div className={styles.proposalActions}>
                        <button className={styles.declineBtn} onClick={() => respondToProposal(p.id, "declined")}>Decline</button>
                        <button className={styles.acceptBtn}  onClick={() => respondToProposal(p.id, "accepted")}>Accept →</button>
                      </div>
                    )}

                    {p.status === "accepted" && (
                      <div className={styles.acceptedSection}>
                        {escrow && (
                          <div className={`${styles.escrowNotice} ${escrow.status === "released" ? styles.released : ""}`}>
                            {escrow.status === "held"
                              ? `🔒 $${escrow.amount.toLocaleString()} held in escrow — funds released when you complete the job`
                              : `✓ $${escrow.amount.toLocaleString()} released to you`}
                          </div>
                        )}
                        <button className={styles.chatBtn} onClick={() => { setActiveChat(p); markAsRead(p.id); }}>
                          💬 Open Chat
                          {getUnreadCount(p.id) > 0 && <span className={styles.unreadDot}>{getUnreadCount(p.id)}</span>}
                        </button>
                      </div>
                    )}

                    {p.status === "declined" && (
                      <div className={styles.declinedNote}>You declined this proposal.</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {activeChat && (
        <ChatBox proposal={activeChat} onClose={() => setActiveChat(null)} />
      )}
    </div>
  );
}
