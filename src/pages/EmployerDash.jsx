import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import WorkerCard from "../components/WorkerCard";
import ChatBox from "../components/ChatBox";
import styles from "./EmployerDash.module.css";

const ALL_SKILLS = ["React","TypeScript","Node.js","Python","UI/UX","Figma","Copywriting","SEO","Video Editing","Graphic Design"];

export default function EmployerDash() {
  const { user, workers, getEmployerProposals, getEscrow, getUnreadCount, markAsRead } = useAuth();
  const [tab, setTab] = useState("browse");
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [activeChat, setActiveChat] = useState(null);

  if (!user) return null;

  const filtered = workers.filter((w) => {
    const matchSearch = !search ||
      w.fullName.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchSkill = !filterSkill || w.skills.includes(filterSkill);
    return matchSearch && matchSkill;
  });

  const myProposals = getEmployerProposals(user.id);
  const activeDeals = myProposals.filter((p) => p.status === "accepted");

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Welcome, {user.firstName} 👋</h2>
          <p>Browse workers or manage your active deals.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === "browse" ? styles.activeTab : ""}`} onClick={() => setTab("browse")}>Browse Workers</button>
          <button className={`${styles.tab} ${tab === "deals"  ? styles.activeTab : ""}`} onClick={() => setTab("deals")}>
            Active Deals {activeDeals.length > 0 && <span className={styles.badge}>{activeDeals.length}</span>}
          </button>
        </div>

        {/* BROWSE TAB */}
        {tab === "browse" && (
          <>
            <div className={styles.controls}>
              <input className={styles.search} placeholder="Search by name, skill or location..." value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className={styles.filter} value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)}>
                <option value="">All skills</option>
                {ALL_SKILLS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.resultsBar}>
              <p className={styles.sectionTitle}>Available Workers</p>
              <span className={styles.count}>{filtered.length} found</span>
            </div>
            {filtered.length > 0 ? (
              <div className={styles.grid}>
                {filtered.map((w) => <WorkerCard key={w.id} worker={w} />)}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No workers match your search.</p>
                <span>Try adjusting your filters.</span>
              </div>
            )}
          </>
        )}

        {/* ACTIVE DEALS TAB */}
        {tab === "deals" && (
          <div className={styles.dealsList}>
            {activeDeals.length === 0 ? (
              <div className={styles.empty}>
                <p>No active deals yet.</p>
                <span>When a worker accepts your proposal, your deal will appear here.</span>
              </div>
            ) : (
              activeDeals.map((p) => {
                const escrow = getEscrow(p.id);
                return (
                  <div key={p.id} className={styles.dealCard}>
                    <div className={styles.dealTop}>
                      <div className={styles.dealWorker}>
                        <div className={styles.dealAvatar}>
                          {p.workerName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.dealName}>{p.workerName}</div>
                          <div className={styles.dealSub}>Accepted your proposal</div>
                        </div>
                      </div>
                      <span className={styles.activeBadge}>ACTIVE</span>
                    </div>

                    <p className={styles.dealMsg}>{p.message}</p>

                    <div className={styles.dealMeta}>
                      {p.budget   && <span>💰 {p.budget}</span>}
                      {p.timeline && <span>🗓 {p.timeline}</span>}
                    </div>

                    {escrow ? (
                      <div className={`${styles.escrowBar} ${escrow.status === "released" ? styles.releasedBar : ""}`}>
                        {escrow.status === "held"
                          ? `🔒 $${escrow.amount.toLocaleString()} held in escrow`
                          : `✓ $${escrow.amount.toLocaleString()} released to ${p.workerName.split(" ")[0]}`}
                      </div>
                    ) : (
                      <div className={styles.noEscrow}>💡 No escrow deposit yet — open chat to set one up</div>
                    )}

                    <button className={styles.chatBtn} onClick={() => { setActiveChat(p); markAsRead(p.id); }}>
                      💬 Open Chat {escrow ? "" : "& Set Up Escrow →"}
                      {getUnreadCount(p.id) > 0 && <span className={styles.unreadDot}>{getUnreadCount(p.id)}</span>}
                    </button>
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
