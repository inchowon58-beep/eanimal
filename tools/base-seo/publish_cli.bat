@echo off
chcp 65001 >nul
cd /d "%~dp0"
if "%~1"=="" (
  echo 사용법: publish_cli.bat shelter keywords.txt
  echo 옵션: --image-cdn URL --image-max 79
  pause
  exit /b 1
)
python publish.py --category %~1 --keywords %~2 %~3 %~4 %~5 %~6 %~7 %~8
pause
