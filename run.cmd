@echo off
REM OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
REM Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
REM
REM This program is free software: you can redistribute it and/or modify
REM it under the terms of the GNU Affero General Public License as
REM published by the Free Software Foundation, either version 3 of the
REM License, or (at your option) any later version.
REM
REM This program is distributed in the hope that it will be useful,
REM but WITHOUT ANY WARRANTY; without even the implied warranty of
REM MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
REM GNU Affero General Public License for more details.
REM
REM You should have received a copy of the GNU Affero General Public License
REM along with this program.  If not, see <https://www.gnu.org/licenses/>.

setlocal EnableDelayedExpansion

REM =============================================================================
REM Configuration
REM =============================================================================

set "REQUIRED_PYTHON_MAJOR=3"
set "REQUIRED_PYTHON_MINOR=10"
set "REQUIRED_NODE_MAJOR=20"
set "FALLBACK_NODE_VERSION=20.18.1"
set "NODE_RELEASE_INDEX_URL=https://nodejs.org/download/release/index.json"
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "VENV_DIR=%SCRIPT_DIR%\venv"
set "NODE_DIR=%SCRIPT_DIR%\.node"
set "NODE_VERSION="
set "PYTHON_CMD="
set "NODE_CMD="
set "NPM_CMD="
set "PKG_MGR="

REM =============================================================================
REM Main Entry Point
REM =============================================================================

echo ============================================================
echo OllaForge - Setup and Run (Windows Batch)
echo ============================================================
echo.

cd /d "%SCRIPT_DIR%"

REM Phase 1: Detect package manager
call :detect_package_manager

REM Phase 2: Ensure Git is installed
call :ensure_git
if errorlevel 1 goto :error_exit

REM Phase 3: Ensure Node.js is installed
call :ensure_node
if errorlevel 1 goto :error_exit

REM Phase 4: Ensure Python is installed
call :ensure_python
if errorlevel 1 goto :error_exit

REM Phase 5: Setup virtual environment
call :setup_venv
if errorlevel 1 goto :error_exit

REM Phase 6: Install dependencies
call :install_pip_dependencies
if errorlevel 1 goto :error_exit

call :check_npm
if errorlevel 1 goto :error_exit

call :install_npm_dependencies
if errorlevel 1 goto :error_exit

REM Phase 7: Run the application
echo.
call :log_success "Setup complete! Starting OllaForge..."
echo.

python "%SCRIPT_DIR%\run.py"
goto :eof

:error_exit
echo.
call :log_error "Setup failed. Please check the errors above."
pause
exit /b 1

REM =============================================================================
REM Utility Functions
REM =============================================================================

:log_info
echo [INFO] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warn
echo [WARN] %~1
goto :eof

:command_exists
where %~1 >nul 2>&1
if errorlevel 1 (
    exit /b 1
)
exit /b 0

:ask_yes_no
set /p "ANSWER=%~1 [Y/n] "
if /i "%ANSWER%"=="" set "ANSWER=y"
if /i "%ANSWER%"=="y" exit /b 0
if /i "%ANSWER%"=="yes" exit /b 0
exit /b 1

REM =============================================================================
REM Package Manager Detection
REM =============================================================================

:detect_package_manager
call :log_info "Detecting package manager..."

call :command_exists winget
if not errorlevel 1 (
    set "PKG_MGR=winget"
    set "PYTHON_PKG=Python.Python.3.13"
    set "GIT_PKG=Git.Git"
    call :log_info "Detected package manager: winget"
    goto :eof
)

call :command_exists choco
if not errorlevel 1 (
    set "PKG_MGR=choco"
    set "PYTHON_PKG=python313"
    set "GIT_PKG=git"
    call :log_info "Detected package manager: choco"
    goto :eof
)

call :command_exists scoop
if not errorlevel 1 (
    set "PKG_MGR=scoop"
    set "PYTHON_PKG=python"
    set "GIT_PKG=git"
    call :log_info "Detected package manager: scoop"
    goto :eof
)

call :log_warn "No supported package manager found (winget, choco, or scoop)."
call :log_warn "Please install Python %REQUIRED_PYTHON_MAJOR%.%REQUIRED_PYTHON_MINOR% or newer manually."
goto :eof

REM =============================================================================
REM Architecture Detection
REM =============================================================================

:detect_arch
set "ARCH_TYPE="
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set "ARCH_TYPE=x64"
) else if "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
    set "ARCH_TYPE=arm64"
) else if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    set "ARCH_TYPE=x86"
) else (
    call :log_error "Unsupported architecture: %PROCESSOR_ARCHITECTURE%"
    exit /b 1
)
call :log_info "Detected architecture: %ARCH_TYPE%"
goto :eof

REM =============================================================================
REM Git Check and Installation
REM =============================================================================

:ensure_git
call :log_info "Checking Git installation..."

