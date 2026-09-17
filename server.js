const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");

const app = express();
const db = new Database(process.env.DB_FILE || "aris_iptv.db");
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";

app.use(cors());
app.use(express.json());

// ARIS IPTV database
// Username + password are used for customer login.
db.exec(`
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT
);
CREATE TABLE IF NOT EXISTS activation_codes(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  expires_at TEXT,
  used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS devices(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  platform TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(user_id,device_id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS dns_servers(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  active INTEGER NOT NULL DEFAULT 1
);
`);

// Demo accounts. Change these before production use.
try {
  const admin = db.prepare("SELECT id FROM users WHERE username=?").get("admin");
  if (!admin) {
    db.prepare("INSERT INTO users(username,password,role,expires_at) VALUES(?,?,?,?)")
      .run("admin", bcrypt.hashSync("ChangeMe123!", 10), "admin", "2099-12-31");
  }

  const demo = db.prepare("SELECT id FROM users WHERE username=?").get("demo");
  if (!demo) {
    db.prepare("INSERT INTO users(username,password,role,expires_at) VALUES(?,?,?,?)")
      .run("demo", bcrypt.hashSync("Demo123!", 10), "user", "2099-12-31");
  }

  const code = db.prepare("SELECT id FROM activation_codes WHERE code=?").get("ARIS-DEMO-2026");
  if (!code) {
    db.prepare("INSERT INTO activation_codes(code,expires_at) VALUES(?,?)")
      .run("ARIS-DEMO-2026", "2099-12-31");
  }

  if (!db.prepare("SELECT id FROM dns_servers LIMIT 1").get()) {
    db.prepare("INSERT INTO dns_servers(name,base_url,priority) VALUES(?,?,?)")
      .run("DNS 1", "https://example-authorized-server.invalid", 1);
  }
} catch (e) {
  console.error("Database initialization error:", e);
}

function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "unauthorized" });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "admin_only" });
  }
  next();
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "ARIS IPTV" });
});

// LOGIN: username + password
app.post("/api/login", (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "username_and_password_required" });
  }

  const user = db.prepare(
    "SELECT * FROM users WHERE username=? AND active=1"
  ).get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      expiresAt: user.expires_at
    }
  });
});

app.post("/api/activate", auth, (req, res) => {
  const code = String(req.body?.code || "").trim();
  const deviceId = String(req.body?.deviceId || "").trim();
  const deviceName = String(req.body?.deviceName || "Android TV");
  const platform = String(req.body?.platform || "Android TV");

  if (!code) return res.status(400).json({ error: "code_required" });

  const activation = db.prepare(
    "SELECT * FROM activation_codes WHERE code=? AND used=0"
  ).get(code);

  if (!activation) {
    return res.status(400).json({ error: "invalid_or_used_code" });
  }

  db.prepare("UPDATE activation_codes SET used=1 WHERE id=?").run(activation.id);
  db.prepare("UPDATE users SET expires_at=? WHERE id=?")
    .run(activation.expires_at, req.user.id);

  if (deviceId) {
    db.prepare(
      "INSERT OR IGNORE INTO devices(user_id,device_id,device_name,platform,created_at) VALUES(?,?,?,?,?)"
    ).run(req.user.id, deviceId, deviceName, platform, new Date().toISOString());
  }

  res.json({ ok: true, expiresAt: activation.expires_at });
});

app.get("/api/dns", auth, (req, res) => {
  const servers = db.prepare(
    "SELECT id,name,base_url,priority,active FROM dns_servers WHERE active=1 ORDER BY priority"
  ).all();
  res.json({ servers });
});

app.post("/api/devices/register", auth, (req, res) => {
  const deviceId = String(req.body?.deviceId || "").trim();
  const deviceName = String(req.body?.deviceName || "Android TV");
  const platform = String(req.body?.platform || "Android TV");

  if (!deviceId) return res.status(400).json({ error: "device_id_required" });

  const count = db.prepare(
    "SELECT COUNT(*) AS n FROM devices WHERE user_id=?"
  ).get(req.user.id).n;
  const exists = db.prepare(
    "SELECT id FROM devices WHERE user_id=? AND device_id=?"
  ).get(req.user.id, deviceId);

  if (!exists && count >= 5) {
    return res.status(409).json({ error: "device_limit_reached", limit: 5 });
  }

  db.prepare(
    "INSERT OR IGNORE INTO devices(user_id,device_id,device_name,platform,created_at) VALUES(?,?,?,?,?)"
  ).run(req.user.id, deviceId, deviceName, platform, new Date().toISOString());

  res.json({ ok: true });
});

app.get("/api/devices", auth, (req, res) => {
  const devices = db.prepare(
    "SELECT id,device_id,device_name,platform,created_at FROM devices WHERE user_id=? ORDER BY id DESC"
  ).all(req.user.id);
  res.json({ devices });
});

app.get("/api/admin/overview", auth, adminOnly, (req, res) => {
  res.json({
    service: "ARIS IPTV",
    users: db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='user'").get().n,
    devices: db.prepare("SELECT COUNT(*) AS n FROM devices").get().n,
    codes: db.prepare("SELECT COUNT(*) AS n FROM activation_codes WHERE used=0").get().n,
    dns: db.prepare("SELECT COUNT(*) AS n FROM dns_servers WHERE active=1").get().n
  });
});

app.get("/api/admin/users", auth, adminOnly, (req, res) => {
  const users = db.prepare(
    "SELECT id,username,role,active,expires_at FROM users ORDER BY id DESC"
  ).all();
  res.json({ users });
});

app.get("/api/admin/dns", auth, adminOnly, (req, res) => {
  res.json({
    servers: db.prepare("SELECT * FROM dns_servers ORDER BY priority").all()
  });
});

app.post("/api/admin/dns", auth, adminOnly, (req, res) => {
  const name = String(req.body?.name || "").trim();
  const baseUrl = String(req.body?.baseUrl || "").trim();
  const priority = Number(req.body?.priority ?? 100);

  if (!name || !baseUrl) {
    return res.status(400).json({ error: "name_and_base_url_required" });
  }

  const info = db.prepare(
    "INSERT INTO dns_servers(name,base_url,priority) VALUES(?,?,?)"
  ).run(name, baseUrl, Number.isFinite(priority) ? priority : 100);

  res.json({ id: info.lastInsertRowid });
});

app.post("/api/admin/codes", auth, adminOnly, (req, res) => {
  const code = String(req.body?.code || "").trim();
  const expiresAt = String(req.body?.expiresAt || "2099-12-31");

  if (!code) return res.status(400).json({ error: "code_required" });

  try {
    db.prepare("INSERT INTO activation_codes(code,expires_at) VALUES(?,?)")
      .run(code, expiresAt);
    res.json({ ok: true, code, expiresAt });
  } catch (e) {
    res.status(409).json({ error: "code_already_exists" });
  }
});

app.listen(PORT, () => {
  console.log(`ARIS IPTV API listening on port ${PORT}`);
});
