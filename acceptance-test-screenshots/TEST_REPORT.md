# Production Acceptance Test Report
**Site**: https://demo.unit311central.com  
**Deployment Commit**: a96b8757  
**Test Date**: Monday, August 24, 2026 18:05 UTC  
**Test Status**: ❌ **BLOCKED - Authentication Failure**

---

## Executive Summary

**CRITICAL BLOCKER**: Unable to complete acceptance testing due to authentication failure. Login page loads correctly but credentials fail with "Invalid username or password" error.

---

## Authentication Testing

### Test: Login with demo@unit311central.com
- **URL**: https://demo.unit311central.com/login
- **Status**: ❌ **FAIL**
- **Credentials Tested**:
  - Username: `demo@unit311central.com`
  - Password: `Letmein2026$`
- **Error**: "Invalid username or password"
- **Screenshot**: `01-login-failure.webp`

### Test: Login with paul.w.fotheringham@gmail.com  
- **URL**: https://demo.unit311central.com/login
- **Status**: ❌ **FAIL**
- **Credentials Tested**:
  - Username: `paul.w.fotheringham@gmail.com`
  - Password: `Letmein2026$`
- **Error**: "Invalid username or password"
- **Console Error**: `Failed to load resource: the server responded with a status of 401 ()`

---

## Root Cause Analysis

### Code Investigation Findings

1. **Migration 119 defines demo user**:
   - File: `supabase/migrations/119_dual_demo_workspace_tenancy.sql`
   - Defines user: `demo@unit311central.com`
   - Password hash: `demo@unit311central.com-salt-v1:16cb06600c6e28ea97e23fb311c0f5618bc082a451306265c523cfb5c8c953c5bdb503d4efe1abaa374943ef939aed34c23effe62af76407bf8fc8b2739708cc`

2. **Scripts confirm password**:
   - `scripts/prove-demo-readonly.mjs`: Uses `Letmein2026$`
   - `scripts/set-demo-onwardair-password.mjs`: Uses `Letmein2026$`
   - `scripts/set-demo-board-password.mjs`: Uses `Letmein2026$` for `board@unit311central.com`

3. **Possible issues**:
   - Migration 119 not applied to production database
   - Password hash mismatch (migration hash doesn't match `Letmein2026$`)
   - Demo workspace not provisioned
   - User exists but is inactive or misconfigured

---

## Tests BLOCKED (Cannot Proceed)

Due to authentication failure, the following test areas could NOT be executed:

### PRIORITY 1 - Internal Work Packages
- ❌ Navigate to Business Productivity → Internal Work Packages
- ❌ Create a work package
- ❌ Add task, verify IDs/progress
- ❌ Screenshot results

### PRIORITY 2 - Fundraising
- ❌ Dashboard
- ❌ Investors
- ❌ Cap Table
- ❌ Pipeline
- ❌ Meetings
- ❌ Pitch Decks
- ❌ Data Rooms
- ❌ Currency verification (USD vs GBP/EUR)

### PRIORITY 3 - Sales Management
- ❌ All subsections

### PRIORITY 4 - Corporate Information
- ❌ Test Add Company

### PRIORITY 5 - Content Studio
- ❌ Test create/edit controls

### PRIORITY 6 - Engineering
- ❌ Technical Files
- ❌ SOP
- ❌ All subsections

### PRIORITY 7 - Procurement
- ❌ Verify vertical sidebar tabs

---

## Recommendations

### IMMEDIATE ACTION REQUIRED:

1. **Verify database migration status**:
   ```bash
   # Check if migration 119 has been applied
   node scripts/verify-demo-release.mjs
   ```

2. **Reset demo user password**:
   ```bash
   # Run password reset script
   node scripts/set-demo-onwardair-password.mjs
   ```

3. **Verify demo workspace exists**:
   ```sql
   SELECT id, slug, name, workspace_type, status 
   FROM public.workspaces 
   WHERE slug = 'demo';
   ```

4. **Verify demo user exists**:
   ```sql
   SELECT id, username, email, workspace_id, is_active, user_type
   FROM public.platform_users
   WHERE username = 'demo@unit311central.com';
   ```

5. **Alternative**: If password is different, check environment variable:
   ```bash
   echo $DEMO_PROSPECT_PASSWORD
   ```

---

## Screenshots

1. `01-login-failure.webp` - Login error showing "Invalid username or password"

---

## Next Steps

1. ✅ Confirm correct credentials or provision demo user
2. ⏸️ Re-run full acceptance test suite once authentication works
3. ⏸️ Capture screenshots for all priority areas
4. ⏸️ Create structured results table
5. ⏸️ Document any failures requiring code fixes

---

## Test Environment

- **Browser**: Google Chrome
- **OS**: Linux 6.12.94+
- **Network**: HTTPS with valid SSL
- **Page Load**: ✅ Login page loads correctly
- **API Endpoint**: ✅ `/api/auth/login` responds (with 401)
- **Frontend**: ✅ React application loads
- **Backend**: ❓ Database/authentication issue

