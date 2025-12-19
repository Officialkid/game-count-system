#!/usr/bin/env pwsh
# Clean up mock data files and unused code

Write-Host "🧹 Cleaning up mock files and old code..." -ForegroundColor Cyan

# Remove mock data files
$mockFiles = @(
    "lib\mockService.ts",
    "lib\mockData.ts",
    "lib\frontend-mock.ts",
    "lib\fetch-mock.ts",
    "hooks\useMockAuth.ts"
)

foreach ($file in $mockFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted $file" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Skipped $file (not found)" -ForegroundColor Gray
    }
}

# Remove documentation files for mock layer
$mockDocs = @(
    "MOCK_LAYER_GUIDE.md",
    "MOCK_AUTH_REFERENCE.tsx",
    "IMPLEMENTATION_SUMMARY.md",
    "COMPLETION_CHECKLIST.md",
    "DIRECTORY_MANIFEST.md"
)

foreach ($file in $mockDocs) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Deleted $file" -ForegroundColor Green
    } else {
        Write-Host "  ⏭️  Skipped $file (not found)" -ForegroundColor Gray
    }
}

Write-Host "`n✅ Cleanup complete!" -ForegroundColor Green
Write-Host "Mock files removed, Appwrite is now the sole backend" -ForegroundColor Cyan
