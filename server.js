const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function(req, res, next) {
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
    id: 1,
    code: "ARIS-2026",
    active: true,
    device: null,
    createdAt: new Date().toISOString()
  }
];

const devices = [];

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

function htmlEscape(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateCode() {
  let code = "";

  do {
    const part1 = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    const part2 = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    code = "ARIS-" + part1 + "-" + part2;

  } while (
    activationCodes.some(function(item) {
      return item.code === code;
    })
  );

  return code;
}


/* =========================================================
   ACCUEIL
   ========================================================= */

app.get("/", function(req, res) {
  res.send(
    "<!DOCTYPE html>" +
    "<html lang='fr'>" +
    "<head>" +
    "<meta charset='UTF-8'>" +
    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
    "<title>ARIS IPTV</title>" +
    "<style>" +
    "body{margin:0;background:#050b14;color:white;font-family:Arial;text-align:center}" +
    ".box{margin:100px auto;max-width:700px;padding:40px}" +
    "h1{font-size:42px;color:#ffd52e}" +
    "p{font-size:18px;color:#b8c7d9}" +
    "</style>" +
    "</head>" +
    "<body>" +
    "<div class='box'>" +
    "<h1>🦁 ARIS IPTV</h1>" +
    "<p>Serveur API opérationnel</p>" +
    "<p>ARIS IPTV PRO</p>" +
    "</div>" +
    "</body>" +
    "</html>"
  );
});


/* =========================================================
   API STATUS
   ========================================================= */

app.get("/api", function(req, res) {
  res.json({
    success: true,
    name: "ARIS IPTV",
    message: "ARIS IPTV API fonctionne correctement",
    status: "online"
  });
});

app.get("/health", function(req, res) {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", function(req, res) {
  res.json({
    success: true,
    service: "ARIS IPTV",
    status: "online",
    message: "Backend accessible",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/status", function(req, res) {
  res.json({
    success: true,
    name: "ARIS IPTV",
    status: "online",
    timestamp: new Date().toISOString()
  });
});


/* =========================================================
   CONNEXION APPLICATION
   ========================================================= */

app.post("/api/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const user = users.find(function(item) {
    return (
      item.username === username &&
      item.password === password &&
      item.active === true
    );
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Identifiants incorrects"
    });
  }

  res.json({
    success: true,
    message: "Connexion réussie",
    token: ADMIN_TOKEN,
    user: {
      id: user.id,
      username: user.username,
      active: user.active
    }
  });
});


/* =========================================================
   ACTIVATION APPAREIL
   ========================================================= */

