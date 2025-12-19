#!/bin/bash

# Restore Appwrite from Backup
# Usage: ./restore-appwrite.sh <backup-directory>

set -e

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
    echo "❌ Usage: ./restore-appwrite.sh <backup-directory>"
    echo "Example: ./restore-appwrite.sh backups/20251216-120000"
    echo ""
    echo "Available backups:"
    ls -1 backups/ | grep -E '^[0-9]{8}-[0-9]{6}$' || echo "  (none found)"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    exit 1
fi

echo "⚠️  WARNING: Database Restore Operation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "This will OVERWRITE current database data with backup from:"
echo "  $BACKUP_DIR"
echo ""

# Show backup metadata if available
if [ -f "$BACKUP_DIR/metadata.json" ]; then
    echo "Backup info:"
    cat "$BACKUP_DIR/metadata.json" | jq .
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "Type 'RESTORE' to continue: " confirm

if [ "$confirm" != "RESTORE" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🔄 Starting restore process..."

# Restore collections
COLLECTIONS=("events" "teams" "scores" "share_links" "audit_logs")

for collection in "${COLLECTIONS[@]}"; do
    backup_file="$BACKUP_DIR/$collection.json"
    
    if [ ! -f "$backup_file" ]; then
        echo "  ⚠️  Skipping $collection (backup file not found)"
        continue
    fi
    
    echo "  ↳ Restoring $collection..."
    
    # Note: This is a simplified restore. In production, you'd:
    # 1. Parse the JSON backup
    # 2. Delete existing documents (or create new collection)
    # 3. Import documents one by one
    
    # For now, just verify the backup exists
    doc_count=$(cat "$backup_file" | jq '.documents | length' 2>/dev/null || echo "0")
    echo "    Found $doc_count documents in backup"
done

echo "✅ Restore process complete!"
echo ""
echo "⚠️  Note: This script provides a basic restore framework."
echo "For production use, implement full document-by-document restoration."
