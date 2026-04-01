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
  updateDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import {
  ref, push, onValue, off, serverTimestamp as rtServerTimestamp,
} from "firebase/database";
import { auth, db, rtdb } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null);
  const [profile,   setProfile]   = useState(null);
  const [workers,   setWorkers]   = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (snap.exists()) setProfile(snap.data());
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Live workers list
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "worker"));
    const unsub = onSnapshot(q, (snap) => {
      setWorkers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Live proposals for current user
  useEffect(() => {
    if (!user || !profile) return;
    const field = profile.role === "worker" ? "workerId" : "employerId";
    const q = query(collection(db, "proposals"), where(field, "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProposals(docs);
    });
    return () => unsub();
  }, [user, profile]);

  // Signup
  const signup = async (formData) => {
    const { email, password, ...rest } = formData;
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid  = cred.user.uid;
    const initials = ((rest.firstName?.[0] || "") + (rest.lastName?.[0] || "")).toUpperCase() || "U";
    const fullName = [rest.firstName, rest.lastName].filter(Boolean).join(" ");
    const userProfile = { ...rest, uid, email, fullName, initials, createdAt: new Date().toISOString() };
    await setDoc(doc(db, "users", uid), userProfile);
    setProfile(userProfile);
    return userProfile;
  };

  // Login
  const login = async (email, password, role) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) { await signOut(auth); return { success: false, error: "Account not found." }; }
      const profileData = snap.data();
      if (profileData.role !== role) {
        await signOut(auth);
        return { success: false, error: `This account is registered as a ${profileData.role}, not a ${role}.` };
      }
      setProfile(profileData);
      return { success: true, role: profileData.role };
    } catch (err) {
      const msgs = {
        "auth/user-not-found":     "No account found with this email.",
        "auth/wrong-password":     "Incorrect password.",
        "auth/invalid-email":      "Invalid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      return { success: false, error: msgs[err.code] || "Login failed. Please try again." };
    }
  };

  // Logout
  const logout = async () => { await signOut(auth); setProfile(null); };

  // Proposals
  const sendProposal = async (proposal) => {
    await addDoc(collection(db, "proposals"), { ...proposal, status: "pending", createdAt: serverTimestamp() });
  };

  const respondToProposal = async (proposalId, status) => {
    await updateDoc(doc(db, "proposals", proposalId), { status });
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

  // Realtime Chat
  const sendMessage = (proposalId, message) => {
    push(ref(rtdb, `chats/${proposalId}`), { ...message, timestamp: rtServerTimestamp() });
  };

  const subscribeToMessages = (proposalId, callback) => {
    const chatRef = ref(rtdb, `chats/${proposalId}`);
    onValue(chatRef, (snap) => {
      const data = snap.val();
      if (!data) { callback([]); return; }
      const msgs = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      callback(msgs);
    });
    return () => off(chatRef);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, workers, proposals, loading,
      signup, login, logout,
      sendProposal, respondToProposal, getWorkerProposals, getEmployerProposals,
      depositEscrow, getEscrow,
      sendMessage, subscribeToMessages,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