app.post("/api/activate", function(req, res) {
  const code = req.body.code;
  const deviceId = req.body.deviceId;
  const deviceName = req.body.deviceName || "Android TV";
  const platform = req.body.platform || "Android TV";

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code d'activation obligatoire"
    });
  }

  const activation = activationCodes.find(function(item) {
    return (
      item.code === code &&
      item.active === true
    );
  });

  if (!activation) {
    return res.status(401).json({
      success: false,
      message: "Code d'activation invalide ou désactivé"
    });
  }

  if (
    activation.device &&
    activation.device !== deviceId
  ) {
    return res.status(403).json({
      success: false,
      message: "Ce code est déjà associé à un autre appareil"
    });
  }

  if (deviceId) {
    activation.device = deviceId;

    const existingDevice = devices.find(function(item) {
      return item.deviceId === deviceId;
    });

    if (existingDevice) {
      existingDevice.active = true;
      existingDevice.code = code;
      existingDevice.deviceName = deviceName;
      existingDevice.platform = platform;
    } else {
      devices.push({
        id: devices.length + 1,
        deviceId: deviceId,
        deviceName: deviceName,
        platform: platform,
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


app.post("/api/check-code", function(req, res) {
  const code = req.body.code;

  const activation = activationCodes.find(function(item) {
    return (
      item.code === code &&
      item.active === true
    );
  });

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
    device: activation.device
  });
});


/* =========================================================
   UTILISATEURS
   ========================================================= */

app.get("/api/users", adminAuth, function(req, res) {
  res.json({
    success: true,
    users: users.map(function(user) {
      return {
        id: user.id,
        username: user.username,
        active: user.active
      };
    })
  });
});


app.post("/api/users", adminAuth, function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username et password obligatoires"
    });
  }

  const existing = users.find(function(user) {
    return user.username === username;
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Utilisateur déjà existant"
    });
  }

  const newUser = {
    id: users.length
      ? Math.max.apply(
          null,
          users.map(function(item) {
            return item.id;
          })
        ) + 1
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


app.post("/api/users/activate", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const user = users.find(function(item) {
    return item.id === id;
  });

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


app.post("/api/users/deactivate", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const user = users.find(function(item) {
    return item.id === id;
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable"
    });
  }

  if (user.username === "admin") {
    return res.status(400).json({
      success: false,
      message: "Le compte principal ne peut pas être désactivé"
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


app.post("/api/users/delete", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const index = users.findIndex(function(item) {
    return item.id === id;
  });

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur introuvable"
    });
  }

  if (users[index].username === "admin") {
    return res.status(400).json({
      success: false,
      message: "Le compte principal ne peut pas être supprimé"
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


/* =========================================================
   CODES
   ========================================================= */

app.get("/api/codes", adminAuth, function(req, res) {
  res.json({
    success: true,
    codes: activationCodes
  });
});


app.post("/api/codes", adminAuth, function(req, res) {
  const code = String(req.body.code || "")
    .trim()
    .toUpperCase();

  if (!code) {
    return res.status(400).json({
      success: false,
      message: "Code obligatoire"
    });
  }

  const existing = activationCodes.find(function(item) {
    return item.code === code;
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "Ce code existe déjà"
    });
  }

  const newCode = {
    id: activationCodes.length
      ? Math.max.apply(
          null,
          activationCodes.map(function(item) {
            return item.id;
          })
        ) + 1
      : 1,
    code: code,
    active: true,
    device: null,
    createdAt: new Date().toISOString()
  };

  activationCodes.push(newCode);

  res.json({
    success: true,
    message: "Code créé avec succès",
    code: newCode
  });
});


app.post("/api/codes/generate", adminAuth, function(req, res) {
  const code = generateCode();

  const newCode = {
    id: activationCodes.length
      ? Math.max.apply(
          null,
          activationCodes.map(function(item) {
            return item.id;
          })
        ) + 1
      : 1,
    code: code,
    active: true,
    device: null,
    createdAt: new Date().toISOString()
  };

  activationCodes.push(newCode);

  res.json({
    success: true,
    message: "Code généré avec succès",
    code: newCode
  });
});


app.post("/api/codes/activate", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const item = activationCodes.find(function(code) {
    return code.id === id;
  });

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


app.post("/api/codes/deactivate", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const item = activationCodes.find(function(code) {
    return code.id === id;
  });

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


app.post("/api/codes/delete", adminAuth, function(req, res) {
  const id = Number(req.body.id);

  const index = activationCodes.findIndex(function(code) {
    return code.id === id;
  });

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Code introuvable"
    });
  }

  const deleted = activationCodes[index];

  if (deleted.device) {
    const device = devices.find(function(item) {
      return item.deviceId === deleted.device;
    });

    if (device) {
      const deviceIndex = devices.indexOf(device);
      devices.splice(deviceIndex, 1);
    }
  }

  activationCodes.splice(index, 1);

  res.json({
    success: true,
    message: "Code supprimé",
    code: deleted
  });
});


/* =========================================================
   APPAREILS
   ========================================================= */

app.get("/api/devices", adminAuth, function(req, res) {
  res.json({
    success: true,
    devices: devices
  });
});


app.post("/api/devices/activate", adminAuth, function(req, res) {
  const deviceId = req.body.deviceId;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Device ID obligatoire"
    });
  }

  const device = devices.find(function(item) {
    return item.deviceId === deviceId;
  });

  if (!device) {
    return res.status(404).json({
      success: false,
      message: "Appareil introuvable"
    });
  }

  device.active = true;

  if (device.code) {
    const code = activationCodes.find(function(item) {
      return item.code === device.code;
    });

    if (code) {
      code.active = true;
      code.device = device.deviceId;
    }
  }

  res.json({
    success: true,
    message: "Appareil activé avec succès",
    device: device
  });
});


app.post("/api/devices/deactivate", adminAuth, function(req, res) {
  const deviceId = req.body.deviceId;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Device ID obligatoire"
    });
  }

  const device = devices.find(function(item) {
    return item.deviceId === deviceId;
  });

  if (!device) {
    return res.status(404).json({
      success: false,
      message: "Appareil introuvable"
    });
  }

  device.active = false;

  res.json({
    success: true,
    message: "Appareil désactivé avec succès",
    device: device
  });
});


