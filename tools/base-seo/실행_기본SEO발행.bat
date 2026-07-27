@echo off
cd /d "%~dp0"
REM 검은 콘솔 없이 브라우저만 열리도록 VBS로 실행
wscript //nologo "%~dp0run_hidden.vbs"
exit /b 0
