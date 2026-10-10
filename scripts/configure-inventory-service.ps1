# Run from PowerShell before starting the local backend; Docker uses the saved root .env.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
$existing = if (Test-Path -LiteralPath $envFile) { [IO.File]::ReadAllText($envFile) } else { '' }
function Get-Setting([string]$name) {
    $match = [regex]::Match($existing, '(?m)^' + [regex]::Escape($name) + '=(.+)\r?$')
    if ($match.Success) { return $match.Groups[1].Value.Trim() }
    return ''
}
$clientId = Get-Setting 'INVENTORY_AGENT_CLIENT_ID'
if (!$clientId) { $clientId = 'inventory.agent' }
$clientSecret = Get-Setting 'INVENTORY_AGENT_CLIENT_SECRET'
if (!$clientSecret) {
    $bytes = [byte[]]::new(32)
    [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $clientSecret = [Convert]::ToHexString($bytes).ToLowerInvariant()
}
if ($clientSecret.Length -lt 32 -or $clientSecret.Length -gt 72) { throw 'Inventory service secret must be 32 to 72 characters.' }
$settings = @{
    INVENTORY_AGENT_CLIENT_ID = $clientId
    INVENTORY_AGENT_CLIENT_SECRET = $clientSecret
    BACKEND_AGENT_CLIENT_ID = $clientId
    BACKEND_AGENT_CLIENT_SECRET = $clientSecret
}
foreach ($name in $settings.Keys) {
    $line = $name + '=' + $settings[$name]
    $pattern = '(?m)^' + [regex]::Escape($name) + '=.*$'
    if ([regex]::IsMatch($existing, $pattern)) { $existing = [regex]::Replace($existing, $pattern, $line) }
    else { $existing = $existing.TrimEnd() + "`n" + $line + "`n" }
}
[IO.File]::WriteAllText($envFile, $existing, [Text.UTF8Encoding]::new($false))
$env:InventoryAgent__ClientId = $clientId
$env:InventoryAgent__ClientSecret = $clientSecret
$env:BACKEND_AGENT_CLIENT_ID = $clientId
$env:BACKEND_AGENT_CLIENT_SECRET = $clientSecret
Write-Host 'Inventory service credentials configured. Existing unrelated settings preserved. No database changes performed.'
