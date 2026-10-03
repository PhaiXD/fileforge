@echo off
set TOOL=%1
set INPUT_FILE=%2
set OUTPUT_FILE=%3

python "%~dp0plugin.py" %TOOL% %INPUT_FILE% %OUTPUT_FILE%
