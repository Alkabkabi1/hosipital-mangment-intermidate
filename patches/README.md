# Patches Directory

This directory contains all patch files that modify the codebase for various improvements and fixes.

## 📋 Available Patches

### Frontend Patches
- **`sync-manager-broadcast.patch`** - Adds BroadcastChannel support for cross-tab sync events
- **`status-normalization.patch`** - Implements status normalization mapper for Arabic/English status handling
- **`status-normalization-completion.patch`** - Completes status normalization integration across all components
- **`api-base-dynamic.patch`** - Makes API base URL dynamic for different deployment environments
- **`offline-sync.patch`** - Enhances offline synchronization with additional storage events and custom events
- **`dashboard-integration.patch`** - Dashboard integration improvements and enhancements
- **`form-integration.patch`** - Form integration and processing improvements

### Backend Patches
- **`auth-security-fix.patch`** - Removes testing mode and enforces proper password validation

## 🔧 How to Apply Patches

### Using Git Apply
```bash
# Apply a specific patch
git apply patches/patch-name.patch

# Check what a patch would do without applying
git apply --check patches/patch-name.patch

# Apply with 3-way merge for better conflict resolution
git apply --3way patches/patch-name.patch
```

### Manual Application
If git apply fails, you can manually review and apply the changes:
1. Open the patch file
2. Review the changes marked with `+` (additions) and `-` (deletions)
3. Apply the changes to the corresponding files
4. Test the changes thoroughly

## 📝 Patch Categories

### Status Management
- `status-normalization.patch`
- `status-normalization-completion.patch`

### Security & Authentication
- `auth-security-fix.patch`

### Frontend Enhancements
- `sync-manager-broadcast.patch`
- `api-base-dynamic.patch`
- `offline-sync.patch`

### Integration & Features
- `dashboard-integration.patch`
- `form-integration.patch`

## ⚠️ Important Notes

1. **Backup First**: Always backup your code before applying patches
2. **Test Thoroughly**: Test all functionality after applying patches
3. **Check Dependencies**: Some patches may depend on others being applied first
4. **Review Changes**: Always review what a patch does before applying it

## 🔄 Patch Application Order

For best results, apply patches in this order:
1. `status-normalization.patch`
2. `status-normalization-completion.patch`
3. `auth-security-fix.patch`
4. `api-base-dynamic.patch`
5. `sync-manager-broadcast.patch`
6. `offline-sync.patch`
7. `dashboard-integration.patch`
8. `form-integration.patch`

---

**Last Updated**: November 11, 2025
