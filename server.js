// =====================================
// 🖥️ PANNEAU ADMINISTRATION
// =====================================

app.get("/admin", (req, res) => {

  const html = [
    '<!DOCTYPE html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>ARIS IPTV - Administration</title>',

    '<style>',
    '* { box-sizing: border-box; }',

    'body {',
    'margin: 0;',
    'background: linear-gradient(135deg, #050b14, #081827);',
    'color: white;',
    'font-family: Arial, sans-serif;',
    '}',

    'header {',
    'background: #0a192a;',
    'padding: 25px;',
    'text-align: center;',
    'border-bottom: 1px solid #168bd0;',
    '}',

    'header h1 {',
    'margin: 0;',
    'font-size: 32px;',
    '}',

    'header p {',
    'color: #8ccfff;',
    '}',

    '.container {',
    'max-width: 1200px;',
    'margin: auto;',
    'padding: 25px;',
    '}',

    '.stats {',
    'display: grid;',
    'grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));',
    'gap: 15px;',
    'margin-bottom: 25px;',
    '}',

    '.stat {',
    'background: #0c1d30;',
    'border: 1px solid #176da3;',
    'border-radius: 14px;',
    'padding: 20px;',
    '}',

    '.stat-number {',
    'font-size: 34px;',
    'font-weight: bold;',
    'color: #35b7ff;',
    'margin-top: 8px;',
    '}',

    '.card {',
    'background: #0e1f32;',
    'border: 1px solid #176da3;',
    'border-radius: 16px;',
    'padding: 22px;',
    'margin-bottom: 25px;',
    '}',

    '.card h2 {',
    'margin-top: 0;',
    '}',

    'input {',
    'width: 100%;',
    'padding: 13px;',
    'margin: 6px 0 12px;',
    'border-radius: 9px;',
    'border: 1px solid #267cad;',
    'background: #071522;',
    'color: white;',
    'font-size: 15px;',
    '}',

    'button {',
    'border: none;',
    'border-radius: 9px;',
    'padding: 11px 16px;',
    'cursor: pointer;',
    'font-weight: bold;',
    'margin: 4px;',
    '}',

    '.btn-create {',
    'background: #168bd0;',
    'color: white;',
    '}',

    '.btn-refresh {',
    'background: #374b60;',
    'color: white;',
    '}',

    '.btn-toggle {',
    'background: #168bd0;',
    'color: white;',
    '}',

    '.btn-delete {',
    'background: #c0392b;',
    'color: white;',
    '}',

    'button:hover {',
    'opacity: 0.85;',
    '}',

    'table {',
    'width: 100%;',
    'border-collapse: collapse;',
    'margin-top: 15px;',
    '}',

    'th, td {',
    'padding: 14px;',
    'border-bottom: 1px solid #20384d;',
    'text-align: left;',
    '}',

    'th {',
    'color: #83cfff;',
    '}',

    '.badge {',
    'display: inline-block;',
    'padding: 6px 10px;',
    'border-radius: 20px;',
    'font-size: 13px;',
    'font-weight: bold;',
    '}',

    '.active {',
    'background: #164f3b;',
    'color: #48e0a5;',
    '}',

    '.inactive {',
    'background: #512522;',
    'color: #ff8c82;',
    '}',

    '.message {',
    'margin-top: 12px;',
    'padding: 12px;',
    'border-radius: 9px;',
    'display: none;',
    '}',

    '.success {',
    'background: #123d31;',
    'color: #55e2a5;',
    '}',

    '.error {',
    'background: #4a211f;',
    'color: #ff9d94;',
    '}',

    '@media(max-width:700px) {',
    'table { font-size: 13px; }',
    'th, td { padding: 9px; }',
    '.actions button { display: block; width: 100%; }',
    '}',

    '</style>',
    '</head>',

    '<body>',

    '<header>',
    '<h1>🦁 ARIS IPTV</h1>',
    '<p>Administration</p>',
    '</header>',

    '<div class="container">',

    '<div class="stats">',

    '<div class="stat">',
    '<div>👤 Utilisateurs</div>',
    '<div id="totalUsers" class="stat-number">0</div>',
    '</div>',

    '<div class="stat">',
    '<div>🟢 Utilisateurs actifs</div>',
    '<div id="activeUsers" class="stat-number">0</div>',
    '</div>',

    '<div class="stat">',
    '<div>🔑 Codes</div>',
    '<div id="totalCodes" class="stat-number">0</div>',
    '</div>',

    '<div class="stat">',
    '<div>📱 Appareils</div>',
    '<div id="totalDevices" class="stat-number">0</div>',
    '</div>',

    '</div>',

    '<div class="card">',

    '<h2>➕ Créer un utilisateur</h2>',

    '<label>Username</label>',
    '<input id="username" type="text" placeholder="Exemple : client01">',

    '<label>Password</label>',
    '<input id="password" type="password" placeholder="Mot de passe">',

    '<button class="btn-create" onclick="createUser()">',
    '➕ CRÉER L&apos;UTILISATEUR',
    '</button>',

    '<div id="message" class="message"></div>',

    '</div>',

    '<div class="card">',

    '<h2>👤 Gestion des utilisateurs</h2>',

    '<button class="btn-refresh" onclick="loadUsers()">',
    '🔄 ACTUALISER LA LISTE',
    '</button>',

    '<div id="usersContainer">',
    'Chargement...',
    '</div>',

    '</div>',

    '<div class="card">',

    '<h2>🔑 Codes d&apos;activation</h2>',

    '<div id="codesContainer">',
    'Chargement...',
    '</div>',

    '</div>',

    '<div class="card">',

    '<h2>📱 Appareils</h2>',

    '<div id="devicesContainer">',
    'Chargement...',
    '</div>',

    '</div>',

    '</div>',

    '<script>',

    'let adminToken = localStorage.getItem("aris_admin_token");',

    'if (!adminToken) {',
    'adminToken = prompt("Token administrateur ARIS IPTV :");',
    'if (adminToken) {',
    'localStorage.setItem("aris_admin_token", adminToken);',
    '}',
    '}',

    'async function api(url, options) {',

    'options = options || {};',

    'options.headers = Object.assign({}, options.headers || {}, {',
    '"Content-Type": "application/json",',
    '"Authorization": "Bearer " + adminToken',
    '});',

    'const response = await fetch(url, options);',
    'const data = await response.json();',

    'if (!response.ok) {',
    'throw new Error(data.message || "Erreur serveur");',
    '}',

    'return data;',
    '}',


    'function escapeHtml(value) {',

    'return String(value)',
    '.replace(/&/g, "&amp;")',
    '.replace(/</g, "&lt;")',
    '.replace(/>/g, "&gt;")',
    '.replace(/"/g, "&quot;")',
    ".replace(/'/g, '&#039;');",

    '}',


    'function showMessage(text, type) {',

    'const box = document.getElementById("message");',

    'box.textContent = text;',
    'box.className = "message " + (type || "success");',
    'box.style.display = "block";',

    '}',


    'async function createUser() {',

    'const username = document.getElementById("username").value.trim();',
    'const password = document.getElementById("password").value.trim();',

    'if (!username || !password) {',
    'showMessage("Username et password obligatoires", "error");',
    'return;',
    '}',

    'try {',

    'const data = await api("/api/users", {',
    'method: "POST",',
    'body: JSON.stringify({',
    'username: username,',
    'password: password',
    '})',
    '});',

    'showMessage("✅ " + data.message, "success");',

    'document.getElementById("username").value = "";',
    'document.getElementById("password").value = "";',

    'await loadUsers();',

    '} catch (error) {',

    'showMessage("❌ " + error.message, "error");',

    '}',

    '}',


    'async function loadUsers() {',

    'const container = document.getElementById("usersContainer");',

    'container.innerHTML = "Chargement...";',

    'try {',

    'const data = await api("/api/users");',
    'const users = data.users || [];',

    'document.getElementById("totalUsers").textContent = users.length;',

    'document.getElementById("activeUsers").textContent =',
    'users.filter(function(user) { return user.active; }).length;',

    'if (users.length === 0) {',
    'container.innerHTML = "<p>Aucun utilisateur.</p>";',
    'return;',
    '}',

    'let html = "";',

    'html += "<table>";',
    'html += "<thead>";',
    'html += "<tr>";',
    'html += "<th>ID</th>";',
    'html += "<th>Username</th>";',
    'html += "<th>État</th>";',
    'html += "<th>Actions</th>";',
    'html += "</tr>";',
    'html += "</thead>";',
    'html += "<tbody>";',

    'users.forEach(function(user) {',

    'html += "<tr>";',

    'html += "<td>" + user.id + "</td>";',

    'html += "<td><strong>" + escapeHtml(user.username) + "</strong></td>";',

    'if (user.active) {',
    'html += "<td><span class=\\"badge active\\">🟢 ACTIF</span></td>";',
    '} else {',
    'html += "<td><span class=\\"badge inactive\\">🔴 INACTIF</span></td>";',
    '}',

    'html += "<td class=\\"actions\\">";',

    'if (user.username === "admin") {',

    'html += "<strong>🔒 Compte principal</strong>";',

    '} else {',

    'if (user.active) {',

    'html += "<button class=\\"btn-toggle\\" onclick=\\"toggleUser(" + user.id + ")\">🔴 Désactiver</button>";',

    '} else {',

    'html += "<button class=\\"btn-toggle\\" onclick=\\"toggleUser(" + user.id + ")\">🟢 Activer</button>";',

    '}',

    'html += "<button class=\\"btn-delete\\" onclick=\\"deleteUser(" + user.id + ")\">🗑️ Supprimer</button>";',

    '}',

    'html += "</td>";',

    'html += "</tr>";',

    '});',

    'html += "</tbody>";',
    'html += "</table>";',

    'container.innerHTML = html;',

    '} catch (error) {',

    'container.innerHTML = "<p>❌ " + escapeHtml(error.message) + "</p>";',

    '}',

    '}',


    'async function toggleUser(id) {',

    'try {',

    'const data = await api("/api/users/toggle", {',
    'method: "POST",',
    'body: JSON.stringify({ id: id })',
    '});',

    'alert("✅ " + data.message);',

    'await loadUsers();',

    '} catch (error) {',

    'alert("❌ " + error.message);',

    '}',

    '}',


    'async function deleteUser(id) {',

    'const confirmation = confirm("Voulez-vous vraiment supprimer cet utilisateur ?");',

    'if (!confirmation) {',
    'return;',
    '}',

    'try {',

    'const data = await api("/api/users/" + id, {',
    'method: "DELETE"',
    '});',

    'alert("✅ " + data.message);',

    'await loadUsers();',

    '} catch (error) {',

    'alert("❌ " + error.message);',

    '}',

    '}',


    'async function loadCodes() {',

    'const container = document.getElementById("codesContainer");',

    'try {',

    'const data = await api("/api/codes");',
    'const codes = data.codes || [];',

    'document.getElementById("totalCodes").textContent = codes.length;',

    'if (!codes.length) {',
    'container.innerHTML = "<p>Aucun code.</p>";',
    'return;',
    '}',

    'let html = "<table>";',
    'html += "<tr><th>Code</th><th>État</th><th>Appareil</th></tr>";',

    'codes.forEach(function(code) {',

    'html += "<tr>";',

    'html += "<td><strong>" + escapeHtml(code.code) + "</strong></td>";',

    'if (code.active) {',
    'html += "<td><span class=\\"badge active\\">🟢 ACTIF</span></td>";',
    '} else {',
    'html += "<td><span class=\\"badge inactive\\">🔴 INACTIF</span></td>";',
    '}',

    'html += "<td>" + escapeHtml(code.device || "Non utilisé") + "</td>";',

    'html += "</tr>";',

    '});',

    'html += "</table>";',

    'container.innerHTML = html;',

    '} catch (error) {',

    'container.innerHTML = "<p>❌ " + escapeHtml(error.message) + "</p>";',

    '}',

    '}',


    'async function loadDevices() {',

    'const container = document.getElementById("devicesContainer");',

    'try {',

    'const data = await api("/api/devices");',
    'const devices = data.devices || [];',

    'document.getElementById("totalDevices").textContent = devices.length;',

    'if (!devices.length) {',
    'container.innerHTML = "<p>Aucun appareil connecté.</p>";',
    'return;',
    '}',

    'let html = "<table>";',
    'html += "<tr><th>Device ID</th><th>Code</th><th>État</th></tr>";',

    'devices.forEach(function(device) {',

    'html += "<tr>";',

    'html += "<td>" + escapeHtml(device.deviceId) + "</td>";',
    'html += "<td>" + escapeHtml(device.code) + "</td>";',

    'if (device.active) {',
    'html += "<td><span class=\\"badge active\\">🟢 ACTIF</span></td>";',
    '} else {',
    'html += "<td><span class=\\"badge inactive\\">🔴 INACTIF</span></td>";',
    '}',

    'html += "</tr>";',

    '});',

    'html += "</table>";',

    'container.innerHTML = html;',

    '} catch (error) {',

    'container.innerHTML = "<p>❌ " + escapeHtml(error.message) + "</p>";',

    '}',

    '}',


    'async function loadAll() {',

    'await loadUsers();',
    'await loadCodes();',
    'await loadDevices();',

    '}',


    'loadAll();',

    '</script>',

    '</body>',
    '</html>'

  ].join("\n");

  res.send(html);

});