call :command_exists git
if not errorlevel 1 (
    for /f "tokens=3" %%v in ('git --version 2^>nul') do set "GIT_VERSION=%%v"
    call :log_info "Found Git !GIT_VERSION!"
    call :log_success "Git check passed."
    goto :eof
)

REM Git not found
if "%PKG_MGR%"=="" (
    call :log_error "Git is required but not installed."
    call :log_error "No package manager detected to install it automatically."
    call :log_error "Please install Git manually from: https://git-scm.com/"
    exit /b 1
)

call :log_warn "Git is required but not found."
echo.
call :ask_yes_no "Would you like to install Git using %PKG_MGR%?"
if errorlevel 1 (
    call :log_error "Git installation declined. Cannot continue without Git."
    exit /b 1
)

call :install_git
if errorlevel 1 exit /b 1

REM Refresh PATH
call :refresh_path

REM Verify installation
call :command_exists git
if errorlevel 1 (
    call :log_error "Git installation failed."
    exit /b 1
)

call :log_success "Git installed and verified."
goto :eof

:install_git
call :log_info "Installing Git via %PKG_MGR%..."

if "%PKG_MGR%"=="winget" (
    winget install --silent --accept-package-agreements --accept-source-agreements %GIT_PKG%
) else if "%PKG_MGR%"=="choco" (
    choco install -y %GIT_PKG%
) else if "%PKG_MGR%"=="scoop" (
    scoop install %GIT_PKG%
) else (
    call :log_error "Unknown package manager: %PKG_MGR%"
    exit /b 1
)

if errorlevel 1 (
    call :log_error "Failed to install Git."
    exit /b 1
)

call :log_success "Git installed successfully."
goto :eof

REM =============================================================================
REM Node.js Check and Installation
REM =============================================================================

:get_node_cmd
set "NODE_CMD="

REM First check local .node directory
if exist "%NODE_DIR%\node.exe" (
    set "NODE_CMD=%NODE_DIR%\node.exe"
    goto :eof
)

REM Then check global node
call :command_exists node
if not errorlevel 1 (
    set "NODE_CMD=node"
    goto :eof
)

goto :eof

:check_node_version
call :get_node_cmd
if "%NODE_CMD%"=="" exit /b 1

for /f "tokens=1 delims=v" %%a in ('"%NODE_CMD%" --version 2^>nul') do set "NODE_VER_FULL=%%a"
for /f "tokens=1 delims=." %%a in ('"%NODE_CMD%" --version 2^>nul') do set "NODE_VER_RAW=%%a"
set "NODE_MAJOR=%NODE_VER_RAW:v=%"

call :log_info "Found Node.js %NODE_VER_RAW% (%NODE_CMD%)"

if "%NODE_MAJOR%"=="" exit /b 1
if %NODE_MAJOR% GEQ %REQUIRED_NODE_MAJOR% (
    exit /b 0
) else (
    call :log_warn "Node.js %REQUIRED_NODE_MAJOR%+ is required."
    exit /b 1
)

:ensure_node
call :log_info "Checking Node.js installation..."

call :check_node_version
if not errorlevel 1 (
    call :log_success "Node.js version check passed."
    goto :eof
)

REM Node not found or version too old
call :log_warn "Node.js %REQUIRED_NODE_MAJOR%+ is required but not found or version too old."
echo.

REM Determine the Node.js version to install
call :determine_node_version

call :ask_yes_no "Would you like to download and install Node.js v%NODE_VERSION% to .node directory?"
if errorlevel 1 (
    call :log_error "Node.js installation declined. Cannot continue without Node.js."
    exit /b 1
)

call :detect_arch
if errorlevel 1 exit /b 1

call :download_node
if errorlevel 1 exit /b 1

REM Update NODE_CMD to point to local installation
set "NODE_CMD=%NODE_DIR%\node.exe"

REM Verify installation
call :check_node_version
if errorlevel 1 (
    call :log_error "Node.js installation failed."
    exit /b 1
)

goto :eof

:determine_node_version
call :log_info "Fetching latest Node.js LTS version..."

REM Try to fetch LTS version using PowerShell
for /f "delims=" %%v in ('powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri '%NODE_RELEASE_INDEX_URL%' -TimeoutSec 10; ($r | Where-Object { $_.lts -ne $false } | Select-Object -First 1).version -replace '^v','' } catch { '' }" 2^>nul') do set "LTS_VERSION=%%v"

if not "%LTS_VERSION%"=="" (
    set "NODE_VERSION=%LTS_VERSION%"
    call :log_success "Found latest Node.js LTS version: %LTS_VERSION%"
) else (
    set "NODE_VERSION=%FALLBACK_NODE_VERSION%"
    call :log_warn "Using fallback Node.js version: %FALLBACK_NODE_VERSION%"
)
goto :eof

