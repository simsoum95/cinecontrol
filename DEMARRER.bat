@echo off
title CineControl
echo.
echo ========================================
echo    CineControl - Demarrage...
echo ========================================
echo.
echo Ouverture du navigateur dans 3 secondes...
timeout /t 3 /nobreak >nul
start http://localhost:8080
node server.js
pause

