import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Auth.module.css";

const ALL_SKILLS = [
  "React","TypeScript","Tailwind","Node.js","Python","UI/UX",
  "Figma","WordPress","Copywriting","SEO","Video Editing",
  "Graphic Design","Next.js","Vue","Flutter","DevOps",
];

export default function Signup() {
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") || "worker");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    location: "", bio: "", rate: "", portfolio: "", company: "", industry: "",
  });

  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const r = params.get("role");
    if (r) setRole(r);
  }, [params]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const getInitials = (f, l) => ((f?.[0] || "") + (l?.[0] || "")).toUpperCase() || "U";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (role === "worker" && selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }

    const fullName = [form.firstName, form.lastName].filter(Boolean).join(" ");
    const initials = getInitials(form.firstName, form.lastName);

    signup({
      role,
      firstName: form.firstName,
      lastName: form.lastName,
      fullName,
      initials,
      email: form.email,
      location: form.location || "Nigeria",
      bio: form.bio || "A passionate professional ready to work.",
      rate: form.rate || "20",
      portfolio: form.portfolio || "",
      skills: selectedSkills,
      company: form.company || "",
      industry: form.industry || "",
    });

    navigate(role === "worker" ? "/worker" : "/employer");
  };

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.top}>
          <Link to="/" className={styles.logo}>HireSpace</Link>
          <Link to="/" className={styles.back}>← Back</Link>
        </div>

        <div className={styles.roleToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${role === "worker" ? styles.active : ""}`}
            onClick={() => setRole("worker")}
          >
            👷 Worker
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${role === "employer" ? styles.active : ""}`}
            onClick={() => setRole("employer")}
          >
            🏢 Employer
          </button>
        </div>

        <h2 className={styles.title}>
          {role === "worker" ? "Create your worker account" : "Create your employer account"}
        </h2>
        <p className={styles.sub}>
          {role === "worker"
            ? "Build your profile and start getting hired."
            : "Find the right talent for your next project."}
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div>
              <label>First name *</label>
              <input placeholder="Oladimeji" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div>
              <label>Last name</label>
              <input placeholder="Ojo" value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>

          <div>
            <label>Email *</label>
            <input type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} />
          </div>

          <div>
            <label>Password *</label>
            <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
          </div>

          {role === "worker" && (
            <>
              <div>
                <label>Location</label>
                <input placeholder="Lagos, Nigeria" value={form.location} onChange={set("location")} />
              </div>
              <div>
                <label>Bio</label>
                <textarea placeholder="Tell employers about yourself..." value={form.bio} onChange={set("bio")} />
              </div>
              <div>
                <label>Hourly rate (USD)</label>
                <input placeholder="e.g. 25" value={form.rate} onChange={set("rate")} />
              </div>
              <div>
                <label>Skills * (select all that apply)</label>
                <div className={styles.skillsWrap}>
                  {ALL_SKILLS.map((s) => (
                    <span
                      key={s}
                      className={`${styles.skillTag} ${selectedSkills.includes(s) ? styles.selected : ""}`}
                      onClick={() => toggleSkill(s)}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label>Portfolio link</label>
                <input placeholder="https://yourportfolio.com" value={form.portfolio} onChange={set("portfolio")} />
              </div>
            </>
          )}

          {role === "employer" && (
            <>
              <div>
                <label>Company name</label>
                <input placeholder="Acme Corp" value={form.company} onChange={set("company")} />
              </div>
              <div>
                <label>Industry</label>
                <select value={form.industry} onChange={set("industry")}>
                  <option value="">Select industry...</option>
                  {["Technology","Design","Marketing","Finance","Healthcare","Education","Other"].map(i => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth>
            Create Account →
          </Button>

          <p className={styles.switch}>
            Already have an account?{" "}
            <Link to="/login" className={styles.switchLink}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
