$version = "v1.5.1"
$zipFile = "d35e-importer.zip"
$repo = "Celtic-Trinity-Studios/d35e-importer"

Write-Host "Creating release $version..."
$releaseOutput = gh release create $version $zipFile --title "Release $version" --notes "Fixes to levelUpData and skills"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Release created successfully."
} else {
    Write-Host "Failed to create release."
}
