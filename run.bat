@echo off
setlocal

echo LEGv8 CPU Architecture Simulator
echo =====================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first:
    echo    https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Compose is not installed.
    pause
    exit /b 1
)

set "MODE=%1"
if "%MODE%"=="" set "MODE=demo"

if "%MODE%"=="dev" goto dev
if "%MODE%"=="demo" goto demo
if "%MODE%"=="prod" goto prod
if "%MODE%"=="stop" goto stop
if "%MODE%"=="help" goto help

echo ERROR: Unknown mode: %MODE%
goto help

:dev
echo Starting in DEVELOPMENT mode...
echo    Access at: http://localhost:3000
docker-compose --profile dev up
goto end

:demo
echo Starting in DEMO mode...
echo    Access at: http://localhost:3000
docker-compose --profile demo up
goto end

:prod
echo Starting in PRODUCTION mode...
echo    Access at: http://localhost
docker-compose --profile prod up
goto end

:stop
echo Stopping containers...
docker-compose down
goto end

:help
echo Usage: run.bat [dev^|demo^|prod^|stop^|help]
echo Examples:
echo   run.bat dev     # Development server
echo   run.bat demo    # Demo server (default)
echo   run.bat prod    # Production server
echo   run.bat stop    # Stop containers

:end
pause 