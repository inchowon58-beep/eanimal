@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 의존성 확인 중...
python -m pip install -q -r requirements.txt
python launcher.py
if errorlevel 1 pause
