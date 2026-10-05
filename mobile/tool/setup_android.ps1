$ErrorActionPreference = 'Stop'
$mobileRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$androidTarget = Join-Path $mobileRoot 'android'
if (Test-Path -LiteralPath $androidTarget) {
    throw 'android already exists. This script will not overwrite platform changes.'
}
Get-Command flutter -ErrorAction Stop | Out-Null
# Generate outside the source tree so Flutter cannot replace our Dart files,
# pubspec or tests. Keep the temporary scaffold for inspection; delete nothing.
$scaffoldRoot = Join-Path ([IO.Path]::GetTempPath()) ('agriops-mobile-' + [Guid]::NewGuid().ToString('N'))
flutter create --no-pub --platforms=android --project-name agriops_mobile --org lk.edu.sliit $scaffoldRoot
if ($LASTEXITCODE -ne 0) { throw 'Flutter platform generation failed.' }
$manifestPath = Join-Path $scaffoldRoot 'android/app/src/main/AndroidManifest.xml'
[xml]$manifest = Get-Content -LiteralPath $manifestPath -Raw
$androidNamespace = 'http://schemas.android.com/apk/res/android'
foreach ($permissionName in @('android.permission.INTERNET', 'android.permission.CAMERA')) {
    $permission = $manifest.CreateElement('uses-permission')
    $permission.SetAttribute('name', $androidNamespace, $permissionName)
    $manifest.manifest.AppendChild($permission) | Out-Null
}
$manifest.manifest.application.SetAttribute('allowBackup', $androidNamespace, 'false')
$manifest.manifest.application.SetAttribute('label', $androidNamespace, 'AgriOps')
$manifest.Save($manifestPath)
$gradlePath = Join-Path $scaffoldRoot 'android/app/build.gradle.kts'
$gradle = Get-Content -LiteralPath $gradlePath -Raw
if ($gradle -notmatch 'minSdk\s*=\s*flutter.minSdkVersion') { throw 'Unexpected Flutter template. Review the generated Android minimum SDK manually.' }
$gradle = $gradle -replace 'minSdk\s*=\s*flutter.minSdkVersion', 'minSdk = maxOf(flutter.minSdkVersion, 23)'
Set-Content -LiteralPath $gradlePath -Value $gradle -Encoding UTF8
# Cleartext is only permitted for emulator/USB loopback during debug development.
$debugRoot = Join-Path $scaffoldRoot 'android/app/src/debug'
$xmlRoot = Join-Path $debugRoot 'res/xml'
New-Item -ItemType Directory -Path $xmlRoot -Force | Out-Null
@'
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain>10.0.2.2</domain>
    <domain>127.0.0.1</domain>
    <domain>localhost</domain>
  </domain-config>
</network-security-config>
'@ | Set-Content -LiteralPath (Join-Path $xmlRoot 'agriops_network_security.xml') -Encoding UTF8
@'
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.INTERNET" />
  <application android:networkSecurityConfig="@xml/agriops_network_security" />
</manifest>
'@ | Set-Content -LiteralPath (Join-Path $debugRoot 'AndroidManifest.xml') -Encoding UTF8
Copy-Item -LiteralPath (Join-Path $scaffoldRoot 'android') -Destination $androidTarget -Recurse
Write-Host "Android platform created in $androidTarget"
Write-Host "Temporary scaffold retained at $scaffoldRoot"
Write-Host 'Next: flutter pub get; flutter analyze; flutter test'
