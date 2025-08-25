@echo off
echo Starting Calendar Management App with SQLite Database...
echo.
echo Starting backend server on http://localhost:3001
start "Backend Server" cmd /k "npm run server"
echo.
echo Starting frontend server on http://localhost:5173
start "Frontend Server" cmd /k "npm run dev"
echo.
echo Both servers are starting...
echo.
echo Access the application at: http://localhost:5173
echo Default login: superadmin / admin123
echo.
pause
