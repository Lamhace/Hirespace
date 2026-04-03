import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, collection,
  query, where, onSnapshot,
  updateDoc, addDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import {
  ref as dbRef, push as dbPush, onValue as dbOnValue, off as dbOff,
} from "firebase/database";
import { auth, db, rtdb } from "../firebase";

const AuthContext = createContext(null);

// Timeline durations in milliseconds
const TIMELINE_MS = {
  "Less than 1 week": 6 * 24 * 60 * 60 * 1000,
  "1–2 weeks":        13 * 24 * 60 * 60 * 1000,
  "1 month":          30 * 24 * 60 * 60 * 1000,
  "2–3 months":       75 * 24 * 60 * 60 * 1000,
  "Ongoing":          null,
};

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [workers,   setWorkers]   = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        setUser(fu);
        try {
          const snap = await getDoc(doc(db, "users", fu.uid));
          setProfile(snap.exists() ? { uid: fu.uid, ...snap.data() } : null);
        } catch (e) { console.error(e); setProfile(null); }
      } else { setUser(null); setProfile(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Live workers
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    const unsub = onSnapshot(q, (snap) => {
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Live proposals
  useEffect(() => {
    if (!user?.uid || !profile?.role) return;
    const field = profile.role === "worker" ? "workerId" : "employerId";
    const q = query(collection(db, "proposals"), where(field, "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProposals(docs);
    });
    return () => unsub();
  }, [user?.uid, profile?.role]);

  // Auto-archive expired deals + notify admin
  useEffect(() => {
    const checkDeals = async () => {
      try {
        const q = query(collection(db, "proposals"), where("status", "==", "accepted"));
        const snap = await getDocs(q);
        const now = Date.now();

        for (const d of snap.docs) {
          const p = d.data();
          if (!p.timeline || !p.acceptedAt) continue;
          const duration = TIMELINE_MS[p.timeline];
          if (!duration) continue;

          const acceptedMs = p.acceptedAt?.seconds
            ? p.acceptedAt.seconds * 1000
            : new Date(p.acceptedAt).getTime();
          const endsAt   = acceptedMs + duration;
          const oneDayMs = 24 * 60 * 60 * 1000;

          // Archive if expired
          if (now >= endsAt) {
            await updateDoc(doc(db, "proposals", d.id), {
              status: "archived",
              archivedAt: new Date().toISOString(),
              archiveReason: "Deal timeframe completed",
            });
          }
          // Notify admin 1 day before expiry
          else if (now >= endsAt - oneDayMs && !p.adminNotified) {
            await addDoc(collection(db, "admin_notifications"), {
              type: "deal_expiring",
              proposalId: d.id,
              workerName: p.workerName,
              employerName: p.employerName,
              timeline: p.timeline,
              endsAt: new Date(endsAt).toISOString(),
              createdAt: serverTimestamp(),
              read: false,
            });
            await updateDoc(doc(db, "proposals", d.id), { adminNotified: true });
          }
        }
      } catch (e) { console.error("Deal check error:", e); }
    };

    // Run on mount and every hour
    checkDeals();
    const interval = setInterval(checkDeals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Signup
  const signup = async (formData) => {
    const { email, password, ...rest } = formData;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const initials = ((rest.firstName?.[0]||"") + (rest.lastName?.[0]||"")).toUpperCase() || "U";
    const fullName = [rest.firstName, rest.lastName].filter(Boolean).join(" ");
    const userProfile = { ...rest, uid, email, fullName, initials, createdAt: new Date().toISOString() };
    await setDoc(doc(db, "users", uid), userProfile);
    setUser(cred.user);
    setProfile(userProfile);
    return userProfile;
  };

  // Login
  const login = async (email, password, role) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) { await signOut(auth); return { success: false, error: "Account not found." }; }
      const profileData = { uid: cred.user.uid, ...snap.data() };
      if (profileData.role !== role) {
        await signOut(auth);
        return { success: false, error: `This account is a ${profileData.role} account. Please select the correct role.` };
      }
      setUser(cred.user); setProfile(profileData);
      return { success: true, role: profileData.role };
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-email": "Invalid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Please try again later.",
      };
      return { success: false, error: msgs[err.code] || "Login failed. Please try again." };
    }
  };

  const logout = async () => { await signOut(auth); setUser(null); setProfile(null); };

  // Update profile (for image upload)
  const updateProfile = async (updates) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // Proposals
  const sendProposal = async (proposal) => {
    await addDoc(collection(db, "proposals"), { ...proposal, status: "pending", createdAt: serverTimestamp() });
  };

  const respondToProposal = async (proposalId, status) => {
    const updates = { status };
    if (status === "accepted") updates.acceptedAt = serverTimestamp();
    await updateDoc(doc(db, "proposals", proposalId), updates);
  };

  const getWorkerProposals   = () => proposals.filter((p) => p.workerId   === user?.uid);
  const getEmployerProposals = () => proposals.filter((p) => p.employerId === user?.uid);

  // Escrow
  const depositEscrow = async (escrowData) => {
    await setDoc(doc(db, "escrows", escrowData.proposalId), { ...escrowData, updatedAt: serverTimestamp() }, { merge: true });
  };
  const getEscrow = async (proposalId) => {
    const snap = await getDoc(doc(db, "escrows", proposalId));
    return snap.exists() ? snap.data() : null;
  };

  // Realtime Chat — block flagged messages server-side
  const FLAG_PATTERNS = [
    /(\+?\d[\d\s\-().]{7,}\d)/,
    /(@[a-zA-Z0-9_.]{2,})/,
    /(wa\.me|whatsapp|instagram|telegram|snapchat|twitter|tiktok|facebook)/i,
    /\b(dm me|text me|call me|my number|my ig|my whatsapp)\b/i,
  ];

  const isFlagged = (text) => FLAG_PATTERNS.some((p) => p.test(text));

  const sendMessage = async (proposalId, message) => {
    // Block delivery if flagged — don't push to Firebase at all
    if (isFlagged(message.text)) {
      return { blocked: true, reason: "Message contains contact info which is not allowed on HireSpace." };
    }
    const chatPath = dbRef(rtdb, `chats/${proposalId}/messages`);
    await dbPush(chatPath, { ...message, timestamp: Date.now() });
    return { blocked: false };
  };

  const subscribeToMessages = (proposalId, callback) => {
    const chatPath = dbRef(rtdb, `chats/${proposalId}/messages`);
    dbOnValue(chatPath, (snap) => {
      const data = snap.val();
      if (!data) { callback([]); return; }
      const msgs = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      callback(msgs);
    }, (e) => { console.error("Chat error:", e); callback([]); });
    return () => dbOff(chatPath);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, workers, proposals, loading,
      signup, login, logout, updateProfile,
      sendProposal, respondToProposal, getWorkerProposals, getEmployerProposals,
      depositEscrow, getEscrow,
      sendMessage, subscribeToMessages,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
