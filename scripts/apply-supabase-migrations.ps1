<#
.SYNOPSIS
  Applies the numbered UrbanExplore Supabase migrations to a project, in order.

.DESCRIPTION
  Feeds each file in packages/supabase/migrations to psql individually, inside a
  transaction, stopping at the first failure and naming the migration that broke.
  Scripted counterpart to pasting apply-all-migrations.sql into the Supabase SQL
  Editor, preferred for a fresh project because the error points at one file.

.PARAMETER ConnectionString
  Full Postgres connection string (Dashboard -> Project Settings -> Database ->
  Connection string, URI). Wins over ProjectRef.

.PARAMETER ProjectRef
  Project ref. Used with PoolerHost/DirectHost when ConnectionString is absent.

.PARAMETER PoolerHost
  Pooler host incl. region, e.g. aws-0-eu-central-1.pooler.supabase.com (port 6543).

.PARAMETER DbPassword
  Database password; falls back to $env:SUPABASE_DB_PASSWORD. Passed via
  PGPASSWORD, never on the command line.

.PARAMETER Seed
  Also apply seed.sql + seed-places.sql (dev/staging data only).

.EXAMPLE
  $env:SUPABASE_DB_PASSWORD = '...'
  powershell -ExecutionPolicy Bypass -File scripts/apply-supabase-migrations.ps1 -ConnectionString 'postgresql://postgres:...@host:6543/postgres'

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts/apply-supabase-migrations.ps1 -ProjectRef abcdefghijklmnop -PoolerHost 'aws-0-eu-central-1.pooler.supabase.com'
#>
[CmdletBinding()]
param(
  [string]$ConnectionString,
  [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
  [string]$PoolerHost,
  [string]$DirectHost,
  [string]$DbPassword = $env:SUPABASE_DB_PASSWORD,
  [int]$Port = 6543,
  [switch]$Seed,
  [switch]$SkipPgCronCheck
)

$ErrorActionPreference = 'Stop'

$RepoRoot   = Split-Path -Parent $PSScriptRoot
$Migrations = Join-Path $RepoRoot 'packages\supabase\migrations'
$SeedFiles  = @(
  (Join-Path $RepoRoot 'packages\supabase\seed.sql'),
  (Join-Path $RepoRoot 'packages\supabase\seed-places.sql')
)

function Resolve-Psql {
  $cmd = Get-Command psql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
    'C:\Program Files\PostgreSQL\18\bin\psql.exe',
    'C:\Program Files\PostgreSQL\17\bin\psql.exe',
    'C:\Program Files\PostgreSQL\16\bin\psql.exe'
  )) { if (Test-Path $p) { return $p } }
  throw "psql not found. Install PostgreSQL client tools, or paste packages\supabase\apply-all-migrations.sql into the Supabase SQL Editor instead."
}


# ---- connection string -------------------------------------------------------
if (-not $ConnectionString) {
  if (-not $ProjectRef) { throw "Provide -ConnectionString, or -ProjectRef (or set `$env:SUPABASE_PROJECT_REF)." }
  if (-not $DbPassword)  { throw "Database password required: pass -DbPassword or set `$env:SUPABASE_DB_PASSWORD." }

  $h = if ($PoolerHost) { $PoolerHost }
       elseif ($DirectHost) { "db.$ProjectRef.supabase.co" }
       else { throw "Provide -PoolerHost (see Dashboard -> Database -> Connection string) or -DirectHost." }
  if ($PoolerHost) { $p = $Port } else { $p = 5432 }
  $user = if ($PoolerHost) { "postgres.$ProjectRef" } else { 'postgres' }

  $encoded = [uri]::EscapeDataString($DbPassword)
  $ConnectionString = "postgresql://${user}:${encoded}@${h}:${p}/postgres"
  Write-Host "Using host $h`:$p (user $user)" -ForegroundColor DarkGray
}

# A password is required unless the connection string already embeds one
# (psql then authenticates from the URI and PGPASSWORD is not needed).
$connHasPassword = $ConnectionString -match '://[^:/@]+:[^@]+@'
if (-not $DbPassword -and -not $connHasPassword) {
  throw "Database password required: pass -DbPassword or set `$env:SUPABASE_DB_PASSWORD (or embed it in -ConnectionString)."
}
if ($DbPassword) { $env:PGPASSWORD = $DbPassword }

$psql = Resolve-Psql
Write-Host "psql: $psql" -ForegroundColor DarkGray

function Invoke-SqlFile {
  param([string]$File, [string]$Label)
  Write-Host ""
  Write-Host "=== $Label ===" -ForegroundColor Cyan
  & $psql $ConnectionString -v ON_ERROR_STOP=1 -q --single-transaction -f $File
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed (psql exit $LASTEXITCODE). Fix it, then re-run FROM THAT FILE. Tables/extensions use `if not exists` so earlier migrations are safe to re-run, but RLS policies are not idempotent."
  }
  Write-Host "ok: $Label" -ForegroundColor Green
}

# ---- preflight: pg_cron availability (needed by 0006) -------------------------
if (-not $SkipPgCronCheck) {
  Write-Host "Checking pg_cron availability (migration 0006 needs it)..." -ForegroundColor DarkGray
  $cron = & $psql $ConnectionString -t -A -c "select 1 from pg_available_extensions where name = 'pg_cron';" 2>$null
  if ($LASTEXITCODE -ne 0) { Write-Host "could not query extensions (continuing)" -ForegroundColor Yellow }
  elseif ($cron -match '1') { Write-Host "pg_cron is available" -ForegroundColor DarkGray }
  else { Write-Warning "pg_cron NOT available. Enable it: Dashboard -> Database -> Extensions -> pg_cron, or 0006 fails." }
}

# ---- apply numbered migrations in order ---------------------------------------
$files = Get-ChildItem $Migrations -Filter '*.sql' | Sort-Object { [int]($_.BaseName.Substring(0, 4)) }
if (-not $files) { throw "No migrations found in $Migrations" }

Write-Host ""
Write-Host "Applying $($files.Count) migrations..." -ForegroundColor Yellow
foreach ($f in $files) { Invoke-SqlFile -File $f.FullName -Label $f.Name }

if ($Seed) {
  foreach ($s in $SeedFiles) { if (Test-Path $s) { Invoke-SqlFile -File $s -Label (Split-Path -Leaf $s) } }
  Write-Warning "Seed data applied. Never run seed files against production."
}

# ---- verification -------------------------------------------------------------
Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
$verify = @(
  "select count(*) as rls_policies from pg_policies where schemaname = 'public';",
  "select count(*) as public_tables from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';",
  "select proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and proname in ('reserve_table','hold_ticket','complete_purchase','release_ticket_hold','admin_set_user_role') order by 1;"
)
foreach ($q in $verify) { & $psql $ConnectionString -c $q }

Write-Host ""
Write-Host "Migrations applied." -ForegroundColor Green
Write-Host "Next: Authentication -> URL Configuration (Site URL + Redirect URLs); enable the Google provider with your EXISTING Client ID/Secret; set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY on Netlify." -ForegroundColor Green
