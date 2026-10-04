import { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, collection, query, where,
  onSnapshot, updateDoc, addDoc, serverTimestamp, getDocs,
} from "firebase/firestore";
import {
  ref as dbRef, push as dbPush, onValue as dbOnValue, off as dbOff,
} from "firebase/database";
import { auth, db, rtdb } from "../firebase";

const AuthContext = createContext(null);

// "Ongoing" removed — use "Mark as complete" button instead
const TIMELINE_MS = {
  "Less than 1 week": 6  * 24 * 60 * 60 * 1000,
  "1–2 weeks":        13 * 24 * 60 * 60 * 1000,
  "1 month":          30 * 24 * 60 * 60 * 1000,
  "2–3 months":       75 * 24 * 60 * 60 * 1000,
};

const FLAG_PATTERNS = [
  /(\+?\d[\d\s\-().]{7,}\d)/,
  /(@[a-zA-Z0-9_.]{2,})/,
  /(wa\.me|whatsapp|instagram|telegram|snapchat|twitter|tiktok|facebook)/i,
  /\b(dm me|text me|call me|my number|my ig|my whatsapp)\b/i,
];
function isFlagged(text) { return FLAG_PATTERNS.some((p) => p.test(text)); }

// Helper: get lastRead timestamp from localStorage
function getLastRead(uid, proposalId) {
  return parseInt(localStorage.getItem(`hs_lastread_${uid}_${proposalId}`) || "0", 10);
}

// Helper: set lastRead timestamp in localStorage
function setLastRead(uid, proposalId, ts) {
  localStorage.setItem(`hs_lastread_${uid}_${proposalId}`, ts.toString());
}

export const NIGERIAN_HUBS = [
  { name: "Ikeja (Mainland Hub)", label: "Ikeja", lat: 6.5954, lng: 3.3432 },
  { name: "Lekki Phase 1 (Island Hub)", label: "Lekki", lat: 6.4474, lng: 3.4731 },
  { name: "Victoria Island", label: "VI", lat: 6.4281, lng: 3.4219 },
  { name: "Surulere (Central)", label: "Surulere", lat: 6.4969, lng: 3.3592 },
  { name: "Yaba (Tech & Commercial)", label: "Yaba", lat: 6.5095, lng: 3.3711 },
];

const SEED_WORKERS = [
  {
    id: "seed-w1",
    uid: "seed-w1",
    fullName: "Emeka Obi",
    initials: "EO",
    role: "worker",
    category: "Electrician",
    location: "Ikeja, Lagos",
    lat: 6.5954,
    lng: 3.3432,
    area: "Ikeja",
    rate: 6500,
    currency: "NGN",
    available: true,
    verifiedBadge: "NIN & Guild Verified",
    trustTier: 3,
    avgRating: 4.9,
    reviewCount: 38,
    bio: "Certified residential & commercial electrician with 6+ years experience. Specializes in distribution boxes, solar inverter setups, and conduit wiring.",
    skills: ["Electrician", "Solar Inverters", "Conduit Wiring", "Fault Finding"],
  },
  {
    id: "seed-w2",
    uid: "seed-w2",
    fullName: "Amina Yusuf",
    initials: "AY",
    role: "worker",
    category: "Interior Decorator",
    location: "Lekki Phase 1, Lagos",
    lat: 6.4474,
    lng: 3.4731,
    area: "Lekki Phase 1",
    rate: 8500,
    currency: "NGN",
    available: true,
    verifiedBadge: "ID & Guild Cleared",
    trustTier: 3,
    avgRating: 5.0,
    reviewCount: 29,
    bio: "Modern interior designer & space planner. Residential remodels, false ceiling lighting, wallpaper, and custom cabinetry.",
    skills: ["Interior Decorator", "Space Planning", "Lighting Design", "Wall Treatment"],
  },
  {
    id: "seed-w3",
    uid: "seed-w3",
    fullName: "Sunday Eze",
    initials: "SE",
    role: "worker",
    category: "Plumber",
    location: "Surulere, Lagos",
    lat: 6.4969,
    lng: 3.3592,
    area: "Surulere",
    rate: 5000,
    currency: "NGN",
    available: true,
    verifiedBadge: "Phone & ID Verified",
    trustTier: 2,
    avgRating: 4.8,
    reviewCount: 54,
    bio: "Specialist in high-pressure water pumps, borehole piping, drainage clearance, and modern bathroom sanitary fittings.",
    skills: ["Plumber", "Water Pumps", "Pipe Installation", "Drainage"],
  },
  {
    id: "seed-w4",
    uid: "seed-w4",
    fullName: "Blessing Adeyemi",
    initials: "BA",
    role: "worker",
    category: "House Cleaner",
    location: "Yaba, Lagos",
    lat: 6.5095,
    lng: 3.3711,
    area: "Yaba",
    rate: 4000,
    currency: "NGN",
    available: true,
    verifiedBadge: "ID & Background Cleared",
    trustTier: 2,
    avgRating: 4.9,
    reviewCount: 42,
    bio: "Deep cleaning expert for post-construction, move-in/move-out apartments, and weekly fumigation. Brings full industrial equipment.",
    skills: ["House Cleaner", "Deep Cleaning", "Post-Construction", "Fumigation"],
  },
];

