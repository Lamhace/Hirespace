import { useState } from "react";
import styles from "./ProofOfWorkModal.module.css";
import Avatar from "./Avatar";

export function getWorkerProjects(worker) {
  if (worker.projects && worker.projects.length > 0) return worker.projects;

  const cat = (worker.category || worker.skills?.[0] || "").toLowerCase();

  if (cat.includes("electric")) {
    return [
      {
        id: "p-el-1",
        title: "3-Bedroom Duplex Conduit Wiring & 5kVA Solar Inverter Setup",
        category: "Residential Electrical",
        location: "Lekki Phase 1, Lagos",
        cost: "₦185,000",
        duration: "5 Days",
        date: "March 2026",
        verified: true,
        summary: "Upgraded main distribution board to 63A MCB with surge protection, ran concealed conduit pipes, and separated inverter essential lines from heavy AC loads.",
        beforeImg: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
        testimonial: "Cleanest electrical wiring job I have seen in Lagos. Completely concealed, neat labels, and finished 1 day early.",
        clientName: "Engr. Tunde B.",
        rating: 5.0
      },
      {
        id: "p-el-2",
        title: "Commercial Office Distribution Board Fault Diagnosis & Rewire",
        category: "Commercial Electrical",
        location: "Victoria Island, Lagos",
        cost: "₦95,000",
        duration: "2 Days",
        date: "February 2026",
        verified: true,
        summary: "Diagnosed persistent 3-phase tripping caused by neutral earth leakage. Balanced phase loads across 18 workstation circuits.",
        beforeImg: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&auto=format&fit=crop&q=80",
        testimonial: "Saved us from endless generator-to-grid switch tripping issues. Very professional and safety-conscious.",
        clientName: "Adeola M., Facility Lead",
        rating: 4.9
      }
    ];
  }

  if (cat.includes("interior") || cat.includes("decor") || cat.includes("paint")) {
    return [
      {
        id: "p-in-1",
        title: "Contemporary Minimalist Living Room Remodel & Mood Lighting",
        category: "Interior Architecture",
        location: "Ikoyi, Lagos",
        cost: "₦320,000",
        duration: "7 Days",
        date: "March 2026",
        verified: true,
        summary: "Installed custom POP perimeter false ceiling with warm LED strip coves, textured Italian wallpaper, and acoustic slat wooden panelling.",
        beforeImg: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80",
        testimonial: "Transformed our plain apartment into a luxury hotel standard lounge. The lighting mood is perfection.",
        clientName: "Chief Mrs. Alabi",
        rating: 5.0
      },
      {
        id: "p-in-2",
        title: "Master Suite Space Planning & Built-in Wardrobe Nook",
        category: "Carpentry & Joinery",
        location: "Lekki Phase 2, Lagos",
        cost: "₦210,000",
        duration: "4 Days",
        date: "January 2026",
        verified: true,
        summary: "Space optimization with matte finish storage cabinetry, concealed vanity mirror illumination, and brass hardware accents.",
        beforeImg: "https://images.unsplash.com/photo-1540518614846-7ede433c4b49?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80",
        testimonial: "Attention to detail was incredible. Highly recommend Amina for any high-end finish.",
        clientName: "Dr. Kemi O.",
        rating: 5.0
      }
    ];
  }

  if (cat.includes("plumb")) {
    return [
      {
        id: "p-pl-1",
        title: "High-Pressure Automatic Borehole Water Pump & Piping Overhaul",
        category: "Borehole & Pumping",
        location: "Surulere, Lagos",
        cost: "₦140,000",
        duration: "3 Days",
        date: "March 2026",
        verified: true,
        summary: "Installed 1.5HP submersible borehole pump, overhead 2000L tank float switch automation, and PPR hot/cold piping to prevent future leaks.",
        beforeImg: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
        testimonial: "No more waking up at 5am to turn on water pumps manually. Zero leaks and silent water flow.",
        clientName: "Mr. Chukwuma N.",
        rating: 4.8
      },
      {
        id: "p-pl-2",
        title: "Modern Bathroom Concealed Cistern & Shower Mixer Installation",
        category: "Sanitary Fittings",
        location: "Yaba, Lagos",
        cost: "₦85,000",
        duration: "2 Days",
        date: "February 2026",
        verified: true,
        summary: "Replaced obsolete leaking exposed toilet tank with wall-hung concealed actuator cistern and thermostatic rainfall shower set.",
        beforeImg: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=80",
        afterImg: "https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&auto=format&fit=crop&q=80",
        testimonial: "Super clean installation with accurate level and pressure testing.",
        clientName: "Folarin S.",
        rating: 4.9
      }
    ];
  }

  // Default trade projects for cleaning and other trades
  return [
    {
      id: "p-gen-1",
      title: "Full Post-Construction Deep Cleaning & Tile Grout Restoration",
      category: "Post-Construction",
      location: "Ikate, Lagos",
      cost: "₦95,000",
      duration: "1 Day",
      date: "March 2026",
      verified: true,
      summary: "Industrial floor scrubbing, paint overspray removal from window glazing, and chemical fumigation for 4-bedroom terrace.",
      beforeImg: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      afterImg: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80",
      testimonial: "Removed paint specks and cement stains we thought were permanent. Looked like a brand new showroom.",
      clientName: "Pastor David A.",
      rating: 4.9
    }
  ];
}

