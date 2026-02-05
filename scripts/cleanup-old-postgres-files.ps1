# Cleanup Old PostgreSQL Files
# This script removes legacy PostgreSQL API routes and library files
# Run: .\scripts\cleanup-old-postgres-files.ps1

Write-Host "`n🧹 Cleaning Up Old PostgreSQL Files" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray

$rootPath = Split-Path -Parent $PSScriptRoot

# Files to delete
$filesToDelete = @(
    # Old API routes
    "app\api\cron\cleanup\route.ts",
    "app\api\event-by-token\[token]\route.ts",
    "app\api\events\[event_id]\export-csv\route.ts",
    "app\api\events\[event_id]\finalize\route.ts",
    "app\api\events\[event_id]\history\route.ts",
    "app\api\events\[event_id]\teams\route.ts",
    "app\api\events\[event_id]\scores\route.ts",
    "app\api\public\by-event\[eventId]\route.ts",
    "app\api\scores\bulk\route.ts",
    "app\api\scores\update\route.ts",
    "app\api\teams\bulk\route.ts",
    "app\api\waitlist\signup\route.ts",
    
    # Old library files
    "lib\db-client.ts",
    "lib\db-access.ts",
    "lib\db-validations.ts",
    "lib\api-responses.ts"
)

# Directories to delete
$dirsToDelete = @(
    "app\api\cron\cleanup",
    "app\api\event-by-token",
    "app\api\events\[event_id]\export-csv",
    "app\api\public\by-event",
    "app\api\waitlist"
)

$deletedCount = 0
$skippedCount = 0

Write-Host "`n📂 Scanning for old PostgreSQL files..." -ForegroundColor Yellow

# Delete files
foreach ($file in $filesToDelete) {
    $fullPath = Join-Path $rootPath $file
    
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "   ✓ Deleted: $file" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "   ✗ Failed to delete: $file" -ForegroundColor Red
            $skippedCount++
        }
    } else {
        Write-Host "   ⊘ Not found: $file" -ForegroundColor Gray
    }
}

# Delete empty directories
Write-Host "`n📁 Cleaning up empty directories..." -ForegroundColor Yellow

foreach ($dir in $dirsToDelete) {
    $fullPath = Join-Path $rootPath $dir
    
    if (Test-Path $fullPath) {
        try {
            # Check if directory is empty or only contains deleted files
            $items = Get-ChildItem $fullPath -Recurse
            
            if ($items.Count -eq 0) {
                Remove-Item $fullPath -Recurse -Force
                Write-Host "   ✓ Deleted directory: $dir" -ForegroundColor Green
                $deletedCount++
            } else {
                Write-Host "   ⊗ Directory not empty: $dir (skipped)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ✗ Failed to delete directory: $dir" -ForegroundColor Red
        }
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "   Deleted: $deletedCount files/directories" -ForegroundColor Green
Write-Host "   Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host ("=" * 60) -ForegroundColor Gray

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart VS Code to clear TypeScript errors"
Write-Host "   2. Run: npm run build"
Write-Host "   3. Verify no errors remain"
Write-Host ""

# Ask if user wants to restart VS Code
$restart = Read-Host "`nRestart VS Code now? (y/n)"
if ($restart -eq 'y' -or $restart -eq 'Y') {
    Write-Host "`n🔄 Please manually restart VS Code" -ForegroundColor Cyan
    Write-Host "   (PowerShell cannot restart VS Code automatically)" -ForegroundColor Gray
}
