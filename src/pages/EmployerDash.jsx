// import { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import Navbar from "../components/Navbar";
// import WorkerCard from "../components/WorkerCard";
// import ChatBox from "../components/ChatBox";
// import styles from "./EmployerDash.module.css";

// const ALL_JOBS = ["Plumber","Electrician","House Cleaner","Interior Decorator","Mechanic","Laundry","Gas Filler","Carpenter","Painter","Welder","Tiler","Mason","Generator Repair","AC Repair","Security Guard","Driver","Gardener","Chef / Cook"];

// function getDistanceKm(lat1, lon1, lat2, lon2) {
//   const R = 6371;
//   const dLat = (lat2-lat1)*Math.PI/180;
//   const dLon = (lon2-lon1)*Math.PI/180;
//   const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
// }

// export default function EmployerDash() {
//   const { profile, workers, getEmployerProposals } = useAuth();
//   const [tab,         setTab]         = useState("browse");
//   const [search,      setSearch]      = useState("");
//   const [filterJob,   setFilterJob]   = useState("");
//   const [activeChat,  setActiveChat]  = useState(null);
//   const [location,    setLocation]    = useState(null);
//   const [locLoading,  setLocLoading]  = useState(false);
//   const [locError,    setLocError]    = useState("");
//   const [nearbyOnly,  setNearbyOnly]  = useState(false);
//   const [nearbyKm,    setNearbyKm]    = useState(10);

//   if (!profile) return null;

//   const myProposals = getEmployerProposals();
//   const activeDeals   = myProposals.filter((p) => p.status === "accepted");
//   const archivedDeals = myProposals.filter((p) => p.status === "archived");

//   const requestLocation = () => {
//     setLocLoading(true);
//     setLocError("");
//     navigator.geolocation.getCurrentPosition(
//       (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); setNearbyOnly(true); },
//       ()    => { setLocError("Location access denied. You can still browse all workers."); setLocLoading(false); },
//       { timeout: 10000 }
//     );
//   };

//   const getDistance = (worker) => {
//     if (!location || !worker.lat || !worker.lng) return null;
//     return getDistanceKm(location.lat, location.lng, worker.lat, worker.lng);
//   };

//   const filtered = workers.filter((w) => {
//     const matchSearch = !search ||
//       w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
//       w.location?.toLowerCase().includes(search.toLowerCase()) ||
//       w.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
//     const matchJob  = !filterJob || w.skills?.includes(filterJob);
//     const dist = getDistance(w);
//     const matchNearby = !nearbyOnly || !location || dist === null || dist <= nearbyKm;
//     return matchSearch && matchJob && matchNearby;
//   }).map((w) => ({ ...w, _distance: getDistance(w) }))
//     .sort((a,b) => nearbyOnly && a._distance !== null && b._distance !== null ? a._distance - b._distance : 0);

//   return (
//     <div className={styles.page}>
//       <Navbar />

//       {/* FEE NOTICE BANNER */}
//       <div className={styles.feeBanner}>
//         💡 <strong>How HireSpace works:</strong> For every agreed payment made by employers, HireSpace takes a <strong>5% service fee</strong>. This keeps the platform running and protects both parties.
//       </div>

//       <div className={styles.body}>
//         <div className={styles.greeting}>
//           <h2>Welcome, {profile.firstName} 👋</h2>
//           <p>Browse local workers or manage your active deals.</p>
//         </div>

//         <div className={styles.tabs}>
//           <button className={`${styles.tab} ${tab==="browse"?"active":""}`} onClick={() => setTab("browse")}>Browse Workers</button>
//           <button className={`${styles.tab} ${tab==="deals"?"active":""}`} onClick={() => setTab("deals")}>
//             Active Deals {activeDeals.length > 0 && <span className={styles.badge}>{activeDeals.length}</span>}
//           </button>
//         </div>