export function AuthProvider({ children }) {
  const [user,          setUser]          = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [workers,       setWorkers]       = useState(SEED_WORKERS);
  const [proposals,     setProposals]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  // hasNewMessage: { [proposalId]: boolean }
  const [hasNewMessage, setHasNewMessage] = useState({});

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fu) => {
      if (fu) {
        setUser(fu);
        try {
          const snap = await getDoc(doc(db, "users", fu.uid));
          setProfile(snap.exists() ? { uid: fu.uid, ...snap.data() } : null);
        } catch (e) { console.error(e); setProfile(null); }
      } else {
        // If not in demo mode, clear state
        setUser((prev) => (prev?.uid?.startsWith("demo-") ? prev : null));
        setProfile((prev) => (prev?.uid?.startsWith("demo-") ? prev : null));
        setHasNewMessage({});
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Live workers ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const liveWorkers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const liveKeys = new Set(liveWorkers.map((w) => w.email || w.uid || w.id));
        const nonDuplicateSeeds = SEED_WORKERS.filter(
          (sw) => !liveKeys.has(sw.email) && !liveKeys.has(sw.uid) && !liveKeys.has(sw.id)
        );
        setWorkers([...liveWorkers, ...nonDuplicateSeeds]);
      },
      (err) => {
        // Handle unauthenticated visitor state gracefully
        console.log("Workers listing loaded in visitor mode:", err.code);
        setWorkers(SEED_WORKERS);
      }
    );
    return () => unsub();
  }, []);

  // ── Live proposals ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid || !profile?.role) return;

    if (profile.isDemo) {
      if (profile.role === "worker") {
        setProposals([
          {
            id: "demo-prop-1",
            workerId: "demo-worker-emeka",
            workerName: "Emeka Obi",
            employerId: "demo-employer-tunde",
            employerName: "Tunde Balogun",
            projectTitle: "3-Bedroom Duplex Conduit Wiring & Solar Setup",
            scope: "Full electrical conduit pipe installation and inverter switchboard hookup in Lekki Phase 1.",
            price: 185000,
            currency: "NGN",
            status: "accepted",
            timeline: "2 Weeks",
            acceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            escrowFunded: true,
            createdAt: { seconds: Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000) },
          },
          {
            id: "demo-prop-2",
            workerId: "demo-worker-emeka",
            workerName: "Emeka Obi",
            employerId: "demo-employer-kemi",
            employerName: "Kemi Adeleke",
            projectTitle: "Fault Finding & Distribution Board Upgrade",
            scope: "Replace old fuse box with 63A MCB and diagnose tripping circuit breakers.",
            price: 45000,
            currency: "NGN",
            status: "pending",
            timeline: "3 Days",
            createdAt: { seconds: Math.floor((Date.now() - 1 * 24 * 60 * 60 * 1000) / 1000) },
          }
        ]);
      } else {
        setProposals([
          {
            id: "demo-prop-1",
            workerId: "seed-w1",
            workerName: "Emeka Obi",
            employerId: "demo-employer-tunde",
            employerName: "Tunde Balogun",
            projectTitle: "Commercial Office Backup Power Wiring",
            scope: "Inverter integration, backup line installation and load balancing.",
            price: 120000,
            currency: "NGN",
            status: "accepted",
            timeline: "1 Week",
            acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            escrowFunded: true,
            createdAt: { seconds: Math.floor((Date.now() - 4 * 24 * 60 * 60 * 1000) / 1000) },
          }
        ]);
      }
      return;
    }

    const field = profile.role === "worker" ? "workerId" : "employerId";
    const q = query(collection(db, "proposals"), where(field, "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProposals(docs);
    });
    return () => unsub();
  }, [user?.uid, profile?.role, profile?.isDemo]);

  // ── Global notification listener ──────────────────────────────────────────
  // Key rule: a notification shows if:
  //   1. The OTHER user sent at least one message in this chat
  //   2. The timestamp of the OTHER user's latest message is AFTER
  //      the current user's lastRead timestamp stored in localStorage
  // This means: after re-login, if lastRead >= latest other msg, NO notification shown.
  useEffect(() => {
    if (!user?.uid || !proposals.length) return;

    const accepted = proposals.filter((p) => p.status === "accepted");
    if (!accepted.length) return;

    const unsubscribers = accepted.map((proposal) => {
      const chatPath = dbRef(rtdb, `chats/${proposal.id}/messages`);

      dbOnValue(chatPath, (snap) => {
        const data = snap.val();
        if (!data) return;

        const msgs          = Object.values(data);
        const otherMsgs     = msgs.filter((m) => m.senderId !== user.uid);
        if (!otherMsgs.length) return;

        // Latest message timestamp from the OTHER person
        const latestOtherTs = Math.max(...otherMsgs.map((m) => m.timestamp || 0));

        // When did THIS user last read this chat (persisted across sessions)
        const lastRead      = getLastRead(user.uid, proposal.id);

        // Only show notification if OTHER person's latest msg is newer than last read
        setHasNewMessage((prev) => ({
          ...prev,
          [proposal.id]: latestOtherTs > lastRead,
        }));
      });

      return () => dbOff(chatPath);
    });

    return () => unsubscribers.forEach((u) => u());
  }, [user?.uid, proposals]);

  // Total chats with unseen messages (capped at 1 per chat regardless of message count)
  const totalUnread = Object.values(hasNewMessage).filter(Boolean).length;

  // Call when user opens a chat — persists lastRead to localStorage
  const markChatRead = (proposalId) => {
    if (!user?.uid) return;
    const now = Date.now();
    setLastRead(user.uid, proposalId, now);
    setHasNewMessage((prev) => ({ ...prev, [proposalId]: false }));
  };

  // ── Auto-archive expired deals ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const checkDeals = async () => {
      try {
        const q    = query(collection(db, "proposals"), where("status", "==", "accepted"));
        const snap = await getDocs(q);
        const now  = Date.now();
        for (const d of snap.docs) {
          const p        = d.data();
          if (!p.timeline || !p.acceptedAt) continue;
          const duration = TIMELINE_MS[p.timeline]; // undefined for removed "Ongoing"
          if (!duration) continue;
          const acceptedMs = p.acceptedAt?.seconds
            ? p.acceptedAt.seconds * 1000
            : new Date(p.acceptedAt).getTime();
          const endsAt = acceptedMs + duration;
          if (now >= endsAt) {
            await updateDoc(doc(db, "proposals", d.id), {
              status: "archived", archivedAt: new Date().toISOString(), archiveReason: "Deal timeframe completed",
            });
          } else if (now >= endsAt - 24*60*60*1000 && !p.adminNotified) {
            await addDoc(collection(db, "admin_notifications"), {
              type:"deal_expiring", proposalId:d.id, workerName:p.workerName,
              employerName:p.employerName, timeline:p.timeline,
              endsAt:new Date(endsAt).toISOString(), createdAt:serverTimestamp(), read:false,
            });
            await updateDoc(doc(db, "proposals", d.id), { adminNotified: true });
          }
        }
      } catch (e) { console.error("Deal check error:", e); }
    };
    checkDeals();
    const interval = setInterval(checkDeals, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Signup ────────────────────────────────────────────────────────────────
  const signup = async (formData) => {
    const { email, password, ...rest } = formData;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const initials = ((rest.firstName?.[0]||"") + (rest.lastName?.[0]||"")).toUpperCase() || "U";
    const fullName = [rest.firstName, rest.lastName].filter(Boolean).join(" ");
    const userProfile = { ...rest, uid, email, fullName, initials, createdAt: new Date().toISOString() };
    await setDoc(doc(db, "users", uid), userProfile);
    setUser(cred.user); setProfile(userProfile);
    return userProfile;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password, role) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        await signOut(auth);
        return { success: false, error: "Account not found. Please sign up first." };
      }
      const profileData = { uid: cred.user.uid, ...snap.data() };

      // Wrong role — give a clear, specific error message
      if (profileData.role !== role) {
        await signOut(auth);
        const actualRole   = profileData.role === "employer" ? "Employer" : "Worker";
        const selectedRole = role === "employer" ? "Employer" : "Worker";
        return {
          success: false,
          error: `This email is registered as an ${actualRole} account. Please select "${actualRole}" above to log in, or sign up for a new ${selectedRole} account.`,
        };
      }

      setUser(cred.user); setProfile(profileData);
      return { success: true, role: profileData.role };
    } catch (err) {
      const msgs = {
        "auth/user-not-found":     "No account found with this email.",
        "auth/wrong-password":     "Incorrect password. Please try again.",
        "auth/invalid-email":      "Invalid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests":  "Too many attempts. Please wait a moment and try again.",
      };
      return { success: false, error: msgs[err.code] || "Login failed. Please try again." };
    }
  };

  // ── Demo login ────────────────────────────────────────────────────────────
  const loginAsDemo = (demoRole = "worker") => {
    if (demoRole === "worker") {
      const demoUser = {
        uid: "demo-worker-emeka",
        email: "emeka.demo@hirespace.ng",
        displayName: "Emeka Obi",
      };
      const demoProfile = {
        uid: "demo-worker-emeka",
        email: "emeka.demo@hirespace.ng",
        fullName: "Emeka Obi",
        firstName: "Emeka",
        lastName: "Obi",
        initials: "EO",
        role: "worker",
        category: "Electrician",
        location: "Ikeja, Lagos",
        rate: 6500,
        currency: "NGN",
        available: true,
        verifiedBadge: "NIN & Guild Verified",
        trustTier: 3,
        avgRating: 4.9,
        reviewCount: 38,
        bio: "Certified residential & commercial electrician with 6+ years experience. Specializes in distribution boxes, solar inverter setups, and conduit wiring.",
        skills: ["Electrician", "Solar Inverters", "Conduit Wiring", "Fault Finding"],
        lat: 6.5954,
        lng: 3.3432,
        area: "Ikeja",
        locationEnabled: true,
        isDemo: true,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      return { success: true, role: "worker" };
    } else {
      const demoUser = {
        uid: "demo-employer-tunde",
        email: "tunde.demo@hirespace.ng",
        displayName: "Tunde Balogun",
      };
      const demoProfile = {
        uid: "demo-employer-tunde",
        email: "tunde.demo@hirespace.ng",
        fullName: "Tunde Balogun",
        firstName: "Tunde",
        lastName: "Balogun",
        initials: "TB",
        role: "employer",
        company: "Balogun Construction & Properties Ltd",
        location: "Victoria Island, Lagos",
        lat: 6.4281,
        lng: 3.4219,
        area: "Victoria Island",
        locationEnabled: true,
        isDemo: true,
      };
      setUser(demoUser);
      setProfile(demoProfile);
      return { success: true, role: "employer" };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // Ignored for demo sessions
    }
    setUser(null); setProfile(null); setHasNewMessage({});
  };

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = async (updates) => {
    if (profile?.isDemo) {
      setProfile((prev) => ({ ...prev, ...updates }));
      return;
    }
    if (!user?.uid) return;
    await updateDoc(doc(db, "users", user.uid), updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // ── Proposals ─────────────────────────────────────────────────────────────
  const sendProposal = async (proposal) => {
    if (profile?.isDemo) {
      const newProp = {
        id: `demo-prop-${Date.now()}`,
        ...proposal,
        status: "pending",
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      };
      setProposals((prev) => [newProp, ...prev]);
      return;
    }
    await addDoc(collection(db, "proposals"), { ...proposal, status:"pending", createdAt:serverTimestamp() });
  };
  const respondToProposal = async (proposalId, status) => {
    if (profile?.isDemo) {
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status, ...(status === "accepted" ? { acceptedAt: new Date().toISOString() } : {}) }
            : p
        )
      );
      return;
    }
    const updates = { status };
    if (status === "accepted") updates.acceptedAt = serverTimestamp();
    await updateDoc(doc(db, "proposals", proposalId), updates);
  };
  const getWorkerProposals   = () => proposals.filter((p) => p.workerId   === user?.uid);
  const getEmployerProposals = () => proposals.filter((p) => p.employerId === user?.uid);

  // ── Ratings & Reviews ─────────────────────────────────────────────────────
  const submitReview = async ({ workerId, proposalId, rating, comment, reviewerName }) => {
    // Save review to Firestore
    await addDoc(collection(db, "reviews"), {
      workerId, proposalId, rating, comment,
      reviewerName, createdAt: serverTimestamp(),
    });
    // Update worker's aggregate rating
    const reviewsSnap = await getDocs(query(collection(db, "reviews"), where("workerId", "==", workerId)));
    const reviews     = reviewsSnap.docs.map((d) => d.data());
    const avgRating   = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await updateDoc(doc(db, "users", workerId), {
      avgRating:   Math.round(avgRating * 10) / 10,
      reviewCount: reviews.length,
    });
    // Mark proposal as reviewed
    await updateDoc(doc(db, "proposals", proposalId), { reviewed: true });
  };

  const getWorkerReviews = async (workerId) => {
    const snap = await getDocs(query(collection(db, "reviews"), where("workerId", "==", workerId)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  };

  // ── Escrow ────────────────────────────────────────────────────────────────
  const depositEscrow = async (escrowData) => {
    if (profile?.isDemo) {
      localStorage.setItem(`hs_demo_escrow_${escrowData.proposalId}`, JSON.stringify(escrowData));
      return;
    }
    await setDoc(doc(db, "escrows", escrowData.proposalId), { ...escrowData, updatedAt:serverTimestamp() }, { merge:true });
  };
  const getEscrow = async (proposalId) => {
    if (profile?.isDemo) {
      const stored = localStorage.getItem(`hs_demo_escrow_${proposalId}`);
      if (stored) return JSON.parse(stored);
      return {
        proposalId,
        amount: 185000,
        currency: "NGN",
        status: "held",
        workerName: "Emeka Obi",
        employerName: "Tunde Balogun",
        depositedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        milestonePlan: "3_stage",
        milestones: [
          { id: 1, name: "Stage 1: Mobilization & Materials", pct: 40, amount: 74000, released: true, releasedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
          { id: 2, name: "Stage 2: Conduit Pipe Inspection", pct: 30, amount: 55500, released: false },
          { id: 3, name: "Stage 3: Inverter Hookup & Sign-Off", pct: 30, amount: 55500, released: false },
        ],
        releasedAmount: 74000,
      };
    }
    const snap = await getDoc(doc(db, "escrows", proposalId));
    return snap.exists() ? snap.data() : null;
  };

  // ── Disputes ─────────────────────────────────────────────────────────────
  const raiseDispute = async ({ proposalId, raisedBy, raisedByName, reason, details }) => {
    await addDoc(collection(db, "disputes"), {
      proposalId, raisedBy, raisedByName, reason, details,
      status: "open", createdAt: serverTimestamp(),
    });
    // Notify admin
    await addDoc(collection(db, "admin_notifications"), {
      type: "dispute_raised", proposalId, raisedByName, reason,
      createdAt: serverTimestamp(), read: false,
    });
    // Freeze escrow
    await updateDoc(doc(db, "proposals", proposalId), { disputed: true });
  };

  const getDispute = async (proposalId) => {
    const q    = query(collection(db, "disputes"), where("proposalId", "==", proposalId));
    const snap = await getDocs(q);
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendMessage = async (proposalId, message) => {
    if (isFlagged(message.text)) {
      return { blocked: true, reason: "Message contains contact info (phone numbers or social media handles) which is not allowed on HireSpace." };
    }
    await dbPush(dbRef(rtdb, `chats/${proposalId}/messages`), { ...message, timestamp: Date.now() });
    return { blocked: false };
  };

  const subscribeToMessages = (proposalId, callback) => {
    const chatPath = dbRef(rtdb, `chats/${proposalId}/messages`);
    dbOnValue(chatPath,
      (snap) => {
        const data = snap.val();
        if (!data) { callback([]); return; }
        const msgs = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        msgs.sort((a, b) => (a.timestamp||0) - (b.timestamp||0));
        callback(msgs);
      },
      (e) => { console.error("Chat error:", e); callback([]); }
    );
    return () => dbOff(chatPath);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, workers, proposals, loading,
      totalUnread, hasNewMessage, markChatRead,
      signup, login, loginAsDemo, logout, updateProfile,
      sendProposal, respondToProposal, getWorkerProposals, getEmployerProposals,
      depositEscrow, getEscrow,
      submitReview, getWorkerReviews,
      raiseDispute, getDispute,
      sendMessage, subscribeToMessages,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
