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
  background: #050b14;
  color: white;
  font-family: Arial, sans-serif;
}

header {
  background: #091a2b;
  padding: 28px;
  text-align: center;
  border-bottom: 1px solid #1597e5;
}

header h1 {
  margin: 0;
  font-size: 34px;
}

header p {
  color: #42a5f5;
  font-size: 17px;
}

.container {
  max-width: 1150px;
  margin: 30px auto;
  padding: 20px;
}

.card {
  background: #0d2034;
  border: 1px solid #1597e5;
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
  box-sizing: border-box;
  padding: 14px;
  margin: 8px 0 14px;
  background: #071522;
  color: white;
  border: 1px solid #1597e5;
  border-radius: 8px;
}

button {
  border: 0;
  border-radius: 8px;
  padding: 12px 17px;
  margin: 4px;
  color: white;
  font-weight: bold;
  cursor: pointer;
}

.btn-blue {
  background: #1597e5;
}

.btn-green {
  background: #0b9f59;
}

.btn-red {
  background: #d9342b;
}

.btn-gray {
  background: #40556b;
}

.status {
  margin-top: 12px;
  color: #42e69a;
  font-weight: bold;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th {
  color: #42a5f5;
  text-align: left;
  padding: 14px 10px;
  border-bottom: 1px solid #24435d;
}

td {
  padding: 14px 10px;
  border-bottom: 1px solid #24435d;
}

.active {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 20px;
  background: #075c3d;
  color: #39ed9b;
  font-weight: bold;
}

.inactive {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 20px;
  background: #5d1717;
  color: #ff7777;
  font-weight: bold;
}

.device-id {
  font-family: monospace;
  color: #ffd52e;
}

.code {
  color: #ffd52e;
  font-weight: bold;
}

.empty {
  text-align: center;
  color: #9eb0c2;
  padding: 30px;
}

@media (max-width: 800px) {

  table {
    font-size: 13px;
  }

  th,
  td {
    padding: 9px 5px;
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
  class="btn-blue"
  onclick="saveToken()"
>
🔐 ENREGISTRER LE TOKEN
</button>

<div id="tokenStatus" class="status"></div>

</div>


<div class="card">

<h2>📱 Gestion des appareils</h2>

<button
  class="btn-gray"
  onclick="loadDevices()"
>
🔄 ACTUALISER LA LISTE
</button>

<div id="deviceStatus" class="status"></div>

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

<tbody id="devicesTable">

<tr>

<td colspan="6" class="empty">
Chargement des appareils...
</td>

</tr>

</tbody>

</table>

</div>

</div>


<script>

let token = localStorage.getItem("aris_admin_token") || "";

document.getElementById("adminToken").value = token;


function saveToken() {

  token = document
    .getElementById("adminToken")
    .value
    .trim();

  localStorage.setItem(
    "aris_admin_token",
    token
  );

  document.getElementById(
    "tokenStatus"
  ).textContent =
    "✓ Token enregistré";

  loadDevices();
}


async function api(url, options) {

  options = options || {};

  options.headers = Object.assign(
    {},
    options.headers || {},
    {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    }
  );

  const response = await fetch(
    url,
    options
  );

  return await response.json();
}


async function loadDevices() {

  if (!token) {

    document.getElementById(
      "deviceStatus"
    ).textContent =
      "Entrez d'abord le token administrateur.";

    return;
  }

  document.getElementById(
    "deviceStatus"
  ).textContent =
    "Chargement...";

  try {

    const data =
      await api("/api/devices");

    if (!data.success) {

      document.getElementById(
        "deviceStatus"
      ).textContent =
        data.message || "Erreur";

      return;
    }

    renderDevices(data.devices || []);

    document.getElementById(
      "deviceStatus"
    ).textContent =
      "✓ Liste actualisée";

  } catch (error) {

    document.getElementById(
      "deviceStatus"
    ).textContent =
      "Erreur de connexion au serveur";

  }

}


function renderDevices(list) {

  const table =
    document.getElementById(
      "devicesTable"
    );

  table.innerHTML = "";

  if (!list.length) {

    table.innerHTML =
      '<tr><td colspan="6" class="empty">📱 Aucun appareil associé</td></tr>';

    return;
  }


  list.forEach(function(device, index) {

    const tr =
      document.createElement("tr");


    const state =
      device.active
      ? '<span class="active">🟢 ACTIF</span>'
      : '<span class="inactive">🔴 INACTIF</span>';


    const action =
      device.active

      ? '<button class="btn-red" onclick="deactivateDevice(\\'' +
        escapeValue(device.deviceId) +
        '\\')">🔴 Désactiver</button>'

      : '<button class="btn-green" onclick="activateDevice(\\'' +
        escapeValue(device.deviceId) +
        '\\')">🟢 Activer</button>';


    tr.innerHTML =

      "<td>" +
      (index + 1) +
      "</td>" +

      "<td class='device-id'>" +
      escapeHtml(device.deviceId || "-") +
      "</td>" +

      "<td>" +
      escapeHtml(
        device.platform ||
        device.deviceName ||
        "Android TV"
      ) +
      "</td>" +

      "<td class='code'>" +
      escapeHtml(device.code || "Non associé") +
      "</td>" +

      "<td>" +
      state +
      "</td>" +

      "<td>" +

      action +

      '<button class="btn-red" onclick="deleteDevice(\\'' +
      escapeValue(device.deviceId) +
      '\\')">🗑️ Supprimer</button>' +

      "</td>";


    table.appendChild(tr);

  });

}


async function activateDevice(deviceId) {

  if (!confirm(
    "Activer cet appareil ?"
  )) {
    return;
  }

  const data =
    await api(
      "/api/devices/activate",
      {
        method: "POST",
        body: JSON.stringify({
          deviceId: deviceId
        })
      }
    );

  alert(
    data.message ||
    "Opération terminée"
  );

  loadDevices();
}


async function deactivateDevice(deviceId) {

  if (!confirm(
    "Désactiver cet appareil ?"
  )) {
    return;
  }

  const data =
    await api(
      "/api/devices/deactivate",
      {
        method: "POST",
        body: JSON.stringify({
          deviceId: deviceId
        })
      }
    );

  alert(
    data.message ||
    "Opération terminée"
  );

  loadDevices();
}


async function deleteDevice(deviceId) {

  if (!confirm(
    "⚠️ Supprimer définitivement cet appareil ?"
  )) {
    return;
  }

  const data =
    await api(
      "/api/devices/delete",
      {
        method: "POST",
        body: JSON.stringify({
          deviceId: deviceId
        })
      }
    );

  alert(
    data.message ||
    "Opération terminée"
  );

  loadDevices();
}


function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function escapeValue(value) {

  return String(value)
    .replace(/\\\\/g, "\\\\\\\\")
    .replace(/'/g, "\\'");
}


loadDevices();

</script>

</body>

</html>
  `);
});
