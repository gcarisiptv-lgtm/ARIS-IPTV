const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.static(path.join(__dirname)));

const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || "ARIS-ADMIN-2026";

let users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    active: true
  }
];

let activationCodes = [
  {
    id: 1,
    code: "ARIS-2026",
    active: true,
    deviceId: null,
    deviceName: null,
    platform: null,
    createdAt: new Date().toISOString(),
    activatedAt: null
  }
];

let devices = [];

function adminAuth(req, res, next) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token admin manquant"
    });
  }

  const token = authorization.substring(7).trim();

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      message: "Token admin invalide"
    });
  }

  next();
}

function generateCode() {
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part3 = crypto.randomBytes(2).toString("hex").toUpperCase();

  return "ARIS-" + part1 + "-" + part2 + "-" + part3;
}

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ARIS IPTV</title>
<style>
body {
  margin: 0;
  background: #07111f;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}
.box {
  max-width: 800px;
  margin: 100px auto;
  padding: 40px;
}
h1 {
  font-size: 42px;
}
p {
  color: #b9c3d0;
  font-size: 18px;
}
</style>
</head>
<body>
<div class="box">
<h1>🦁 ARIS IPTV</h1>
<p>Serveur ARIS IPTV opérationnel</p>
<p>API : ONLINE</p>
</div>
</body>
</html>
  `);
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    message: "ARIS IPTV API fonctionne correctement",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    status: "online",
    timestamp: new Date().toISOString()
  });
});

/* =========================
   LOGIN
========================= */

app.post("/api/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const user = users.find(
    item =>
      item.username === username &&
      item.password === password &&
      item.active === true
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Identifiants incorrects"
    });
  }

  const token = crypto.randomBytes(24).toString("hex");

  res.json({
    success: true,
    message: "Connexion réussie",
    token: token,
    user: {
      id: user.id,
      username: user.username,
      active: user.active
    }
  });
});

/* =========================
   ADMIN OVERVIEW
========================= */

app.get("/api/admin/overview", adminAuth, (req, res) => {
  const activeUsers = users.filter(
    user => user.active
  ).length;

  const activeCodes = activationCodes.filter(
    code => code.active
  ).length;

  const activeDevices = devices.filter(
    device => device.active
  ).length;

  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",

    statistics: {
      users: users.length,
      activeUsers: activeUsers,
      activationCodes: activationCodes.length,
      activeCodes: activeCodes,
      devices: devices.length,
      activeDevices: activeDevices
    },

    users: users.map(user => ({
      id: user.id,
      username: user.username,
      active: user.active
    })),

    codes: activationCodes,

    devices: devices,

    timestamp: new Date().toISOString()
  });
});

/* =========================
   ADMIN TEST
========================= */

app.get("/api/admin/test", adminAuth, (req, res) => {
  res.json({
    success: true,
    message: "Authentification admin réussie",
    service: "ARIS IPTV"
  });
});

/* =========================
   UTILISATEURS
========================= */

app.get("/api/users", adminAuth, (req, res) => {
  res.json({
    success: true,
    users: users.map(user => ({
      id: user.id,
      username: user.username,
      active: user.active
    }))
  });
});

app.post("/api/users", adminAuth, (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const existing = users.find(
    user => user.username.toLowerCase() === username.toLowerCase()
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Utilisateur déjà existant"
    });
  }

  const newUser = {
    id: users.length
      ? Math.max(...users.map(user => user.id)) + 1
      : 1,
    username: username,
    password: password,
    active: true
  };

  users.push(newUser);

  res.json({
    success: true,
    message: "Utilisateur créé avec succès",
    user: {
      id: newUser.id,
      username: newUser.username,
      active: newUser.active
    }
  });
});

app.post("/api/users/activate", adminAuth, (req, res) => {
  const id = Number(req.body.id);

  const user = users.find(item => item.id === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable"
    });
  }

  user.active = true;

  res.json({
    success: true,
    message: "Utilisateur activé",
    user: {
      id: user.id,
      username: user.username,
      active: user.active
    }
  });
});

app.post("/api/users/deactivate", adminAuth, (req, res) => {
  const id = Number(req.body.id);

  if (id === 1) {
    return res.status(403).json({
      success: false,
      message: "Le compte principal ne peut pas être désactivé"
    });
  }

  const user = users.find(item => item.id === id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable"
    });
  }

  user.active = false;

  res.json({
    success: true,
    message: "Utilisateur désactivé",
    user: {
      id: user.id,
      username: user.username,
      active: user.active
    }
  });
});

app.delete("/api/users/:id", adminAuth, (req, res) => {
  const id = Number(req.params.id);

  if (id === 1) {
    return res.status(403).json({
      success: false,
      message: "Le compte principal ne peut pas être supprimé"
    });
  }

  const index = users.findIndex(
    user => user.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable"
    });
  }

  const deleted = users[index];

  users.splice(index, 1);

  res.json({
    success: true,
    message: "Utilisateur supprimé",
    user: {
      id: deleted.id,
      username: deleted.username
    }
  });
});

/* =========================
   CODES
========================= */

/* Voir tous les codes */

app.get("/api/codes", adminAuth, (req, res) => {
  res.json({
    success: true,
    codes: activationCodes
  });
});

/* Créer un code */

app.post("/api/codes", adminAuth, (req, res) => {
  let code = String(req.body.code || "").trim();

  if (!code) {
    code = generateCode();
  }

  code = code.toUpperCase();

  const existing = activationCodes.find(
    item => item.code === code
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Ce code existe déjà"
    });
  }

  const newCode = {
    id: activationCodes.length
      ? Math.max(...activationCodes.map(item => item.id)) + 1
      : 1,

    code: code,
    active: true,
    deviceId: null,
    deviceName: null,
    platform: null,
    createdAt: new Date().toISOString(),
    activatedAt: null
  };

  activationCodes.push(newCode);

  res.json({
    success: true,
    message: "Code créé avec succès",
    code: newCode
  });
});

/* Générer automatiquement un code */

app.post("/api/codes/generate", adminAuth, (req, res) => {
  let code;

  do {
    code = generateCode();
  } while (
    activationCodes.some(
      item => item.code === code
    )
  );

  const newCode = {
    id: activationCodes.length
      ? Math.max(...activationCodes.map(item => item.id)) + 1
      : 1,

    code: code,
    active: true,
    deviceId: null,
    deviceName: null,
    platform: null,
    createdAt: new Date().toISOString(),
    activatedAt: null
  };

  activationCodes.push(newCode);

  res.json({
    success: true,
    message: "Nouveau code généré",
    code: newCode
  });
});

/* Activer un code */

app.post("/api/codes/activate", adminAuth, (req, res) => {
  const id = Number(req.body.id);

  const item = activationCodes.find(
    code => code.id === id
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Code introuvable"
    });
  }

  item.active = true;

  res.json({
    success: true,
    message: "Code activé",
    code: item
  });
});

/* Désactiver un code */

app.post("/api/codes/deactivate", adminAuth, (req, res) => {
  const id = Number(req.body.id);

  const item = activationCodes.find(
    code => code.id === id
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Code introuvable"
    });
  }

  item.active = false;

  res.json({
    success: true,
    message: "Code désactivé",
    code: item
  });
});

/* Supprimer un code */

app.delete("/api/codes/:id", adminAuth, (req, res) => {
  const id = Number(req.params.id);

  const index = activationCodes.findIndex(
    code => code.id === id
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Code introuvable"
    });
  }

  const deleted = activationCodes[index];

  activationCodes.splice(index, 1);

  if (deleted.deviceId) {
    devices = devices.filter(
      device =>
        device.deviceId !== deleted.deviceId
    );
  }

  res.json({
    success: true,
    message: "Code supprimé",
    code: deleted
  });
});

/* Voir un code précis */

app.get("/api/codes/:id", adminAuth, (req, res) => {
  const id = Number(req.params.id);

  const item = activationCodes.find(
    code => code.id === id
  );

  if (!item) {
    return res.status(404).json({
      success: false,
      message: "Code introuvable"
    });
  }

  res.json({
    success: true,
    code: item
  });
});

/* =========================
   ACTIVATION APPAREIL
========================= */

app.post("/api/activate", (req, res) => {
  const codeValue = String(
    req.body.code || ""
  ).trim().toUpperCase();

  const deviceId = String(
    req.body.deviceId || ""
  ).trim();

  const deviceName = String(
    req.body.deviceName || "Appareil Android"
  ).trim();

  const platform = String(
    req.body.platform || "Android"
  ).trim();

  if (!codeValue) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation obligatoire"
    });
  }

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Identifiant appareil obligatoire"
    });
  }

  const item = activationCodes.find(
    code => code.code === codeValue
  );

  if (!item) {
    return res.status(401).json({
      success: false,
      message: "Code d'activation invalide"
    });
  }

  if (!item.active) {
    return res.status(403).json({
      success: false,
      message: "Ce code est désactivé"
    });
  }

  if (
    item.deviceId &&
    item.deviceId !== deviceId
  ) {
    return res.status(403).json({
      success: false,
      message: "Ce code est déjà associé à un autre appareil"
    });
  }

  item.deviceId = deviceId;
  item.deviceName = deviceName;
  item.platform = platform;

  if (!item.activatedAt) {
    item.activatedAt =
      new Date().toISOString();
  }

  const existingDevice = devices.find(
    device =>
      device.deviceId === deviceId
  );

  if (existingDevice) {
    existingDevice.active = true;
    existingDevice.code = codeValue;
    existingDevice.deviceName = deviceName;
    existingDevice.platform = platform;
  } else {
    devices.push({
      id: devices.length
        ? Math.max(...devices.map(item => item.id)) + 1
        : 1,

      deviceId: deviceId,
      code: codeValue,
      deviceName: deviceName,
      platform: platform,
      active: true,
      activatedAt: item.activatedAt
    });
  }

  res.json({
    success: true,
    message: "Appareil activé avec succès",
    code: item.code,
    deviceId: item.deviceId,
    deviceName: item.deviceName,
    platform: item.platform
  });
});

/* =========================
   CHECK CODE
========================= */

app.post("/api/check-code", (req, res) => {
  const codeValue = String(
    req.body.code || ""
  ).trim().toUpperCase();

  const item = activationCodes.find(
    code =>
      code.code === codeValue &&
      code.active === true
  );

  if (!item) {
    return res.json({
      success: false,
      valid: false,
      message: "Code invalide ou désactivé"
    });
  }

  res.json({
    success: true,
    valid: true,
    message: "Code valide",
    code: item.code,
    deviceAssociated: !!item.deviceId
  });
});

/* =========================
   APPAREILS
========================= */

app.get("/api/devices", adminAuth, (req, res) => {
  res.json({
    success: true,
    devices: devices
  });
});

app.post(
  "/api/devices/deactivate",
  adminAuth,
  (req, res) => {
    const deviceId = String(
      req.body.deviceId || ""
    ).trim();

    const device = devices.find(
      item =>
        item.deviceId === deviceId
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    device.active = false;

    const code = activationCodes.find(
      item =>
        item.code === device.code
    );

    if (code) {
      code.deviceId = null;
      code.deviceName = null;
      code.platform = null;
    }

    res.json({
      success: true,
      message: "Appareil désactivé",
      device: device
    });
  }
);

/* =========================
   PAGE ADMIN
========================= */

app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>ARIS IPTV - Administration</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #050c16;
  color: white;
  font-family: Arial, sans-serif;
}

header {
  background: #0a1b2d;
  padding: 30px;
  text-align: center;
  border-bottom: 1px solid #178ee5;
}

header h1 {
  margin: 0;
  font-size: 36px;
}

header p {
  color: #55b9ff;
}

.container {
  max-width: 1200px;
  margin: auto;
  padding: 30px 20px;
}

.card {
  background: #0d2035;
  border: 1px solid #178ee5;
  border-radius: 16px;
  padding: 25px;
  margin-bottom: 25px;
}

h2 {
  color: #ffffff;
  margin-top: 0;
}

input {
  width: 100%;
  padding: 15px;
  margin: 7px 0;
  border-radius: 8px;
  border: 1px solid #178ee5;
  background: #071522;
  color: white;
  font-size: 16px;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 12px 18px;
  margin: 5px;
  cursor: pointer;
  font-weight: bold;
}

.create {
  background: #169be8;
  color: white;
}

.activate {
  background: #159447;
  color: white;
}

.deactivate {
  background: #e09b13;
  color: white;
}

.delete {
  background: #d63737;
  color: white;
}

.refresh {
  background: #34495e;
  color: white;
}

.generate {
  background: #8e44ad;
  color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th,
td {
  border-bottom: 1px solid #24415a;
  padding: 15px 10px;
  text-align: left;
}

th {
  color: #55b9ff;
}

.badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: bold;
}

.active {
  background: #115d38;
  color: #45f09a;
}

.inactive {
  background: #632727;
  color: #ff7777;
}

.device {
  color: #c7d6e8;
}

.small {
  color: #91a6ba;
  font-size: 13px;
}

.message {
  padding: 12px;
  margin-bottom: 15px;
  border-radius: 8px;
  background: #102b43;
  color: #70c7ff;
}

@media(max-width: 800px) {

table {
  font-size: 13px;
}

button {
  width: 100%;
  margin: 4px 0;
}

}

</style>

</head>

<body>

<header>

<h1>🦁 ARIS IPTV</h1>

<p>Administration</p>

</header>

<div class="container">

<div class="card">

<h2>🔐 Connexion administrateur</h2>

<input
id="adminToken"
type="password"
placeholder="Token administrateur"
/>

<button
class="create"
onclick="saveToken()">

🔐 ENREGISTRER LE TOKEN

</button>

</div>

<div id="message"></div>

<div class="card">

<h2>🔑 Créer un code d'activation</h2>

<input
id="newCode"
placeholder="Exemple : ARIS-CLIENT-001"
/>

<button
class="create"
onclick="createCode()">

➕ CRÉER LE CODE

</button>

<button
class="generate"
onclick="generateCode()">

🎲 GÉNÉRER AUTOMATIQUEMENT

</button>

</div>

<div class="card">

<h2>🔑 Gestion des codes</h2>

<button
class="refresh"
onclick="loadCodes()">

🔄 ACTUALISER LA LISTE

</button>

<table>

<thead>

<tr>

<th>ID</th>

<th>Code</th>

<th>État</th>

<th>Appareil associé</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="codesTable">

</tbody>

</table>

</div>

<div class="card">

<h2>📱 Appareils</h2>

<button
class="refresh"
onclick="loadDevices()">

🔄 ACTUALISER LES APPAREILS

</button>

<table>

<thead>

<tr>

<th>ID</th>

<th>Appareil</th>

<th>Plateforme</th>

<th>Code</th>

<th>État</th>

</tr>

</thead>

<tbody id="devicesTable">

</tbody>

</table>

</div>

</div>

<script>

function token() {

  return localStorage.getItem("aris_admin_token") || "";

}

function saveToken() {

  const value =
    document.getElementById("adminToken").value.trim();

  if (!value) {

    showMessage("Entrez le token administrateur.");

    return;

  }

  localStorage.setItem(
    "aris_admin_token",
    value
  );

  showMessage("Token enregistré.");

  loadCodes();
  loadDevices();

}

function showMessage(text) {

  document.getElementById("message").innerHTML =
    '<div class="message">' +
    text +
    '</div>';

}

async function api(url, options = {}) {

  options.headers = {

    "Content-Type": "application/json",

    "Authorization":
      "Bearer " + token(),

    ...(options.headers || {})

  };

  const response =
    await fetch(url, options);

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.message || "Erreur serveur"
    );

  }

  return data;

}

async function createCode() {

  const input =
    document.getElementById("newCode");

  const code =
    input.value.trim();

  try {

    const data =
      await api("/api/codes", {

        method: "POST",

        body: JSON.stringify({
          code: code
        })

      });

    showMessage(
      "✅ Code créé : " +
      data.code.code
    );

    input.value = "";

    loadCodes();

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function generateCode() {

  try {

    const data =
      await api("/api/codes/generate", {

        method: "POST"

      });

    showMessage(
      "✅ Nouveau code : " +
      data.code.code
    );

    loadCodes();

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function activateCode(id) {

  try {

    await api(
      "/api/codes/activate",
      {

        method: "POST",

        body: JSON.stringify({
          id: id
        })

      }
    );

    showMessage("🟢 Code activé.");

    loadCodes();

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function deactivateCode(id) {

  try {

    await api(
      "/api/codes/deactivate",
      {

        method: "POST",

        body: JSON.stringify({
          id: id
        })

      }
    );

    showMessage("🔴 Code désactivé.");

    loadCodes();

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function deleteCode(id) {

  if (
    !confirm(
      "Supprimer définitivement ce code ?"
    )
  ) {

    return;

  }

  try {

    await api(
      "/api/codes/" + id,
      {

        method: "DELETE"

      }
    );

    showMessage("🗑️ Code supprimé.");

    loadCodes();

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function loadCodes() {

  try {

    const data =
      await api("/api/codes");

    const table =
      document.getElementById(
        "codesTable"
      );

    table.innerHTML = "";

    data.codes.forEach(code => {

      const state =
        code.active
          ? '<span class="badge active">🟢 ACTIF</span>'
          : '<span class="badge inactive">🔴 DÉSACTIVÉ</span>';

      let device = "Non utilisé";

      if (code.deviceId) {

        device =
          "<strong>" +
          (code.deviceName || "Appareil") +
          "</strong><br>" +
          '<span class="small">' +
          "ID : " +
          code.deviceId +
          "</span><br>" +
          '<span class="small">' +
          (code.platform || "") +
          "</span>";

      }

      let actions = "";

      if (code.active) {

        actions +=
          '<button class="deactivate" ' +
          'onclick="deactivateCode(' +
          code.id +
          ')">' +
          "🔴 Désactiver" +
          "</button>";

      } else {

        actions +=
          '<button class="activate" ' +
          'onclick="activateCode(' +
          code.id +
          ')">' +
          "🟢 Activer" +
          "</button>";

      }

      actions +=
        '<button class="delete" ' +
        'onclick="deleteCode(' +
        code.id +
        ')">' +
        "🗑️ Supprimer" +
        "</button>";

      table.innerHTML +=

        "<tr>" +

        "<td>" +
        code.id +
        "</td>" +

        "<td><strong>" +
        code.code +
        "</strong></td>" +

        "<td>" +
        state +
        "</td>" +

        '<td class="device">' +
        device +
        "</td>" +

        "<td>" +
        actions +
        "</td>" +

        "</tr>";

    });

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

async function loadDevices() {

  try {

    const data =
      await api("/api/devices");

    const table =
      document.getElementById(
        "devicesTable"
      );

    table.innerHTML = "";

    data.devices.forEach(device => {

      const state =
        device.active
          ? '<span class="badge active">🟢 ACTIF</span>'
          : '<span class="badge inactive">🔴 INACTIF</span>';

      table.innerHTML +=

        "<tr>" +

        "<td>" +
        device.id +
        "</td>" +

        "<td>" +
        (device.deviceName || "Appareil") +
        "<br>" +
        '<span class="small">' +
        device.deviceId +
        "</span>" +
        "</td>" +

        "<td>" +
        (device.platform || "") +
        "</td>" +

        "<td>" +
        device.code +
        "</td>" +

        "<td>" +
        state +
        "</td>" +

        "</tr>";

    });

  } catch(error) {

    showMessage(
      "❌ " + error.message
    );

  }

}

window.onload = function() {

  const saved =
    localStorage.getItem(
      "aris_admin_token"
    );

  if (saved) {

    document.getElementById(
      "adminToken"
    ).value = saved;

  }

};

</script>

</body>

</html>
  `);
});

/* =========================
   ERREURS
========================= */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur"
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    path: req.originalUrl
  });
});

/* =========================
   SERVEUR
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "ARIS IPTV API listening on port " +
      PORT
    );
  }
);
