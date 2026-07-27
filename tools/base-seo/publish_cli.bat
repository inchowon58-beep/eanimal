@echo off
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  echo 사용법: publish_cli.bat shelter keywords.txt
  echo 예: publish_cli.bat shelter keywords.example.txt
  pause
  exit /b 1
)
python publish.py --category %~1 --keywords %~2
pause
