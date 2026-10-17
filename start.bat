@echo off
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
echo ========================================================
echo       Starting Tasker OS - Productivity & Omni-AI       
echo ========================================================
echo.
echo Opening development server on http://localhost:5173 ...
echo.
npm.cmd run dev
pause