:download_node
call :log_info "Downloading Node.js v%NODE_VERSION%..."

set "DOWNLOAD_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-%ARCH_TYPE%.zip"
set "TEMP_DIR=%TEMP%\ollaforge-node-%RANDOM%"
set "ARCHIVE_PATH=%TEMP_DIR%\node.zip"

call :log_info "Download URL: %DOWNLOAD_URL%"

mkdir "%TEMP_DIR%" 2>nul
mkdir "%NODE_DIR%" 2>nul

REM Download using PowerShell
powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile '%ARCHIVE_PATH%' -UseBasicParsing"
if errorlevel 1 (
    call :log_error "Failed to download Node.js."
    rmdir /s /q "%TEMP_DIR%" 2>nul
    exit /b 1
)

call :log_info "Extracting Node.js to %NODE_DIR%..."

REM Extract using PowerShell
powershell -NoProfile -Command "Expand-Archive -Path '%ARCHIVE_PATH%' -DestinationPath '%TEMP_DIR%' -Force"
if errorlevel 1 (
    call :log_error "Failed to extract Node.js."
    rmdir /s /q "%TEMP_DIR%" 2>nul
    exit /b 1
)

REM Move contents from extracted folder to .node directory
for /d %%d in ("%TEMP_DIR%\node-*") do (
    xcopy "%%d\*" "%NODE_DIR%\" /E /Y /Q >nul
)

REM Cleanup
rmdir /s /q "%TEMP_DIR%" 2>nul

call :log_success "Node.js v%NODE_VERSION% installed to %NODE_DIR%"
goto :eof

REM =============================================================================
REM Python Check and Installation
REM =============================================================================

:get_python_cmd
set "PYTHON_CMD="

REM Try different Python command names
for %%c in (python3 python py) do (
    call :command_exists %%c
    if not errorlevel 1 (
        set "PYTHON_CMD=%%c"
        goto :eof
    )
)
goto :eof

:check_python_version
call :get_python_cmd
if "%PYTHON_CMD%"=="" exit /b 1

for /f "tokens=2" %%v in ('"%PYTHON_CMD%" --version 2^>nul') do set "PY_VERSION=%%v"
for /f "tokens=1,2 delims=." %%a in ("%PY_VERSION%") do (
    set "PY_MAJOR=%%a"
    set "PY_MINOR=%%b"
)

call :log_info "Found Python %PY_VERSION% (%PYTHON_CMD%)"

if "%PY_MAJOR%"=="" exit /b 1
if "%PY_MINOR%"=="" exit /b 1
if %PY_MAJOR% GTR %REQUIRED_PYTHON_MAJOR% (
    exit /b 0
) else if %PY_MAJOR% EQU %REQUIRED_PYTHON_MAJOR% (
    if %PY_MINOR% GEQ %REQUIRED_PYTHON_MINOR% (
        exit /b 0
    )
)

call :log_warn "Python %REQUIRED_PYTHON_MAJOR%.%REQUIRED_PYTHON_MINOR% or newer is required."
call :log_warn "Found: Python %PY_VERSION%"
exit /b 1

:ensure_python
call :log_info "Checking Python installation..."

call :check_python_version
if not errorlevel 1 (
    call :log_success "Python version check passed."
    goto :eof
)

REM Python not found or version too old
if "%PKG_MGR%"=="" (
    call :log_error "Python %REQUIRED_PYTHON_MAJOR%.%REQUIRED_PYTHON_MINOR%+ is required but not installed."
    call :log_error "No package manager detected to install it automatically."
    call :log_error "Please install Python %REQUIRED_PYTHON_MAJOR%.%REQUIRED_PYTHON_MINOR% or newer manually."
    call :log_error "Visit: https://www.python.org/downloads/"
    exit /b 1
)

call :log_warn "Python %REQUIRED_PYTHON_MAJOR%.%REQUIRED_PYTHON_MINOR%+ is required but not found."
echo.
call :ask_yes_no "Would you like to install Python using %PKG_MGR%?"
if errorlevel 1 (
    call :log_error "Python installation declined. Cannot continue without Python."
    exit /b 1
)

call :install_python
if errorlevel 1 exit /b 1

REM Refresh PATH
call :refresh_path

REM Verify installation
call :check_python_version
if errorlevel 1 (
    call :log_error "Python installation failed or version still not sufficient."
    exit /b 1
)

goto :eof

:install_python
call :log_info "Installing Python via %PKG_MGR%..."

if "%PKG_MGR%"=="winget" (
    winget install --silent --accept-package-agreements --accept-source-agreements %PYTHON_PKG%
) else if "%PKG_MGR%"=="choco" (
    choco install -y %PYTHON_PKG%
) else if "%PKG_MGR%"=="scoop" (
    scoop install %PYTHON_PKG%
) else (
    call :log_error "Unknown package manager: %PKG_MGR%"
    exit /b 1
)

