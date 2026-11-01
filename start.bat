@echo off
title SMBIN — Sistema Maestro Definitivo
echo =================================================================
echo    SMBIN - MI DIARIO DIGITAL Y TELEVISION 24/7
echo =================================================================
echo.
echo [1/2] Instalando dependencias...
call npm install
echo.
echo [2/2] Iniciando servidor en http://localhost:3000...
echo.
node backend/api/server.js
pause
