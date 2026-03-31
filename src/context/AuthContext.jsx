import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const load = (key, fallback) => {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
  catch { return fallback; }
};

const DEFAULT_WORKERS = [
  { id: 1, firstName: "Amaka",  lastName: "Kalu",   fullName: "Amaka Kalu",   initials: "AK", location: "Abuja, Nigeria",         bio: "Creative UI/UX designer with 4 years of experience crafting beautiful digital products.",       rate: "35", portfolio: "https://amakakalu.design", skills: ["UI/UX","Figma","React"],             email: "amaka@email.com",  role: "worker" },
  { id: 2, firstName: "Tunde",  lastName: "Badmus", fullName: "Tunde Badmus", initials: "TB", location: "Lagos, Nigeria",          bio: "Full-stack developer specialising in scalable backend systems and clean APIs.",                  rate: "45", portfolio: "https://tundecodes.dev",    skills: ["Node.js","Python","TypeScript"],      email: "tunde@email.com",  role: "worker" },
  { id: 3, firstName: "Chisom", lastName: "Eze",    fullName: "Chisom Eze",   initials: "CE", location: "Port Harcourt, Nigeria",  bio: "SEO strategist and content writer helping brands rank higher and convert better.",               rate: "20", portfolio: "",                           skills: ["SEO","Copywriting"],                  email: "chisom@email.com", role: "worker" },
];

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => load("hs_user",      null));
  const [workers,   setWorkers]   = useState(() => load("hs_workers",   DEFAULT_WORKERS));
  const [proposals, setProposals] = useState(() => load("hs_proposals", []));
  const [messages,  setMessages]  = useState(() => load("hs_messages",  []));
  const [escrows,   setEscrows]   = useState(() => load("hs_escrows",   []));
  const [readLog,   setReadLog]   = useState(() => load("hs_readlog",   {}));

  // ── Persist to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    if (user) localStorage.setItem("hs_user", JSON.stringify(user));
    else localStorage.removeItem("hs_user");
  }, [user]);

  useEffect(() => { localStorage.setItem("hs_workers",   JSON.stringify(workers));   }, [workers]);
  useEffect(() => { localStorage.setItem("hs_proposals", JSON.stringify(proposals)); }, [proposals]);
  useEffect(() => { localStorage.setItem("hs_messages",  JSON.stringify(messages));  }, [messages]);
  useEffect(() => { localStorage.setItem("hs_escrows",   JSON.stringify(escrows));   }, [escrows]);
  useEffect(() => { localStorage.setItem("hs_readlog",   JSON.stringify(readLog));   }, [readLog]);

  // ── Cross-tab sync via storage event ─────────────────────────────────────
  // When another tab writes to localStorage (e.g. worker sends a message),
  // this fires in the employer's tab and pulls in the latest data instantly.
  const syncFromStorage = useCallback((e) => {
    if (!e.key) return;
    const map = {
      hs_messages:  setMessages,
      hs_proposals: setProposals,
      hs_escrows:   setEscrows,
      hs_workers:   setWorkers,
      hs_readlog:   setReadLog,
    };
    if (map[e.key] && e.newValue) {
      try { map[e.key](JSON.parse(e.newValue)); } catch {}
    }
  }, []);

  useEffect(() => {
    window.addEventListener("storage", syncFromStorage);
    return () => window.removeEventListener("storage", syncFromStorage);
  }, [syncFromStorage]);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const signup = (formData) => {
    const newUser = { ...formData, id: Date.now(), createdAt: new Date().toISOString() };
    setUser(newUser);
    if (formData.role === "worker") setWorkers((prev) => [...prev, newUser]);
    return newUser;
  };

  const login = (email, role) => {
    if (role === "worker") {
      const found = workers.find((w) => w.email === email);
      if (found) { setUser(found); return { success: true }; }
      return { success: false, error: "No worker account found with that email." };
    }
    const emp = { id: Date.now(), role: "employer", firstName: "Demo", lastName: "Employer", fullName: "Demo Employer", initials: "DE", email, company: "Demo Corp" };
    setUser(emp);
    return { success: true };
  };

  const logout = () => setUser(null);

  // ── Proposals ────────────────────────────────────────────────────────────
  const sendProposal       = (p)  => setProposals((prev) => [p, ...prev]);
  const respondToProposal  = (id, status) => setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
  const getWorkerProposals  = (wId) => proposals.filter((p) => p.workerId   === wId);
  const getEmployerProposals = (eId) => proposals.filter((p) => p.employerId === eId);

  // ── Messages ─────────────────────────────────────────────────────────────
  const sendMessage  = (msg) => setMessages((prev) => [...prev, msg]);
  const getMessages  = (proposalId) => messages.filter((m) => m.proposalId === proposalId);

  // Unread count: messages in a proposal chat NOT sent by the current user
  // that arrived after the last time this user marked the chat as read.
  const getUnreadCount = (proposalId) => {
    if (!user) return 0;
    const lastRead = readLog[`${user.id}_${proposalId}`] || 0;
    return messages.filter(
      (m) => m.proposalId === proposalId &&
             m.senderId !== user.id &&
             new Date(m.timestamp).getTime() > lastRead
    ).length;
  };

  // Call this when a user opens the chat panel for a proposal
  const markAsRead = (proposalId) => {
    if (!user) return;
    setReadLog((prev) => ({
      ...prev,
      [`${user.id}_${proposalId}`]: Date.now(),
    }));
  };

  // Total unread across ALL of the current user's accepted chats
  const totalUnread = () => {
    if (!user) return 0;
    const myProposals = user.role === "worker"
      ? proposals.filter((p) => p.workerId   === user.id && p.status === "accepted")
      : proposals.filter((p) => p.employerId === user.id && p.status === "accepted");
    return myProposals.reduce((sum, p) => sum + getUnreadCount(p.id), 0);
  };

  // ── Escrow ───────────────────────────────────────────────────────────────
  const depositEscrow = (escrow) =>
    setEscrows((prev) => {
      const idx = prev.findIndex((e) => e.proposalId === escrow.proposalId);
      if (idx >= 0) { const u = [...prev]; u[idx] = escrow; return u; }
      return [...prev, escrow];
    });

  const getEscrow = (proposalId) => escrows.find((e) => e.proposalId === proposalId) || null;

  return (
    <AuthContext.Provider value={{
      user, workers, proposals, messages, escrows,
      signup, login, logout,
      sendProposal, respondToProposal, getWorkerProposals, getEmployerProposals,
      sendMessage, getMessages, getUnreadCount, markAsRead, totalUnread,
      depositEscrow, getEscrow,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
