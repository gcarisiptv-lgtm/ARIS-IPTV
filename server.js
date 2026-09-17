const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;


// =====================================
// CONFIGURATION
// =====================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
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

  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {

    return res.status(401).json({
      success: false,
      message: "Token admin manquant"
    });
  }

  const token =
    authorization.substring(7).trim();

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

app.get("/", function (req, res) {

  const indexPath =
    path.join(__dirname, "index.html");

  res.sendFile(indexPath, function (err) {

    if (err) {

      res.send(
        "<!DOCTYPE html>" +
        "<html lang='fr'>" +
        "<head>" +
        "<meta charset='UTF-8'>" +
        "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
        "<title>ARIS IPTV</title>" +
        "<style>" +
        "body{margin:0;background:#07111f;color:white;font-family:Arial;text-align:center;}" +
        ".box{max-width:700px;margin:100px auto;padding:40px;}" +
        "h1{font-size:42px;}" +
        "p{color:#b9c3d0;font-size:18px;}" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<div class='box'>" +
        "<h1>ARIS IPTV</h1>" +
        "<p>Serveur API opérationnel</p>" +
        "<p>ARIS IPTV PRO</p>" +
        "</div>" +
        "</body>" +
        "</html>"
      );

    }

  });

});


// =====================================
// API PRINCIPALE
// =====================================

app.get("/api", function (req, res) {

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

app.get("/health", function (req, res) {

  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });

});


app.get("/api/health", function (req, res) {

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

app.get("/api/status", function (req, res) {

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
  function (req, res) {

    const activeUsers =
      users.filter(function (user) {
        return user.active;
      }).length;

    const activeCodes =
      activationCodes.filter(function (code) {
        return code.active;
      }).length;

    const activeDevices =
      devices.filter(function (device) {
        return device.active;
      }).length;

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

      users: users.map(function (user) {

        return {
          id: user.id,
          username: user.username,
          active: user.active
        };

      }),

      devices: devices,

      codes: activationCodes.map(function (code) {

        return {
          code: code.code,
          active: code.active,
          device: code.device
        };

      }),

      timestamp:
        new Date().toISOString()

    });

  }
);


// =====================================
// TEST ADMIN
// =====================================

app.get(
  "/api/admin/test",
  adminAuth,
  function (req, res) {

    res.json({

      success: true,

      message:
        "Authentification admin réussie",

      service:
        "ARIS IPTV"

    });

  }
);


// =====================================
// CONNEXION UTILISATEUR
// =====================================

app.post("/api/login", function (req, res) {

  const username =
    req.body.username;

  const password =
    req.body.password;

  if (!username || !password) {

    return res.status(400).json({

      success: false,

      message:
        "Username et password obligatoires"

    });

  }

  const user =
    users.find(function (item) {

      return (
        item.username === username &&
        item.password === password &&
        item.active === true
      );

    });

  if (!user) {

    return res.status(401).json({

      success: false,

      message:
        "Identifiants incorrects"

    });

  }

  res.json({

    success: true,

    message:
      "Connexion réussie",

    user: {

      id: user.id,

      username: user.username

    }

  });

});


// =====================================
// ACTIVATION
// =====================================

app.post("/api/activate", function (req, res) {

  const code =
    req.body.code;

  const deviceId =
    req.body.deviceId;

  if (!code) {

    return res.status(400).json({

      success: false,

      message:
        "Code d'activation obligatoire"

    });

  }

  const activation =
    activationCodes.find(function (item) {

      return (
        item.code === code &&
        item.active === true
      );

    });

  if (!activation) {

    return res.status(401).json({

      success: false,

      message:
        "Code d'activation invalide"

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

    activation.device =
      deviceId;

    const existingDevice =
      devices.find(function (device) {

        return (
          device.deviceId === deviceId
        );

      });

    if (!existingDevice) {

      devices.push({

        deviceId:
          deviceId,

        code:
          code,

        active:
          true,

        activatedAt:
          new Date().toISOString()

      });

    }

  }

  res.json({

    success: true,

    message:
      "Appareil activé avec succès",

    code:
      code,

    deviceId:
      deviceId || null

  });

});


// =====================================
// VÉRIFICATION CODE
// =====================================

app.post("/api/check-code", function (req, res) {

  const code =
    req.body.code;

  const activation =
    activationCodes.find(function (item) {

      return (
        item.code === code &&
        item.active === true
      );

    });

  if (!activation) {

    return res.json({

      success: false,

      valid: false,

      message:
        "Code invalide"

    });

  }

  res.json({

    success: true,

    valid: true,

    message:
      "Code valide"

  });

});


// =====================================
// 👤 VOIR LES UTILISATEURS
// =====================================

app.get(
  "/api/users",
  adminAuth,
  function (req, res) {

    res.json({

      success: true,

      users:
        users.map(function (user) {

          return {

            id:
              user.id,

            username:
              user.username,

            active:
              user.active

          };

        })

    });

  }
);


// =====================================
// ➕ CRÉER UN UTILISATEUR
// =====================================

app.post(
  "/api/users",
  adminAuth,
  function (req, res) {

    const username =
      String(req.body.username || "").trim();

    const password =
      String(req.body.password || "").trim();

    if (!username || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Username et password obligatoires"

      });

    }

    if (
      username.length < 3 ||
      password.length < 4
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Username minimum 3 caractères et password minimum 4 caractères"

      });

    }

    const existing =
      users.find(function (user) {

        return (
          user.username.toLowerCase() ===
          username.toLowerCase()
        );

      });

    if (existing) {

      return res.status(409).json({

        success: false,

        message:
          "Utilisateur déjà existant"

      });

    }

    let newId = 1;

    if (users.length > 0) {

      newId =
        Math.max.apply(
          null,
          users.map(function (user) {
            return user.id;
          })
        ) + 1;

    }

    const newUser = {

      id:
        newId,

      username:
        username,

      password:
        password,

      active:
        true

    };

    users.push(newUser);

    res.json({

      success: true,

      message:
        "Utilisateur créé avec succès",

      user: {

        id:
          newUser.id,

        username:
          newUser.username,

        active:
          newUser.active

      }

    });

  }
);


