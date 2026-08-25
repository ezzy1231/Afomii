# Admin portal launcher — runs a second Next.js instance on :3001 serving
# only /dashboard/admin (+ /auth so you can sign in there directly).
# Main consumer/partner app keeps running separately on :3000.
#
# Usage (from anywhere):  powershell -File scripts\dev-admin.ps1

Set-Location (Join-Path $PSScriptRoot '..\apps\web')

$env:ADMIN_PORTAL = '1'
$env:PORT = '3001'
$env:NEXT_PUBLIC_MAIN_ORIGIN = if ($env:NEXT_PUBLIC_MAIN_ORIGIN) { $env:NEXT_PUBLIC_MAIN_ORIGIN } else { 'http://localhost:3000' }

Write-Host "Admin portal -> http://localhost:3001/dashboard/admin" -ForegroundColor Yellow
npm run dev
