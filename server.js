const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

// ==========================================
// CONFIGURATION
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
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

// ==========================================
// FICHIERS WEB
// ==========================================

app.use(express.static(path.join(__dirname)));

// ==========================================
// DONNÉES TEMPORAIRES
// ==========================================

const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    active: true
  }
];

const activationCodes = [
  {
    code: "ARIS-2026",
    active: true,
    device: null
  }
];

const devices = [];

// ==========================================
// PAGE PRINCIPALE
// ==========================================

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
              margin-bottom: 15px;
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
            <p>Bienvenue sur ARIS IPTV PRO</p>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// ==========================================
// API PRINCIPALE
// ==========================================

app.get("/api", (req, res) => {
  res.json({
    success: true,
    name: "ARIS IPTV",
    message: "ARIS IPTV API fonctionne correctement",
    status: "online"
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// STATUT DU SERVEUR
// ==========================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    status: "online",
    server: "ARIS IPTV PRO",
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// CONNEXION UTILISATEUR
// ==========================================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const user = users.find(
    (u) =>
      u.username === username &&
      u.password === password &&
      u.active === true
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

// ==========================================
// ACTIVATION PAR CODE
// ==========================================

app.post("/api/activate", (req, res) => {
  const { code, deviceId } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation obligatoire"
    });
  }

  const activation = activationCodes.find(
    (item) =>
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
      message: "Ce code est déjà utilisé sur un autre appareil"
    });
  }

  if (deviceId) {
    activation.device = deviceId;

    const existingDevice = devices.find(
      (device) =>
        device.deviceId === deviceId
    );

    if (!existingDevice) {
      devices.push({
        deviceId: deviceId,
        code: code,
        active: true,
        activatedAt: new Date().toISOString()
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

// ==========================================
// VÉRIFICATION DU CODE
// ==========================================

app.post("/api/check-code", (req, res) => {
  const { code } = req.body;

  const activation = activationCodes.find(
    (item) =>
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

// ==========================================
// LISTE DES UTILISATEURS
// ==========================================

app.get("/api/users", (req, res) => {
  res.json({
    success: true,
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      active: user.active
    }))
  });
});

// ==========================================
// AJOUT UTILISATEUR
// ==========================================

app.post("/api/users", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const existing = users.find(
    (user) =>
      user.username === username
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Utilisateur déjà existant"
    });
  }

  const newUser = {
    id: users.length + 1,
    username: username,
    password: password,
    active: true
  };

  users.push(newUser);

  res.json({
    success: true,
    message: "Utilisateur créé",
    user: {
      id: newUser.id,
      username: newUser.username,
      active: newUser.active
    }
  });
});

// ==========================================
// LISTE DES CODES
// ==========================================

app.get("/api/codes", (req, res) => {
  res.json({
    success: true,
    codes: activationCodes
  });
});

// ==========================================
// CRÉER UN CODE
// ==========================================

app.post("/api/codes", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code obligatoire"
    });
  }

  const existing = activationCodes.find(
    (item) =>
      item.code === code
  );

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Ce code existe déjà"
    });
  }

  activationCodes.push({
    code: code,
    active: true,
    device: null
  });

  res.json({
    success: true,
    message: "Code créé avec succès",
    code: code
  });
});

// ==========================================
// LISTE DES APPAREILS
// ==========================================

app.get("/api/devices", (req, res) => {
  res.json({
    success: true,
    devices: devices
  });
});

// ==========================================
// DÉSACTIVER UN APPAREIL
// ==========================================

app.post("/api/devices/deactivate", (req, res) => {
  const { deviceId } = req.body;

  const device = devices.find(
    (item) =>
      item.deviceId === deviceId
  );

  if (!device) {
    return res.status(404).json({
      success: false,
      message: "Appareil introuvable"
    });
  }

  device.active = false;

  res.json({
    success: true,
    message: "Appareil désactivé"
  });
});

// ==========================================
// PAGE ADMIN
// ==========================================

app.get("/admin", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">

    <head>
      <meta charset="UTF-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      >

      <title>ARIS IPTV - Administration</title>

      <style>
        body {
          margin: 0;
          background: #07111f;
          color: white;
          font-family: Arial, sans-serif;
        }

        header {
          padding: 25px;
          text-align: center;
          background: #0d1b2a;
        }

        header h1 {
          margin: 0;
        }

        .container {
          max-width: 1000px;
          margin: 30px auto;
          padding: 20px;
        }

        .cards {
          display: grid;
          grid-template-columns:
            repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .card {
          background: #102235;
          padding: 25px;
          border-radius: 12px;
          box-shadow:
            0 4px 20px rgba(0,0,0,0.25);
        }

        .number {
          font-size: 32px;
          font-weight: bold;
        }

        .online {
          color: #36d399;
          font-weight: bold;
        }
      </style>
    </head>

    <body>

      <header>
        <h1>ARIS IPTV</h1>
        <p>Administration</p>
      </header>

      <div class="container">

        <div class="cards">

          <div class="card">
            <h2>Utilisateurs</h2>
            <div class="number">
              ${users.length}
            </div>
          </div>

          <div class="card">
            <h2>Codes d'activation</h2>
            <div class="number">
              ${activationCodes.length}
            </div>
          </div>

          <div class="card">
            <h2>Appareils</h2>
            <div class="number">
              ${devices.length}
            </div>
          </div>

          <div class="card">
            <h2>Serveur</h2>
            <p class="online">
              ● ONLINE
            </p>
          </div>

        </div>

      </div>

    </body>

    </html>
  `);
});

// ==========================================
// GESTION DES ERREURS
// ==========================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur"
  });
});

// ==========================================
// ROUTE 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    path: req.originalUrl
  });
});

// ==========================================
// DÉMARRAGE DU SERVEUR
// ==========================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `ARIS IPTV API listening on port ${PORT}`
  );
});
