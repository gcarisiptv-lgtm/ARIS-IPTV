const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   ARIS IPTV - CONFIGURATION
   ========================================================= */

const APP_NAME = "ARIS IPTV";
const APP_VERSION = "1.0.0";

/*
  Pour la production, définis ces variables dans Render :
  ADMIN_USERNAME
  ADMIN_PASSWORD
*/
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe_ARIS_2026!";

/* =========================================================
   DONNÉES TEMPORAIRES
   ========================================================= */

// Utilisateurs de démonstration.
// Ces données disparaissent lors d'un redémarrage du serveur.
const users = [
  {
    id: 1,
    username: "demo",
    password: "demo123",
    active: true,
    activationCode: "ARIS-DEMO-2026",
    expiresAt: "2099-12-31T23:59:59.000Z",
    maxDevices: 1,
    devices: []
  }
];

// Codes d'activation disponibles
const activationCodes = [
  {
    code: "ARIS-DEMO-2026",
    durationDays: 3650,
    used: true
  },
  {
    code: "ARIS-2026-001",
    durationDays: 30,
    used: false
  },
  {
    code: "ARIS-2026-002",
    durationDays: 90,
    used: false
  },
  {
    code: "ARIS-2026-003",
    durationDays: 365,
    used: false
  }
];

/* =========================================================
   OUTILS
   ========================================================= */

function generateId() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isExpired(user) {
  if (!user.expiresAt) return false;
  return new Date(user.expiresAt) < new Date();
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    active: user.active,
    expired: isExpired(user),
    expiresAt: user.expiresAt,
    maxDevices: user.maxDevices,
    devices: user.devices
  };
}

/* =========================================================
   PAGE D'ACCUEIL
   ========================================================= */

