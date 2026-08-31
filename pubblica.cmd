@echo off
REM Pubblica le modifiche su GitHub, e da li' Vercel aggiorna il sito da solo.
REM node_modules resta esclusa: la reinstalla Vercel da package.json.
cd /d "%~dp0"

git add -A
git diff --cached --quiet
if %errorlevel%==0 (
  echo Nessuna modifica da pubblicare.
  pause
  exit /b
)

echo.
echo File che sto per pubblicare:
git diff --cached --name-status
echo.

set "msg="
set /p msg="Cosa hai cambiato? (invio per saltare) "
if "%msg%"=="" set "msg=Aggiornamento"

git commit -m "%msg%"
git push origin main

echo.
echo Fatto. Vercel sta ricostruendo il sito.
pause