// =====================================
// 🟢 ACTIVER / 🔴 DÉSACTIVER
// =====================================

app.post(
  "/api/users/toggle",
  adminAuth,
  function (req, res) {

    const id =
      Number(req.body.id);

    const user =
      users.find(function (item) {

        return item.id === id;

      });

    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "Utilisateur introuvable"

      });

    }

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

        id:
          user.id,

        username:
          user.username,

        active:
          user.active

      }

    });

  }
);


// =====================================
// 🗑️ SUPPRIMER UTILISATEUR
// =====================================

app.delete(
  "/api/users/:id",
  adminAuth,
  function (req, res) {

    const id =
      Number(req.params.id);

    const index =
      users.findIndex(function (user) {

        return user.id === id;

      });

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

        id:
          deletedUser.id,

        username:
          deletedUser.username

      }

    });

  }
);


// =====================================
// 🔑 CODES
// =====================================

app.get(
  "/api/codes",
  adminAuth,
  function (req, res) {

    res.json({

      success: true,

      codes:
        activationCodes

    });

  }
);


app.post(
  "/api/codes",
  adminAuth,
  function (req, res) {

    const code =
      String(req.body.code || "").trim();

    if (!code) {

      return res.status(400).json({

        success: false,

        message:
          "Code obligatoire"

      });

    }

    const existing =
      activationCodes.find(function (item) {

        return item.code === code;

      });

    if (existing) {

      return res.status(409).json({

        success: false,

        message:
          "Ce code existe déjà"

      });

    }

    activationCodes.push({

      code:
        code,

      active:
        true,

      device:
        null,

      createdAt:
        new Date().toISOString()

    });

    res.json({

      success: true,

      message:
        "Code créé avec succès",

      code:
        code

    });

  }
);


// =====================================
// 📱 APPAREILS
// =====================================

app.get(
  "/api/devices",
  adminAuth,
  function (req, res) {

    res.json({

      success: true,

      devices:
        devices

    });

  }
);