app.get("/", (req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${APP_NAME}</title>

  <style>
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #07111f, #102b4c);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .box {
      width: 90%;
      max-width: 650px;
      padding: 45px 25px;
      border-radius: 22px;
      background: rgba(255,255,255,0.08);
      box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      backdrop-filter: blur(10px);
    }

    h1 {
      font-size: 48px;
      margin-bottom: 10px;
    }

    .status {
      display: inline-block;
      margin: 20px 0;
      padding: 10px 18px;
      border-radius: 30px;
      background: #0f8f4f;
      font-weight: bold;
    }

    .info {
      opacity: 0.85;
      line-height: 1.7;
    }

    code {
      background: rgba(0,0,0,0.3);
      padding: 5px 8px;
      border-radius: 6px;
    }
  </style>
</head>

<body>

  <div class="box">

    <h1>ARIS IPTV</h1>

    <div class="status">
      ● API ONLINE
    </div>

    <p class="info">
      Bienvenue sur le serveur ARIS IPTV.
    </p>

    <p class="info">
      Version : <strong>${APP_VERSION}</strong>
    </p>

    <p class="info">
      API : <code>/api/health</code>
    </p>

    <p class="info">
      Connexion : <code>/api/login</code>
    </p>

  </div>

</body>
</html>
  `);
});

/* =========================================================
   TEST API
   ========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    app: APP_NAME,
    version: APP_VERSION,
    status: "online",
    timestamp: new Date().toISOString()
  });
});

/* Alias */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online"
  });
});

/* =========================================================
   INFORMATIONS APPLICATION
   ========================================================= */

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: APP_NAME,
    version: APP_VERSION,
    status: "online",
    endpoints: {
      login: "POST /api/login",
      activate: "POST /api/activate",
      health: "GET /api/health",
      user: "GET /api/user/:username",
      devices: "GET /api/devices/:username"
    }
  });
});

/* =========================================================
   CONNEXION UTILISATEUR
   ========================================================= */

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires."
    });
  }

  const user = users.find(
    u =>
      u.username.toLowerCase() === String(username).toLowerCase() &&
      u.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Username ou password incorrect."
    });
  }

  if (!user.active) {
    return res.status(403).json({
      success: false,
      message: "Compte désactivé."
    });
  }

  if (isExpired(user)) {
    return res.status(403).json({
      success: false,
      message: "Votre abonnement est expiré.",
      expiresAt: user.expiresAt
    });
  }

  return res.json({
    success: true,
    message: "Connexion réussie.",
    user: publicUser(user)
  });
});

/* =========================================================
   ACTIVATION PAR CODE
   ========================================================= */

app.post("/api/activate", (req, res) => {
  const { username, password, code, deviceId } = req.body;

  if (!username || !password || !code) {
    return res.status(400).json({
      success: false,
      message: "Username, password et code obligatoires."
    });
  }

  let user = users.find(
    u => u.username.toLowerCase() === String(username).toLowerCase()
  );

  const activation = activationCodes.find(
    c => c.code.toUpperCase() === String(code).toUpperCase()
  );

  if (!activation) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation invalide."
    });
  }

  if (activation.used) {
    return res.status(400).json({
      success: false,
      message: "Ce code d'activation a déjà été utilisé."
    });
  }

  if (!user) {
    user = {
      id: generateId(),
      username,
      password,
      active: true,
      activationCode: activation.code,
      expiresAt: addDays(new Date(), activation.durationDays).toISOString(),
      maxDevices: 1,
      devices: []
    };

    users.push(user);
  } else {
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect."
      });
    }

    user.active = true;
    user.activationCode = activation.code;

    const currentExpiration = isExpired(user)
      ? new Date()
      : new Date(user.expiresAt);

    user.expiresAt = addDays(
      currentExpiration,
      activation.durationDays
    ).toISOString();
  }

  if (deviceId) {
    if (!user.devices.includes(deviceId)) {
      if (user.devices.length >= user.maxDevices) {
        return res.status(403).json({
          success: false,
          message: "Nombre maximum d'appareils atteint."
        });
      }

      user.devices.push(deviceId);
    }
  }

  activation.used = true;

  return res.json({
    success: true,
    message: "Activation réussie.",
    user: publicUser(user)
  });
});

/* =========================================================
   INFORMATIONS UTILISATEUR
   ========================================================= */

app.get("/api/user/:username", (req, res) => {
  const user = users.find(
    u => u.username.toLowerCase() === req.params.username.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  res.json({
    success: true,
    user: publicUser(user)
  });
});

/* =========================================================
   APPAREILS
   ========================================================= */

app.get("/api/devices/:username", (req, res) => {
  const user = users.find(
    u => u.username.toLowerCase() === req.params.username.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  res.json({
    success: true,
    username: user.username,
    maxDevices: user.maxDevices,
    devices: user.devices
  });
});

/* Ajouter un appareil */
app.post("/api/devices", (req, res) => {
  const { username, deviceId } = req.body;

  if (!username || !deviceId) {
    return res.status(400).json({
      success: false,
      message: "Username et deviceId obligatoires."
    });
  }

  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  if (user.devices.includes(deviceId)) {
    return res.json({
      success: true,
      message: "Appareil déjà enregistré.",
      devices: user.devices
    });
  }

  if (user.devices.length >= user.maxDevices) {
    return res.status(403).json({
      success: false,
      message: "Nombre maximum d'appareils atteint."
    });
  }

  user.devices.push(deviceId);

  res.json({
    success: true,
    message: "Appareil ajouté.",
    devices: user.devices
  });
});

/* Supprimer un appareil */
app.delete("/api/devices", (req, res) => {
  const { username, deviceId } = req.body;

  const user = users.find(
    u => u.username.toLowerCase() === String(username).toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  user.devices = user.devices.filter(id => id !== deviceId);

  res.json({
    success: true,
    message: "Appareil supprimé.",
    devices: user.devices
  });
});

/* =========================================================
   ADMIN - CONNEXION
   ========================================================= */

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username !== ADMIN_USERNAME ||
    password !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: "Identifiants administrateur incorrects."
    });
  }

  res.json({
    success: true,
    message: "Connexion administrateur réussie.",
    admin: {
      username: ADMIN_USERNAME
    }
  });
});

/* =========================================================
   ADMIN - LISTE UTILISATEURS
   ========================================================= */

app.get("/api/admin/users", (req, res) => {
  res.json({
    success: true,
    count: users.length,
    users: users.map(publicUser)
  });
});

/* =========================================================
   ADMIN - CRÉER UN CODE
   ========================================================= */

app.post("/api/admin/codes", (req, res) => {
  const { code, durationDays } = req.body;

  if (!code || !durationDays) {
    return res.status(400).json({
      success: false,
      message: "Code et durée obligatoires."
    });
  }

  const existing = activationCodes.find(
    c => c.code.toUpperCase() === String(code).toUpperCase()
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Ce code existe déjà."
    });
  }

  const newCode = {
    code: String(code).toUpperCase(),
    durationDays: Number(durationDays),
    used: false
  };

  activationCodes.push(newCode);

  res.json({
    success: true,
    message: "Code créé.",
    code: newCode
  });
});

/* =========================================================
   ADMIN - LISTE DES CODES
   ========================================================= */

app.get("/api/admin/codes", (req, res) => {
  res.json({
    success: true,
    codes: activationCodes
  });
});

/* =========================================================
   ADMIN - DÉSACTIVER UTILISATEUR
   ========================================================= */

app.post("/api/admin/users/:username/disable", (req, res) => {
  const user = users.find(
    u => u.username.toLowerCase() === req.params.username.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  user.active = false;

  res.json({
    success: true,
    message: "Utilisateur désactivé.",
    user: publicUser(user)
  });
});

/* =========================================================
   ADMIN - ACTIVER UTILISATEUR
   ========================================================= */

app.post("/api/admin/users/:username/enable", (req, res) => {
  const user = users.find(
    u => u.username.toLowerCase() === req.params.username.toLowerCase()
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable."
    });
  }

  user.active = true;

  res.json({
    success: true,
    message: "Utilisateur activé.",
    user: publicUser(user)
  });
});

/* =========================================================
   ERREUR 404
   ========================================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable.",
    path: req.originalUrl
  });
});

/* =========================================================
   DÉMARRAGE SERVEUR
   ========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    ${APP_NAME} API listening on port ${PORT}
  );
  console.log(
    ${APP_NAME} version ${APP_VERSION}
  );
});
