import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import styles from "./Auth.module.css";

const ALL_SKILLS = [
  "Plumber","Electrician","House Cleaner","Interior Decorator",
  "Mechanic","Laundry","Gas Filler","Carpenter","Painter",
  "Welder","Tiler","Mason","Generator Repair","AC Repair",
  "Security Guard","Driver","Gardener","Chef / Cook",
];

const CURRENCIES = [
  { code:"NGN", symbol:"₦", label:"Nigerian Naira (₦)" },
  { code:"USD", symbol:"$", label:"US Dollar ($)" },
  { code:"GBP", symbol:"£", label:"British Pounds (£)" },
];

export default function Signup() {
  const [params]  = useSearchParams();
  const [role,    setRole]    = useState(params.get("role") || "worker");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [currency,  setCurrency]  = useState("NGN");
  const [showPass,  setShowPass]  = useState(false);
  const [error,     setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", password:"",
    location:"", bio:"", rate:"", portfolio:"", company:"", industry:"",
  });

  const { signup, user, profile } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === "worker" ? "/worker" : "/employer", { replace: true });
    }
  }, [user, profile, navigate]);

  useEffect(() => { const r = params.get("role"); if (r) setRole(r); }, [params]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleSkill = (skill) =>
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.email || !form.password) {
      setError("Please fill in all required fields."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (role === "worker" && selectedSkills.length === 0) {
      setError("Please select at least one job category."); return;
    }

    setIsLoading(true);
    try {
      const newProfile = await signup({
        role,
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        location:  form.location  || "Nigeria",
        bio:       form.bio       || "A passionate professional ready to work.",
        rate:      form.rate      || "0",
        currency,
        portfolio: form.portfolio || "",
        skills:    selectedSkills,
        company:   form.company   || "",
        industry:  form.industry  || "",
      });
      // Navigate immediately using the returned profile role
      navigate(newProfile.role === "worker" ? "/worker" : "/employer", { replace: true });
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email":        "Invalid email address.",
        "auth/weak-password":        "Password must be at least 6 characters.",
      };
      setError(msgs[err.code] || err.message || "Signup failed. Please try again.");
      setIsLoading(false);
    }
  };

  const currSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₦";

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.top}>
          <Link to="/" className={styles.logo}>HireSpace</Link>
          <Link to="/" className={styles.back}>← Back</Link>
        </div>

        <div className={styles.roleToggle}>
          <button type="button" className={`${styles.toggleBtn} ${role==="worker"?styles.active:""}`} onClick={() => setRole("worker")}>👷 Worker</button>
          <button type="button" className={`${styles.toggleBtn} ${role==="employer"?styles.active:""}`} onClick={() => setRole("employer")}>🏢 Employer</button>
        </div>

        <h2 className={styles.title}>{role==="worker" ? "Create your worker account" : "Create your employer account"}</h2>
        <p className={styles.sub}>{role==="worker" ? "Build your profile and start getting hired." : "Find the right talent for your next project."}</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div><label>First name *</label><input placeholder="Oladimeji" value={form.firstName} onChange={set("firstName")} /></div>
            <div><label>Last name</label><input placeholder="Ojo" value={form.lastName} onChange={set("lastName")} /></div>
          </div>

          <div><label>Email *</label><input type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} /></div>

          <div className={styles.passwordWrap}>
            <label>Password *</label>
            <div className={styles.passwordField}>
              <input type={showPass?"text":"password"} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {role === "worker" && (
            <>
              <div><label>Location</label><input placeholder="Lagos, Nigeria" value={form.location} onChange={set("location")} /></div>
              <div><label>Bio</label><textarea placeholder="Tell employers about yourself..." value={form.bio} onChange={set("bio")} /></div>
              <div>
                <label>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <div><label>Rate per hour ({currSymbol})</label><input placeholder={`e.g. ${currency==="NGN"?"5000":"25"}`} value={form.rate} onChange={set("rate")} /></div>
              <div>
                <label>Job category * (select all that apply)</label>
                <div className={styles.skillsWrap}>
                  {ALL_SKILLS.map((s) => (
                    <span key={s} className={`${styles.skillTag} ${selectedSkills.includes(s)?styles.selected:""}`} onClick={() => toggleSkill(s)}>{s}</span>
                  ))}
                </div>
              </div>
              <div><label>Portfolio / Social link</label><input placeholder="https://yourportfolio.com" value={form.portfolio} onChange={set("portfolio")} /></div>
            </>
          )}

          {role === "employer" && (
            <>
              <div><label>Company / Name</label><input placeholder="Acme Corp" value={form.company} onChange={set("company")} /></div>
              <div>
                <label>Industry</label>
                <select value={form.industry} onChange={set("industry")}>
                  <option value="">Select industry...</option>
                  {["Home Services","Construction","Technology","Design","Marketing","Finance","Healthcare","Education","Other"].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </>
          )}

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account →"}
          </Button>

          <p className={styles.switch}>Already have an account? <Link to="/login" className={styles.switchLink}>Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
