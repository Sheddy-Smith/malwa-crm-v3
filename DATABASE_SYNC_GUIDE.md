# Database File System Sync - Malwa CRM

## Overview
The Malwa CRM application now automatically saves all data to the file system at `C:/malwa_crm/data-base/` when running in Electron (desktop) mode. This ensures that your data persists and is easily accessible even outside the application.

## How It Works

### Automatic Sync
- **Real-time Backup**: Data is automatically backed up every 30 seconds when changes are detected
- **Startup Restore**: On app startup, data is automatically restored from the latest backup if available
- **Individual Store Files**: Each data module (customers, jobs, inventory, etc.) is saved as separate JSON files for easy access

### File Structure
```
C:/malwa_crm/data-base/
├── malwa-crm-backup-2025-11-22T10-30-00-000Z.json    # Complete backup with timestamp
├── customers-data.json                                  # Customer data
├── jobs-data.json                                      # Jobs data  
├── inventory-data.json                                 # Inventory data
├── suppliers-data.json                                 # Supplier data
├── vendors-data.json                                   # Vendor data
├── labour-data.json                                    # Labour data
└── ... (other module files)
```

### Features

#### 1. Automatic Data Persistence
- All data changes are automatically saved to the file system
- No manual intervention required
- Continuous backup ensures data safety

#### 2. Easy Data Access
- Data files are in human-readable JSON format
- Individual module files for specific data access
- Complete backup files for full system restore

#### 3. Backup & Restore
- **Settings > Backup & Restore**: Access backup management interface
- **Force Backup**: Create immediate backup on demand
- **Restore Options**: Restore from any available backup file
- **File List**: View all available backup files with timestamps and sizes

#### 4. Visual Indicators
- **Navbar Indicator**: Shows file sync status in the top navigation
- **Settings Dashboard**: Detailed sync information and controls
- **Status Cards**: Real-time sync status and last backup time

## Using the System

### Initial Setup
The system automatically:
1. Creates the `C:/malwa_crm/data-base/` directory
2. Initializes file system sync on app startup
3. Restores any existing data from previous backups
4. Starts automatic backup timer

### Manual Backup
1. Go to **Settings > Backup & Restore**
2. Click **Force Backup** to create immediate backup
3. View backup status and file information

### Restore Data
1. Go to **Settings > Backup & Restore**
2. Select a backup file from the list
3. Click **Restore** (confirms before overwriting current data)
4. App automatically reloads with restored data

### Accessing Raw Data
- Navigate to `C:/malwa_crm/data-base/` in Windows Explorer
- Open any `.json` file with a text editor to view raw data
- Module-specific files contain data for individual features
- Complete backup files contain all system data

## Data Safety

### Automatic Protection
- **Continuous Backup**: Data is saved every 30 seconds
- **Change Detection**: Only saves when actual changes occur
- **Multiple Copies**: Both individual module files and complete backups
- **Timestamp Tracking**: Each backup includes creation time

### Manual Safety Measures
- **Regular Backups**: Create manual backups before major changes
- **File Verification**: Check backup files periodically
- **External Backup**: Copy the entire `data-base` folder to external storage

## Browser vs Desktop Mode

### Desktop Mode (Electron)
✅ File system sync active
✅ Automatic backup to C:/malwa_crm/data-base/
✅ Persistent data storage
✅ Backup/restore functionality
✅ Raw file access

### Browser Mode
❌ File system sync not available
❌ Limited to browser storage (IndexedDB)
❌ Data may be cleared by browser
ℹ️ Traditional backup/export functionality still available

## Troubleshooting

### Common Issues

#### 1. Directory Not Created
- **Solution**: Check Windows permissions for C:/ drive
- **Alternative**: Manually create `C:/malwa_crm/data-base/` directory

#### 2. Backup Files Not Appearing
- **Check**: Settings > Backup & Restore for sync status
- **Solution**: Click "Force Backup" to create initial files
- **Verify**: Navigate to directory in Windows Explorer

#### 3. Restore Not Working
- **Verify**: Backup file is valid JSON format
- **Check**: File permissions in the data-base directory
- **Try**: Different backup file if available

#### 4. Sync Indicator Showing Red
- **Meaning**: File system sync is disabled or failed
- **Solution**: Restart application or check directory permissions
- **Backup**: Use manual export functions as fallback

### Performance Notes
- Backup files may grow large with extensive data
- Individual module files allow selective data access
- Auto-backup frequency can be adjusted in code if needed

## Technical Details

### File Format
All data files use JSON format with structure:
```json
{
  "timestamp": "2025-11-22T10:30:00.000Z",
  "version": "2.0.0",
  "stores": {
    "customers": [...],
    "jobs": [...],
    "inventory": [...]
  }
}
```

### Sync Architecture
- **Database Sync Manager**: Coordinates IndexedDB ↔ File System
- **Enhanced DB Operations**: Wraps database calls with sync triggers
- **IPC Handlers**: Electron main process file operations
- **Auto-save Timer**: Background process for periodic backups

This system ensures your Malwa CRM data is always safe, accessible, and persistent across application sessions.