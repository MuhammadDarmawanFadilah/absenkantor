[CmdletBinding()]
param(
  [string]$AppPath = "",
  [string]$RemoteAppDir = "/var/www/absenkantor.my.id",
  [string]$RemotePort = "",
  [string]$RemoteHost = "",
  [string]$RemoteUser = "",
  [string]$RemoteHostKey = "",
  [string]$RemotePassword = "",
  [string]$ServiceName = "absenkantor-frontend.service",
  [int]$AppPort = 3004,
  [string]$LocalPnpmExe = "",
  [string]$PlinkExe = "",
  [string]$PscpExe = "",
  [switch]$SkipInstall,
  [switch]$SkipRemoteInstall
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($AppPath)) {
  $baseDir = $null
  if ($PSCommandPath) {
    $baseDir = Split-Path -Parent $PSCommandPath
  }
  elseif ($PSScriptRoot) {
    $baseDir = $PSScriptRoot
  }
  else {
    $baseDir = (Get-Location).Path
  }

  $AppPath = Join-Path -Path $baseDir -ChildPath 'frontend'
}

if ([string]::IsNullOrWhiteSpace($RemotePort)) {
  $RemotePort = if ($env:DEPLOY_SSH_PORT) { $env:DEPLOY_SSH_PORT } else { "22" }
}

if ([string]::IsNullOrWhiteSpace($RemoteHost)) {
  $RemoteHost = if ($env:DEPLOY_SSH_HOST) { $env:DEPLOY_SSH_HOST } else { "31.97.110.194" }
}

if ([string]::IsNullOrWhiteSpace($RemoteUser)) {
  $RemoteUser = if ($env:DEPLOY_SSH_USER) { $env:DEPLOY_SSH_USER } else { "root" }
}

if ([string]::IsNullOrWhiteSpace($RemoteHostKey)) {
  $RemoteHostKey = if ($env:DEPLOY_SSH_HOSTKEY) { $env:DEPLOY_SSH_HOSTKEY } else { "" }
}

if ([string]::IsNullOrWhiteSpace($RemotePassword)) {
  $RemotePassword = if ($env:DEPLOY_SSH_PASS) { $env:DEPLOY_SSH_PASS } else { "" }
}

if ([string]::IsNullOrWhiteSpace($LocalPnpmExe)) {
  $LocalPnpmExe = if ($env:PNPM_EXE) { $env:PNPM_EXE } else { "pnpm" }
}

if ([string]::IsNullOrWhiteSpace($PlinkExe)) {
  $PlinkExe = if ($env:PLINK_EXE) { $env:PLINK_EXE } else { "C:\Program Files\PuTTY\plink.exe" }
}

if ([string]::IsNullOrWhiteSpace($PscpExe)) {
  $PscpExe = if ($env:PSCP_EXE) { $env:PSCP_EXE } else { "C:\Program Files\PuTTY\pscp.exe" }
}

function Assert-FileExists([string]$Path, [string]$Name) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing $Name at: $Path"
  }
}

function Assert-CommandExists([string]$Exe, [string]$Name) {
  $cmd = Get-Command $Exe -ErrorAction SilentlyContinue
  if (-not $cmd) {
    throw "Missing $Name ($Exe)"
  }
}

Assert-FileExists -Path $AppPath -Name 'AppPath'
Assert-FileExists -Path $PlinkExe -Name 'PlinkExe'
Assert-FileExists -Path $PscpExe -Name 'PscpExe'
Assert-CommandExists -Exe $LocalPnpmExe -Name 'pnpm'

if ([string]::IsNullOrWhiteSpace($RemotePassword)) { throw 'DEPLOY_SSH_PASS is required' }

Push-Location $AppPath
try {
  $envProdPath = Join-Path -Path $AppPath -ChildPath '.env.prod'
  $envProductionPath = Join-Path -Path $AppPath -ChildPath '.env.production'
  if (Test-Path -LiteralPath $envProdPath) {
    Copy-Item -LiteralPath $envProdPath -Destination $envProductionPath -Force
  }

  if (-not $SkipInstall) {
    & $LocalPnpmExe install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
      & $LocalPnpmExe install --no-frozen-lockfile
    }
  }

  $oldNodeEnv = $env:NODE_ENV
  $env:NODE_ENV = 'production'
  & $LocalPnpmExe run build
  $env:NODE_ENV = $oldNodeEnv
  if ($LASTEXITCODE -ne 0) {
    throw "Local build failed (exit code $LASTEXITCODE)"
  }

  $artifactName = "absenkantor-frontend-build-$([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')).tar.gz"
  $artifactPath = Join-Path -Path $env:TEMP -ChildPath $artifactName
  if (Test-Path -LiteralPath $artifactPath) {
    Remove-Item -LiteralPath $artifactPath -Force
  }

  foreach ($required in @('.next', 'public', 'package.json', 'pnpm-lock.yaml')) {
    if (-not (Test-Path -LiteralPath (Join-Path $AppPath $required))) {
      throw "Missing required deploy input/output: $required"
    }
  }

  $configCandidates = @('next.config.js', 'next.config.mjs')
  $configToShip = $null
  foreach ($c in $configCandidates) {
    if (Test-Path -LiteralPath (Join-Path $AppPath $c)) { $configToShip = $c; break }
  }
  if (-not $configToShip) {
    throw 'Missing Next.js config (next.config.js/next.config.mjs)'
  }

  $tarExe = Get-Command tar -ErrorAction SilentlyContinue
  if (-not $tarExe) {
    throw 'Missing tar executable on Windows (tar)'
  }
  & $tarExe.Source -czf $artifactPath -C $AppPath .next public package.json pnpm-lock.yaml $configToShip

  $remoteZip = "/tmp/$artifactName"

  $pscpArgs = @('-batch', '-P', $RemotePort, '-pw', $RemotePassword)
  if (-not [string]::IsNullOrWhiteSpace($RemoteHostKey)) { $pscpArgs += @('-hostkey', $RemoteHostKey) }
  $pscpArgs += @($artifactPath, "$RemoteUser@${RemoteHost}:$remoteZip")
  & $PscpExe @pscpArgs

  $remoteCmdPath = Join-Path -Path $env:TEMP -ChildPath "absenkantor-frontend-deploy-remote-$([DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss')).sh"

  $remoteCmd = @'