app.post("/api/devices/delete", adminAuth, function(req, res) {
  const deviceId = req.body.deviceId;

  if (!deviceId) {
    return res.status(400).json({
      success: false,
      message: "Device ID obligatoire"
    });
  }

  const index = devices.findIndex(function(item) {
    return item.deviceId === deviceId;
  });

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Appareil introuvable"
    });
  }

  const deleted = devices[index];

  const activation = activationCodes.find(function(item) {
    return item.code === deleted.code;
  });

  if (activation) {
    activation.device = null;
  }

  devices.splice(index, 1);

  res.json({
    success: true,
    message: "Appareil supprimé avec succès",
    device: deleted
  });
});


/* =========================================================
   ADMIN OVERVIEW
   ========================================================= */

app.get("/api/admin/overview", adminAuth, function(req, res) {
  const activeUsers = users.filter(function(user) {
    return user.active;
  }).length;

  const activeCodes = activationCodes.filter(function(code) {
    return code.active;
  }).length;

  const activeDevices = devices.filter(function(device) {
    return device.active;
  }).length;

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

    users: users.map(function(user) {
      return {
        id: user.id,
        username: user.username,
        active: user.active
      };
    }),

    codes: activationCodes,

    devices: devices,

    timestamp: new Date().toISOString()
  });
});


app.get("/api/admin/test", adminAuth, function(req, res) {
  res.json({
    success: true,
    message: "Authentification admin réussie",
    service: "ARIS IPTV"
  });
});


/* =========================================================
   PAGE ADMIN
   ========================================================= */

