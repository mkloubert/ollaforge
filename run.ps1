#!/usr/bin/env pwsh
# OllaForge - A web application that simplifies training LLMs with your own data for use in Ollama.
# Copyright (C) 2026  Marcel Joachim Kloubert (marcel@kloubert.dev)
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

#Requires -Version 7.0

$ErrorActionPreference = "Stop"

# =============================================================================
# Configuration
# =============================================================================

$Script:RequiredPythonMajor = 3
$Script:RequiredPythonMinor = 10
$Script:RequiredNodeMajor = 20
$Script:FallbackNodeVersion = "20.18.1"
$Script:NodeReleaseIndexUrl = "https://nodejs.org/download/release/index.json"
$Script:ScriptDir = $PSScriptRoot
$Script:VenvDir = Join-Path $Script:ScriptDir "venv"
$Script:NodeDir = Join-Path $Script:ScriptDir ".node"
$Script:NodeVersion = ""

# Platform detection variables
$Script:OsType = $null
$Script:ArchType = $null
$Script:LinuxDistroId = $null
$Script:LinuxDistroFamily = $null
$Script:PkgMgr = $null
$Script:PythonPkg = $null
$Script:GitPkg = $null
$Script:PythonCmd = $null
$Script:NodeCmd = $null
$Script:NpmCmd = $null

# =============================================================================
# Utility Functions
# =============================================================================

function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-LogSuccess {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# =============================================================================
# Node.js LTS Version Detection
# =============================================================================

function Get-LatestNodeLtsVersion {
    Write-LogInfo "Fetching latest Node.js LTS version from API..."

    try {
        # Fetch the JSON from Node.js release API
        $releases = Invoke-RestMethod -Uri $Script:NodeReleaseIndexUrl -TimeoutSec 10 -ErrorAction Stop

        # Find the first entry where lts is not $false (i.e., it's a string like "Krypton")
        $ltsRelease = $releases | Where-Object { $_.lts -ne $false } | Select-Object -First 1

        if ($ltsRelease) {
            # Extract version without the leading "v"
            $version = $ltsRelease.version -replace '^v', ''
            Write-LogSuccess "Found latest Node.js LTS version: $version"
            return $version
        }
        else {
            Write-LogWarn "No LTS version found in API response."
            return $null
        }
    }
    catch {
        Write-LogWarn "Failed to fetch Node.js release index: $_"
        return $null
    }
}

function Set-NodeVersion {
    # Try to fetch the latest LTS version from the API
    $ltsVersion = Get-LatestNodeLtsVersion

    if ($ltsVersion) {
        $Script:NodeVersion = $ltsVersion
    }
    else {
        # Fallback to hardcoded version
        Write-LogWarn "Using fallback Node.js version: $Script:FallbackNodeVersion"
        $Script:NodeVersion = $Script:FallbackNodeVersion
    }
}

function Read-YesNo {
    param(
        [string]$Prompt,
        [string]$Default = "y"
    )

    $suffix = if ($Default -eq "y") { "[Y/n]" } else { "[y/N]" }
    $response = Read-Host "$Prompt $suffix"

    if ([string]::IsNullOrWhiteSpace($response)) {
        return $Default -eq "y"
    }

    return $response -match "^[Yy]"
}

# =============================================================================
# OS Detection
# =============================================================================

function Get-OperatingSystem {
    Write-LogInfo "Detecting operating system..."

    if ($IsWindows) {
        $Script:OsType = "windows"
    }
    elseif ($IsMacOS) {
        $Script:OsType = "darwin"
    }
    elseif ($IsLinux) {
        $Script:OsType = "linux"
    }
    else {
        # Fallback for older PowerShell or edge cases
        if ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT) {
            $Script:OsType = "windows"
        }
        elseif ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Unix) {
            # Could be Linux or macOS
            $uname = & uname -s 2>$null
            switch ($uname) {
                "Darwin" { $Script:OsType = "darwin" }
                "Linux" { $Script:OsType = "linux" }
                "FreeBSD" { $Script:OsType = "freebsd" }
                "NetBSD" { $Script:OsType = "netbsd" }
                "OpenBSD" { $Script:OsType = "openbsd" }
                default { $Script:OsType = "linux" }
            }
        }
        else {
            Write-LogError "Unsupported operating system."
            exit 1
        }
    }

    Write-LogInfo "Detected OS: $Script:OsType"
}

