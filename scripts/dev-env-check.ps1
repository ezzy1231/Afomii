# requires PowerShell 5+ (works in ConstrainedLanguage); read-only checks only
$ErrorActionPreference = 'SilentlyContinue'

function Test-Cmd([string]$Name, [string]$Cmd, [scriptblock]$Extra = {}) {
  $found = Get-Command $Cmd -ErrorAction SilentlyContinue
  if ($found) {
    $out = (& $Cmd --version 2>$null | Select-Object -First 1)
    if (-not $out) { $out = 'installed' }
    Write-Host ('PASS  {0,-28} {1}' -f $Name, $out) -ForegroundColor Green
    & $Extra
    return $true
  } else {
    Write-Host ('FAIL  {0,-28} not found' -f $Name) -ForegroundColor Red
    return $false
  }
}

$results = @()

Write-Host '=== FoodRide dev environment check ===' -ForegroundColor Cyan

# 1. Node
$ok = Test-Cmd 'Node.js >= 18' 'node'
if ($ok) {
  $v = [version](node -v).TrimStart('v')
  if ($v.Major -ge 18) { Write-Host '      node major version OK' -ForegroundColor Green }
  else { Write-Host '      WARNING: node too old' -ForegroundColor Yellow }
}

# 2. Git
[void](Test-Cmd 'Git' 'git')

# 3. Docker CLI + daemon
$dockerCli = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCli) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'PASS  Docker daemon              running' -ForegroundColor Green
  } else {
    Write-Host 'FAIL  Docker daemon              not running - start Docker Desktop' -ForegroundColor Red
  }
} else {
  Write-Host 'FAIL  Docker CLI                 not installed (winget install Docker.DockerDesktop)' -ForegroundColor Red
}

# 4. Java 17
$java = Get-Command java -ErrorAction SilentlyContinue
if (-not $java -and $env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  Write-Host ('PASS  JDK 17                     ' + $env:JAVA_HOME) -ForegroundColor Green
} elseif ($java) {
  $jv = (& java -version 2>&1 | Select-Object -First 1)
  if ($jv -match '17\.') { Write-Host ('PASS  JDK 17                     {0}' -f $jv) -ForegroundColor Green }
  else { Write-Host ('WARN  Java present but not 17:   {0}' -f $jv) -ForegroundColor Yellow }
} else {
  Write-Host 'FAIL  JDK 17                     missing (winget install EclipseAdoptium.Temurin.17.JDK)' -ForegroundColor Red
}

# 5. ANDROID_HOME
if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) {
  Write-Host ('PASS  ANDROID_HOME               {0}' -f $env:ANDROID_HOME) -ForegroundColor Green
} else {
  Write-Host 'FAIL  ANDROID_HOME               unset or path missing' -ForegroundColor Red
}

# helper: resolve tool from ANDROID_HOME when PATH is stale
function Resolve-SdkTool([string]$rel) {
  if ($env:ANDROID_HOME) { $c = Join-Path $env:ANDROID_HOME $rel; if (Test-Path $c) { return $c } }
  return $null
}
# 6. adb / emulator / sdkmanager
$adbCmd = Get-Command adb -ErrorAction SilentlyContinue
$adb = $null; if ($adbCmd) { $adb = $adbCmd.Source } else { $adb = Resolve-SdkTool 'platform-tools\adb.exe' }
if ($adb) { Write-Host ('PASS  adb                        ' + $adb) -ForegroundColor Green } else { Write-Host 'FAIL  adb                        missing' -ForegroundColor Red }
$emuCmd = Get-Command emulator -ErrorAction SilentlyContinue
$emu = $null; if ($emuCmd) { $emu = $emuCmd.Source } else { $emu = Resolve-SdkTool 'emulator\emulator.exe' }
if ($emu) { Write-Host ('PASS  emulator                   ' + $emu) -ForegroundColor Green } else { Write-Host 'FAIL  emulator                   missing' -ForegroundColor Red }
$sdkmgr = Get-Command sdkmanager -ErrorAction SilentlyContinue
if (-not $sdkmgr -and $env:ANDROID_HOME) {
  $cand = Join-Path $env:ANDROID_HOME 'cmdline-tools\latest\bin\sdkmanager.bat'
  if (Test-Path $cand) { Write-Host ('PASS  sdkmanager                 {0}' -f $cand) -ForegroundColor Green; $sdkmgr = $true }
}
if (-not $sdkmgr) { Write-Host 'FAIL  sdkmanager                 missing - install Android Studio cmdline-tools' -ForegroundColor Red }

# 7. AVD list
if ($env:ANDROID_HOME) {
  if (-not $emu) { $emuCmd2 = Get-Command emulator -ErrorAction SilentlyContinue; if ($emuCmd2) { $emu = $emuCmd2.Source } }
  $avds = $null; if ($emu) { $avds = (& $emu -list-avds) 2>$null }
  if ($avds) { Write-Host ('PASS  AVDs                       {0}' -f ($avds -join ', ')) -ForegroundColor Green }
  else { Write-Host 'FAIL  AVDs                       none found - create FoodRidePixel7 (doc 04 §2.4)' -ForegroundColor Red }
}

# 8. Virtualization hint
$cs = Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue
$wmi = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue
$hv = (Get-CimInstance Win32_ComputerSystem -ErrorAction SilentlyContinue).HypervisorPresent
if ($hv) { Write-Host 'PASS  Virtualization             hypervisor active' -ForegroundColor Green }
elseif ($wmi -and $wmi.VirtualizationFirmwareEnabled) { Write-Host 'PASS  Firmware virtualization    enabled' -ForegroundColor Green }
else { Write-Host 'WARN  Firmware virtualization    unknown/disabled - emulator may fail to boot' -ForegroundColor Yellow }

# 9. Workspace basics
if (Test-Path 'docker-compose.yml') { Write-Host 'PASS  Repo root                  docker-compose.yml found' -ForegroundColor Green }
else { Write-Host 'WARN  Repo root                  run this script from the repo root' -ForegroundColor Yellow }

Write-Host ''
Write-Host 'Fix every FAIL above, then re-run. Loop starts when all rows PASS.' -ForegroundColor Cyan