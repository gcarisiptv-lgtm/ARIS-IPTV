const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Page d'accueil
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
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #06142e, #0b3d91);
          font-family: Arial, sans-serif;
          color: white;
        }

        .box {
          width: 90%;
          max-width: 420px;
          padding: 35px;
          text-align: center;
          background: rgba(0,0,0,0.35);
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.4);
        }

        h1 {
          font-size: 42px;
          margin-bottom: 10px;
        }

        p {
          color: #ddd;
          margin-bottom: 30px;
        }

        input {
          width: 100%;
          box-sizing: border-box;
          padding: 14px;
          margin: 8px 0;
          border: none;
          border-radius: 10px;
          font-size: 16px;
        }

        button {
          width: 100%;
          padding: 14px;
          margin-top: 15px;
          border: none;
          border-radius: 10px;
          background: #d4af37;
          color: #111;
          font-size: 17px;
          font-weight: bold;
          cursor: pointer;
        }

        button:hover {
          background: #f0c94b;
        }

        #message {
          margin-top: 20px;
          min-height: 20px;
        }
      </style>
    </head>

    <body>
      <div class="box">
        <h1>ARIS IPTV</h1>
        <p>Connexion à votre espace IPTV</p>

        <input
          id="username"
          type="text"
          placeholder="Username"
        >

        <input
          id="password"
          type="password"
          placeholder="Password"
        >

        <button onclick="login()">CONNEXION</button>

        <div id="message"></div>
      </div>

      <script>
        async function login() {
          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;
          const message = document.getElementById("message");

          if (!username || !password) {
            message.innerHTML = "Veuillez remplir tous les champs.";
            return;
          }

          try {
            const response = await fetch("/api/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                username: username,
                password: password
              })
            });

            const data = await response.json();

            if (data.success) {
              message.innerHTML = "Connexion réussie.";
              localStorage.setItem("aris_token", data.token);
            } else {
              message.innerHTML = data.message || "Identifiants incorrects.";
            }

          } catch (error) {
            message.innerHTML = "Erreur de connexion au serveur.";
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Test API
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    app: "ARIS IPTV",
    status: "online"
  });
});

// Connexion
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Identifiants de test
  const USERNAME = process.env.ADMIN_USERNAME || "admin";
  const PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

  if (username === USERNAME && password === PASSWORD) {
    return res.json({
      success: true,
      message: "Connexion réussie",
      token: "ARIS-" + Date.now()
    });
  }

  return res.status(401).json({
    success: false,
    message: "Username ou password incorrect."
  });
});

// Page admin
app.get("/admin", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ARIS IPTV - Administration</title>
      <style>
        body {
          margin: 0;
          padding: 30px;
          background: #07152f;
          color: white;
          font-family: Arial, sans-serif;
        }

        .container {
          max-width: 900px;
          margin: auto;
        }

        h1 {
          color: #d4af37;
        }

        .card {
          margin-top: 20px;
          padding: 25px;
          background: #10254a;
          border-radius: 15px;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <h1>ARIS IPTV — Administration</h1>

        <div class="card">
          <h2>Serveur</h2>
          <p>Statut : <strong>EN LIGNE</strong></p>
        </div>

        <div class="card">
          <h2>API</h2>
          <p>Endpoint : /api/status</p>
        </div>

        <div class="card">
          <h2>Utilisateurs</h2>
          <p>Gestion des utilisateurs disponible dans la prochaine étape.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur"
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(ARIS IPTV API listening on port ${PORT});
});
