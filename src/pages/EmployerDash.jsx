import { useState } from "react";
import { useAuth, NIGERIAN_HUBS } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import WorkerCard from "../components/WorkerCard";
import Avatar from "../components/Avatar";
import ChatBox from "../components/ChatBox";
import ReviewModal from "../components/ReviewModal";
import DisputeModal from "../components/DisputeModal";
import styles from "./EmployerDash.module.css";

const ALL_JOBS = ["Plumber","Electrician","House Cleaner","Interior Decorator","Mechanic","Laundry","Gas Filler","Carpenter","Painter","Welder","Tiler","Mason","Generator Repair","AC Repair","Security Guard","Driver","Gardener","Chef / Cook"];

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function EmployerDash() {
  const { profile, workers, getEmployerProposals, hasNewMessage } = useAuth();
  const [tab,          setTab]          = useState("browse");
  const [search,       setSearch]       = useState("");
  const [filterJob,    setFilterJob]    = useState("");
  const [activeChat,   setActiveChat]   = useState(null);
  const [reviewProposal,  setReviewProposal]  = useState(null);
  const [disputeProposal, setDisputeProposal] = useState(null);
  const [activeHub,    setActiveHub]    = useState(profile?.area || "Victoria Island");
  const [location,     setLocation]     = useState(
    profile?.lat && profile?.lng
      ? { lat: profile.lat, lng: profile.lng, name: profile.area || profile.location || "Victoria Island" }
      : { lat: 6.4281, lng: 3.4219, name: "Victoria Island" }
  );
  const [locLoading,   setLocLoading]   = useState(false);
  const [locError,     setLocError]     = useState("");
  const [nearbyOnly,   setNearbyOnly]   = useState(true);
  const [nearbyKm,     setNearbyKm]     = useState(15);

  if (!profile) return null;

  const myProposals   = getEmployerProposals();
  const activeDeals   = myProposals.filter((p) => p.status === "accepted");
  const archivedDeals = myProposals.filter((p) => p.status === "archived");

  const handleSelectHub = (hub) => {
    setActiveHub(hub.label);
    setLocation({ lat: hub.lat, lng: hub.lng, name: hub.name });
    setNearbyOnly(true);
    setLocError("");
  };

  const requestLocation = () => {
    setLocLoading(true);
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("GPS not supported in this browser. Active area: " + (location?.name || "Lagos"));
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: "Live GPS Location" });
        setActiveHub("GPS");
        setLocLoading(false);
        setNearbyOnly(true);
      },
      () => {
        setLocError("Location access denied or unavailable. Switched to Lagos Island hub.");
        setLocation({ lat: 6.4281, lng: 3.4219, name: "Victoria Island" });
        setActiveHub("VI");
        setLocLoading(false);
        setNearbyOnly(true);
      },
      { timeout: 8000 }
    );
  };

  const getDistance = (worker) => {
    if (!location || !worker.lat || !worker.lng) return null;
    return getDistanceKm(location.lat, location.lng, worker.lat, worker.lng);
  };

  const filtered = workers
    .filter((w) => {
      const matchSearch =
        !search ||
        w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        w.location?.toLowerCase().includes(search.toLowerCase()) ||
        w.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchJob    = !filterJob || w.skills?.includes(filterJob);
      const dist        = getDistance(w);
      const matchNearby = !nearbyOnly || dist === null || dist <= nearbyKm;
      return matchSearch && matchJob && matchNearby;
    })
    .map((w) => ({ ...w, _distance: getDistance(w) }))
    .sort((a, b) => {
      if (a._distance !== null && b._distance !== null) {
        return a._distance - b._distance;
      }
      if (a._distance !== null) return -1;
      if (b._distance !== null) return 1;
      return 0;
    });

  return (
    <div className={styles.page}>
      <Navbar />

      {/* FEE NOTICE BANNER */}
      <div className={styles.feeBanner}>
        💡 <strong>How HireSpace works:</strong> For every agreed payment made by employers, HireSpace takes a{" "}
        <strong>5% service fee</strong>. This keeps the platform running and protects both parties.
      </div>

      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Welcome, {profile.firstName} 👋</h2>
          <p>Browse local workers or manage your active deals.</p>
        </div>

        {/* TABS */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "browse" ? styles.activeTab : ""}`}
            onClick={() => setTab("browse")}
          >
            Browse Workers
          </button>
          <button
            className={`${styles.tab} ${tab === "deals" ? styles.activeTab : ""}`}
            onClick={() => setTab("deals")}
          >
            Active Deals
            {activeDeals.length > 0 && <span className={styles.badge}>{activeDeals.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${tab === "archived" ? styles.activeTab : ""}`}
            onClick={() => setTab("archived")}
          >
            Archived
            {archivedDeals.length > 0 && <span className={styles.badge}>{archivedDeals.length}</span>}
          </button>
        </div>

        {/* ── BROWSE TAB ── */}
        {tab === "browse" && (
          <>
            {/* PROXIMITY RADAR BAR */}
            <div className={styles.radarBar}>
              <div className={styles.radarTopRow}>
                <div className={styles.radarStatus}>
                  <span className={styles.radarPulse}>📡</span>
                  <div>
                    <span className={styles.radarTitle}>Proximity Radar: ACTIVE</span>
                    <span className={styles.radarArea}>
                      Browsing verified artisans near <strong>{location?.name || "Lagos"}</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.radiusControl}>
                  <label>Radius:</label>
                  <select
                    className={styles.kmSelect}
                    value={nearbyKm}
                    onChange={(e) => setNearbyKm(Number(e.target.value))}
                  >
                    <option value={5}>Within 5km (Same neighborhood)</option>
                    <option value={10}>Within 10km (District)</option>
                    <option value={15}>Within 15km (Metropolitan)</option>
                    <option value={35}>Within 35km (All Lagos)</option>
                  </select>
                </div>
              </div>

              {/* Quick Area Hub Selector */}
              <div className={styles.hubSelectorRow}>
                <span className={styles.hubLabel}>Area Hubs:</span>
                <div className={styles.hubPills}>
                  <button
                    type="button"
                    className={`${styles.hubPill} ${activeHub === "GPS" ? styles.hubActive : ""}`}
                    onClick={requestLocation}
                    disabled={locLoading}
                  >
                    {locLoading ? "Locating..." : "📍 My GPS"}
                  </button>
                  {NIGERIAN_HUBS.map((hub) => (
                    <button
                      key={hub.label}
                      type="button"
                      className={`${styles.hubPill} ${activeHub === hub.label ? styles.hubActive : ""}`}
                      onClick={() => handleSelectHub(hub)}
                    >
                      {hub.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`${styles.hubPill} ${!nearbyOnly ? styles.hubActive : ""}`}
                    onClick={() => setNearbyOnly(!nearbyOnly)}
                    style={{ marginLeft: "auto" }}
                  >
                    {nearbyOnly ? "Nearby Filter: ON ✓" : "Show All"}
                  </button>
                </div>
              </div>

              {locError && <p className={styles.locError}>{locError}</p>}
            </div>

            <div className={styles.controls}>
              <input
                className={styles.search}
                placeholder="Search by name, job or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.filter}
                value={filterJob}
                onChange={(e) => setFilterJob(e.target.value)}
              >
                <option value="">All jobs</option>
                {ALL_JOBS.map((j) => <option key={j}>{j}</option>)}
              </select>
            </div>

            <div className={styles.resultsBar}>
              <p className={styles.sectionTitle}>Available Workers</p>
              <span className={styles.count}>{filtered.length} found</span>
            </div>

            {filtered.length > 0 ? (
              <div className={styles.grid}>
                {filtered.map((w) => (
                  <WorkerCard
                    key={w.id}
                    worker={w}
                    distance={w._distance !== null ? `${w._distance.toFixed(1)}km` : null}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <p>No workers match your search.</p>
                <span>Try adjusting your filters.</span>
              </div>
            )}
          </>
        )}

        {/* ── ACTIVE DEALS TAB ── */}
        {tab === "deals" && (
          <div className={styles.dealsList}>
            {activeDeals.length === 0 ? (
              <div className={styles.empty}>
                <p>No active deals yet.</p>
                <span>When a worker accepts your proposal, your deal will appear here.</span>
              </div>
            ) : (
              activeDeals.map((p) => (
                <div key={p.id} className={styles.dealCard}>
                  <div className={styles.dealTop}>
                    <div className={styles.dealWorker}>
                      <div className={styles.dealAvatar}>
                        {p.workerName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
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

                  <button className={styles.chatBtn} onClick={() => setActiveChat(p)}>
                    💬 Open Chat & Escrow →
                    {hasNewMessage[p.id] && (
                      <span className={styles.unreadDot}>1</span>
                    )}
                  </button>

                  <div className={styles.dealActions}>
                    {!p.reviewed ? (
                      <button className={styles.reviewBtn} onClick={() => setReviewProposal(p)}>
                        ⭐ Rate Worker
                      </button>
                    ) : (
                      <span className={styles.reviewedTag}>✓ Reviewed</span>
                    )}
                    {!p.disputed ? (
                      <button className={styles.disputeBtn} onClick={() => setDisputeProposal(p)}>
                        🛡️ Dispute
                      </button>
                    ) : (
                      <span className={styles.disputedTag}>⚠️ Dispute open</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ARCHIVED TAB ── */}
        {tab === "archived" && (
          <div className={styles.dealsList}>
            {archivedDeals.length === 0 ? (
              <div className={styles.empty}>
                <p>No archived deals yet.</p>
                <span>Completed deals are automatically archived when their timeframe ends.</span>
              </div>
            ) : (
              archivedDeals.map((p) => (
                <div key={p.id} className={styles.archivedCard}>
                  <div className={styles.dealTop}>
                    <div className={styles.dealWorker}>
                      <div className={styles.dealAvatar}>
                        {p.workerName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.dealName}>{p.workerName}</div>
                        <div className={styles.dealSub}>{p.archiveReason || "Deal completed"}</div>
                      </div>
                    </div>
                    <span className={styles.archivedBadge}>ARCHIVED</span>
                  </div>
                  <div className={styles.dealMeta}>
                    {p.budget    && <span>💰 {p.budget}</span>}
                    {p.timeline  && <span>🗓 {p.timeline}</span>}
                    {p.archivedAt && (
                      <span>
                        📅 Archived{" "}
                        {new Date(p.archivedAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {activeChat      && <ChatBox       proposal={activeChat}      onClose={() => setActiveChat(null)} />}
      {reviewProposal  && <ReviewModal   proposal={reviewProposal}  onClose={() => setReviewProposal(null)}  onSubmitted={() => setReviewProposal(null)} />}
      {disputeProposal && <DisputeModal  proposal={disputeProposal} onClose={() => setDisputeProposal(null)} />}
    </div>
  );
}
