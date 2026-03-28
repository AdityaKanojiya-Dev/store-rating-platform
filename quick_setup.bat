@echo off
echo ========================================
echo Store Rating Platform - Quick Setup
echo ========================================
echo.

echo Step 1: Checking PostgreSQL...
pg_config --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL is not installed or not in PATH
    echo Please install PostgreSQL and add it to your PATH
    pause
    exit /b 1
)
echo PostgreSQL found!

echo.
echo Step 2: Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS store_rating_platform;" 2>nul
psql -U postgres -c "CREATE DATABASE store_rating_platform;" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database
    echo Please check your PostgreSQL credentials
    pause
    exit /b 1
)
echo Database created successfully!

echo.
echo Step 3: Loading database schema...
psql -U postgres -d store_rating_platform -f server\database\final_database.sql
if %errorlevel% neq 0 (
    echo ERROR: Failed to load database schema
    pause
    exit /b 1
)
echo Database schema loaded successfully!

echo.
echo Step 4: Testing database connection...
cd server
node setup_database.js
if %errorlevel% neq 0 (
    echo ERROR: Database test failed
    pause
    exit /b 1
)

echo.
echo Step 5: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install server dependencies
    pause
    exit /b 1
)

cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Demo credentials:
echo Admin: admin@storeplatform.com / Admin123!
echo Store Owner: john.smith@example.com / Admin123!
echo User: alice.customer@example.com / Admin123!
echo.
echo To start the application:
echo 1. Open terminal 1: cd server && npm start
echo 2. Open terminal 2: cd client && npm start
echo.
pause