app.post(
  "/api/devices/deactivate",
  adminAuth,
  function (req, res) {

    const deviceId =
      req.body.deviceId;

    const device =
      devices.find(function (item) {

        return (
          item.deviceId === deviceId
        );

      });

    if (!device) {

      return res.status(404).json({

        success: false,

        message:
          "Appareil introuvable"

      });

    }

    device.active =
      false;

    res.json({

      success: true,

      message:
        "Appareil désactivé"

    });

  }
);


// =====================================
// 🖥️ PANNEAU ADMIN
// =====================================

app.get("/admin", function (req, res) {

  const html = [

    "<!DOCTYPE html>",

    "<html lang='fr'>",

    "<head>",

    "<meta charset='UTF-8'>",

    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",

    "<title>ARIS IPTV - Administration</title>",

    "<style>",

    "*{box-sizing:border-box;}",

    "body{margin:0;background:#050b14;color:white;font-family:Arial,sans-serif;}",

    "header{background:#0a192a;padding:25px;text-align:center;border-bottom:1px solid #168bd0;}",

    "header h1{margin:0;font-size:32px;}",

    "header p{color:#8ccfff;}",

    ".container{max-width:1200px;margin:auto;padding:25px;}",

    ".stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin-bottom:25px;}",

    ".stat{background:#0c1d30;border:1px solid #176da3;border-radius:14px;padding:20px;}",

    ".stat-number{font-size:34px;font-weight:bold;color:#35b7ff;margin-top:8px;}",

    ".card{background:#0e1f32;border:1px solid #176da3;border-radius:16px;padding:22px;margin-bottom:25px;}",

    ".card h2{margin-top:0;}",

    "label{display:block;margin-top:10px;}",

    "input{width:100%;padding:13px;margin:6px 0 12px;border-radius:9px;border:1px solid #267cad;background:#071522;color:white;font-size:15px;}",

    "button{border:none;border-radius:9px;padding:11px 16px;cursor:pointer;font-weight:bold;margin:4px;}",

    ".btn-create{background:#168bd0;color:white;}",

    ".btn-refresh{background:#374b60;color:white;}",

    ".btn-toggle{background:#168bd0;color:white;}",

    ".btn-delete{background:#c0392b;color:white;}",

    "button:hover{opacity:.85;}",

    "table{width:100%;border-collapse:collapse;margin-top:15px;}",

    "th,td{padding:14px;border-bottom:1px solid #20384d;text-align:left;}",

    "th{color:#83cfff;}",

    ".badge{display:inline-block;padding:6px 10px;border-radius:20px;font-size:13px;font-weight:bold;}",

    ".active{background:#164f3b;color:#48e0a5;}",

    ".inactive{background:#512522;color:#ff8c82;}",

    ".message{margin-top:12px;padding:12px;border-radius:9px;display:none;}",

    ".success{background:#123d31;color:#55e2a5;}",

    ".error{background:#4a211f;color:#ff9d94;}",

    ".topbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}",

    "@media(max-width:700px){table{font-size:13px;}th,td{padding:9px;}.actions button{display:block;width:100%;}}",

    "</style>",

    "</head>",

    "<body>",

    "<header>",

    "<h1>🦁 ARIS IPTV</h1>",

    "<p>Administration</p>",

    "</header>",

    "<div class='container'>",

    "<div class='stats'>",

    "<div class='stat'>",

    "<div>👤 Utilisateurs</div>",

    "<div id='totalUsers' class='stat-number'>0</div>",

    "</div>",

    "<div class='stat'>",

    "<div>🟢 Utilisateurs actifs</div>",

    "<div id='activeUsers' class='stat-number'>0</div>",

    "</div>",

    "<div class='stat'>",

    "<div>🔑 Codes</div>",

    "<div id='totalCodes' class='stat-number'>0</div>",

    "</div>",

    "<div class='stat'>",

    "<div>📱 Appareils</div>",

    "<div id='totalDevices' class='stat-number'>0</div>",

    "</div>",

    "</div>",


    "<div class='card'>",

    "<h2>➕ Créer un utilisateur</h2>",

    "<label>Username</label>",

    "<input id='username' type='text' placeholder='Exemple : client01'>",

    "<label>Password</label>",

    "<input id='password' type='password' placeholder='Mot de passe'>",

    "<button class='btn-create' onclick='createUser()'>➕ CRÉER L'UTILISATEUR</button>",

    "<div id='message' class='message'></div>",

    "</div>",


    "<div class='card'>",

    "<div class='topbar'>",

    "<h2>👤 Gestion des utilisateurs</h2>",

    "<button class='btn-refresh' onclick='loadUsers()'>🔄 ACTUALISER LA LISTE</button>",

    "</div>",

    "<div id='usersContainer'>Chargement...</div>",

    "</div>",


    "<div class='card'>",

    "<h2>🔑 Codes d'activation</h2>",

    "<div id='codesContainer'>Chargement...</div>",

    "</div>",


    "<div class='card'>",

    "<h2>📱 Appareils</h2>",

    "<div id='devicesContainer'>Chargement...</div>",

    "</div>",

    "</div>",


    "<script>",

    "var adminToken=localStorage.getItem('aris_admin_token');",

    "if(!adminToken){",

    "adminToken=prompt('Token administrateur ARIS IPTV :');",

    "if(adminToken){localStorage.setItem('aris_admin_token',adminToken);}",

    "}",


    "async function api(url,options){",

    "options=options||{};",

    "options.headers=Object.assign({},options.headers||{}, {",

    "'Content-Type':'application/json',",

    "'Authorization':'Bearer '+adminToken",

    "});",

    "var response=await fetch(url,options);",

    "var data=await response.json();",

    "if(!response.ok){throw new Error(data.message||'Erreur serveur');}",

    "return data;",

    "}",


    "function escapeHtml(value){",

    "return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');",

    "}",


    "function showMessage(text,type){",

    "var box=document.getElementById('message');",

    "box.textContent=text;",

    "box.className='message '+(type||'success');",

    "box.style.display='block';",

    "}",


    "async function createUser(){",

    "var username=document.getElementById('username').value.trim();",

    "var password=document.getElementById('password').value.trim();",

    "if(!username||!password){showMessage('Username et password obligatoires','error');return;}",

    "try{",

    "var data=await api('/api/users',{method:'POST',body:JSON.stringify({username:username,password:password})});",

    "showMessage('✅ '+data.message,'success');",

    "document.getElementById('username').value='';",

    "document.getElementById('password').value='';",

    "await loadUsers();",

    "}catch(error){showMessage('❌ '+error.message,'error');}",

    "}",


    "async function loadUsers(){",

    "var container=document.getElementById('usersContainer');",

    "container.innerHTML='Chargement...';",

    "try{",

    "var data=await api('/api/users');",

    "var users=data.users||[];",

    "document.getElementById('totalUsers').textContent=users.length;",

    "document.getElementById('activeUsers').textContent=users.filter(function(user){return user.active;}).length;",

    "if(users.length===0){container.innerHTML='<p>Aucun utilisateur.</p>';return;}",

    "var html='<table><thead><tr><th>ID</th><th>Username</th><th>État</th><th>Actions</th></tr></thead><tbody>';",

    "users.forEach(function(user){",

    "html+='<tr>';",

    "html+='<td>'+user.id+'</td>';",

    "html+='<td><strong>'+escapeHtml(user.username)+'</strong></td>';",

    "if(user.active){",

    "html+='<td><span class=\"badge active\">🟢 ACTIF</span></td>';",

    "}else{",

    "html+='<td><span class=\"badge inactive\">🔴 INACTIF</span></td>';",

    "}",

    "html+='<td class=\"actions\">';",

    "if(user.username==='admin'){",

    "html+='<strong>🔒 Compte principal</strong>';",

    "}else{",

    "if(user.active){",

    "html+='<button class=\"btn-toggle\" onclick=\"toggleUser('+user.id+')\">🔴 Désactiver</button>';",

    "}else{",

    "html+='<button class=\"btn-toggle\" onclick=\"toggleUser('+user.id+')\">🟢 Activer</button>';",

    "}",

    "html+='<button class=\"btn-delete\" onclick=\"deleteUser('+user.id+')\">🗑️ Supprimer</button>';",

    "}",

    "html+='</td>';",

    "html+='</tr>';",

    "});",

    "html+='</tbody></table>';",

    "container.innerHTML=html;",

    "}catch(error){",

    "container.innerHTML='<p>❌ '+escapeHtml(error.message)+'</p>';",

    "}",

    "}",


    "async function toggleUser(id){",

    "try{",

    "var data=await api('/api/users/toggle',{method:'POST',body:JSON.stringify({id:id})});",

    "alert('✅ '+data.message);",

    "await loadUsers();",

    "}catch(error){alert('❌ '+error.message);}",

    "}",


    "async function deleteUser(id){",

    "if(!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')){return;}",

    "try{",

    "var data=await api('/api/users/'+id,{method:'DELETE'});",

    "alert('✅ '+data.message);",

    "await loadUsers();",

    "}catch(error){alert('❌ '+error.message);}",

    "}",


    "async function loadCodes(){",

    "var container=document.getElementById('codesContainer');",

    "try{",

    "var data=await api('/api/codes');",

    "var codes=data.codes||[];",

    "document.getElementById('totalCodes').textContent=codes.length;",

    "if(!codes.length){container.innerHTML='<p>Aucun code.</p>';return;}",

    "var html='<table><tr><th>Code</th><th>État</th><th>Appareil</th></tr>';",

    "codes.forEach(function(code){",

    "html+='<tr>';",

    "html+='<td><strong>'+escapeHtml(code.code)+'</strong></td>';",

    "if(code.active){",

    "html+='<td><span class=\"badge active\">🟢 ACTIF</span></td>';",

    "}else{",

    "html+='<td><span class=\"badge inactive\">🔴 INACTIF</span></td>';",

    "}",

    "html+='<td>'+escapeHtml(code.device||'Non utilisé')+'</td>';",

    "html+='</tr>';",

    "});",

    "html+='</table>';",

    "container.innerHTML=html;",

    "}catch(error){",

    "container.innerHTML='<p>❌ '+escapeHtml(error.message)+'</p>';",

    "}",

    "}",


    "async function loadDevices(){",

    "var container=document.getElementById('devicesContainer');",

    "try{",

    "var data=await api('/api/devices');",

    "var devices=data.devices||[];",

    "document.getElementById('totalDevices').textContent=devices.length;",

    "if(!devices.length){container.innerHTML='<p>Aucun appareil connecté.</p>';return;}",

    "var html='<table><tr><th>Device ID</th><th>Code</th><th>État</th></tr>';",

    "devices.forEach(function(device){",

    "html+='<tr>';",

    "html+='<td>'+escapeHtml(device.deviceId)+'</td>';",

    "html+='<td>'+escapeHtml(device.code)+'</td>';",

    "if(device.active){",

    "html+='<td><span class=\"badge active\">🟢 ACTIF</span></td>';",

    "}else{",

    "html+='<td><span class=\"badge inactive\">🔴 INACTIF</span></td>';",

    "}",

    "html+='</tr>';",

    "});",

    "html+='</table>';",

    "container.innerHTML=html;",

    "}catch(error){",

    "container.innerHTML='<p>❌ '+escapeHtml(error.message)+'</p>';",

    "}",

    "}",


    "async function loadAll(){",

    "await loadUsers();",

    "await loadCodes();",

    "await loadDevices();",

    "}",


    "loadAll();",

    "</script>",

    "</body>",

    "</html>"

  ].join("\n");

  res.send(html);

});


// =====================================
// ERREURS
// =====================================

app.use(function (err, req, res, next) {

  console.error(err);

  res.status(500).json({

    success: false,

    message:
      "Erreur interne du serveur"

  });

});


// =====================================
// ROUTE 404
// =====================================

app.use(function (req, res) {

  res.status(404).json({

    success: false,

    message:
      "Route introuvable",

    path:
      req.originalUrl

  });

});


// =====================================
// DÉMARRAGE SERVEUR
// =====================================

app.listen(
  PORT,
  "0.0.0.0",
  function () {

    console.log(
      "ARIS IPTV API listening on port " +
      PORT
    );

  }
);