if errorlevel 1 (
    call :log_error "Failed to install Python."
    exit /b 1
)

call :log_success "Python installed successfully."
goto :eof

REM =============================================================================
REM Virtual Environment
REM =============================================================================

:setup_venv
call :log_info "Setting up Python virtual environment..."

call :get_python_cmd

if exist "%VENV_DIR%" (
    call :log_info "Virtual environment already exists at %VENV_DIR%"
) else (
    call :log_info "Creating virtual environment at %VENV_DIR%"
    "%PYTHON_CMD%" -m venv "%VENV_DIR%"
    if errorlevel 1 (
        call :log_error "Failed to create virtual environment."
        exit /b 1
    )
)

REM Activate virtual environment
call :log_info "Activating virtual environment..."

if exist "%VENV_DIR%\Scripts\activate.bat" (
    call "%VENV_DIR%\Scripts\activate.bat"
) else (
    call :log_error "Virtual environment activation script not found."
    exit /b 1
)

REM Ensure pip is available
call :command_exists pip
if errorlevel 1 (
    call :ensure_pip_in_venv
    if errorlevel 1 exit /b 1
)

call :log_success "Virtual environment activated."
goto :eof

:ensure_pip_in_venv
call :log_warn "pip not found in virtual environment. Attempting to install..."

REM Try using ensurepip first
python -m ensurepip --upgrade >nul 2>&1
if not errorlevel 1 (
    call :log_success "pip installed via ensurepip."
    goto :eof
)

REM Fallback: download and run get-pip.py
call :log_info "Trying to install pip via get-pip.py..."
set "GET_PIP_URL=https://bootstrap.pypa.io/get-pip.py"
set "GET_PIP_FILE=%TEMP%\get-pip-%RANDOM%.py"

powershell -NoProfile -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%GET_PIP_URL%' -OutFile '%GET_PIP_FILE%' -UseBasicParsing"
if errorlevel 1 (
    call :log_error "Failed to download get-pip.py."
    exit /b 1
)

python "%GET_PIP_FILE%" >nul 2>&1
if errorlevel 1 (
    del "%GET_PIP_FILE%" 2>nul
    call :log_error "Failed to install pip via get-pip.py."
    exit /b 1
)

del "%GET_PIP_FILE%" 2>nul
call :log_success "pip installed via get-pip.py."
goto :eof

REM =============================================================================
REM Dependency Installation
REM =============================================================================

:install_pip_dependencies
call :log_info "Installing Python dependencies..."

if exist "%SCRIPT_DIR%\requirements.txt" (
    pip install --upgrade pip -q
    if errorlevel 1 (
        call :log_error "Failed to upgrade pip."
        exit /b 1
    )
    pip install -r "%SCRIPT_DIR%\requirements.txt" -q
    if errorlevel 1 (
        call :log_error "Failed to install Python dependencies."
        exit /b 1
    )
    call :log_success "Python dependencies installed."
) else (
    call :log_warn "No requirements.txt found, skipping Python dependencies."
)
goto :eof

:get_npm_cmd
set "NPM_CMD="

REM First check local .node directory
if exist "%NODE_DIR%\npm.cmd" (
    set "NPM_CMD=%NODE_DIR%\npm.cmd"
    goto :eof
)

REM Then check global npm
call :command_exists npm
if not errorlevel 1 (
    set "NPM_CMD=npm"
    goto :eof
)

goto :eof

:check_npm
call :get_npm_cmd

if "%NPM_CMD%"=="" (
    call :log_error "npm is not installed."
    call :log_error "Please install Node.js and npm before running this script."
    call :log_error "Visit: https://nodejs.org/"
    exit /b 1
)

for /f "delims=" %%v in ('"%NPM_CMD%" --version 2^>nul') do set "NPM_VERSION=%%v"
call :log_info "npm found: %NPM_VERSION% (%NPM_CMD%)"
goto :eof

:install_npm_dependencies
call :log_info "Installing UI dependencies..."

if exist "%SCRIPT_DIR%\ui\package.json" (
    pushd "%SCRIPT_DIR%\ui"
    "%NPM_CMD%" install --silent 2>nul
    if errorlevel 1 (
        popd
        call :log_error "Failed to install UI dependencies."
        exit /b 1
    )
    popd
    call :log_success "UI dependencies installed."
) else (
    call :log_warn "No UI project found, skipping npm dependencies."
)
goto :eof

REM =============================================================================
REM Helper Functions
REM =============================================================================

:refresh_path
REM Refresh PATH environment variable from registry
for /f "tokens=2*" %%a in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%b"
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USR_PATH=%%b"
set "PATH=%SYS_PATH%;%USR_PATH%"
goto :eof