//         {tab === "browse" && (
//           <>
//             {/* LOCATION SECTION */}
//             <div className={styles.locationBar}>
//               {!location ? (
//                 <div className={styles.locationPrompt}>
//                   <div>
//                     <p className={styles.locTitle}>📍 Find nearby workers</p>
//                     <p className={styles.locSub}>Enable location to see workers close to you — completely optional.</p>
//                   </div>
//                   <button className={styles.locBtn} onClick={requestLocation} disabled={locLoading}>
//                     {locLoading ? "Detecting..." : "Enable Location"}
//                   </button>
//                 </div>
//               ) : (
//                 <div className={styles.locationActive}>
//                   <span className={styles.locOn}>📍 Location on</span>
//                   <div className={styles.nearbyToggle}>
//                     <label className={styles.toggle}>
//                       <input type="checkbox" checked={nearbyOnly} onChange={(e)=>setNearbyOnly(e.target.checked)} />
//                       <span className={styles.slider}></span>
//                     </label>
//                     <span>Nearby only</span>
//                     {nearbyOnly && (
//                       <select className={styles.kmSelect} value={nearbyKm} onChange={(e)=>setNearbyKm(Number(e.target.value))}>
//                         <option value={5}>Within 5km</option>
//                         <option value={10}>Within 10km</option>
//                         <option value={25}>Within 25km</option>
//                         <option value={50}>Within 50km</option>
//                       </select>
//                     )}
//                   </div>
//                   <button className={styles.locOffBtn} onClick={() => { setLocation(null); setNearbyOnly(false); }}>Turn off</button>
//                 </div>
//               )}
//               {locError && <p className={styles.locError}>{locError}</p>}
//             </div>

//             <div className={styles.controls}>
//               <input className={styles.search} placeholder="Search by name, job or location..." value={search} onChange={(e)=>setSearch(e.target.value)} />
//               <select className={styles.filter} value={filterJob} onChange={(e)=>setFilterJob(e.target.value)}>
//                 <option value="">All jobs</option>
//                 {ALL_JOBS.map((j) => <option key={j}>{j}</option>)}
//               </select>
//             </div>

//             <div className={styles.resultsBar}>
//               <p className={styles.sectionTitle}>Available Workers</p>
//               <span className={styles.count}>{filtered.length} found</span>
//             </div>

//             {filtered.length > 0
//               ? <div className={styles.grid}>{filtered.map((w) => <WorkerCard key={w.id} worker={w} distance={w._distance !== null ? `${w._distance.toFixed(1)}km` : null} />)}</div>
//               : <div className={styles.empty}><p>No workers match your search.</p><span>Try adjusting your filters.</span></div>
//             }
//           </>
//         )}

//         {tab === "deals" && (
//           <div className={styles.dealsList}>
//             {activeDeals.length === 0 ? (
//               <div className={styles.empty}><p>No active deals yet.</p><span>When a worker accepts your proposal, your deal will appear here.</span></div>
//             ) : (
//               activeDeals.map((p) => (
//                 <div key={p.id} className={styles.dealCard}>
//                   <div className={styles.dealTop}>
//                     <div className={styles.dealWorker}>
//                       <div className={styles.dealAvatar}>{p.workerName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
//                       <div>
//                         <div className={styles.dealName}>{p.workerName}</div>
//                         <div className={styles.dealSub}>Accepted your proposal</div>
//                       </div>
//                     </div>
//                     <span className={styles.activeBadge}>ACTIVE</span>
//                   </div>
//                   <p className={styles.dealMsg}>{p.message}</p>
//                   <div className={styles.dealMeta}>
//                     {p.budget && <span>💰 {p.budget}</span>}
//                     {p.timeline && <span>🗓 {p.timeline}</span>}
//                   </div>
//                   <button className={styles.chatBtn} onClick={() => setActiveChat(p)}>💬 Open Chat & Escrow →</button>
//                 </div>
//               ))
//             )}
//           </div>
//         )}
//       </div>

