@echo off
TITLE Upay AI Financial Intelligence Platform Launcher
COLOR 0B

echo ========================================================================
echo           UPAY AI FINANCIAL INTELLIGENCE PLATFORM (HACKATHON)
echo ========================================================================
echo.
echo [1/4] Verifying Python and AI ML Models...
if not exist "ai_models\fraud_xgb.joblib" (
    echo [ERROR] Model files missing in ai_models directory!
    pause
    exit /b 1
)

echo [2/4] Initializing Database and Seeding Demo Profile...
python backend\seed_data.py
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database seed returned code %ERRORLEVEL%. Continuing...
)

echo [3/4] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "Upay Backend API (FastAPI)" cmd /k "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [4/4] Launching Vite Frontend on http://localhost:3000 ...
cd frontend
start "Upay Frontend (Vite)" cmd /k "npm.cmd run dev"
cd ..

timeout /t 3 /nobreak >nul

echo.
echo ========================================================================
echo  Platform is now LIVE!
echo  - Frontend Web and Mobile UI:  http://localhost:3000
echo  - Backend API Gateway:         http://127.0.0.1:8000
echo  - Interactive Swagger Docs:    http://127.0.0.1:8000/docs
echo  - Demo User:                   NAKIB MD. ASHIK (01771449164, PIN 1234)
echo ========================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

pause
