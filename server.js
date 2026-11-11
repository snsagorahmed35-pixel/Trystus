const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "store.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

function loadStore() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
  catch { return { users: [], profiles: [], messages: [] }; }
}
let store = loadStore();
function saveStore() { fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2)); }
function id() { return Math.random().toString(36).slice(2, 11); }

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "30kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "trystus.sid",
  secret: process.env.SESSION_SECRET || "change-this-development-secret-before-launch",
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400000 }
}));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 180, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const clean = (v, max=120) => String(v || "").trim().replace(/[<>]/g, "").slice(0, max);
const currentUser = req => store.users.find(u => u.id === req.session.userId);
function requireAuth(req, res, next) {
  if (!currentUser(req)) return res.status(401).json({ error: "প্রথমে লগইন করুন।" });
  next();
}
function safeUser(u) { return { id:u.id, name:u.name, email:u.email, role:u.role }; }

app.get("/api/health", (req,res) => res.json({ ok:true, app:"TrystUS" }));
app.get("/api/me", (req,res) => {
  const u = currentUser(req);
  res.json({ user: u ? safeUser(u) : null });
});

app.post("/api/register", async (req,res) => {
  const name = clean(req.body.name, 50);
  const email = clean(req.body.email, 120).toLowerCase();
  const password = String(req.body.password || "");
  const ageConfirmed = req.body.ageConfirmed === true;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || !ageConfirmed)
    return res.status(400).json({ error:"নাম, সঠিক ইমেইল, অন্তত ১০ অক্ষরের পাসওয়ার্ড এবং ১৮+ নিশ্চিতকরণ দিন।" });
  if (store.users.some(u => u.email === email)) return res.status(409).json({ error:"এই ইমেইলে অ্যাকাউন্ট আছে।" });
  const user = { id:id(), name, email, passwordHash:await bcrypt.hash(password, 12), role:"member", createdAt:new Date().toISOString() };
  store.users.push(user); saveStore(); req.session.userId = user.id;
  res.status(201).json({ user:safeUser(user) });
});

app.post("/api/login", async (req,res) => {
  const email = clean(req.body.email, 120).toLowerCase();
  const user = store.users.find(u => u.email === email);
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash)))
    return res.status(401).json({ error:"ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।" });
  req.session.userId = user.id;
  res.json({ user:safeUser(user) });
});
app.post("/api/logout", (req,res) => req.session.destroy(() => res.json({ ok:true })));

app.get("/api/profiles", (req,res) => {
  const q = clean(req.query.q, 60).toLowerCase();
  const profiles = store.profiles.filter(p => p.status === "approved" &&
    (!q || `${p.displayName} ${p.city} ${p.about}`.toLowerCase().includes(q)))
    .map(({id,displayName,city,about,photoUrl}) => ({id,displayName,city,about,photoUrl}));
  res.json({ profiles });
});

app.post("/api/profiles", requireAuth, (req,res) => {
  const displayName = clean(req.body.displayName, 40);
  const city = clean(req.body.city, 50);
  const about = clean(req.body.about, 400);
  const photoUrl = clean(req.body.photoUrl, 300);
  if (!displayName || !city || about.length < 10) return res.status(400).json({error:"নাম, শহর ও অন্তত ১০ অক্ষরের পরিচিতি দিন।"});
  const profile = { id:id(), userId:req.session.userId, displayName, city, about, photoUrl, status:"pending", createdAt:new Date().toISOString() };
  store.profiles.push(profile); saveStore();
  res.status(201).json({ message:"প্রোফাইলটি যাচাইয়ের জন্য জমা হয়েছে। অনুমোদনের পর দেখা যাবে।" });
});

app.post("/api/messages", requireAuth, (req,res) => {
  const to = clean(req.body.to, 80), body = clean(req.body.body, 1000);
  if (!to || !body) return res.status(400).json({error:"প্রাপক ও বার্তা লিখুন।"});
  const recipient = store.users.find(u => u.id === to);
  if (!recipient || recipient.id === req.session.userId) return res.status(404).json({error:"প্রাপক পাওয়া যায়নি।"});
  store.messages.push({id:id(), from:req.session.userId, to, body, createdAt:new Date().toISOString()});
  saveStore(); res.status(201).json({ok:true});
});
app.get("/api/messages/:userId", requireAuth, (req,res) => {
  const uid = req.session.userId;
  const messages = store.messages.filter(m =>
    (m.from === uid && m.to === req.params.userId) || (m.to === uid && m.from === req.params.userId));
  res.json({messages});
});

function requireAdmin(req,res,next) {
  const u = currentUser(req);
  if (!u || u.role !== "admin") return res.status(403).json({error:"শুধু অ্যাডমিনের জন্য।"});
  next();
}
app.get("/api/admin/pending", requireAdmin, (req,res) =>
  res.json({profiles:store.profiles.filter(p=>p.status==="pending")}));
app.post("/api/admin/profiles/:id/:action", requireAdmin, (req,res) => {
  const p = store.profiles.find(p=>p.id===req.params.id);
  if (!p || !["approve","reject"].includes(req.params.action)) return res.status(404).json({error:"পাওয়া যায়নি।"});
  p.status = req.params.action === "approve" ? "approved" : "rejected"; saveStore(); res.json({ok:true,status:p.status});
});

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || store.users.some(u=>u.email===email)) return;
  store.users.push({id:id(),name:"Admin",email,passwordHash:await bcrypt.hash(password,12),role:"admin",createdAt:new Date().toISOString()});
  saveStore();
}
ensureAdmin().then(() => app.listen(PORT, () => console.log(`TrystUS running on ${PORT}`)));
