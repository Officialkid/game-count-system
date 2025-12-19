#!/bin/bash

# Automated Appwrite Backup Script
# Backs up all collections and storage buckets

set -e

BACKUP_ROOT="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo "📦 Creating Appwrite backup..."
echo "Timestamp: $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if Appwrite CLI is configured
if [ -z "$APPWRITE_ENDPOINT" ] || [ -z "$APPWRITE_PROJECT_ID" ]; then
    echo "❌ Appwrite environment variables not set"
    exit 1
fi

# Backup collections
echo "📄 Backing up collections..."

COLLECTIONS=("events" "teams" "scores" "share_links" "audit_logs")

for collection in "${COLLECTIONS[@]}"; do
    echo "  ↳ Backing up $collection..."
    appwrite databases listDocuments \
        --databaseId="$APPWRITE_DATABASE_ID" \
        --collectionId="$collection" \
        --limit=10000 \
        > "$BACKUP_DIR/$collection.json" 2>&1 || echo "    ⚠️  Warning: Could not backup $collection"
done

# Backup storage file lists
echo "🗄️  Backing up storage manifests..."

appwrite storage listFiles \
    --bucketId="event-logos" \
    > "$BACKUP_DIR/logos-manifest.json" 2>&1 || echo "  ⚠️  Warning: Could not backup logos manifest"

appwrite storage listFiles \
    --bucketId="team-avatars" \
    > "$BACKUP_DIR/avatars-manifest.json" 2>&1 || echo "  ⚠️  Warning: Could not backup avatars manifest"

# Create backup metadata
cat > "$BACKUP_DIR/metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "project_id": "$APPWRITE_PROJECT_ID",
  "database_id": "$APPWRITE_DATABASE_ID",
  "collections": $(printf '%s\n' "${COLLECTIONS[@]}" | jq -R . | jq -s .),
  "buckets": ["event-logos", "team-avatars"]
}
EOF

# Create symlink to latest backup
ln -sfn "$TIMESTAMP" "$BACKUP_ROOT/latest"

echo "✅ Backup complete!"
echo "📁 Location: $BACKUP_DIR"
echo "💾 Size: $(du -sh $BACKUP_DIR | cut -f1)"

# Cleanup old backups (keep last 30 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_ROOT" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;

echo "🎉 Backup process finished successfully!"
