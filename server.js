const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// =====================================
// CONFIGURATION
// =====================================

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


// =====================================
// ADMIN TOKEN
// =====================================

const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || "ARIS-ADMIN-2026";


// =====================================
// UTILISATEURS
// =====================================

const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    active: true
  }
];


// =====================================
// CODES D'ACTIVATION
// =====================================

const activationCodes = [
  {
    code: "ARIS-2026",
    active: true,
    device: null,
    createdAt: new Date().toISOString()
  }
];


// =====================================
// APPAREILS
// =====================================

const devices = [];


// =====================================
// AUTHENTIFICATION ADMIN
// =====================================

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


// =====================================
// PAGE PRINCIPALE
// =====================================

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");

  res.sendFile(indexPath, (err) => {
    if (err) {
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
  max-width: 700px;
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

<h1>ARIS IPTV</h1>

<p>Serveur API opérationnel</p>

<p>ARIS IPTV PRO</p>

</div>

</body>
</html>
      `);
    }
  });
});


// =====================================
// API PRINCIPALE
// =====================================

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    message: "ARIS IPTV API fonctionne correctement",
    status: "online"
  });
});


// =====================================
// HEALTH
// =====================================

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


// =====================================
// STATUS
// =====================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    status: "online",
    timestamp: new Date().toISOString()
  });
});


// =====================================
// ADMIN OVERVIEW
// =====================================

app.get(
  "/api/admin/overview",
  adminAuth,
  (req, res) => {

    const activeUsers =
      users.filter(user => user.active).length;

    const activeCodes =
      activationCodes.filter(code => code.active).length;

    const activeDevices =
      devices.filter(device => device.active).length;

    res.json({
      success: true,

      service: "ARIS IPTV",

      status: "online",

      statistics: {
        users: users.length,
        activeUsers: activeUsers,

        activationCodes:
          activationCodes.length,

        activeCodes: activeCodes,

        devices: devices.length,

        activeDevices: activeDevices
      },

      users: users.map(user => ({
        id: user.id,
        username: user.username,
        active: user.active
      })),

      devices: devices,

      codes: activationCodes.map(code => ({
        code: code.code,
        active: code.active,
        device: code.device
      })),

      timestamp: new Date().toISOString()
    });
  }
);


// =====================================
// TEST ADMIN
// =====================================

app.get(
  "/api/admin/test",
  adminAuth,
  (req, res) => {

    res.json({
      success: true,
      message: "Authentification admin réussie",
      service: "ARIS IPTV"
    });
  }
);


// =====================================
// CONNEXION UTILISATEUR
// =====================================

app.post("/api/login", (req, res) => {

  const {
    username,
    password
  } = req.body;

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

  res.json({
    success: true,
    message: "Connexion réussie",

    user: {
      id: user.id,
      username: user.username
    }
  });
});


// =====================================
// ACTIVATION APPAREIL
// =====================================

app.post("/api/activate", (req, res) => {

  const {
    code,
    deviceId
  } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation obligatoire"
    });
  }

  const activation =
    activationCodes.find(
      item =>
        item.code === code &&
        item.active === true
    );

  if (!activation) {
    return res.status(401).json({
      success: false,
      message: "Code d'activation invalide"
    });
  }

  if (
    activation.device &&
    activation.device !== deviceId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Ce code est déjà utilisé sur un autre appareil"
    });
  }

  if (deviceId) {

    activation.device = deviceId;

    const existingDevice =
      devices.find(
        device =>
          device.deviceId === deviceId
      );

    if (!existingDevice) {

      devices.push({
        deviceId: deviceId,
        code: code,
        active: true,
        activatedAt:
          new Date().toISOString()
      });
    }
  }

  res.json({
    success: true,
    message: "Appareil activé avec succès",
    code: code,
    deviceId: deviceId || null
  });
});


// =====================================
// VÉRIFIER CODE
// =====================================

app.post("/api/check-code", (req, res) => {

  const {
    code
  } = req.body;

  const activation =
    activationCodes.find(
      item =>
        item.code === code &&
        item.active === true
    );

  if (!activation) {

    return res.json({
      success: false,
      valid: false,
      message: "Code invalide"
    });
  }

  res.json({
    success: true,
    valid: true,
    message: "Code valide"
  });
});


// =====================================
// 👤 GESTION DES UTILISATEURS
// =====================================

// VOIR LES UTILISATEURS

app.get(
  "/api/users",
  adminAuth,
  (req, res) => {

    res.json({
      success: true,

      users: users.map(user => ({
        id: user.id,
        username: user.username,
        active: user.active
      }))
    });
  }
);


// CRÉER UN UTILISATEUR

app.post(
  "/api/users",
  adminAuth,
  (req, res) => {

    const {
      username,
      password
    } = req.body;

    if (!username || !password) {

      return res.status(400).json({
        success: false,
        message:
          "Username et password obligatoires"
      });
    }

    const cleanUsername =
      String(username).trim();

    const cleanPassword =
      String(password).trim();

    if (
      cleanUsername.length < 3 ||
      cleanPassword.length < 4
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Username minimum 3 caractères et password minimum 4 caractères"
      });
    }

    const existing =
      users.find(
        user =>
          user.username.toLowerCase() ===
          cleanUsername.toLowerCase()
      );

    if (existing) {

      return res.status(409).json({
        success: false,
        message:
          "Utilisateur déjà existant"
      });
    }

    const newId =
      users.length > 0
        ? Math.max(
            ...users.map(user => user.id)
          ) + 1
        : 1;

    const newUser = {
      id: newId,
      username: cleanUsername,
      password: cleanPassword,
      active: true
    };

    users.push(newUser);

    res.json({
      success: true,
      message:
        "Utilisateur créé avec succès",

      user: {
        id: newUser.id,
        username: newUser.username,
        active: newUser.active
      }
    });
  }
);


// 🟢 ACTIVER / 🔴 DÉSACTIVER

app.post(
  "/api/users/toggle",
  adminAuth,
  (req, res) => {

    const {
      id
    } = req.body;

    const user =
      users.find(
        item =>
          item.id === Number(id)
      );

    if (!user) {

      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable"
      });
    }

    // Protection du compte admin

    if (user.username === "admin") {

      return res.status(403).json({
        success: false,
        message:
          "Le compte admin principal ne peut pas être désactivé"
      });
    }

    user.active =
      !user.active;

    res.json({
      success: true,

      message:
        user.active
          ? "Utilisateur activé"
          : "Utilisateur désactivé",

      user: {
        id: user.id,
        username: user.username,
        active: user.active
      }
    });
  }
);


// 🗑️ SUPPRIMER UN UTILISATEUR

app.delete(
  "/api/users/:id",
  adminAuth,
  (req, res) => {

    const id =
      Number(req.params.id);

    const index =
      users.findIndex(
        user =>
          user.id === id
      );

    if (index === -1) {

      return res.status(404).json({
        success: false,
        message:
          "Utilisateur introuvable"
      });
    }

    if (
      users[index].username ===
      "admin"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Le compte admin principal ne peut pas être supprimé"
      });
    }

    const deletedUser =
      users.splice(index, 1)[0];

    res.json({
      success: true,

      message:
        "Utilisateur supprimé",

      user: {
        id: deletedUser.id,
        username:
          deletedUser.username
      }
    });
  }
);


// =====================================
// 🔑 GESTION DES CODES
// =====================================

app.get(
  "/api/codes",
  adminAuth,
  (req, res) => {

    res.json({
      success: true,
      codes: activationCodes
    });
  }
);


app.post(
  "/api/codes",
  adminAuth,
  (req, res) => {

    const {
      code
    } = req.body;

    if (!code) {

      return res.status(400).json({
        success: false,
        message: "Code obligatoire"
      });
    }

    const existing =
      activationCodes.find(
        item =>
          item.code === code
      );

    if (existing) {

      return res.status(409).json({
        success: false,
        message:
          "Ce code existe déjà"
      });
    }

    activationCodes.push({

      code: code,

      active: true,

      device: null,

      createdAt:
        new Date().toISOString()

    });

    res.json({

      success: true,

      message:
        "Code créé avec succès",

      code: code
    });
  }
);


// =====================================
// 📱 GESTION DES APPAREILS
// =====================================

app.get(
  "/api/devices",
  adminAuth,
  (req, res) => {

    res.json({
      success: true,
      devices: devices
    });
  }
);


app.post(
  "/api/devices/deactivate",
  adminAuth,
  (req, res) => {

    const {
      deviceId
    } = req.body;

    const device =
      devices.find(
        item =>
          item.deviceId === deviceId
      );

    if (!device) {

      return res.status(404).json({
        success: false,
        message:
          "Appareil introuvable"
      });
    }

    device.active = false;

    res.json({
      success: true,
      message:
        "Appareil désactivé"
    });
  }
);


// =====================================
// 🖥️ PANNEAU ADMINISTRATION
// =====================================

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

  background:
    linear-gradient(
      135deg,
      #050b14,
      #081827
    );

  color: white;

  font-family:
    Arial,
    sans-serif;
}


header {

  background:
    rgba(10, 25, 42, 0.95);

  padding: 25px;

  text-align: center;

  border-bottom:
    1px solid #168bd0;
}


header h1 {

  margin: 0;

  font-size: 32px;

}


header p {

  margin-top: 8px;

  color: #8ccfff;

}


.container {

  max-width: 1200px;

  margin: auto;

  padding: 25px;

}


.card {

  background:
    rgba(14, 31, 50, 0.95);

  border:
    1px solid #176da3;

  border-radius: 16px;

  padding: 22px;

  margin-bottom: 25px;

  box-shadow:
    0 10px 30px
    rgba(0,0,0,0.25);

}


.card h2 {

  margin-top: 0;

}


.stats {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(180px, 1fr)
    );

  gap: 15px;

  margin-bottom: 25px;

}


.stat {

  background: #0c1d30;

  border:
    1px solid #176da3;

  border-radius: 14px;

  padding: 20px;

}


.stat-number {

  font-size: 34px;

  font-weight: bold;

  color: #35b7ff;

}


input {

  width: 100%;

  padding: 13px;

  margin:
    6px 0 12px;

  border-radius: 9px;

  border:
    1px solid #267cad;

  background: #071522;

  color: white;

  font-size: 15px;

}


button {

  border: none;

  border-radius: 9px;

  padding: 11px 16px;

  cursor: pointer;

  font-weight: bold;

  margin: 4px;

}


.btn-create {

  background: #168bd0;

  color: white;

}


.btn-refresh {

  background: #374b60;

  color: white;

}


.btn-toggle {

  background: #168bd0;

  color: white;

}


.btn-delete {

  background: #c0392b;

  color: white;

}


button:hover {

  opacity: 0.85;

}


table {

  width: 100%;

  border-collapse: collapse;

  margin-top: 15px;

}


th,
td {

  padding: 14px;

  border-bottom:
    1px solid #20384d;

  text-align: left;

}


th {

  color: #83cfff;

}


.badge {

  display: inline-block;

  padding:
    6px 10px;

  border-radius: 20px;

  font-size: 13px;

  font-weight: bold;

}


.active {

  background: #164f3b;

  color: #48e0a5;

}


.inactive {

  background: #512522;

  color: #ff8c82;

}


.message {

  margin-top: 12px;

  padding: 12px;

  border-radius: 9px;

  display: none;

}


.success {

  background: #123d31;

  color: #55e2a5;

}


.error {

  background: #4a211f;

  color: #ff9d94;

}


@media(max-width:700px) {

  table {

    font-size: 13px;
  }

  th,
  td {

    padding: 9px;
  }

  .actions button {

    display: block;

    width: 100%;
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


<!-- ================================= -->
<!-- STATISTIQUES -->
<!-- ================================= -->

<div class="stats">

<div class="stat">

<div>👤 Utilisateurs</div>

<div
id="totalUsers"
class="stat-number">
0
</div>

</div>


<div class="stat">

<div>🟢 Actifs</div>

<div
id="activeUsers"
class="stat-number">
0
</div>

</div>


<div class="stat">

<div>🔑 Codes</div>

<div
id="totalCodes"
class="stat-number">
0
</div>

</div>


<div class="stat">

<div>📱 Appareils</div>

<div
id="totalDevices"
class="stat-number">
0
</div>

</div>

</div>


<!-- ================================= -->
<!-- CRÉER UTILISATEUR -->
<!-- ================================= -->

<div class="card">

<h2>
➕ Créer un utilisateur
</h2>


<label>
Username
</label>

<input
id="username"
type="text"
placeholder="Exemple : client01"
/>


<label>
Password
</label>

<input
id="password"
type="password"
placeholder="Mot de passe"
/>


<button
class="btn-create"
onclick="createUser()">

➕ CRÉER L'UTILISATEUR

</button>


<div
id="message"
class="message">
</div>

</div>


<!-- ================================= -->
<!-- LISTE UTILISATEURS -->
<!-- ================================= -->

<div class="card">

<h2>
👤 Gestion des utilisateurs
</h2>


<button
class="btn-refresh"
onclick="loadUsers()">

🔄 ACTUALISER LA LISTE

</button>


<div id="usersContainer">

Chargement...

</div>

</div>


<!-- ================================= -->
<!-- CODES -->
<!-- ================================= -->

<div class="card">

<h2>
🔑 Codes d'activation
</h2>

<div id="codesContainer">

Chargement...

</div>

</div>


<!-- ================================= -->
<!-- APPAREILS -->
<!-- ================================= -->

<div class="card">

<h2>
📱 Appareils
</h2>

<div id="devicesContainer">

Chargement...

</div>

</div>


</div>


<script>

let adminToken =
  localStorage.getItem(
    "aris_admin_token"
  );


/* =================================
   TOKEN ADMIN
================================= */

if (!adminToken) {

  adminToken =
    prompt(
      "Token administrateur ARIS IPTV :"
    );

  if (adminToken) {

    localStorage.setItem(
      "aris_admin_token",
      adminToken
    );

  }

}


/* =================================
   API
================================= */

async function api(
  url,
  options = {}
) {

  options.headers =
    Object.assign(
      {},
      options.headers || {},
      {
        "Content-Type":
          "application/json",

        "Authorization":
          "Bearer " +
          adminToken
      }
    );

  const response =
    await fetch(url, options);

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data.message ||
      "Erreur serveur"
    );

  }

  return data;
}


/* =================================
   MESSAGE
================================= */

function showMessage(
  text,
  type = "success"
) {

  const box =
    document.getElementById(
      "message"
    );

  box.textContent = text;

  box.className =
    "message " + type;

  box.style.display =
    "block";

}


/* =================================
   CRÉER UTILISATEUR
================================= */

async function createUser() {

  const username =
    document.getElementById(
      "username"
    ).value.trim();

  const password =
    document.getElementById(
      "password"
    ).value.trim();


  if (!username || !password) {

    showMessage(
      "Username et password obligatoires",
      "error"
    );

    return;
  }


  try {

    const data =
      await api(
        "/api/users",
        {
          method: "POST",

          body:
            JSON.stringify({
              username,
              password
            })
        }
      );


    showMessage(
      "✅ " + data.message,
      "success"
    );


    document.getElementById(
      "username"
    ).value = "";


    document.getElementById(
      "password"
    ).value = "";


    await loadUsers();


  } catch (error) {

    showMessage(
      "❌ " + error.message,
      "error"
    );

  }

}


/* =================================
   CHARGER UTILISATEURS
================================= */

async function loadUsers() {

  const container =
    document.getElementById(
      "usersContainer"
    );


  container.innerHTML =
    "Chargement...";


  try {

    const data =
      await api(
        "/api/users"
      );


    const users =
      data.users || [];


    document.getElementById(
      "totalUsers"
    ).textContent =
      users.length;


    document.getElementById(
      "activeUsers"
    ).textContent =
      users.filter(
        user => user.active
      ).length;


    if (users.length === 0) {

      container.innerHTML =
        "<p>Aucun utilisateur.</p>";

      return;
    }


    let html = `

<table>

<thead>

<tr>

<th>ID</th>

<th>Username</th>

<th>État</th>

<th>Actions</th>

</tr>

</thead>

<tbody>
`;


    users.forEach(
      user => {

        const status =
          user.active
            ? '<span class="badge active">🟢 ACTIF</span>'
            : '<span class="badge inactive">🔴 INACTIF</span>';


        let actions = "";


        if (
          user.username ===
          "admin"
        ) {

          actions =
            "<strong>🔒 Compte principal</strong>";

        } else {

          actions = `

<button
class="btn-toggle"
onclick="toggleUser(${user.id})">

${user.active
  ? "🔴 Désactiver"
  : "🟢 Activer"}

</button>


<button
class="btn-delete"
onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">

🗑️ Supprimer

</button>

`;

        }


        html += `

<tr>

<td>
${user.id}
</td>

<td>
<strong>
${escapeHtml(user.username)}
</strong>
</td>

<td>
${status}
</td>

<td class="actions">
${actions}
</td>

</tr>

`;

      }
    );


    html += `

</tbody>

</table>
`;


    container.innerHTML =
      html;


  } catch (error) {

    container.innerHTML =
      "<p>❌ " +
      escapeHtml(
        error.message
      ) +
      "</p>";

  }

}


/* =================================
   ACTIVER / DÉSACTIVER
================================= */

async function toggleUser(id) {

  try {

    const data =
      await api(
        "/api/users/toggle",
        {
          method: "POST",

          body:
            JSON.stringify({
              id: id
            })
        }
      );


    alert(
      "✅ " +
      data.message
    );


    await loadUsers();


  } catch (error) {

    alert(
      "❌ " +
      error.message
    );

  }

}


/* =================================
   SUPPRIMER
================================= */

async function deleteUser(
  id,
  username
) {

  const confirmation =
    confirm(
      "Supprimer l'utilisateur \"" +
      username +
      "\" ?"
    );


  if (!confirmation) {

    return;
  }


  try {

    const data =
      await api(
        "/api/users/" +
        id,
        {
          method: "DELETE"
        }
      );


    alert(
      "✅ " +
      data.message
    );


    await loadUsers();


  } catch (error) {

    alert(
      "❌ " +
      error.message
    );

  }

}


/* =================================
   CODES
================================= */

async function loadCodes() {

  const container =
    document.getElementById(
      "codesContainer"
    );


  try {

    const data =
      await api(
        "/api/codes"
      );


    const codes =
      data.codes || [];


    document.getElementById(
      "totalCodes"
    ).textContent =
      codes.length;


    if (!codes.length) {

      container.innerHTML =
        "<p>Aucun code.</p>";

      return;

    }


    let html =
      "<table><tr><th>Code</th><th>État</th><th>Appareil</th></tr>";


    codes.forEach(
      code => {

        html += `

<tr>

<td>
<strong>
${escapeHtml(code.code)}
</strong>
</td>

<td>

${
  code.active
    ? '<span class="badge active">🟢 ACTIF</span>'
    : '<span class="badge inactive">🔴 INACTIF</span>'
}

</td>

<td>
${escapeHtml(
  code.device || "Non utilisé"
)}
</td>

</tr>

`;

      }
    );


    html +=
      "</table>";


    container.innerHTML =
      html;


  } catch (error) {

    container.innerHTML =
      "<p>❌ " +
      escapeHtml(
        error.message
      ) +
      "</p>";

  }

}


/* =================================
   APPAREILS
================================= */

async function loadDevices() {

  const container =
    document.getElementById(
      "devicesContainer"
    );


  try {

    const data =
      await api(
        "/api/devices"
      );


    const devices =
      data.devices || [];


    document.getElementById(
      "totalDevices"
    ).textContent =
      devices.length;


    if (!devices.length) {

      container.innerHTML =
        "<p>Aucun appareil connecté.</p>";

      return;

    }


    let html =
      "<table><tr><th>Device ID</th><th>Code</th><th>État</th></tr>";


    devices.forEach(
      device => {

        html += `

<tr>

<td>
${escapeHtml(
  device.deviceId
)}
</td>

<td>
${escapeHtml(
  device.code
)}
</td>

<td>

${
  device.active
    ? '<span class="badge active">🟢 ACTIF</span>'
    : '<span class="badge inactive">🔴 INACTIF</span>'
}

</td>

</tr>

`;

      }
    );


    html +=
      "</table>";


    container.innerHTML =
      html;


  } catch (error) {

    container.innerHTML =
      "<p>❌ " +
      escapeHtml(
        error.message
      ) +
      "</p>";

  }

}


/* =================================
   SÉCURITÉ AFFICHAGE
================================= */

function escapeHtml(value) {

  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =================================
   CHARGEMENT INITIAL
================================= */

async function loadAll() {

  await loadUsers();

  await loadCodes();

  await loadDevices();

}


loadAll();

</script>


</body>

</html>

  `);

});


// =====================================
// ERREURS
// =====================================

app.use(
  (err, req, res, next) => {

    console.error(err);

    res.status(500).json({

      success: false,

      message:
        "Erreur interne du serveur"

    });

  }
);


// =====================================
// ROUTE 404
// =====================================

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "Route introuvable",

      path:
        req.originalUrl

    });

  }
);


// =====================================
// DÉMARRAGE
// =====================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `ARIS IPTV API listening on port ${PORT}`
    );

  }
);