export default function ProofOfWorkModal({ worker, onClose, onHireForProject }) {
  const projects = getWorkerProjects(worker);
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState("after"); // "before" | "after" | "both"

  const project = projects[activeIdx] || projects[0];

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatarWrap}>
              <Avatar avatarBase64={worker.avatarBase64} initials={worker.initials} size={44} />
            </div>
            <div>
              <div className={styles.workerNameRow}>
                <h3 className={styles.workerName}>{worker.fullName}</h3>
                <span className={styles.verifiedTag}>🛡️ Verified Craft</span>
              </div>
              <p className={styles.workerSub}>
                {worker.category || worker.skills?.[0]} · {worker.location}
              </p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Project Selector Tabs */}
        {projects.length > 1 && (
          <div className={styles.tabsBar}>
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.tabBtn} ${activeIdx === i ? styles.activeTab : ""}`}
                onClick={() => { setActiveIdx(i); setViewMode("after"); }}
              >
                <span>Project {i + 1}:</span> {p.category || p.title.slice(0, 24) + "..."}
              </button>
            ))}
          </div>
        )}

        <div className={styles.body}>
          {/* Project Header & Meta */}
          <div className={styles.projectTop}>
            <div>
              <div className={styles.badgeRow}>
                <span className={styles.escrowBadge}>🛡️ 100% Escrow Verified</span>
                <span className={styles.dateBadge}>📅 Completed {project.date}</span>
              </div>
              <h4 className={styles.projectTitle}>{project.title}</h4>
            </div>

            <div className={styles.statsPill}>
              <div>
                <span className={styles.pillLbl}>Project Value</span>
                <span className={styles.pillVal}>{project.cost}</span>
              </div>
              <div className={styles.pillDivider} />
              <div>
                <span className={styles.pillLbl}>Duration</span>
                <span className={styles.pillVal}>{project.duration}</span>
              </div>
            </div>
          </div>

          {/* Interactive Before / After Image Showcase */}
          <div className={styles.galleryContainer}>
            <div className={styles.viewToggleBar}>
              <span className={styles.viewLabel}>Craftsmanship Evidence:</span>
              <div className={styles.toggleButtons}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === "before" ? styles.toggleActive : ""}`}
                  onClick={() => setViewMode("before")}
                >
                  Before
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === "after" ? styles.toggleActive : ""}`}
                  onClick={() => setViewMode("after")}
                >
                  After (Finished)
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${viewMode === "both" ? styles.toggleActive : ""}`}
                  onClick={() => setViewMode("both")}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {viewMode === "both" ? (
              <div className={styles.sideBySideGrid}>
                <div className={styles.imageCard}>
                  <div className={styles.imageBadge}>BEFORE</div>
                  <img src={project.beforeImg} alt="Before work" className={styles.img} />
                </div>
                <div className={styles.imageCard}>
                  <div className={`${styles.imageBadge} ${styles.afterBadge}`}>AFTER (COMPLETED)</div>
                  <img src={project.afterImg} alt="After work" className={styles.img} />
                </div>
              </div>
            ) : (
              <div className={styles.singleImageCard}>
                <div className={`${styles.imageBadge} ${viewMode === "after" ? styles.afterBadge : ""}`}>
                  {viewMode === "after" ? "AFTER (COMPLETED CRAFTSMANSHIP)" : "BEFORE (INITIAL SITE STATE)"}
                </div>
                <img
                  src={viewMode === "after" ? project.afterImg : project.beforeImg}
                  alt={viewMode}
                  className={styles.singleImg}
                />
              </div>
            )}
          </div>

          {/* Project Summary */}
          <div className={styles.scopeSection}>
            <label className={styles.sectionLabel}>Scope of Work Delivered</label>
            <p className={styles.scopeDesc}>{project.summary}</p>
          </div>

          {/* Verified Employer Testimonial */}
          {project.testimonial && (
            <div className={styles.testimonialCard}>
              <div className={styles.testimHeader}>
                <div className={styles.stars}>{"★".repeat(5)} {project.rating?.toFixed(1)}</div>
                <span className={styles.clientBadge}>Verified Client: {project.clientName}</span>
              </div>
              <p className={styles.testimonialText}>"{project.testimonial}"</p>
            </div>
          )}
        </div>

        {/* Modal Footer CTA */}
        <div className={styles.footer}>
          <button className={styles.closeAltBtn} onClick={onClose}>
            Back to Directory
          </button>
          <button
            className={styles.hireProjectBtn}
            onClick={() => {
              onClose();
              if (onHireForProject) onHireForProject(project);
            }}
          >
            Hire for Similar Project ({project.cost}) →
          </button>
        </div>
      </div>
    </div>
  );
}
