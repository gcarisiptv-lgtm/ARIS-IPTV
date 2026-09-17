# GCA FORCE-IPTV PRO

Starter full-stack project for an Android / Android TV IPTV client and connected administration API.

## Included
- Android app in Kotlin + XML layouts
- Android TV / remote-friendly UI
- Login
- Activation code flow
- Device registration and device limits
- Multi-DNS server configuration
- Connected REST backend (Node.js + Express + SQLite)
- Admin endpoints for users, activation codes, devices and DNS servers
- GCA FORCE-IPTV PRO branding placeholders

## Important
Only connect playlists, streams, logos and other media for which you have the necessary rights/authorization. The sample backend contains demo data only.

## Backend
cd backend
npm install
npm start

Default API: http://10.0.2.2:8080 for the Android emulator.
For a physical TV/box, set the API URL in `ApiConfig.kt` to the LAN address of the backend.

Demo admin:
email: admin@gcaforce.local
password: ChangeMe123!

Demo user:
email: demo@gcaforce.local
password: Demo123!
activation code: GCA-DEMO-2026

## Android
Open the `android` directory in Android Studio and run the app on an Android phone, TV emulator or Android TV device.

## Si le panneau affiche « Backend inaccessible »
Le panneau Admin ne démarre pas le serveur lui-même.

### Windows
1. Installe **Node.js LTS**.
2. Ouvre `backend/start-windows.bat`.
3. Attends `Backend GCA FORCE-IPTV PRO sur http://localhost:8080`.
4. Ouvre `admin/index.html`.
5. Clique sur **Tester le backend**.
6. L'adresse par défaut est `http://localhost:8080/`.

Si le backend tourne sur un autre PC du réseau, saisis son adresse, par exemple `http://192.168.1.50:8080/`. En production, utilise HTTPS et remplace le secret JWT de démonstration.