# =============================================================================
# Architecture Detection
# =============================================================================

function Get-Architecture {
    Write-LogInfo "Detecting architecture..."

    $arch = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture

    switch ($arch) {
        "X64" { $Script:ArchType = "x64" }
        "Arm64" { $Script:ArchType = "arm64" }
        "X86" { $Script:ArchType = "x86" }
        default {
            # Fallback for older PowerShell
            $envArch = $env:PROCESSOR_ARCHITECTURE
            switch ($envArch) {
                "AMD64" { $Script:ArchType = "x64" }
                "ARM64" { $Script:ArchType = "arm64" }
                "x86" { $Script:ArchType = "x86" }
                default {
                    Write-LogError "Unsupported architecture: $arch / $envArch"
                    exit 1
                }
            }
        }
    }

    Write-LogInfo "Detected architecture: $Script:ArchType"
}

# =============================================================================
# Node.js Check and Installation
# =============================================================================

function Get-NodeCommand {
    # First check local .node directory
    if ($Script:OsType -eq "windows") {
        $localNode = Join-Path $Script:NodeDir "node.exe"
    }
    else {
        $localNode = Join-Path $Script:NodeDir "bin/node"
    }

    if (Test-Path $localNode) {
        return $localNode
    }

    # Then check global node
    if (Test-CommandExists "node") {
        return "node"
    }

    return $null
}

function Test-NodeVersion {
    $Script:NodeCmd = Get-NodeCommand

    if (-not $Script:NodeCmd) {
        return $false
    }

    try {
        $versionOutput = & $Script:NodeCmd --version 2>&1
        if ($versionOutput -match "v(\d+)\.(\d+)\.(\d+)") {
            $major = [int]$Matches[1]

            Write-LogInfo "Found Node.js v$($Matches[1]).$($Matches[2]).$($Matches[3]) ($Script:NodeCmd)"

            if ($major -ge $Script:RequiredNodeMajor) {
                return $true
            }
            else {
                Write-LogWarn "Node.js $Script:RequiredNodeMajor+ is required."
                Write-LogWarn "Found: Node.js v$($Matches[1]).$($Matches[2]).$($Matches[3])"
                return $false
            }
        }
    }
    catch {
        return $false
    }

    return $false
}

function Get-NodeDownloadUrl {
    $baseUrl = "https://nodejs.org/dist/v$Script:NodeVersion"

    switch ($Script:OsType) {
        "windows" {
            return "$baseUrl/node-v$Script:NodeVersion-win-$Script:ArchType.zip"
        }
        "darwin" {
            return "$baseUrl/node-v$Script:NodeVersion-darwin-$Script:ArchType.tar.gz"
        }
        "linux" {
            return "$baseUrl/node-v$Script:NodeVersion-linux-$Script:ArchType.tar.xz"
        }
        default {
            Write-LogError "No Node.js download available for OS: $Script:OsType"
            exit 1
        }
    }
}