//         {tab === "archived" && (
//           <div className={styles.dealsList}>
//             {archivedDeals.length === 0 ? (
//               <div className={styles.empty}>
//                 <p>No archived deals yet.</p>
//                 <span>Completed deals are automatically archived when their timeframe ends.</span>
//               </div>
//             ) : (
//               archivedDeals.map((p) => (
//                 <div key={p.id} className={styles.archivedCard}>
//                   <div className={styles.dealTop}>
//                     <div className={styles.dealWorker}>
//                       <div className={styles.dealAvatar}>{p.workerName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
//                       <div>
//                         <div className={styles.dealName}>{p.workerName}</div>
//                         <div className={styles.dealSub}>{p.archiveReason || "Deal completed"}</div>
//                       </div>
//                     </div>
//                     <span className={styles.archivedBadge}>ARCHIVED</span>
//                   </div>
//                   <div className={styles.dealMeta}>
//                     {p.budget && <span>💰 {p.budget}</span>}
//                     {p.timeline && <span>🗓 {p.timeline}</span>}
//                     {p.archivedAt && <span>📅 Archived {new Date(p.archivedAt).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}</span>}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         )}

//       </div>

//       {activeChat && <ChatBox proposal={activeChat} onClose={() => setActiveChat(null)} />}
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import WorkerCard from "../components/WorkerCard";
import ChatBox from "../components/ChatBox";
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
  const { profile, workers, getEmployerProposals } = useAuth();
  const [tab,         setTab]         = useState("browse");
  const [search,      setSearch]      = useState("");
  const [filterJob,   setFilterJob]   = useState("");
  const [activeChat,  setActiveChat]  = useState(null);
  const [location,    setLocation]    = useState(null);
  const [locLoading,  setLocLoading]  = useState(false);
  const [locError,    setLocError]    = useState("");
  const [nearbyOnly,  setNearbyOnly]  = useState(false);
  const [nearbyKm,    setNearbyKm]    = useState(10);

  if (!profile) return null;

  const myProposals = getEmployerProposals();
  const activeDeals   = myProposals.filter((p) => p.status === "accepted");
  const archivedDeals = myProposals.filter((p) => p.status === "archived");

  const requestLocation = () => {
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); setNearbyOnly(true); },
      ()    => { setLocError("Location access denied. You can still browse all workers."); setLocLoading(false); },
      { timeout: 10000 }
    );
  };

  const getDistance = (worker) => {
    if (!location || !worker.lat || !worker.lng) return null;
    return getDistanceKm(location.lat, location.lng, worker.lat, worker.lng);
  };

  const filtered = workers.filter((w) => {
    const matchSearch = !search ||
      w.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      w.location?.toLowerCase().includes(search.toLowerCase()) ||
      w.skills?.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchJob  = !filterJob || w.skills?.includes(filterJob);
    const dist = getDistance(w);
    const matchNearby = !nearbyOnly || !location || dist === null || dist <= nearbyKm;
    return matchSearch && matchJob && matchNearby;
  }).map((w) => ({ ...w, _distance: getDistance(w) }))
    .sort((a,b) => nearbyOnly && a._distance !== null && b._distance !== null ? a._distance - b._distance : 0);

  return (
    <div className={styles.page}>
      <Navbar />

      {/* FEE NOTICE BANNER */}
      <div className={styles.feeBanner}>
        💡 <strong>How HireSpace works:</strong> For every agreed payment made by employers, HireSpace takes a <strong>5% service fee</strong>. This keeps the platform running and protects both parties.
      </div>

      <div className={styles.body}>
        <div className={styles.greeting}>
          <h2>Welcome, {profile.firstName} 👋</h2>
          <p>Browse local workers or manage your active deals.</p>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab==="browse"?"active":""}`} onClick={() => setTab("browse")}>Browse Workers</button>
          <button className={`${styles.tab} ${tab==="deals"?"active":""}`} onClick={() => setTab("deals")}>
            Active Deals {activeDeals.length > 0 && <span className={styles.badge}>{activeDeals.length}</span>}
          </button>
          <button className={`${styles.tab} ${tab==="archived"?"active":""}`} onClick={() => setTab("archived")}>
            Archived
          </button>
        </div>

        {tab === "browse" && (
          <>
            {/* LOCATION SECTION */}
            <div className={styles.locationBar}>
              {!location ? (
                <div className={styles.locationPrompt}>
                  <div>
                    <p className={styles.locTitle}>📍 Find nearby workers</p>
                    <p className={styles.locSub}>Enable location to see workers close to you — completely optional.</p>
                  </div>
                  <button className={styles.locBtn} onClick={requestLocation} disabled={locLoading}>
                    {locLoading ? "Detecting..." : "Enable Location"}
                  </button>
                </div>
              ) : (
                <div className={styles.locationActive}>
                  <span className={styles.locOn}>📍 Location on</span>
                  <div className={styles.nearbyToggle}>
                    <label className={styles.toggle}>
                      <input type="checkbox" checked={nearbyOnly} onChange={(e)=>setNearbyOnly(e.target.checked)} />
                      <span className={styles.slider}></span>
                    </label>
                    <span>Nearby only</span>
                    {nearbyOnly && (
                      <select className={styles.kmSelect} value={nearbyKm} onChange={(e)=>setNearbyKm(Number(e.target.value))}>
                        <option value={5}>Within 5km</option>
                        <option value={10}>Within 10km</option>
                        <option value={25}>Within 25km</option>
                        <option value={50}>Within 50km</option>
                      </select>
                    )}
                  </div>
                  <button className={styles.locOffBtn} onClick={() => { setLocation(null); setNearbyOnly(false); }}>Turn off</button>
                </div>
              )}
              {locError && <p className={styles.locError}>{locError}</p>}
            </div>

            <div className={styles.controls}>
              <input className={styles.search} placeholder="Search by name, job or location..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              <select className={styles.filter} value={filterJob} onChange={(e)=>setFilterJob(e.target.value)}>
                <option value="">All jobs</option>
                {ALL_JOBS.map((j) => <option key={j}>{j}</option>)}
              </select>
            </div>

            <div className={styles.resultsBar}>
              <p className={styles.sectionTitle}>Available Workers</p>
              <span className={styles.count}>{filtered.length} found</span>
            </div>

            {filtered.length > 0
              ? <div className={styles.grid}>{filtered.map((w) => <WorkerCard key={w.id} worker={w} distance={w._distance !== null ? `${w._distance.toFixed(1)}km` : null} />)}</div>
              : <div className={styles.empty}><p>No workers match your search.</p><span>Try adjusting your filters.</span></div>
            }
          </>
        )}

        {tab === "deals" && (
          <div className={styles.dealsList}>
            {activeDeals.length === 0 ? (
              <div className={styles.empty}><p>No active deals yet.</p><span>When a worker accepts your proposal, your deal will appear here.</span></div>
            ) : (
              activeDeals.map((p) => (
                <div key={p.id} className={styles.dealCard}>
                  <div className={styles.dealTop}>
                    <div className={styles.dealWorker}>
                      <div className={styles.dealAvatar}>{p.workerName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className={styles.dealName}>{p.workerName}</div>
                        <div className={styles.dealSub}>Accepted your proposal</div>
                      </div>
                    </div>
                    <span className={styles.activeBadge}>ACTIVE</span>
                  </div>
                  <p className={styles.dealMsg}>{p.message}</p>
                  <div className={styles.dealMeta}>
                    {p.budget && <span>💰 {p.budget}</span>}
                    {p.timeline && <span>🗓 {p.timeline}</span>}
                  </div>
                  <button className={styles.chatBtn} onClick={() => setActiveChat(p)}>💬 Open Chat & Escrow →</button>
                </div>
              ))
            )}
          </div>
        )}

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
                      <div className={styles.dealAvatar}>{p.workerName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}</div>
                      <div>
                        <div className={styles.dealName}>{p.workerName}</div>
                        <div className={styles.dealSub}>{p.archiveReason || "Deal completed"}</div>
                      </div>
                    </div>
                    <span className={styles.archivedBadge}>ARCHIVED</span>
                  </div>
                  <div className={styles.dealMeta}>
                    {p.budget && <span>💰 {p.budget}</span>}
                    {p.timeline && <span>🗓 {p.timeline}</span>}
                    {p.archivedAt && <span>📅 Archived {new Date(p.archivedAt).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>{/* end styles.body */}

      {activeChat && <ChatBox proposal={activeChat} onClose={() => setActiveChat(null)} />}
    </div>
  );
}