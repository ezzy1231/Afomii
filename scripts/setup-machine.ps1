# setup-machine.ps1 - one-shot idempotent installer for FoodRide dev loop
# Sections: Docker daemon, JDK 17, Android Studio (optional), Android SDK + AVD, user env vars
param([switch]$SkipStudio)
$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot '..\logs\machine-setup.log'
New-Item (Split-Path $log) -ItemType Directory -Force *> $null
Start-Transcript -Path $log -Append | Out-Null

function Step($name) { Write-Host ('`n===== STEP: ' + $name + ' =====') }

Step '0. Pre-flight'
$free = 0
try { $d = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"; $free = [math]::Round($d.FreeSpace/1GB,1) } catch { try { $free = [math]::Round((Get-PSDrive C).Free/1GB,1) } catch {} }
Write-Host ('Free disk on C: ' + $free + ' GB')  # need ~12 GB

# ------------------------------------------------------------------
Step '1. Docker Desktop daemon'
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Starting Docker Desktop...'
  Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -ErrorAction SilentlyContinue
  $ready = $false
  foreach ($i in 1..60) { Start-Sleep 3; docker info *> $null; if ($LASTEXITCODE -eq 0) { $ready = $true; break } }
  if ($ready) { Write-Host ('DOCKER OK after ~' + ($i*3) + 's') } else { Write-Host 'DOCKER STILL DOWN - may need first-run GUI acceptance; continuing with remaining steps' }
} else { Write-Host 'Docker already running' }

# ------------------------------------------------------------------
Step '2. JDK 17'
$javaDir = $null
$cand = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue | Where-Object Name -like 'jdk-17*' | Sort-Object Name -Descending | Select-Object -First 1
if ($cand) { $javaDir = $cand.FullName }
if (-not $javaDir) {
  Write-Host 'Installing Temurin JDK 17 via winget (approve the UAC prompt if shown)...'
  cmd /c 'winget install --id EclipseAdoptium.Temurin.17.JDK -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity' *> $null
  Start-Sleep 5
  $cand = Get-ChildItem 'C:\Program Files\Eclipse Adoptium' -Directory -ErrorAction SilentlyContinue | Where-Object Name -like 'jdk-17*' | Sort-Object Name -Descending | Select-Object -First 1
  if ($cand) { $javaDir = $cand.FullName }
}
if (-not $javaDir) {
  Write-Host 'winget path failed - falling back to Adoptium ZIP into LOCALAPPDATA (no admin needed)'
  $jzip = Join-Path $env:LOCALAPPDATA 'Temurin17.zip'
  Invoke-WebRequest -Uri 'https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk' -OutFile $jzip -UseBasicParsing
  $jdir = Join-Path $env:LOCALAPPDATA 'Java'
  New-Item $jdir -ItemType Directory -Force *> $null
  Expand-Archive $jzip $jdir -Force
  Remove-Item $jzip -Force
  $javaDir = (Get-ChildItem $jdir -Directory | Where-Object Name -like 'jdk-17*' | Select-Object -First 1).FullName
}
if ($javaDir) {
  [Environment]::SetEnvironmentVariable('JAVA_HOME', $javaDir, 'User')
  $env:JAVA_HOME = $javaDir
  Write-Host ('JDK ready at ' + $javaDir)
  & (Join-Path $javaDir 'bin\java.exe') -version
} else { Write-Host 'JDK INSTALL FAILED - sdkmanager steps will fail' }

# ------------------------------------------------------------------
if (-not $SkipStudio) {
  Step '3. Android Studio (optional, big download)'
  $studio = Test-Path 'C:\Program Files\Android\Android Studio\bin\studio64.exe'
  if ($studio) { Write-Host 'Android Studio already installed' }
  else {
    Write-Host 'Installing Android Studio via winget (UAC prompt possible)...'
    cmd /c 'winget install --id Google.AndroidStudio -e --silent --accept-package-agreements --accept-source-agreements --disable-interactivity' *> $null
    if (Test-Path 'C:\Program Files\Android\Android Studio\bin\studio64.exe') { Write-Host 'Studio installed' }
    else { Write-Host 'Studio install did not complete - NOT a blocker (SDK installed headless next)' }
  }
}

# ------------------------------------------------------------------
Step '4. Android SDK bootstrap (headless)'
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
New-Item (Join-Path $sdk 'cmdline-tools') -ItemType Directory -Force *> $null
$cltZip = Join-Path $env:TEMP 'cmdlinetools.zip'
$cltMarker = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
if (-not (Test-Path $cltMarker)) {
  Write-Host 'Downloading commandline-tools...'
  Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip' -OutFile $cltZip -UseBasicParsing
  $tmpX = Join-Path $env:TEMP 'clt-x'
  Remove-Item $tmpX -Recurse -Force -ErrorAction SilentlyContinue
  Expand-Archive $cltZip $tmpX -Force
  Move-Item (Join-Path $tmpX 'cmdline-tools') (Join-Path $sdk 'cmdline-tools\latest')
  Remove-Item $cltZip, $tmpX -Recurse -Force -ErrorAction SilentlyContinue
}
$env:ANDROID_HOME = $sdk; $env:ANDROID_SDK_ROOT = $sdk
$sdkmgr = $cltMarker
Write-Host ('sdkmanager at ' + $sdkmgr)

Write-Host 'Accepting licenses...'
1..30 | ForEach-Object { 'y' } | & $sdkmgr --licenses > $null

Write-Host 'Installing SDK components (~2.5 GB, longest step)...'
& $sdkmgr 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0' 'emulator' 'system-images;android-35;google_apis;x86_64' 2>&1 | ForEach-Object { if ($_ -match '\[\d+%|OK|done') { Write-Host $_ } }

Step '5. Create AVD FoodRidePixel7'
$avdmgr = Join-Path $sdk 'cmdline-tools\latest\bin\avdmanager.bat'
& $avdmgr list avd 2>$null | Select-String 'FoodRidePixel7' > $null
if ($LASTEXITCODE -eq 0 -and $?) { Write-Host 'AVD exists' }
else { echo n | & $avdmgr create avd -n FoodRidePixel7 -k 'system-images;android-35;google_apis;x86_64' -d pixel_7 --force; Write-Host 'AVD create exit: ' $LASTEXITCODE }

# ------------------------------------------------------------------
Step '6. User environment variables'
[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdk, 'User')
Write-Host ('ANDROID_HOME -> ' + $sdk)
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$additions = @((Join-Path $sdk 'platform-tools'), (Join-Path $sdk 'emulator'), (Join-Path $sdk 'cmdline-tools\latest\bin'))
foreach ($a in $additions) { if ($userPath -notlike '*' + $a + '*') { $userPath = $userPath.TrimEnd(';') + ';' + $a } }
[Environment]::SetEnvironmentVariable('Path', $userPath, 'User')
Write-Host 'User PATH updated (new terminals will see adb/emulator)'

Step 'DONE - summary'
docker info --format 'docker server: {{.ServerVersion}}' 2>$null
Write-Host ('JAVA_HOME=' + [Environment]::GetEnvironmentVariable('JAVA_HOME','User'))
Write-Host ('ANDROID_HOME=' + [Environment]::GetEnvironmentVariable('ANDROID_HOME','User'))
& (Join-Path $sdk 'platform-tools\adb.exe') version 2>$null | Select-Object -First 1
Stop-Transcript | Out-Null