function Install-Node {
    Write-LogInfo "Downloading Node.js v$Script:NodeVersion..."

    Get-Architecture

    $downloadUrl = Get-NodeDownloadUrl
    $archiveName = Split-Path $downloadUrl -Leaf
    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "ollaforge-node-$(Get-Random)"

    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

    $archivePath = Join-Path $tempDir $archiveName

    Write-LogInfo "Download URL: $downloadUrl"

    try {
        # Download the archive
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath -UseBasicParsing

        # Create .node directory
        if (-not (Test-Path $Script:NodeDir)) {
            New-Item -ItemType Directory -Path $Script:NodeDir -Force | Out-Null
        }

        Write-LogInfo "Extracting Node.js to $Script:NodeDir..."

        if ($Script:OsType -eq "windows") {
            # Extract ZIP on Windows
            Expand-Archive -Path $archivePath -DestinationPath $tempDir -Force

            # Move contents from extracted folder to .node directory
            $extractedFolder = Get-ChildItem -Path $tempDir -Directory | Where-Object { $_.Name -like "node-*" } | Select-Object -First 1
            if ($extractedFolder) {
                Get-ChildItem -Path $extractedFolder.FullName | Move-Item -Destination $Script:NodeDir -Force
            }
        }
        else {
            # Extract tar.gz or tar.xz on Unix
            if ($archiveName -like "*.tar.xz") {
                & tar -xJf $archivePath -C $Script:NodeDir --strip-components=1
            }
            else {
                & tar -xzf $archivePath -C $Script:NodeDir --strip-components=1
            }
        }

        Write-LogSuccess "Node.js v$Script:NodeVersion installed to $Script:NodeDir"
    }
    finally {
        # Cleanup
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

function Confirm-Node {
    Write-LogInfo "Checking Node.js installation..."

    if (Test-NodeVersion) {
        Write-LogSuccess "Node.js version check passed."
        return
    }

    # Node not found or version too old
    Write-LogWarn "Node.js $Script:RequiredNodeMajor+ is required but not found or version too old."
    Write-Host ""

    # Determine the Node.js version to install (fetch from API or use fallback)
    Set-NodeVersion

    if (-not (Read-YesNo "Would you like to download and install Node.js v$Script:NodeVersion to .node directory?" "y")) {
        Write-LogError "Node.js installation declined. Cannot continue without Node.js."
        exit 1
    }

    Install-Node

    # Update NodeCmd to point to local installation
    if ($Script:OsType -eq "windows") {
        $Script:NodeCmd = Join-Path $Script:NodeDir "node.exe"
    }
    else {
        $Script:NodeCmd = Join-Path $Script:NodeDir "bin/node"
    }

    # Verify installation
    if (-not (Test-NodeVersion)) {
        Write-LogError "Node.js installation failed."
        exit 1
    }
}

# =============================================================================
# Linux Distribution Detection
# =============================================================================

function Get-LinuxDistro {
    $Script:LinuxDistroId = ""
    $Script:LinuxDistroFamily = ""

    # Try /etc/os-release first (most modern distros)
    if (Test-Path "/etc/os-release") {
        $osRelease = Get-Content "/etc/os-release" -Raw

        if ($osRelease -match '(?m)^ID=(.+)$') {
            $Script:LinuxDistroId = $Matches[1].Trim('"', "'", ' ')
        }
        if ($osRelease -match '(?m)^ID_LIKE=(.+)$') {
            $Script:LinuxDistroFamily = $Matches[1].Trim('"', "'", ' ')
        }
        else {
            $Script:LinuxDistroFamily = $Script:LinuxDistroId
        }
    }
    # Fallback to other release files
    elseif (Test-Path "/etc/debian_version") {
        $Script:LinuxDistroId = "debian"
        $Script:LinuxDistroFamily = "debian"
    }
    elseif (Test-Path "/etc/fedora-release") {
        $Script:LinuxDistroId = "fedora"
        $Script:LinuxDistroFamily = "fedora"
    }
    elseif (Test-Path "/etc/redhat-release") {
        $Script:LinuxDistroId = "rhel"
        $Script:LinuxDistroFamily = "rhel fedora"
    }
    elseif (Test-Path "/etc/arch-release") {
        $Script:LinuxDistroId = "arch"
        $Script:LinuxDistroFamily = "arch"
    }
    elseif (Test-Path "/etc/alpine-release") {
        $Script:LinuxDistroId = "alpine"
        $Script:LinuxDistroFamily = "alpine"
    }
    elseif (Test-Path "/etc/gentoo-release") {
        $Script:LinuxDistroId = "gentoo"
        $Script:LinuxDistroFamily = "gentoo"
    }
    elseif ((Test-Path "/etc/SuSE-release") -or (Test-Path "/etc/SUSE-brand")) {
        $Script:LinuxDistroId = "opensuse"
        $Script:LinuxDistroFamily = "suse"
    }

    $distroId = if ($Script:LinuxDistroId) { $Script:LinuxDistroId } else { "unknown" }
    Write-LogInfo "Detected Linux distribution: $distroId"
}

# =============================================================================
# Package Manager Detection
# =============================================================================

function Get-PackageManager {
    Write-LogInfo "Detecting package manager..."

    switch ($Script:OsType) {
        "windows" {
            if (Test-CommandExists "winget") {
                $Script:PkgMgr = "winget"
                $Script:PythonPkg = "Python.Python.3.13"
                $Script:GitPkg = "Git.Git"
            }
            elseif (Test-CommandExists "choco") {
                $Script:PkgMgr = "choco"
                $Script:PythonPkg = "python313"
                $Script:GitPkg = "git"
            }
            elseif (Test-CommandExists "scoop") {
                $Script:PkgMgr = "scoop"
                $Script:PythonPkg = "python"
                $Script:GitPkg = "git"
            }
        }
        "darwin" {
            if (Test-CommandExists "brew") {
                $Script:PkgMgr = "brew"
                $Script:PythonPkg = "python@3.13"
                $Script:GitPkg = "git"
            }
            elseif (Test-CommandExists "port") {
                $Script:PkgMgr = "port"
                $Script:PythonPkg = "python313"
                $Script:GitPkg = "git"
            }
        }
        "linux" {
            Get-LinuxDistro

            switch ($Script:LinuxDistroId) {
                # Debian-based
                { $_ -in @("debian", "ubuntu", "linuxmint", "pop", "elementary", "zorin", "kali", "raspbian", "neon") } {
                    if (Test-CommandExists "apt-get") {
                        $Script:PkgMgr = "apt"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
                # Fedora/RHEL-based
                { $_ -in @("fedora", "rhel", "centos", "rocky", "almalinux", "ol", "amzn") } {
                    if (Test-CommandExists "dnf") {
                        $Script:PkgMgr = "dnf"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                    elseif (Test-CommandExists "yum") {
                        $Script:PkgMgr = "yum"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
                # Arch-based
                { $_ -in @("arch", "manjaro", "endeavouros", "garuda", "artix") } {
                    if (Test-CommandExists "pacman") {
                        $Script:PkgMgr = "pacman"
                        $Script:PythonPkg = "python"
                        $Script:GitPkg = "git"
                    }
                }
                # openSUSE
                { $_ -in @("opensuse", "opensuse-leap", "opensuse-tumbleweed", "sles") } {
                    if (Test-CommandExists "zypper") {
                        $Script:PkgMgr = "zypper"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
                # Alpine
                "alpine" {
                    if (Test-CommandExists "apk") {
                        $Script:PkgMgr = "apk"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
                # Gentoo
                "gentoo" {
                    if (Test-CommandExists "emerge") {
                        $Script:PkgMgr = "emerge"
                        $Script:PythonPkg = "dev-lang/python"
                        $Script:GitPkg = "dev-vcs/git"
                    }
                }
                # Void Linux
                "void" {
                    if (Test-CommandExists "xbps-install") {
                        $Script:PkgMgr = "xbps"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
                # NixOS
                "nixos" {
                    if (Test-CommandExists "nix-env") {
                        $Script:PkgMgr = "nix"
                        $Script:PythonPkg = "python3"
                        $Script:GitPkg = "git"
                    }
                }
            }

            # Fallback detection by available commands
            if (-not $Script:PkgMgr) {
                if (Test-CommandExists "apt-get") {
                    $Script:PkgMgr = "apt"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "dnf") {
                    $Script:PkgMgr = "dnf"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "yum") {
                    $Script:PkgMgr = "yum"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "pacman") {
                    $Script:PkgMgr = "pacman"
                    $Script:PythonPkg = "python"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "zypper") {
                    $Script:PkgMgr = "zypper"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "apk") {
                    $Script:PkgMgr = "apk"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "emerge") {
                    $Script:PkgMgr = "emerge"
                    $Script:PythonPkg = "dev-lang/python"
                    $Script:GitPkg = "dev-vcs/git"
                }
                elseif (Test-CommandExists "xbps-install") {
                    $Script:PkgMgr = "xbps"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
                elseif (Test-CommandExists "nix-env") {
                    $Script:PkgMgr = "nix"
                    $Script:PythonPkg = "python3"
                    $Script:GitPkg = "git"
                }
            }
        }
        { $_ -in @("freebsd", "netbsd", "openbsd") } {
            if (Test-CommandExists "pkg") {
                $Script:PkgMgr = "pkg"
                $Script:PythonPkg = "python3"
                $Script:GitPkg = "git"
            }
        }
    }

    if ($Script:PkgMgr) {
        Write-LogInfo "Detected package manager: $Script:PkgMgr"
    }
    else {
        Write-LogWarn "No supported package manager found."
        Write-LogWarn "Please install Python $Script:RequiredPythonMajor.$Script:RequiredPythonMinor or newer manually."
    }
}

# =============================================================================
# Python Installation
# =============================================================================

function Install-Python {
    Write-LogInfo "Installing Python via $Script:PkgMgr..."

    switch ($Script:PkgMgr) {
        "winget" {
            & winget install --silent --accept-package-agreements --accept-source-agreements $Script:PythonPkg
        }
        "choco" {
            & choco install -y $Script:PythonPkg
        }
        "scoop" {
            & scoop install $Script:PythonPkg
        }
        "brew" {
            & brew install $Script:PythonPkg
        }
        "port" {
            & sudo port install $Script:PythonPkg
        }
        "apt" {
            & sudo apt-get update -qq
            & sudo apt-get install -y $Script:PythonPkg python3-venv python3-pip
        }
        "dnf" {
            & sudo dnf install -y $Script:PythonPkg python3-pip
        }
        "yum" {
            & sudo yum install -y $Script:PythonPkg python3-pip
        }
        "pacman" {
            & sudo pacman -Sy --noconfirm $Script:PythonPkg python-pip
        }
        "zypper" {
            & sudo zypper install -y $Script:PythonPkg python3-pip
        }
        "apk" {
            & sudo apk add $Script:PythonPkg py3-pip
        }
        "emerge" {
            & sudo emerge $Script:PythonPkg
        }
        "xbps" {
            & sudo xbps-install -y $Script:PythonPkg python3-pip
        }
        "nix" {
            & nix-env -iA nixpkgs.$Script:PythonPkg
        }
        "pkg" {
            & sudo pkg install -y $Script:PythonPkg py3-pip
        }
        default {
            Write-LogError "Unknown package manager: $Script:PkgMgr"
            exit 1
        }
    }

    # Refresh PATH on Windows
    if ($Script:OsType -eq "windows") {
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }

    Write-LogSuccess "Python installed successfully."
}

# =============================================================================
# Git Installation
# =============================================================================

function Install-Git {
    Write-LogInfo "Installing Git via $Script:PkgMgr..."

    switch ($Script:PkgMgr) {
        "winget" {
            & winget install --silent --accept-package-agreements --accept-source-agreements $Script:GitPkg
        }
        "choco" {
            & choco install -y $Script:GitPkg
        }
        "scoop" {
            & scoop install $Script:GitPkg
        }
        "brew" {
            & brew install $Script:GitPkg
        }
        "port" {
            & sudo port install $Script:GitPkg
        }
        "apt" {
            & sudo apt-get update -qq
            & sudo apt-get install -y $Script:GitPkg
        }
        "dnf" {
            & sudo dnf install -y $Script:GitPkg
        }
        "yum" {
            & sudo yum install -y $Script:GitPkg
        }
        "pacman" {
            & sudo pacman -Sy --noconfirm $Script:GitPkg
        }
        "zypper" {
            & sudo zypper install -y $Script:GitPkg
        }
        "apk" {
            & sudo apk add $Script:GitPkg
        }
        "emerge" {
            & sudo emerge $Script:GitPkg
        }
        "xbps" {
            & sudo xbps-install -y $Script:GitPkg
        }
        "nix" {
            & nix-env -iA nixpkgs.git
        }
        "pkg" {
            & sudo pkg install -y $Script:GitPkg
        }
        default {
            Write-LogError "Unknown package manager: $Script:PkgMgr"
            exit 1
        }
    }

    # Refresh PATH on Windows
    if ($Script:OsType -eq "windows") {
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    }

    Write-LogSuccess "Git installed successfully."
}

# =============================================================================
# Git Check
# =============================================================================

function Confirm-Git {
    Write-LogInfo "Checking Git installation..."

    if (Test-CommandExists "git") {
        try {
            $gitVersion = & git --version 2>&1
            $gitVersion = $gitVersion -replace 'git version ', ''
            Write-LogInfo "Found Git $gitVersion"
            Write-LogSuccess "Git check passed."
            return
        }
        catch {
            # Continue to installation
        }
    }

    # Git not found
    if (-not $Script:PkgMgr) {
        Write-LogError "Git is required but not installed."
        Write-LogError "No package manager detected to install it automatically."
        Write-LogError "Please install Git manually."
        exit 1
    }

    Write-LogWarn "Git is required but not found."
    Write-Host ""

    if (-not (Read-YesNo "Would you like to install Git using $Script:PkgMgr?" "y")) {
        Write-LogError "Git installation declined. Cannot continue without Git."
        exit 1
    }

    Install-Git

    # Verify installation
    if (-not (Test-CommandExists "git")) {
        Write-LogError "Git installation failed."
        exit 1
    }

    Write-LogSuccess "Git installed and verified."
}

# =============================================================================
# Python Version Check
# =============================================================================

function Get-PythonCommand {
    # Try different Python command names in order of preference
    $commands = @("python3.13", "python3", "python")

    foreach ($cmd in $commands) {
        if (Test-CommandExists $cmd) {
            return $cmd
        }
    }

    return $null
}

function Test-PythonVersion {
    $Script:PythonCmd = Get-PythonCommand

    if (-not $Script:PythonCmd) {
        return $false
    }

    try {
        $versionOutput = & $Script:PythonCmd --version 2>&1
        if ($versionOutput -match "Python (\d+)\.(\d+)\.(\d+)") {
            $major = [int]$Matches[1]
            $minor = [int]$Matches[2]

            Write-LogInfo "Found Python $major.$minor ($Script:PythonCmd)"

            if ($major -gt $Script:RequiredPythonMajor) {
                return $true
            }
            elseif ($major -eq $Script:RequiredPythonMajor -and $minor -ge $Script:RequiredPythonMinor) {
                return $true
            }
            else {
                Write-LogWarn "Python $Script:RequiredPythonMajor.$Script:RequiredPythonMinor or newer is required."
                Write-LogWarn "Found: Python $major.$minor"
                return $false
            }
        }
    }
    catch {
        return $false
    }

    return $false
}

function Confirm-Python {
    Write-LogInfo "Checking Python installation..."

    if (Test-PythonVersion) {
        Write-LogSuccess "Python version check passed."
        return
    }

    # Python not found or version too old
    if (-not $Script:PkgMgr) {
        Write-LogError "Python $Script:RequiredPythonMajor.$Script:RequiredPythonMinor+ is required but not installed."
        Write-LogError "No package manager detected to install it automatically."
        Write-LogError "Please install Python $Script:RequiredPythonMajor.$Script:RequiredPythonMinor or newer manually."
        exit 1
    }

    Write-LogWarn "Python $Script:RequiredPythonMajor.$Script:RequiredPythonMinor+ is required but not found."
    Write-Host ""

    if (-not (Read-YesNo "Would you like to install Python using $Script:PkgMgr?" "y")) {
        Write-LogError "Python installation declined. Cannot continue without Python."
        exit 1
    }

    Install-Python

    # Verify installation
    if (-not (Test-PythonVersion)) {
        Write-LogError "Python installation failed or version still not sufficient."
        exit 1
    }
}

# =============================================================================
# Virtual Environment
# =============================================================================

function Test-PipInVenv {
    # Check if pip is available in the activated venv
    if (Test-CommandExists "pip") {
        return $true
    }
    return $false
}

function Install-PipInVenv {
    Write-LogWarn "pip not found in virtual environment. Attempting to install..."

    # Try using ensurepip first
    try {
        & python -m ensurepip --upgrade 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "pip installed via ensurepip."
            return $true
        }
    }
    catch {
        # Continue to fallback
    }

    # Fallback: download and run get-pip.py
    Write-LogInfo "Trying to install pip via get-pip.py..."
    $getPipUrl = "https://bootstrap.pypa.io/get-pip.py"
    $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "get-pip-$(Get-Random).py"

    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $getPipUrl -OutFile $tempFile -UseBasicParsing

        & python $tempFile 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-LogSuccess "pip installed via get-pip.py."
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
            return $true
        }
    }
    catch {
        Write-LogWarn "Failed to download or run get-pip.py: $_"
    }
    finally {
        if (Test-Path $tempFile) {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
    }

    return $false
}

function Initialize-Venv {
    Write-LogInfo "Setting up Python virtual environment..."

    $venvCreated = $false

    if (Test-Path $Script:VenvDir) {
        Write-LogInfo "Virtual environment already exists at $Script:VenvDir"
    }
    else {
        Write-LogInfo "Creating virtual environment at $Script:VenvDir"
        & $Script:PythonCmd -m venv $Script:VenvDir

        if ($LASTEXITCODE -ne 0) {
            Write-LogError "Failed to create virtual environment."
            exit 1
        }
        $venvCreated = $true
    }

    # Activate virtual environment
    Write-LogInfo "Activating virtual environment..."

    if ($Script:OsType -eq "windows") {
        $activateScript = Join-Path $Script:VenvDir "Scripts\Activate.ps1"
    }
    else {
        $activateScript = Join-Path $Script:VenvDir "bin/Activate.ps1"
    }

    if (Test-Path $activateScript) {
        . $activateScript
    }
    else {
        Write-LogError "Virtual environment activation script not found: $activateScript"
        exit 1
    }

    # Ensure pip is available
    if (-not (Test-PipInVenv)) {
        if (-not (Install-PipInVenv)) {
            if (-not $venvCreated) {
                # Existing venv might be corrupted, try recreating
                Write-LogWarn "pip installation failed. Recreating virtual environment..."

                # Deactivate if possible
                try { deactivate } catch { }

                Remove-Item -Path $Script:VenvDir -Recurse -Force -ErrorAction SilentlyContinue
                Write-LogInfo "Creating fresh virtual environment at $Script:VenvDir"
                & $Script:PythonCmd -m venv $Script:VenvDir
                . $activateScript

                if (-not (Test-PipInVenv) -and -not (Install-PipInVenv)) {
                    Write-LogError "Failed to ensure pip is available in virtual environment."
                    exit 1
                }
            }
            else {
                Write-LogError "Failed to install pip in new virtual environment."
                exit 1
            }
        }
    }

    Write-LogSuccess "Virtual environment activated."
}

# =============================================================================
# Dependency Installation
# =============================================================================

function Install-PipDependencies {
    Write-LogInfo "Installing Python dependencies..."

    $requirementsFile = Join-Path $Script:ScriptDir "requirements.txt"

    if (Test-Path $requirementsFile) {
        & pip install --upgrade pip -q
        & pip install -r $requirementsFile -q

        if ($LASTEXITCODE -ne 0) {
            Write-LogError "Failed to install Python dependencies."
            exit 1
        }

        Write-LogSuccess "Python dependencies installed."
    }
    else {
        Write-LogWarn "No requirements.txt found, skipping Python dependencies."
    }
}

function Get-NpmCommand {
    # First check local .node directory
    if ($Script:OsType -eq "windows") {
        $localNpm = Join-Path $Script:NodeDir "npm.cmd"
    }
    else {
        $localNpm = Join-Path $Script:NodeDir "bin/npm"
    }

    if (Test-Path $localNpm) {
        return $localNpm
    }

    # Then check global npm
    if (Test-CommandExists "npm") {
        return "npm"
    }

    return $null
}

function Confirm-Npm {
    $Script:NpmCmd = Get-NpmCommand

    if (-not $Script:NpmCmd) {
        Write-LogError "npm is not installed."
        Write-LogError "Please install Node.js and npm before running this script."
        Write-LogError "Visit: https://nodejs.org/"
        exit 1
    }

    $npmVersion = & $Script:NpmCmd --version 2>$null
    Write-LogInfo "npm found: $npmVersion ($Script:NpmCmd)"
}

function Install-NpmDependencies {
    Write-LogInfo "Installing UI dependencies..."

    $uiDir = Join-Path $Script:ScriptDir "ui"
    $packageJson = Join-Path $uiDir "package.json"

    if ((Test-Path $uiDir) -and (Test-Path $packageJson)) {
        Push-Location $uiDir
        try {
            & $Script:NpmCmd install --silent 2>$null

            if ($LASTEXITCODE -ne 0) {
                Write-LogError "Failed to install UI dependencies."
                exit 1
            }

            Write-LogSuccess "UI dependencies installed."
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-LogWarn "No UI project found, skipping npm dependencies."
    }
}

# =============================================================================
# Main
# =============================================================================

function Main {
    Write-Host "============================================================"
    Write-Host "OllaForge - Setup and Run (PowerShell)"
    Write-Host "============================================================"
    Write-Host ""

    # Change to script directory
    Set-Location $Script:ScriptDir

    # Phase 1: Detect system
    Get-OperatingSystem
    Get-PackageManager

    # Phase 2: Ensure Git is installed
    Confirm-Git

    # Phase 3: Ensure Node.js is installed
    Confirm-Node

    # Phase 4: Ensure Python is installed
    Confirm-Python

    # Phase 5: Setup virtual environment
    Initialize-Venv

    # Phase 6: Install dependencies
    Install-PipDependencies
    Confirm-Npm
    Install-NpmDependencies

    # Phase 7: Run the application
    Write-Host ""
    Write-LogSuccess "Setup complete! Starting OllaForge..."
    Write-Host ""

    $runScript = Join-Path $Script:ScriptDir "run.py"
    & python $runScript
}

# Run main function
Main
