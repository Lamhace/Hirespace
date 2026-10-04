import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Landing.module.css";

const LOCAL_JOBS = ["Plumber","Electrician","House Cleaner","Interior Decorator","Mechanic","Laundry","Gas Filler","Carpenter","Painter","Driver"];

export default function Landing() {
  const navigate = useNavigate();
  const { user, profile, loginAsDemo } = useAuth();
  const [calcAmount, setCalcAmount] = useState(85000);

  const m1 = Math.round(calcAmount * 0.4);
  const m2 = Math.round(calcAmount * 0.3);
  const m3 = Math.max(0, calcAmount - m1 - m2);
  const fee = Math.round(calcAmount * 0.05);
  const workerGets = calcAmount - fee;

  // Block homepage if already logged in
  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === "worker" ? "/worker" : "/employer", { replace: true });
    }
  }, [user, profile, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.grid} />
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <div className={styles.logo}>HireSpace</div>
          <div className={styles.navRight}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { loginAsDemo("employer"); navigate("/employer"); }}
              style={{ color: "#38bdf8", border: "1px solid rgba(56,189,248,0.3)" }}
            >
              ⚡ Instant Demo
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Log in</Button>
            <Button variant="primary" size="sm" onClick={() => navigate("/signup")}>Sign up</Button>
          </div>
        </nav>

        <div className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.dot} />
            Local workers, ready to hire
          </div>
          <h1 className={styles.title}>
            Find trusted local<br />
            <span>workers near you.</span>
          </h1>
          <p className={styles.sub}>
            HireSpace connects you with skilled local workers — plumbers, electricians, cleaners and more.
            Post a job, hire safely, pay securely through escrow.
          </p>
          <div className={styles.cta}>
            <Button variant="primary" size="lg" onClick={() => navigate("/signup?role=worker")}>Join as Worker</Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/signup?role=employer")}>Hire Someone</Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => { loginAsDemo("employer"); navigate("/employer"); }}
              style={{
                border: "1px dashed rgba(56,189,248,0.5)",
                color: "#38bdf8",
                background: "rgba(56,189,248,0.06)"
              }}
            >
              ⚡ Explore Demo →
            </Button>
          </div>
          <div className={styles.skillCloud}>
            {LOCAL_JOBS.map((s) => <span key={s} className={styles.cloudTag}>{s}</span>)}
          </div>
        </div>

        <div className={styles.roleSection}>
          <p className={styles.rolesLabel}>Choose your path</p>
          <div className={styles.roleCards}>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=worker")}>
              <div className={styles.roleIcon}>👷</div>
              <div className={styles.roleTitle}>I'm a Worker</div>
              <div className={styles.roleDesc}>Build your profile, showcase your skills, and connect with people who need your services.</div>
              <div className={styles.roleAction}>Get started →</div>
            </div>
            <div className={styles.roleCard} onClick={() => navigate("/signup?role=employer")}>
              <div className={styles.roleIcon}>🏠</div>
              <div className={styles.roleTitle}>I need help</div>
              <div className={styles.roleDesc}>Browse skilled local workers, send proposals, and pay safely through HireSpace escrow.</div>
              <div className={styles.roleAction}>Find help →</div>
            </div>
          </div>
        </div>

        {/* ESCROW & MILESTONE CALCULATOR SECTION */}
        <div className={styles.escrowSection}>
          <div className={styles.escrowSecHeader}>
            <div className={styles.escrowSecBadge}>🛡️ 100% FRAUD & ABANDONMENT PROTECTION</div>
            <h2 className={styles.escrowSecTitle}>
              Hire with complete peace of mind.<br />
              <span>Nigerian Escrow & Milestone Calculator.</span>
            </h2>
            <p className={styles.escrowSecSub}>
              Never pay 100% upfront to an artisan again. HireSpace locks funds securely in escrow and
              only releases payments as each milestone is verified and signed off by you.
            </p>
          </div>

          <div className={styles.calculatorCard}>
            <div className={styles.calcControls}>
              <div className={styles.calcInputHeader}>
                <label>Enter project budget (₦):</label>
                <div className={styles.presetGroup}>
                  {[35000, 85000, 200000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.presetBtn} ${calcAmount === preset ? styles.presetActive : ""}`}
                      onClick={() => setCalcAmount(preset)}
                    >
                      ₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.calcInputRow}>
                <span className={styles.calcCurrency}>₦</span>
                <input
                  type="number"
                  min="5000"
                  step="5000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value) || 0))}
                  className={styles.calcInput}
                />
              </div>

              <input
                type="range"
                min="10000"
                max="1000000"
                step="5000"
                value={calcAmount}
                onChange={(e) => setCalcAmount(Number(e.target.value))}
                className={styles.calcSlider}
              />
            </div>

            <div className={styles.calcResultsGrid}>
              <div className={styles.calcResultCol}>
                <div className={styles.calcStat}>
                  <span className={styles.calcStatLbl}>Total Escrow Held</span>
                  <span className={styles.calcStatVal} style={{ color: "var(--cyan)" }}>
                    ₦{calcAmount.toLocaleString()}
                  </span>
                </div>
                <div className={styles.calcStat}>
                  <span className={styles.calcStatLbl}>Artisan Net Payout</span>
                  <span className={styles.calcStatVal}>
                    ₦{workerGets.toLocaleString()}
                  </span>
                </div>
                <div className={styles.calcStat}>
                  <span className={styles.calcStatLbl}>HireSpace Guarantee (5%)</span>
                  <span className={styles.calcStatVal} style={{ color: "#94a3b8" }}>
                    ₦{fee.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={styles.calcMilestonesCol}>
                <div className={styles.milestoneHeading}>Verified 3-Stage Milestone Plan:</div>
                <div className={styles.timelineList}>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineNum}>1</div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>
                        <span>Mobilization & Materials</span>
                        <span className={styles.timelineAmt}>₦{m1.toLocaleString()} (40%)</span>
                      </div>
                      <p className={styles.timelineDesc}>Released to kick off work and purchase certified materials.</p>
                    </div>
                  </div>

                  <div className={styles.timelineItem}>
                    <div className={styles.timelineNum}>2</div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>
                        <span>Mid-Point Quality Check</span>
                        <span className={styles.timelineAmt}>₦{m2.toLocaleString()} (30%)</span>
                      </div>
                      <p className={styles.timelineDesc}>Released only after on-site or photo inspection proves 50% completion.</p>
                    </div>
                  </div>

                  <div className={styles.timelineItem}>
                    <div className={styles.timelineNum}>3</div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineTitle}>
                        <span>Final Sign-Off & Handover</span>
                        <span className={styles.timelineAmt}>₦{m3.toLocaleString()} (30%)</span>
                      </div>
                      <p className={styles.timelineDesc}>Released after testing, cleanup, and employer 100% satisfaction.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.calcFooter}>
              <div className={styles.calcFooterNotice}>
                🛡️ If a worker abandons the job or disputes occur, funds remain frozen in escrow until resolved.
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => { loginAsDemo("employer"); navigate("/employer"); }}
              >
                ⚡ Test in Instant Demo →
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.statsBar}>
          {[["12k+","Workers"],["3.4k+","Clients"],["98%","Satisfaction"],["24h","Avg. hire time"]].map(([n,l]) => (
            <div key={l} className={styles.stat}>
              <div className={styles.statNum}>{n}</div>
              <div className={styles.statLbl}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
