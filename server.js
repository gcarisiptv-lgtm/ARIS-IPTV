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
   =====…
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(${APP_NAME} API listening on port ${PORT});
});
console.log(${APP_NAME} API listening on port ${PORT});
console.log(${APP_NAME} API listening on port ${PORT});
const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const APP_NAME = "ARIS-IPTV";
const APP_VERSION = "1.0.0";

// ===============================
// CONFIGURATION
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Autoriser les requêtes depuis l'application Android
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
    return res.sendStatus(200);
  }

  next();
});

// ===============================
// PAGE D'ACCUEIL
// ===============================

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
          display: flex;
          align-items: center;
          justify-content: center;
          background: #07111f;
          color: white;
          font-family: Arial, sans-serif;
          text-align: center;
        }

        .box {
          padding: 40px;
          border-radius: 20px;
          background: #101d30;
          box-shadow: 0 0 30px rgba(0,0,0,.4);
        }

        h1 {
          margin-bottom: 10px;
          font-size: 36px;
        }

        .ok {
          color: #00d084;
          font-weight: bold;
        }

        .version {
          color: #aaa;
          margin-top: 15px;
        }
      </style>
    </head>

    <body>
      <div class="box">
        <h1>🦁 ${APP_NAME}</h1>
        <p class="ok">● API ONLINE</p>
        <p>Serveur opérationnel</p>
        <p class="version">Version ${APP_VERSION}</p>
      </div>
    </body>
    </html>
  `);
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "online",
    app: APP_NAME,
    version: APP_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ===============================
// INFORMATIONS API
// ===============================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    app: APP_NAME,
    version: APP_VERSION,
    message: "ARIS-IPTV API fonctionne correctement.",
    endpoints: [
      "GET /",
      "GET /health",
      "GET /api",
      "POST /api/login",
      "POST /api/activate",
      "POST /api/device"
    ]
  });
});

// ===============================
// LOGIN
// ===============================

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password sont obligatoires."
    });
  }

  // Pour le moment, le serveur vérifie uniquement
  // que les identifiants ont été fournis.
  //
  // La connexion à une vraie base de données
  // pourra être ajoutée ensuite.

  return res.status(200).json({
    success: true,
    message: "Connexion acceptée.",
    user: {
      username: username
    },
    app: APP_NAME
  });
});

// ===============================
// ACTIVATION PAR CODE
// ===============================

app.post("/api/activate", (req, res) => {
  const { code, deviceId } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation obligatoire."
    });
  }

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Device ID obligatoire."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Code reçu par le serveur.",
    activation: {
      code: code,
      deviceId: deviceId,
      status: "pending"
    }
  });
});

// ===============================
// ENREGISTREMENT APPAREIL
// ===============================

app.post("/api/device", (req, res) => {
  const {
    deviceId,
    deviceName,
    model,
    androidVersion
  } = req.body;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Device ID obligatoire."
    });
  }

  return res.status(200).json({
    success: true,
    message: "Appareil enregistré.",
    device: {
      deviceId: deviceId,
      deviceName: deviceName || "Unknown",
      model: model || "Unknown",
      androidVersion: androidVersion || "Unknown"
    }
  });
});

// ===============================
// TEST MULTI-DNS
// ===============================

app.get("/api/dns", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Multi-DNS disponible.",
    dns: []
  });
});

// ===============================
// ERREUR 404
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route introuvable.",
    path: req.originalUrl
  });
});

// ===============================
// DÉMARRAGE SERVEUR
// ===============================

app.listen(PORT, "0.0.0.0", () => {
  console.log(${APP_NAME} API listening on port ${PORT});
  console.log(${APP_NAME} version ${APP_VERSION});
});
