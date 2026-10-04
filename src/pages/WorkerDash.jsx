import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ChatBox from "../components/ChatBox";
import Avatar from "../components/Avatar";
import ProofOfWorkModal, { getWorkerProjects } from "../components/ProofOfWorkModal";
import styles from "./WorkerDash.module.css";

export default function WorkerDash() {
  const { user, profile, getWorkerProposals, respondToProposal, updateProfile, hasNewMessage } = useAuth();
  const [tab,           setTab]           = useState("profile");
  const [activeChat,    setActiveChat]    = useState(null);
  const [showPowModal,  setShowPowModal]  = useState(false);
  const [locLoading,    setLocLoading]    = useState(false);
  const [locError,      setLocError]      = useState("");
  const [availLoading,  setAvailLoading]  = useState(false);

  if (!profile) return null;

  const projects  = getWorkerProjects(profile);
  const proposals = getWorkerProposals();
  const pending   = proposals.filter((p) => p.status === "pending").length;

  // Total unread across all accepted proposals
  const totalNewMessages = proposals
    .filter((p) => p.status === "accepted")
    .reduce((sum, p) => sum + (hasNewMessage[p.id] ? 1 : 0), 0);

  const enableLocation = () => {
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateProfile({ lat: pos.coords.latitude, lng: pos.coords.longitude, locationEnabled: true });
        setLocLoading(false);
      },
      () => { setLocError("Location access denied. Please allow location in your browser settings."); setLocLoading(false); },
      { timeout: 10000 }
    );
  };

  const disableLocation = async () => {
    await updateProfile({ lat: null, lng: null, locationEnabled: false });
  };

  const toggleAvailability = async () => {
    setAvailLoading(true);
    await updateProfile({ available: !profile.available });
    setAvailLoading(false);
  };

  const CURRENCY_SYMBOLS = { NGN:"₦", USD:"$", GBP:"£" };
  const sym = CURRENCY_SYMBOLS[profile.currency] || "₦";

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Hey, {profile.firstName} 👋</h2>
          <p>Manage your profile and incoming proposals.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==="profile"?styles.activeTab:""}`}  onClick={() => setTab("profile")}>Profile</button>
          <button className={`${styles.tab} ${tab==="requests"?styles.activeTab:""}`} onClick={() => setTab("requests")}>
            Requests
            {(pending + totalNewMessages) > 0 && (
              <span className={styles.badge}>{pending + totalNewMessages}</span>
            )}
          </button>
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <div className={styles.profileCard}>
              <div className={styles.profileTop}>
                <Avatar avatarBase64={profile.avatarBase64} initials={profile.initials} size={68} />
                <div className={styles.profileInfo}>
                  <h3>{profile.fullName}</h3>
                  <p>📍 {profile.location}</p>
                  {profile.verifiedBadge && (
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      fontSize: "0.68rem",
                      color: "#38bdf8",
                      background: "rgba(56, 189, 248, 0.1)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "999px",
                      marginTop: "0.25rem",
                      fontWeight: 600
                    }}>
                      🛡️ {profile.verifiedBadge}
                    </span>
                  )}
                </div>
                <div className={styles.rateBadge}>{sym}{Number(profile.rate||0).toLocaleString()}<span>/hr</span></div>
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
                <label>Job categories</label>
                <div className={styles.skills}>
                  {profile.skills?.length > 0
                    ? profile.skills.map((s) => <span key={s} className={styles.skill}>{s}</span>)
                    : <span className={styles.empty}>No categories added</span>}
                </div>
              </div>

              <div className={styles.divider} />

              {/* Proof of Work Showcase */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <label style={{ fontFamily: "var(--mono)", fontSize: "0.68rem", color: "var(--muted2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Verified Craftsmanship & Proof of Work ({projects.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPowModal(true)}
                    style={{
                      background: "rgba(6,182,212,0.1)",
                      border: "1px solid rgba(6,182,212,0.3)",
                      color: "var(--cyan)",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "20px",
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    View Public Portfolio →
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                  {projects.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setShowPowModal(true)}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        height: "76px",
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.08)"
                      }}
                    >
                      <img src={p.afterImg} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        insetInline: 0,
                        background: "linear-gradient(transparent, rgba(15,23,42,0.9))",
                        padding: "4px 8px",
                        fontSize: "0.66rem",
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: 600
                      }}>
                        {p.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.divider} />

              {/* AVAILABILITY TOGGLE */}
              <div className={styles.availSection}>
                <div className={styles.availHeader}>
                  <div>
                    <label>Availability</label>
                    <p className={styles.availDesc}>Let employers know if you're open for new work right now.</p>
                  </div>
                  <button
                    className={`${styles.availToggle} ${profile.available ? styles.availOn : styles.availOff}`}
                    onClick={toggleAvailability}
                    disabled={availLoading}
                  >
                    <span className={styles.availDot} />
                    {availLoading ? "Updating..." : profile.available ? "Available" : "Unavailable"}
                  </button>
                </div>
              </div>

              <div className={styles.divider} />

              {/* RATINGS DISPLAY */}
              {profile.reviewCount > 0 && (
                <>
                  <div className={styles.ratingsSection}>
                    <label>Your rating</label>
                    <div className={styles.ratingRow}>
                      <div className={styles.ratingBig}>{profile.avgRating?.toFixed(1)}</div>
                      <div>
                        <div className={styles.ratingStars}>
                          {[1,2,3,4,5].map((s) => (
                            <span key={s} style={{ color: s <= Math.round(profile.avgRating) ? "#fbbf24" : "var(--border)" }}>★</span>
                          ))}
                        </div>
                        <p className={styles.ratingCount}>{profile.reviewCount} review{profile.reviewCount !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.divider} />
                </>
              )}
              <div className={styles.locationSection}>
                <label>📍 Location visibility</label>
                <p className={styles.locDesc}>Enable location so nearby employers can find you more easily.</p>
                {profile.locationEnabled ? (
                  <div className={styles.locEnabled}>
                    <span className={styles.locOnTag}>✓ Location enabled — employers can find you nearby</span>
                    <button className={styles.locOffBtn} onClick={disableLocation}>Turn off</button>
                  </div>
                ) : (
                  <div className={styles.locDisabled}>
                    {locError && <p className={styles.locError}>{locError}</p>}
                    <button className={styles.locEnableBtn} onClick={enableLocation} disabled={locLoading}>
                      {locLoading ? "Detecting location..." : "📍 Enable my location"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.tipCard}>
              <strong>Profile tip:</strong> Workers with a profile photo and location enabled get <strong>3x more</strong> employer views.
            </div>

            <div className={styles.statsRow}>
              {[[proposals.length,"Total proposals"],[pending,"Pending requests"],[profile.skills?.length||0,"Job categories"]].map(([n,l]) => (
                <div key={l} className={styles.statCard}>
                  <div className={styles.statNum}>{n}</div>
                  <div className={styles.statLbl}>{l}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── REQUESTS TAB ── */}
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
                const hasNew = hasNewMessage[p.id] || false;
                return (
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
                        <button className={styles.chatBtn} onClick={() => setActiveChat(p)}>
                          💬 Open Chat
                          {hasNew && <span className={styles.unreadDot}>1</span>}
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

      {activeChat && <ChatBox proposal={activeChat} onClose={() => setActiveChat(null)} />}
      {showPowModal && (
        <ProofOfWorkModal
          worker={profile}
          onClose={() => setShowPowModal(false)}
        />
      )}
    </div>
  );
}
