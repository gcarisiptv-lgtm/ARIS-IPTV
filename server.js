const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 10000;
const ADMIN_TOKEN =
  process.env.ADMIN_TOKEN || "ARIS-ADMIN-2026";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// CORS
// ======================================================

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

// ======================================================
// FICHIERS STATIQUES
// ======================================================

app.use(express.static(path.join(__dirname)));

// ======================================================
// DONNÉES
// Prototype : données en mémoire
// ======================================================

let nextUserId = 2;
let nextDeviceId = 1;
let nextCodeId = 2;

const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    active: true,
    role: "admin",
    createdAt: new Date().toISOString()
  }
];

const activationCodes = [
  {
    id: 1,
    code: "ARIS-2026",
    active: true,
    deviceId: null,
    deviceName: null,
    platform: null,
    createdAt: new Date().toISOString()
  }
];

const devices = [];

// Sessions utilisateurs
const userSessions = new Map();

// ======================================================
// OUTILS
// ======================================================

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function generateActivationCode() {
  const part1 = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  const part2 = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `ARIS-${part1}-${part2}`;
}

function findUserFromToken(token) {
  if (!token) return null;
  return userSessions.get(token) || null;
}

function getBearerToken(req) {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization
    .substring(7)
    .trim();
}

// ======================================================
// AUTH ADMIN
// ======================================================

function adminAuth(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token admin manquant"
    });
  }

  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      message: "Token admin invalide"
    });
  }

  next();
}

// ======================================================
// AUTH UTILISATEUR
// ======================================================

function userAuth(req, res, next) {
  const token = getBearerToken(req);
  const user = findUserFromToken(token);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Session utilisateur invalide"
    });
  }

  if (!user.active) {
    return res.status(403).json({
      success: false,
      message: "Utilisateur désactivé"
    });
  }

  req.user = user;
  next();
}

// ======================================================
// PAGE PRINCIPALE
// ======================================================

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "index.html");

  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ARIS IPTV</title>