app.get("/admin", function(req, res) {

  const html = [
    "<!DOCTYPE html>",
    "<html lang='fr'>",
    "<head>",
    "<meta charset='UTF-8'>",
    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>",
    "<title>ARIS IPTV - Administration</title>",

    "<style>",

    "body{margin:0;background:#050b14;color:#fff;font-family:Arial,sans-serif}",

    "header{background:#091a2b;padding:28px;text-align:center;border-bottom:1px solid #1597e5}",

    "header h1{margin:0;font-size:34px}",

    "header p{color:#42a5f5;font-size:17px}",

    ".container{max-width:1200px;margin:30px auto;padding:20px}",

    ".card{background:#0d2034;border:1px solid #1597e5;border-radius:16px;padding:25px;margin-bottom:25px}",

    "h2{margin-top:0}",

    "input{width:100%;box-sizing:border-box;padding:14px;margin:8px 0 14px;background:#071522;color:#fff;border:1px solid #1597e5;border-radius:8px}",

    "button{border:0;border-radius:8px;padding:11px 15px;margin:4px;color:#fff;font-weight:bold;cursor:pointer}",

    ".blue{background:#1597e5}",

    ".green{background:#0b9f59}",

    ".red{background:#d9342b}",

    ".purple{background:#8d43b9}",

    ".gray{background:#40556b}",

    ".status{margin-top:12px;color:#42e69a;font-weight:bold}",

    "table{width:100%;border-collapse:collapse;margin-top:20px}",

    "th{color:#42a5f5;text-align:left;padding:13px 8px;border-bottom:1px solid #24435d}",

    "td{padding:13px 8px;border-bottom:1px solid #24435d}",

    ".active{display:inline-block;padding:7px 12px;border-radius:20px;background:#075c3d;color:#39ed9b;font-weight:bold}",

    ".inactive{display:inline-block;padding:7px 12px;border-radius:20px;background:#5d1717;color:#ff7777;font-weight:bold}",

    ".code{color:#ffd52e;font-weight:bold}",

    ".device{font-family:monospace;color:#ffd52e}",

    ".empty{text-align:center;color:#9eb0c2;padding:25px}",

    ".stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px}",

    ".stat{background:#0d2034;border:1px solid #1597e5;border-radius:14px;padding:20px}",

    ".stat strong{display:block;font-size:32px;color:#36a9ff;margin-top:8px}",

    "@media(max-width:800px){.stats{grid-template-columns:1fr 1fr}table{font-size:12px}button{padding:9px}}",

    "</style>",

    "</head>",

    "<body>",

    "<header>",
    "<h1>🦁 ARIS IPTV</h1>",
    "<p>Administration</p>",
    "</header>",

    "<div class='container'>",

    "<div class='card'>",
    "<h2>🔐 Connexion administrateur</h2>",
    "<input id='adminToken' type='password' placeholder='Token administrateur'>",
    "<button class='blue' onclick='saveToken()'>🔐 ENREGISTRER LE TOKEN</button>",
    "<div id='tokenStatus' class='status'></div>",
    "</div>",

    "<div class='stats'>",

    "<div class='stat'>👤 Utilisateurs<strong id='statUsers'>0</strong></div>",

    "<div class='stat'>🟢 Utilisateurs actifs<strong id='statActiveUsers'>0</strong></div>",

    "<div class='stat'>🔑 Codes<strong id='statCodes'>0</strong></div>",

    "<div class='stat'>📱 Appareils<strong id='statDevices'>0</strong></div>",

    "</div>",


    "<div class='card'>",
    "<h2>👤 Créer un utilisateur</h2>",

    "<input id='newUsername' type='text' placeholder='Username'>",

    "<input id='newPassword' type='password' placeholder='Password'>",

    "<button class='blue' onclick='createUser()'>➕ CRÉER L'UTILISATEUR</button>",

    "<button class='gray' onclick='loadAll()'>🔄 ACTUALISER</button>",

    "<div id='userStatus' class='status'></div>",

    "</div>",


    "<div class='card'>",

    "<h2>👤 Gestion des utilisateurs</h2>",

    "<button class='gray' onclick='loadUsers()'>🔄 ACTUALISER LA LISTE</button>",

    "<table>",

    "<thead>",
    "<tr>",
    "<th>ID</th>",
    "<th>Username</th>",
    "<th>État</th>",
    "<th>Actions</th>",
    "</tr>",
    "</thead>",

    "<tbody id='usersTable'>",
    "<tr><td colspan='4' class='empty'>Chargement...</td></tr>",
    "</tbody>",

    "</table>",
    "</div>",


    "<div class='card'>",

    "<h2>🔑 Créer un code d'activation</h2>",

    "<input id='newCode' type='text' placeholder='Exemple : ARIS-CLIENT-001'>",

    "<button class='blue' onclick='createCode()'>➕ CRÉER LE CODE</button>",

    "<button class='purple' onclick='generateCode()'>🎲 GÉNÉRER AUTOMATIQUEMENT</button>",

    "<div id='codeStatus' class='status'></div>",

    "</div>",


    "<div class='card'>",

    "<h2>🔑 Gestion des codes</h2>",

    "<button class='gray' onclick='loadCodes()'>🔄 ACTUALISER LA LISTE</button>",

    "<table>",

    "<thead>",
    "<tr>",
    "<th>ID</th>",
    "<th>Code</th>",
    "<th>État</th>",
    "<th>Appareil associé</th>",
    "<th>Actions</th>",
    "</tr>",
    "</thead>",

    "<tbody id='codesTable'>",
    "<tr><td colspan='5' class='empty'>Chargement...</td></tr>",
    "</tbody>",

    "</table>",
    "</div>",


    "<div class='card'>",

    "<h2>📱 Gestion des appareils</h2>",

    "<button class='gray' onclick='loadDevices()'>🔄 ACTUALISER LES APPAREILS</button>",

    "<table>",

    "<thead>",
    "<tr>",
    "<th>ID</th>",
    "<th>Device ID</th>",
    "<th>Appareil</th>",
    "<th>Plateforme</th>",
    "<th>Code associé</th>",
    "<th>État</th>",
    "<th>Actions</th>",
    "</tr>",
    "</thead>",

    "<tbody id='devicesTable'>",
    "<tr><td colspan='7' class='empty'>Chargement...</td></tr>",
    "</tbody>",

    "</table>",
    "</div>",

    "</div>",


    "<script>",

    "let token=localStorage.getItem('aris_admin_token')||'';",

    "document.getElementById('adminToken').value=token;",


    "function saveToken(){",
    "token=document.getElementById('adminToken').value.trim();",
    "localStorage.setItem('aris_admin_token',token);",
    "document.getElementById('tokenStatus').textContent='✓ Token enregistré';",
    "loadAll();",
    "}",


    "async function api(url,options){",
    "options=options||{};",
    "options.headers=Object.assign({},options.headers||{},{
      'Content-Type':'application/json',
      'Authorization':'Bearer '+token
    });",
    "const response=await fetch(url,options);",
    "return await response.json();",
    "}",


    "async function loadAll(){",
    "await loadUsers();",
    "await loadCodes();",
    "await loadDevices();",
    "await loadStats();",
    "}",


    "async function loadStats(){",
    "try{",
    "const data=await api('/api/admin/overview');",
    "if(data.success&&data.statistics){",
    "document.getElementById('statUsers').textContent=data.statistics.users;",
    "document.getElementById('statActiveUsers').textContent=data.statistics.activeUsers;",
    "document.getElementById('statCodes').textContent=data.statistics.activationCodes;",
    "document.getElementById('statDevices').textContent=data.statistics.devices;",
    "}",
    "}catch(e){}",
    "}",


    "async function createUser(){",
    "const username=document.getElementById('newUsername').value.trim();",
    "const password=document.getElementById('newPassword').value;",
    "if(!username||!password){alert('Username et password obligatoires');return;}",
    "const data=await api('/api/users',{method:'POST',body:JSON.stringify({username:username,password:password})});",
    "document.getElementById('userStatus').textContent=data.message||'Opération terminée';",
    "if(data.success){document.getElementById('newUsername').value='';document.getElementById('newPassword').value='';}",
    "await loadUsers();",
    "await loadStats();",
    "}",


    "async function loadUsers(){",
    "try{",
    "const data=await api('/api/users');",
    "if(!data.success){document.getElementById('usersTable').innerHTML='<tr><td colspan=\"4\" class=\"empty\">'+(data.message||'Erreur')+'</td></tr>';return;}",
    "const table=document.getElementById('usersTable');",
    "table.innerHTML='';",
    "if(!data.users.length){table.innerHTML='<tr><td colspan=\"4\" class=\"empty\">Aucun utilisateur</td></tr>';return;}",
    "data.users.forEach(function(user){",
    "let state=user.active?'<span class=\"active\">🟢 ACTIF</span>':'<span class=\"inactive\">🔴 INACTIF</span>';",
    "let actions='';",
    "if(user.username==='admin'){actions='🔐 Compte principal';}",
    "else if(user.active){actions='<button class=\"red\" onclick=\"deactivateUser('+user.id+')\">🔴 Désactiver</button><button class=\"red\" onclick=\"deleteUser('+user.id+')\">🗑️ Supprimer</button>';}",
    "else{actions='<button class=\"green\" onclick=\"activateUser('+user.id+')\">🟢 Activer</button><button class=\"red\" onclick=\"deleteUser('+user.id+')\">🗑️ Supprimer</button>';}",
    "table.innerHTML+= '<tr><td>'+user.id+'</td><td><strong>'+escapeHtml(user.username)+'</strong></td><td>'+state+'</td><td>'+actions+'</td></tr>';",
    "});",
    "}catch(e){document.getElementById('usersTable').innerHTML='<tr><td colspan=\"4\" class=\"empty\">Erreur de connexion</td></tr>';}",
    "}",


    "async function activateUser(id){",
    "if(!confirm('Activer cet utilisateur ?'))return;",
    "const data=await api('/api/users/activate',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deactivateUser(id){",
    "if(!confirm('Désactiver cet utilisateur ?'))return;",
    "const data=await api('/api/users/deactivate',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deleteUser(id){",
    "if(!confirm('Supprimer définitivement cet utilisateur ?'))return;",
    "const data=await api('/api/users/delete',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function createCode(){",
    "const code=document.getElementById('newCode').value.trim();",
    "if(!code){alert('Entrez un code');return;}",
    "const data=await api('/api/codes',{method:'POST',body:JSON.stringify({code:code})});",
    "document.getElementById('codeStatus').textContent=data.message||'Opération terminée';",
    "if(data.success){document.getElementById('newCode').value='';}",
    "await loadCodes();",
    "await loadStats();",
    "}",


    "async function generateCode(){",
    "const data=await api('/api/codes/generate',{method:'POST'});",
    "if(data.success){",
    "document.getElementById('newCode').value=data.code.code;",
    "document.getElementById('codeStatus').textContent='✓ Code généré : '+data.code.code;",
    "await loadCodes();",
    "await loadStats();",
    "}else{alert(data.message||'Erreur');}",
    "}",


    "async function loadCodes(){",
    "try{",
    "const data=await api('/api/codes');",
    "if(!data.success){document.getElementById('codesTable').innerHTML='<tr><td colspan=\"5\" class=\"empty\">'+(data.message||'Erreur')+'</td></tr>';return;}",
    "const table=document.getElementById('codesTable');",
    "table.innerHTML='';",
    "if(!data.codes.length){table.innerHTML='<tr><td colspan=\"5\" class=\"empty\">Aucun code</td></tr>';return;}",
    "data.codes.forEach(function(item){",
    "let state=item.active?'<span class=\"active\">🟢 ACTIF</span>':'<span class=\"inactive\">🔴 INACTIF</span>';",
    "let device=item.device?'<span class=\"device\">'+escapeHtml(item.device)+'</span>':'Non utilisé';",
    "let action=item.active",
      "?'<button class=\"red\" onclick=\"deactivateCode('+item.id+')\">🔴 Désactiver</button>'",
      ":'<button class=\"green\" onclick=\"activateCode('+item.id+')\">🟢 Activer</button>';",
    "action+='<button class=\"red\" onclick=\"deleteCode('+item.id+')\">🗑️ Supprimer</button>';",
    "table.innerHTML+='<tr><td>'+item.id+'</td><td class=\"code\">'+escapeHtml(item.code)+'</td><td>'+state+'</td><td>'+device+'</td><td>'+action+'</td></tr>';",
    "});",
    "}catch(e){document.getElementById('codesTable').innerHTML='<tr><td colspan=\"5\" class=\"empty\">Erreur de connexion</td></tr>';}",
    "}",


    "async function activateCode(id){",
    "if(!confirm('Activer ce code ?'))return;",
    "const data=await api('/api/codes/activate',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deactivateCode(id){",
    "if(!confirm('Désactiver ce code ?'))return;",
    "const data=await api('/api/codes/deactivate',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deleteCode(id){",
    "if(!confirm('Supprimer définitivement ce code ?'))return;",
    "const data=await api('/api/codes/delete',{method:'POST',body:JSON.stringify({id:id})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function loadDevices(){",
    "try{",
    "const data=await api('/api/devices');",
    "if(!data.success){document.getElementById('devicesTable').innerHTML='<tr><td colspan=\"7\" class=\"empty\">'+(data.message||'Erreur')+'</td></tr>';return;}",
    "const table=document.getElementById('devicesTable');",
    "table.innerHTML='';",
    "if(!data.devices.length){table.innerHTML='<tr><td colspan=\"7\" class=\"empty\">📱 Aucun appareil associé</td></tr>';return;}",
    "data.devices.forEach(function(device){",
    "let state=device.active?'<span class=\"active\">🟢 ACTIF</span>':'<span class=\"inactive\">🔴 INACTIF</span>';",
    "let action=device.active",
      "?'<button class=\"red\" onclick=\"deactivateDevice(\\''+escapeJs(device.deviceId)+'\\')\">🔴 Désactiver</button>'",
      ":'<button class=\"green\" onclick=\"activateDevice(\\''+escapeJs(device.deviceId)+'\\')\">🟢 Activer</button>';",
    "action+='<button class=\"red\" onclick=\"deleteDevice(\\''+escapeJs(device.deviceId)+'\\')\">🗑️ Supprimer</button>';",
    "table.innerHTML+='<tr><td>'+device.id+'</td><td class=\"device\">'+escapeHtml(device.deviceId)+'</td><td>'+escapeHtml(device.deviceName||'Android TV')+'</td><td>'+escapeHtml(device.platform||'Android TV')+'</td><td class=\"code\">'+escapeHtml(device.code||'Non associé')+'</td><td>'+state+'</td><td>'+action+'</td></tr>';",
    "});",
    "}catch(e){document.getElementById('devicesTable').innerHTML='<tr><td colspan=\"7\" class=\"empty\">Erreur de connexion</td></tr>';}",
    "}",


    "async function activateDevice(deviceId){",
    "if(!confirm('Activer cet appareil ?'))return;",
    "const data=await api('/api/devices/activate',{method:'POST',body:JSON.stringify({deviceId:deviceId})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deactivateDevice(deviceId){",
    "if(!confirm('Désactiver cet appareil ?'))return;",
    "const data=await api('/api/devices/deactivate',{method:'POST',body:JSON.stringify({deviceId:deviceId})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "async function deleteDevice(deviceId){",
    "if(!confirm('Supprimer définitivement cet appareil ?'))return;",
    "const data=await api('/api/devices/delete',{method:'POST',body:JSON.stringify({deviceId:deviceId})});",
    "alert(data.message||'Terminé');",
    "loadAll();",
    "}",


    "function escapeHtml(value){",
    "return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');",
    "}",


    "function escapeJs(value){",
    "return String(value==null?'').replace(/\\\\/g,'\\\\\\\\').replace(/'/g,\"\\\\'\");",
    "}",


    "loadAll();",

    "</script>",

    "</body>",
    "</html>"
  ].join("\n");

  res.send(html);
});


/* =========================================================
   ERREURS
   ========================================================= */

app.use(function(err, req, res, next) {
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur"
  });
});


app.use(function(req, res) {
  res.status(404).json({
    success: false,
    message: "Route introuvable",
    path: req.originalUrl
  });
});


/* =========================================================
   DEMARRAGE
   ========================================================= */

app.listen(PORT, "0.0.0.0", function() {
  console.log(
    "ARIS IPTV API listening on port " + PORT
  );
});
