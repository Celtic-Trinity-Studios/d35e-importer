$ErrorActionPreference = "Stop"
$version = "v1.6.3"

# Get git credentials
$credInput = @"
protocol=https
host=github.com

"@
$credOutput = $credInput | git credential fill 2>$null
$token = ($credOutput | Where-Object { $_ -match "^password=" }) -replace "password=", ""

if (-not $token) {
    Write-Error "Could not get GitHub token from git credentials"
    exit 1
}

$headers = @{
    "Authorization" = "token $token"
    "Accept" = "application/vnd.github+json"
}

# Create release
$body = @{
    tag_name = $version
    name = "Release $version"
    body = "Fix corrupted actor - remove recursive:false"
} | ConvertTo-Json

Write-Host "Creating release..."
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/Celtic-Trinity-Studios/d35e-importer/releases" `
    -Method Post -Headers $headers -ContentType "application/json" -Body $body

Write-Host "Release created with ID $($release.id)"

# Upload asset
$uploadUrl = $release.upload_url -replace "\{.*\}", ""
Write-Host "Uploading d35e-importer.zip..."
$result = Invoke-RestMethod -Uri "$($uploadUrl)?name=d35e-importer.zip" `
    -Method Post -Headers $headers -ContentType "application/zip" -InFile "d35e-importer.zip"

Write-Host "Uploaded: $($result.name) ($($result.size) bytes) - $($result.browser_download_url)"
