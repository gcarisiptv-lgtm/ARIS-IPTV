@echo off
title GCA FORCE-IPTV PRO - Backend
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (echo Node.js n'est pas installe. Installe Node.js LTS puis relance ce fichier. & pause & exit /b 1)
if not exist node_modules (echo Installation des dependances... & call npm install & if errorlevel 1 (echo Echec de npm install. & pause & exit /b 1))
echo Backend GCA FORCE-IPTV PRO sur http://localhost:8080
echo Gardez cette fenetre ouverte.
node server.js
pause