<style>
body{
  margin:0;
  background:#07111f;
  color:white;
  font-family:Arial,sans-serif;
  text-align:center;
}
.box{
  max-width:700px;
  margin:100px auto;
  padding:40px;
}
h1{
  font-size:44px;
}
p{
  color:#b9c3d0;
  font-size:18px;
}
a{
  color:#28a9ff;
}
</style>
</head>
<body>
<div class="box">
<h1>🐯 ARIS IPTV</h1>
<p>Serveur opérationnel</p>
<p>ARIS IPTV PRO</p>
<p><a href="/admin">Administration</a></p>
</div>
</body>
</html>
      `);
    }
  });
});

// ======================================================
// HEALTH
// ======================================================

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    message: "ARIS IPTV API fonctionne correctement",
    status: "online",
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
    users: users.length,
    codes: activationCodes.length,
    devices: devices.length,
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// LOGIN UTILISATEUR
// ======================================================

app.post("/api/login", (req, res) => {
  const username = String(
    req.body.username || ""
  ).trim();

  const password = String(
    req.body.password || ""
  );

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

  const token = generateToken();

  userSessions.set(token, user);

  res.json({
    success: true,
    message: "Connexion réussie",
    token: token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

// ======================================================
// LOGOUT
// ======================================================

app.post("/api/logout", userAuth, (req, res) => {
  const token = getBearerToken(req);

  if (token) {
    userSessions.delete(token);
  }

  res.json({
    success: true,
    message: "Déconnexion réussie"
  });
});

// ======================================================
// PROFIL
// ======================================================

app.get("/api/me", userAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      active: req.user.active
    }
  });
});

// ======================================================
// ACTIVATION APPAREIL
// ======================================================

app.post("/api/activate", (req, res) => {
  const codeValue = String(
    req.body.code || ""
  ).trim();

  const deviceId = String(
    req.body.deviceId || ""
  ).trim();

  const deviceName = String(
    req.body.deviceName || "Android TV"
  ).trim();

  const platform = String(
    req.body.platform || "Android TV"
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

  const activation = activationCodes.find(
    item =>
      item.code.toUpperCase() ===
        codeValue.toUpperCase() &&
      item.active === true
  );

  if (!activation) {
    return res.status(401).json({
      success: false,
      message: "Code d'activation invalide ou désactivé"
    });
  }

  // Code déjà associé à un autre appareil
  if (
    activation.deviceId &&
    activation.deviceId !== deviceId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Ce code est déjà associé à un autre appareil"
    });
  }

  let device = devices.find(
    item => item.deviceId === deviceId
  );

  if (device) {
    device.active = true;
    device.codeId = activation.id;
    device.code = activation.code;
    device.deviceName = deviceName;
    device.platform = platform;
    device.updatedAt =
      new Date().toISOString();
  } else {
    device = {
      id: nextDeviceId++,
      deviceId: deviceId,
      deviceName: deviceName,
      platform: platform,
      codeId: activation.id,
      code: activation.code,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    devices.push(device);
  }

  activation.deviceId = deviceId;
  activation.deviceName = deviceName;
  activation.platform = platform;

  res.json({
    success: true,
    message: "Appareil activé avec succès",
    activation: {
      code: activation.code,
      deviceId: deviceId,
      deviceName: deviceName,
      platform: platform
    },
    device: device
  });
});

// ======================================================
// VÉRIFIER UN CODE
// ======================================================

app.post("/api/check-code", (req, res) => {
  const codeValue = String(
    req.body.code || ""
  ).trim();

  const activation = activationCodes.find(
    item =>
      item.code.toUpperCase() ===
        codeValue.toUpperCase() &&
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
    message: "Code valide",
    code: activation.code,
    deviceId: activation.deviceId
  });
});

// ======================================================
// APPAREILS POUR L'APPLICATION
// ======================================================

app.get("/api/devices", userAuth, (req, res) => {
  res.json({
    success: true,
    devices: devices.map(device => ({
      id: device.id,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
      code: device.code,
      active: device.active,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt
    }))
  });
});

// ======================================================
// ADMIN : OVERVIEW
// ======================================================

app.get(
  "/api/admin/overview",
  adminAuth,
  (req, res) => {
    const activeUsers =
      users.filter(u => u.active).length;

    const activeCodes =
      activationCodes.filter(c => c.active)
        .length;

    const activeDevices =
      devices.filter(d => d.active).length;

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
        active: user.active,
        role: user.role,
        createdAt: user.createdAt
      })),

      codes: activationCodes,

      devices: devices,

      timestamp: new Date().toISOString()
    });
  }
);

// ======================================================
// ADMIN : TEST
// ======================================================

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

// ======================================================
// ADMIN : CRÉER UTILISATEUR
// ======================================================

app.post(
  "/api/users",
  adminAuth,
  (req, res) => {
    const username = String(
      req.body.username || ""
    ).trim();

    const password = String(
      req.body.password || ""
    );

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username et password obligatoires"
      });
    }

    const existing = users.find(
      user =>
        user.username.toLowerCase() ===
        username.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Utilisateur déjà existant"
      });
    }

    const user = {
      id: nextUserId++,
      username: username,
      password: password,
      active: true,
      role: "client",
      createdAt: new Date().toISOString()
    };

    users.push(user);

    res.json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: {
        id: user.id,
        username: user.username,
        active: user.active,
        role: user.role
      }
    });
  }
);

// ======================================================
// ADMIN : VOIR UTILISATEURS
// ======================================================

app.get(
  "/api/users",
  adminAuth,
  (req, res) => {
    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        username: user.username,
        active: user.active,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  }
);

// ======================================================
// ADMIN : ACTIVER UTILISATEUR
// ======================================================

app.post(
  "/api/users/activate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const user = users.find(
      item => item.id === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    user.active = true;

    res.json({
      success: true,
      message: "Utilisateur activé"
    });
  }
);

// ======================================================
// ADMIN : DÉSACTIVER UTILISATEUR
// ======================================================

app.post(
  "/api/users/deactivate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const user = users.find(
      item => item.id === id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Le compte administrateur principal ne peut pas être désactivé"
      });
    }

    user.active = false;

    res.json({
      success: true,
      message: "Utilisateur désactivé"
    });
  }
);

// ======================================================
// ADMIN : SUPPRIMER UTILISATEUR
// ======================================================

app.delete(
  "/api/users/:id",
  adminAuth,
  (req, res) => {
    const id = Number(req.params.id);

    const index = users.findIndex(
      user => user.id === id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable"
      });
    }

    if (users[index].role === "admin") {
      return res.status(403).json({
        success: false,
        message:
          "Le compte administrateur principal ne peut pas être supprimé"
      });
    }

    users.splice(index, 1);

    res.json({
      success: true,
      message: "Utilisateur supprimé"
    });
  }
);

// ======================================================
// ADMIN : VOIR LES CODES
// ======================================================

app.get(
  "/api/codes",
  adminAuth,
  (req, res) => {
    res.json({
      success: true,
      codes: activationCodes.map(code => ({
        id: code.id,
        code: code.code,
        active: code.active,

        deviceId: code.deviceId,

        deviceName:
          code.deviceName,

        platform:
          code.platform,

        createdAt:
          code.createdAt
      }))
    });
  }
);

// ======================================================
// ADMIN : CRÉER UN CODE
// ======================================================

app.post(
  "/api/codes",
  adminAuth,
  (req, res) => {
    let codeValue = String(
      req.body.code || ""
    ).trim();

    if (!codeValue) {
      codeValue = generateActivationCode();
    }

    codeValue = codeValue.toUpperCase();

    const existing =
      activationCodes.find(
        item =>
          item.code.toUpperCase() ===
          codeValue
      );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Ce code existe déjà"
      });
    }

    const code = {
      id: nextCodeId++,
      code: codeValue,
      active: true,
      deviceId: null,
      deviceName: null,
      platform: null,
      createdAt: new Date().toISOString()
    };

    activationCodes.push(code);

    res.json({
      success: true,
      message: "Code créé avec succès",
      code: code
    });
  }
);

// ======================================================
// ADMIN : GÉNÉRER CODE AUTOMATIQUEMENT
// ======================================================

app.post(
  "/api/codes/generate",
  adminAuth,
  (req, res) => {
    let codeValue;

    do {
      codeValue = generateActivationCode();
    } while (
      activationCodes.some(
        item => item.code === codeValue
      )
    );

    const code = {
      id: nextCodeId++,
      code: codeValue,
      active: true,
      deviceId: null,
      deviceName: null,
      platform: null,
      createdAt: new Date().toISOString()
    };

    activationCodes.push(code);

    res.json({
      success: true,
      message: "Code généré automatiquement",
      code: code
    });
  }
);

// ======================================================
// ADMIN : ACTIVER UN CODE
// ======================================================

app.post(
  "/api/codes/activate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const code = activationCodes.find(
      item => item.id === id
    );

    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Code introuvable"
      });
    }

    code.active = true;

    res.json({
      success: true,
      message: "Code activé",
      code: code
    });
  }
);

// ======================================================
// ADMIN : DÉSACTIVER UN CODE
// ======================================================

app.post(
  "/api/codes/deactivate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const code = activationCodes.find(
      item => item.id === id
    );

    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Code introuvable"
      });
    }

    code.active = false;

    // Désactiver également l'appareil associé
    if (code.deviceId) {
      const device = devices.find(
        item =>
          item.deviceId === code.deviceId
      );

      if (device) {
        device.active = false;
        device.updatedAt =
          new Date().toISOString();
      }
    }

    res.json({
      success: true,
      message: "Code désactivé",
      code: code
    });
  }
);

// ======================================================
// ADMIN : SUPPRIMER UN CODE
// ======================================================

app.delete(
  "/api/codes/:id",
  adminAuth,
  (req, res) => {
    const id = Number(req.params.id);

    const index =
      activationCodes.findIndex(
        item => item.id === id
      );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Code introuvable"
      });
    }

    const code = activationCodes[index];

    // Désassocier l'appareil
    if (code.deviceId) {
      const device = devices.find(
        item =>
          item.deviceId === code.deviceId
      );

      if (device) {
        device.codeId = null;
        device.code = null;
        device.active = false;
        device.updatedAt =
          new Date().toISOString();
      }
    }

    activationCodes.splice(index, 1);

    res.json({
      success: true,
      message: "Code supprimé"
    });
  }
);

// ======================================================
// ADMIN : DÉSACTIVER CODE PAR VALEUR
// ======================================================

app.post(
  "/api/codes/deactivate-by-code",
  adminAuth,
  (req, res) => {
    const codeValue = String(
      req.body.code || ""
    ).trim().toUpperCase();

    const code = activationCodes.find(
      item =>
        item.code.toUpperCase() ===
        codeValue
    );

    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Code introuvable"
      });
    }

    code.active = false;

    res.json({
      success: true,
      message: "Code désactivé",
      code: code
    });
  }
);

// ======================================================
// ADMIN : VOIR APPAREILS
// ======================================================

app.get(
  "/api/admin/devices",
  adminAuth,
  (req, res) => {
    res.json({
      success: true,
      devices: devices.map(device => ({
        id: device.id,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        platform: device.platform,
        codeId: device.codeId,
        code: device.code,
        active: device.active,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt
      }))
    });
  }
);

// Alias
app.get(
  "/api/devices/all",
  adminAuth,
  (req, res) => {
    res.json({
      success: true,
      devices: devices
    });
  }
);

// ======================================================
// ADMIN : ACTIVER APPAREIL
// ======================================================

app.post(
  "/api/devices/activate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const device = devices.find(
      item => item.id === id
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    device.active = true;
    device.updatedAt =
      new Date().toISOString();

    // Activer également son code
    if (device.codeId) {
      const code = activationCodes.find(
        item => item.id === device.codeId
      );

      if (code) {
        code.active = true;
      }
    }

    res.json({
      success: true,
      message: "Appareil activé",
      device: device
    });
  }
);

// ======================================================
// ADMIN : DÉSACTIVER APPAREIL
// ======================================================

app.post(
  "/api/devices/deactivate",
  adminAuth,
  (req, res) => {
    const id = Number(req.body.id);

    const device = devices.find(
      item => item.id === id
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    device.active = false;
    device.updatedAt =
      new Date().toISOString();

    res.json({
      success: true,
      message: "Appareil désactivé",
      device: device
    });
  }
);

// ======================================================
// ADMIN : SUPPRIMER APPAREIL
// ======================================================

app.delete(
  "/api/devices/:id",
  adminAuth,
  (req, res) => {
    const id = Number(req.params.id);

    const index = devices.findIndex(
      device => device.id === id
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    const device = devices[index];

    // Retirer l'association du code
    if (device.codeId) {
      const code = activationCodes.find(
        item => item.id === device.codeId
      );

      if (code) {
        code.deviceId = null;
        code.deviceName = null;
        code.platform = null;
      }
    }

    devices.splice(index, 1);

    res.json({
      success: true,
      message: "Appareil supprimé"
    });
  }
);

// ======================================================
// ADMIN : SUPPRIMER APPAREIL PAR DEVICE ID
// ======================================================

app.post(
  "/api/devices/delete",
  adminAuth,
  (req, res) => {
    const deviceId = String(
      req.body.deviceId || ""
    ).trim();

    const index = devices.findIndex(
      device =>
        device.deviceId === deviceId
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    const device = devices[index];

    if (device.codeId) {
      const code = activationCodes.find(
        item => item.id === device.codeId
      );

      if (code) {
        code.deviceId = null;
        code.deviceName = null;
        code.platform = null;
      }
    }

    devices.splice(index, 1);

    res.json({
      success: true,
      message: "Appareil supprimé"
    });
  }
);

// ======================================================
// ADMIN : DÉTAIL D'UN APPAREIL
// ======================================================

app.get(
  "/api/devices/:id",
  adminAuth,
  (req, res) => {
    const id = Number(req.params.id);

    const device = devices.find(
      item => item.id === id
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Appareil introuvable"
      });
    }

    let associatedCode = null;

    if (device.codeId) {
      associatedCode =
        activationCodes.find(
          code =>
            code.id === device.codeId
        ) || null;
    }

    res.json({
      success: true,
      device: device,
      associatedCode: associatedCode
    });
  }
);

// ======================================================
// ADMIN : DÉTAIL D'UN CODE + APPAREIL ASSOCIÉ
// ======================================================

app.get(
  "/api/codes/:id",
  adminAuth,
  (req, res) => {
    const id = Number(req.params.id);

    const code = activationCodes.find(
      item => item.id === id
    );

    if (!code) {
      return res.status(404).json({
        success: false,
        message: "Code introuvable"
      });
    }

    let associatedDevice = null;

    if (code.deviceId) {
      associatedDevice =
        devices.find(
          device =>
            device.deviceId ===
            code.deviceId
        ) || null;
    }

    res.json({
      success: true,
      code: code,
      associatedDevice:
        associatedDevice
    });
  }
);

// ======================================================
// PAGE ADMINISTRATION COMPLÈTE
// ======================================================

app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="fr">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>ARIS IPTV - Administration</title>

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
background:#050b14;
color:white;
font-family:Arial,sans-serif;
}

header{
background:#0a1a2c;
padding:30px 20px;
text-align:center;
border-bottom:1px solid #1689cf;
}

header h1{
margin:0;
font-size:34px;
}

header p{
color:#39aaff;
font-size:18px;
}

.container{
max-width:1200px;
margin:auto;
padding:25px;
}

.card{
background:#0d2034;
border:1px solid #168fd3;
border-radius:16px;
padding:24px;
margin-bottom:24px;
}

h2{
margin-top:0;
}

.grid{
display:grid;
grid-template-columns:
repeat(auto-fit,minmax(210px,1fr));
gap:16px;
}

.stat{
background:#081729;
border:1px solid #167fbd;
border-radius:14px;
padding:20px;
}

.stat span{
display:block;
color:#8fcfff;
}

.stat strong{
display:block;
font-size:36px;
color:#29a8ff;
margin-top:8px;
}

input{
width:100%;
padding:14px;
margin:7px 0;
border-radius:8px;
border:1px solid #168fd3;
background:#061321;
color:white;
font-size:15px;
}

button{
border:0;
border-radius:8px;
padding:12px 16px;
margin:5px;
cursor:pointer;
font-weight:bold;
color:white;
background:#1498df;
}

button:hover{
opacity:.85;
}

.btn-green{
background:#138b56;
}

.btn-red{
background:#c93b3b;
}

.btn-purple{
background:#8a45bd;
}

.btn-gray{
background:#40566c;
}

table{
width:100%;
border-collapse:collapse;
margin-top:15px;
}

th,td{
padding:14px 10px;
border-bottom:1px solid #24405a;
text-align:left;
}

th{
color:#48b5ff;
}

.badge{
display:inline-block;
padding:6px 10px;
border-radius:20px;
font-size:13px;
font-weight:bold;
}

.active{
background:#095b3b;
color:#43ff9b;
}

.inactive{
background:#652121;
color:#ff8e8e;
}

.associated{
color:#46d6ff;
}

.small{
color:#9cafc2;
font-size:13px;
}

.message{
padding:12px;
margin-top:12px;
border-radius:8px;
background:#102c43;
}

@media(max-width:700px){

.container{
padding:12px;
}

table{
font-size:12px;
}

th,td{
padding:8px 5px;
}

button{
font-size:12px;
padding:9px;
}

}

</style>

</head>

<body>

<header>

<h1>🐯 ARIS IPTV</h1>

<p>Administration complète</p>

</header>

<div class="container">

<div class="card">

<h2>🔐 Connexion administrateur</h2>

<input
id="token"
type="password"
placeholder="Token administrateur"
/>

<button onclick="saveToken()">
🔐 ENREGISTRER LE TOKEN
</button>

<button
class="btn-gray"
onclick="testAdmin()"
>
TESTER
</button>

<div id="message"></div>

</div>

<div class="grid">

<div class="stat">
<span>👤 Utilisateurs</span>
<strong id="usersCount">0</strong>
</div>

<div class="stat">
<span>🟢 Utilisateurs actifs</span>
<strong id="activeUsers">0</strong>
</div>

<div class="stat">
<span>🔑 Codes</span>
<strong id="codesCount">0</strong>
</div>

<div class="stat">
<span>📱 Appareils</span>
<strong id="devicesCount">0</strong>
</div>

</div>

<div class="card">

<h2>🔑 Créer un code d'activation</h2>

<input
id="newCode"
placeholder="Exemple : ARIS-CLIENT-001"
/>

<button onclick="createCode()">
➕ CRÉER LE CODE
</button>

<button
class="btn-purple"
onclick="generateCode()"
>
🎲 GÉNÉRER AUTOMATIQUEMENT
</button>

</div>

<div class="card">

<h2>🔑 Gestion des codes</h2>

<button
class="btn-gray"
onclick="loadCodes()"
>
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

<tbody id="codesTable"></tbody>

</table>

</div>

<div class="card">

<h2>📱 Gestion complète des appareils</h2>

<button
class="btn-gray"
onclick="loadDevices()"
>
🔄 ACTUALISER LES APPAREILS
</button>

<table>

<thead>

<tr>
<th>ID</th>
<th>Appareil</th>
<th>Plateforme</th>
<th>Code associé</th>
<th>État</th>
<th>Actions</th>
</tr>

</thead>

<tbody id="devicesTable"></tbody>

</table>

</div>

<div class="card">

<h2>👤 Gestion des utilisateurs</h2>

<input
id="newUsername"
placeholder="Username"
/>

<input
id="newPassword"
type="password"
placeholder="Password"
/>

<button onclick="createUser()">
➕ CRÉER L'UTILISATEUR
</button>

<button
class="btn-gray"
onclick="loadUsers()"
>
🔄 ACTUALISER
</button>

<table>

<thead>

<tr>
<th>ID</th>
<th>Username</th>
<th>État</th>
<th>Actions</th>
</tr>

</thead>

<tbody id="usersTable"></tbody>

</table>

</div>

</div>

<script>

let adminToken =
localStorage.getItem("aris_admin_token") || "";

document.getElementById("token").value =
adminToken;

function headers(){

return {
"Content-Type":"application/json",
"Authorization":
"Bearer " + adminToken
};

}

function show(message){

document.getElementById("message").innerHTML =
'<div class="message">' +
message +
'</div>';

}

function saveToken(){

adminToken =
document.getElementById("token").value.trim();

localStorage.setItem(
"aris_admin_token",
adminToken
);

show("Token enregistré.");

testAdmin();

}

async function api(url,options={}){

options.headers = Object.assign(
{},
options.headers || {},
headers()
);

const response =
await fetch(url,options);

const data =
await response.json();

if(!response.ok){

throw new Error(
data.message ||
"Erreur HTTP " + response.status
);

}

return data;

}

async function testAdmin(){

try{

const data =
await api("/api/admin/test");

show(
"🟢 " + data.message
);

await refreshAll();

}catch(error){

show(
"🔴 " + error.message
);

}

}

async function refreshAll(){

await loadOverview();
await loadCodes();
await loadDevices();
await loadUsers();

}

async function loadOverview(){

try{

const data =
await api("/api/admin/overview");

document.getElementById(
"usersCount"
).textContent =
data.statistics.users;

document.getElementById(
"activeUsers"
).textContent =
data.statistics.activeUsers;

document.getElementById(
"codesCount"
).textContent =
data.statistics.activationCodes;

document.getElementById(
"devicesCount"
).textContent =
data.statistics.devices;

}catch(error){

show("Erreur : " + error.message);

}

}

async function createCode(){

const value =
document.getElementById(
"newCode"
).value.trim();

try{

const data =
await api(
"/api/codes",
{
method:"POST",
body:JSON.stringify({
code:value
})
}
);

show(
"🟢 Code créé : " +
data.code.code
);

document.getElementById(
"newCode"
).value = "";

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function generateCode(){

try{

const data =
await api(
"/api/codes/generate",
{
method:"POST"
}
);

show(
"🟢 Code généré : " +
data.code.code
);

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function loadCodes(){

try{

const data =
await api("/api/codes");

const table =
document.getElementById(
"codesTable"
);

table.innerHTML = "";

data.codes.forEach(code => {

const row =
document.createElement("tr");

const state =
code.active
? '<span class="badge active">🟢 ACTIF</span>'
: '<span class="badge inactive">🔴 DÉSACTIVÉ</span>';

const device =
code.deviceId
? '<span class="associated">' +
  '📱 ' +
  escapeHtml(
    code.deviceName || code.deviceId
  ) +
  '</span>'
: "Non utilisé";

const action =
code.active
?
'<button class="btn-red" ' +
'onclick="deactivateCode(' +
code.id +
')">🔴 Désactiver</button>'
:
'<button class="btn-green" ' +
'onclick="activateCode(' +
code.id +
')">🟢 Activer</button>';

row.innerHTML =

"<td>" + code.id + "</td>" +

"<td><strong>" +
escapeHtml(code.code) +
"</strong></td>" +

"<td>" + state + "</td>" +

"<td>" + device + "</td>" +

"<td>" +

action +

'<button class="btn-red" ' +
'onclick="deleteCode(' +
code.id +
')">🗑️ Supprimer</button>' +

"</td>";

table.appendChild(row);

});

}catch(error){

show("🔴 " + error.message);

}

}

async function activateCode(id){

try{

await api(
"/api/codes/activate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

show("🟢 Code activé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deactivateCode(id){

try{

await api(
"/api/codes/deactivate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

show("🔴 Code désactivé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deleteCode(id){

if(!confirm(
"Supprimer définitivement ce code ?"
)) return;

try{

await api(
"/api/codes/" + id,
{
method:"DELETE"
}
);

show("🗑️ Code supprimé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function loadDevices(){

try{

const data =
await api("/api/admin/devices");

const table =
document.getElementById(
"devicesTable"
);

table.innerHTML = "";

data.devices.forEach(device => {

const row =
document.createElement("tr");

const state =
device.active
? '<span class="badge active">🟢 ACTIF</span>'
: '<span class="badge inactive">🔴 DÉSACTIVÉ</span>';

const action =
device.active
?
'<button class="btn-red" ' +
'onclick="deactivateDevice(' +
device.id +
')">🔴 Désactiver</button>'
:
'<button class="btn-green" ' +
'onclick="activateDevice(' +
device.id +
')">🟢 Activer</button>';

row.innerHTML =

"<td>" + device.id + "</td>" +

"<td>" +
"<strong>" +
escapeHtml(device.deviceName) +
"</strong><br>" +
'<span class="small">' +
escapeHtml(device.deviceId) +
"</span>" +
"</td>" +

"<td>" +
escapeHtml(device.platform) +
"</td>" +

"<td>" +
escapeHtml(device.code || "Aucun") +
"</td>" +

"<td>" + state + "</td>" +

"<td>" +

'<button onclick="viewDevice(' +
device.id +
')">👁️ Voir</button>' +

action +

'<button class="btn-red" ' +
'onclick="deleteDevice(' +
device.id +
')">🗑️ Supprimer</button>' +

"</td>";

table.appendChild(row);

});

}catch(error){

show("🔴 " + error.message);

}

}

async function viewDevice(id){

try{

const data =
await api(
"/api/devices/" + id
);

const device =
data.device;

const code =
data.associatedCode;

alert(
"📱 APPAREIL\\n\\n" +

"Nom : " +
device.deviceName +

"\\n\\nDevice ID : " +
device.deviceId +

"\\n\\nPlateforme : " +
device.platform +

"\\n\\nÉtat : " +
(device.active
? "ACTIF"
: "DÉSACTIVÉ") +

"\\n\\nCode associé : " +
(code
? code.code
: "Aucun")
);

}catch(error){

show("🔴 " + error.message);

}

}

async function activateDevice(id){

try{

await api(
"/api/devices/activate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

show("🟢 Appareil activé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deactivateDevice(id){

try{

await api(
"/api/devices/deactivate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

show("🔴 Appareil désactivé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deleteDevice(id){

if(!confirm(
"Supprimer définitivement cet appareil ?"
)) return;

try{

await api(
"/api/devices/" + id,
{
method:"DELETE"
}
);

show("🗑️ Appareil supprimé.");

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function createUser(){

const username =
document.getElementById(
"newUsername"
).value.trim();

const password =
document.getElementById(
"newPassword"
).value;

if(!username || !password){

show(
"Username et Password obligatoires."
);

return;

}

try{

const data =
await api(
"/api/users",
{
method:"POST",
body:JSON.stringify({
username:username,
password:password
})
}
);

show(
"🟢 Utilisateur créé : " +
data.user.username
);

document.getElementById(
"newUsername"
).value = "";

document.getElementById(
"newPassword"
).value = "";

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function loadUsers(){

try{

const data =
await api("/api/users");

const table =
document.getElementById(
"usersTable"
);

table.innerHTML = "";

data.users.forEach(user => {

const row =
document.createElement("tr");

const state =
user.active
? '<span class="badge active">🟢 ACTIF</span>'
: '<span class="badge inactive">🔴 DÉSACTIVÉ</span>';

let actions = "";

if(user.role === "admin"){

actions =
"🔐 Compte principal";

}else{

if(user.active){

actions +=
'<button class="btn-red" ' +
'onclick="deactivateUser(' +
user.id +
')">🔴 Désactiver</button>';

}else{

actions +=
'<button class="btn-green" ' +
'onclick="activateUser(' +
user.id +
')">🟢 Activer</button>';

}

actions +=
'<button class="btn-red" ' +
'onclick="deleteUser(' +
user.id +
')">🗑️ Supprimer</button>';

}

row.innerHTML =

"<td>" + user.id + "</td>" +

"<td><strong>" +
escapeHtml(user.username) +
"</strong></td>" +

"<td>" + state + "</td>" +

"<td>" + actions + "</td>";

table.appendChild(row);

});

}catch(error){

show("🔴 " + error.message);

}

}

async function activateUser(id){

try{

await api(
"/api/users/activate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deactivateUser(id){

try{

await api(
"/api/users/deactivate",
{
method:"POST",
body:JSON.stringify({id:id})
}
);

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

async function deleteUser(id){

if(!confirm(
"Supprimer cet utilisateur ?"
)) return;

try{

await api(
"/api/users/" + id,
{
method:"DELETE"
}
);

await refreshAll();

}catch(error){

show("🔴 " + error.message);

}

}

function escapeHtml(value){

return String(value || "")
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}

// Chargement initial
if(adminToken){

refreshAll();

}

</script>

</body>
</html>
  `);
});

// ======================================================
// ERREUR 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    path: req.originalUrl
  });
});

// ======================================================
// ERREUR SERVEUR
// ======================================================

app.use((err, req, res, next) => {
  console.error("Erreur serveur :", err);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur"
  });
});

// ======================================================
// DÉMARRAGE
// ======================================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `ARIS IPTV API listening on port ${PORT}`
    );

    console.log(
      `Port: ${PORT}`
    );
  }
);
