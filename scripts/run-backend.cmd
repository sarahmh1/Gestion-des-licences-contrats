@echo off
REM Lance le backend Spring Boot (sans Docker) sur le port 8089
cd /d "%~dp0..\projet2024"
echo Compilation...
call mvn -q package -DskipTests
if errorlevel 1 (
  echo Echec compilation Maven.
  exit /b 1
)
echo Demarrage sur http://localhost:8089 ...
call mvn spring-boot:run
