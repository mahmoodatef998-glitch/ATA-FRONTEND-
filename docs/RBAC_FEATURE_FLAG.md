# RBAC Feature Flag Guide

## Overview

The RBAC system includes a feature flag (`RBAC_ENABLED`) that allows you to enable/disable the RBAC system without code changes. This enables gradual rollout and easy rollback.

---

## Configuration

### Backend (Server-side)

Add to `.env`:

```env
# Enable/disable RBAC system
# true = Use RBAC permission checks
# false = Use legacy role-based checks
RBAC_ENABLED=true

# Optional: Permission cache TTL (milliseconds)
# Default: 300000 (5 minutes)
PERMISSION_CACHE_TTL=300000

# Optional: Enable/disable audit logging
# Default: true
AUDIT_LOGGING_ENABLED=true
```

### Frontend (Client-side)

Add to `.env.local` or `.env`:

```env
# Client-side RBAC flag (must be prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_RBAC_ENABLED=true
```

**Important:** Client-side flag is optional. If not set, frontend will always check permissions (but backend will respect the server-side flag).

---

## Usage

### Backend

```typescript
import { authorize } from "@/lib/rbac/authorize";
import { PermissionAction } from "@/lib/permissions/role-permissions";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole } from "@prisma/client";

// In API route
export async function POST(request: NextRequest) {
  // RBAC check (falls back to legacy if RBAC_ENABLED=false)
  const { userId, companyId } = await authorize(
    PermissionAction.USER_CREATE,
    [UserRole.ADMIN] // Fallback roles if RBAC disabled
  );
  
  // Your logic here
}
```

### Frontend

```typescript
import { useCan } from "@/lib/permissions/frontend-helpers";
import { PermissionAction } from "@/lib/permissions/role-permissions";

function MyComponent() {
  const canCreate = useCan(PermissionAction.USER_CREATE);
  
  // Component automatically respects RBAC_ENABLED flag
  return (
    <PermissionButton permission={PermissionAction.USER_CREATE}>
      Create User
    </PermissionButton>
  );
}
```

---

## Behavior

### When `RBAC_ENABLED=true`

- ✅ RBAC permission checks are used
- ✅ Database queries for permissions
- ✅ Permission caching enabled
- ✅ Audit logging enabled (if `AUDIT_LOGGING_ENABLED=true`)
- ✅ Frontend permission checks active

### When `RBAC_ENABLED=false`

- ✅ Legacy role-based checks are used
- ✅ No database queries for permissions
- ✅ No permission caching
- ✅ Audit logging disabled
- ✅ Frontend still checks permissions (but backend ignores them)

---

## Gradual Rollout Strategy

### Phase 1: Testing (RBAC_ENABLED=false)

1. Deploy RBAC code with flag disabled
2. Verify legacy system still works
3. Test RBAC code in staging environment

**Configuration:**
```env
RBAC_ENABLED=false
```

### Phase 2: Internal Testing (RBAC_ENABLED=true for admins)

1. Enable RBAC for admin users only
2. Monitor logs and errors
3. Test all admin functions

**Configuration:**
```env
RBAC_ENABLED=true
```

**Code modification needed:**
```typescript
// Only enable RBAC for admins
if (session.user.role === UserRole.ADMIN && RBAC_ENABLED) {
  await authorize(PermissionAction.USER_CREATE);
} else {
  await requireRole([UserRole.ADMIN]);
}
```

### Phase 3: Gradual Rollout (RBAC_ENABLED=true)

1. Enable RBAC for all users
2. Monitor performance and errors
3. Have rollback plan ready

**Configuration:**
```env
RBAC_ENABLED=true
```

### Phase 4: Full Deployment

1. Remove legacy code
2. Remove feature flag
3. RBAC only

---

## Rollback Procedure

### Quick Rollback (via Feature Flag)

1. Set `RBAC_ENABLED=false` in `.env`
2. Restart server
3. System falls back to legacy checks

### Full Rollback (if needed)

1. Set `RBAC_ENABLED=false`
2. Revert database migrations (if needed)
3. Remove RBAC code (if needed)

See `docs/rbac.md` → Rollback Plan for details.

---

## Monitoring

### Check Feature Flag Status

```typescript
import { RBAC_ENABLED } from "@/lib/rbac/config";

console.log("RBAC Enabled:", RBAC_ENABLED);
```

### Logs

When RBAC is enabled, you'll see:

```
🔐 RBAC Configuration: {
  RBAC_ENABLED: true,
  PERMISSION_CACHE_TTL: '300s',
  AUDIT_LOGGING_ENABLED: true
}
```

---

## Troubleshooting

### Issue: Feature flag not working

**Solution:**
1. Verify `.env` file has `RBAC_ENABLED=true` (or `false`)
2. Restart server (env vars load on startup)
3. Check logs for RBAC configuration message

### Issue: Frontend still checking permissions when disabled

**Solution:**
1. Frontend always checks permissions (for UI consistency)
2. Backend will reject requests if user lacks permission
3. This is expected behavior

### Issue: Legacy checks not working when RBAC disabled

**Solution:**
1. Verify `fallbackRoles` parameter is provided to `authorize()`
2. Check that `requireRole()` is imported correctly
3. Verify user has correct role in database

---

## Best Practices

1. **Always provide fallback roles** when using `authorize()`:
   ```typescript
   await authorize(PermissionAction.USER_CREATE, [UserRole.ADMIN]);
   ```

2. **Test both modes** before deployment:
   - Test with `RBAC_ENABLED=true`
   - Test with `RBAC_ENABLED=false`

3. **Monitor logs** during rollout:
   - Watch for permission errors
   - Monitor cache hit rates
   - Check audit log entries

4. **Have rollback plan ready**:
   - Know how to disable quickly
   - Have database backup ready
   - Document rollback procedure

---

## Related Documentation

- `docs/rbac.md` - Full RBAC documentation
- `docs/ACCEPTANCE_CRITERIA.md` - Acceptance criteria
- `lib/rbac/config.ts` - Configuration file