set -e
APP_DIR="__APP_DIR__"
ZIP="__ZIP__"
SVC="__SVC__"
PORT="__PORT__"
TS="$(date +%Y%m%d_%H%M%S)"
BK="/var/backups/absenkantor-frontend-$TS"

mkdir -p "$BK"

if [ -d "$APP_DIR" ]; then
  if [ -d "$APP_DIR/.next" ]; then cp -a "$APP_DIR/.next" "$BK/.next" || true; fi
  if [ -d "$APP_DIR/public" ]; then cp -a "$APP_DIR/public" "$BK/public" || true; fi
  if [ -f "$APP_DIR/package.json" ]; then cp -a "$APP_DIR/package.json" "$BK/package.json" || true; fi
  if [ -f "$APP_DIR/pnpm-lock.yaml" ]; then cp -a "$APP_DIR/pnpm-lock.yaml" "$BK/pnpm-lock.yaml" || true; fi
else
  mkdir -p "$APP_DIR"
fi

rm -rf "$APP_DIR/.next" "$APP_DIR/public" "$APP_DIR/package.json" "$APP_DIR/pnpm-lock.yaml" "$APP_DIR/next.config.ts" "$APP_DIR/next.config.js" "$APP_DIR/next.config.mjs"

if command -v tar >/dev/null 2>&1; then
  tar -xzf "$ZIP" -C "$APP_DIR"
else
  echo "Missing tar on server" >&2
  exit 2
fi

cd "$APP_DIR"

if [ "__SKIP_REMOTE_INSTALL__" = "True" ]; then
  :
else
  if command -v pnpm >/dev/null 2>&1; then
    pnpm install --prod --frozen-lockfile || pnpm install --prod
  elif command -v npm >/dev/null 2>&1; then
    npm install --omit=dev
  fi
fi

cat > "/etc/systemd/system/$SVC" <<UNIT
[Unit]
Description=Absensi Lampung Frontend (Next.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=127.0.0.1
EnvironmentFile=-$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/node_modules/next/dist/bin/next start -p $PORT
Restart=always
RestartSec=3
KillSignal=SIGINT
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "$SVC" >/dev/null 2>&1 || true

systemctl restart "$SVC"
sleep 2
systemctl is-active "$SVC"

echo "Waiting for upstream to be ready..."
ok=0
for i in $(seq 1 60); do
  if ss -lnt | grep -q ":$PORT"; then
    ok=1
    break
  fi
  sleep 1
done

if [ "$ok" != "1" ]; then
  echo "Deploy check failed" >&2
  systemctl status "$SVC" --no-pager || true
  journalctl -u "$SVC" -n 200 --no-pager || true
  exit 3
fi

nginx -t >/dev/null 2>&1 || true
'@

  $remoteCmd = $remoteCmd.Replace('__APP_DIR__', $RemoteAppDir)
  $remoteCmd = $remoteCmd.Replace('__ZIP__', $remoteZip)
  $remoteCmd = $remoteCmd.Replace('__SVC__', $ServiceName)
  $remoteCmd = $remoteCmd.Replace('__PORT__', $AppPort.ToString())
  $remoteCmd = $remoteCmd.Replace('__SKIP_REMOTE_INSTALL__', ($(if ($SkipRemoteInstall) { 'True' } else { 'False' })))

  [System.IO.File]::WriteAllText($remoteCmdPath, $remoteCmd, (New-Object System.Text.UTF8Encoding($false)))

  $plinkArgs = @('-batch', '-ssh', '-P', $RemotePort, '-pw', $RemotePassword)
  if (-not [string]::IsNullOrWhiteSpace($RemoteHostKey)) { $plinkArgs += @('-hostkey', $RemoteHostKey) }
  $plinkArgs += @('-m', $remoteCmdPath, "$RemoteUser@$RemoteHost")
  & $PlinkExe @plinkArgs
}
finally {
  Pop-Location
}
