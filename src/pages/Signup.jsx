import { useState, useEffect, useRef } from "react";
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
  const [avatarBase64, setAvatarBase64] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", password:"",
    location:"", bio:"", rate:"", portfolio:"", company:"", industry:"",
  });

  const { signup, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) navigate(profile.role === "worker" ? "/worker" : "/employer", { replace: true });
  }, [user, profile, navigate]);

  useEffect(() => { const r = params.get("role"); if (r) setRole(r); }, [params]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleSkill = (skill) =>
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarBase64(ev.target.result);
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.firstName || !form.email || !form.password) { setError("Please fill in all required fields."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (role === "worker" && selectedSkills.length === 0) { setError("Please select at least one job category."); return; }

    setIsLoading(true);
    try {
      const newProfile = await signup({
        role, firstName: form.firstName, lastName: form.lastName,
        email: form.email, password: form.password,
        location: form.location || "Nigeria",
        bio: form.bio || "A passionate professional ready to work.",
        rate: form.rate || "0", currency,
        portfolio: form.portfolio || "",
        skills: selectedSkills,
        company: form.company || "", industry: form.industry || "",
        avatarBase64: avatarBase64 || "",
      });
      navigate(newProfile.role === "worker" ? "/worker" : "/employer", { replace: true });
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
      };
      setError(msgs[err.code] || err.message || "Signup failed. Please try again.");
      setIsLoading(false);
    }
  };

  const currSymbol = CURRENCIES.find(c => c.code === currency)?.symbol || "₦";
  const initials = ((form.firstName?.[0]||"") + (form.lastName?.[0]||"")).toUpperCase() || "?";

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

          {/* AVATAR UPLOAD */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview} onClick={() => fileInputRef.current?.click()}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" className={styles.avatarImg} />
                : <span className={styles.avatarInitials}>{initials}</span>
              }
              <div className={styles.avatarOverlay}>📷</div>
            </div>
            <div className={styles.avatarInfo}>
              <p className={styles.avatarLabel}>Profile photo</p>
              <p className={styles.avatarHint}>Optional · Max 2MB</p>
              <button type="button" className={styles.avatarBtn} onClick={() => fileInputRef.current?.click()}>
                {avatarPreview ? "Change photo" : "Upload photo"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleImageChange} />
          </div>

          <div className={styles.row}>
            <div><label>First name *</label><input placeholder="Oladimeji" value={form.firstName} onChange={set("firstName")} /></div>
            <div><label>Last name</label><input placeholder="Ojo" value={form.lastName} onChange={set("lastName")} /></div>
          </div>

          <div><label>Email *</label><input type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} /></div>

          <div className={styles.passwordWrap}>
            <label>Password *</label>
            <div className={styles.passwordField}>
              <input type={showPass?"text":"password"} placeholder="Min. 6 characters" value={form.password} onChange={set("password")} />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>{showPass?"🙈":"👁️"}</button>
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
