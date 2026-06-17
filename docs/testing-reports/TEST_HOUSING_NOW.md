# COMPLETE TEST PLAN - Housing Allowance

## Issue Summary
- ✅ Database: Correct (2 requests with Arabic status)
- ✅ Backend Code: Fixed (uses getAllRecentRequests)
- ✅ Frontend Code: Correct (calls getMyHousingAllowances)
- ❌ Backend Server: **NEEDS RESTART** (still running old code)
- ❌ Browser: **NEEDS CACHE CLEAR** (old token/data)

## STEP-BY-STEP FIX

### Step 1: Restart Backend Server (CRITICAL!)

The backend is still running the **OLD CODE** without your fix. You MUST restart it:

```bash
# In your terminal where backend is running:
1. Press Ctrl+C to stop the server
2. Wait for it to fully stop
3. Run: npm run dev
   OR
   Run: node server.js
```

**WHY:** The backend you changed isn't running yet! The old code doesn't include housing in the queries.

### Step 2: Clear Browser Data (CRITICAL!)

Your browser has cached the old API responses and expired tokens:

**Option A - Clear Everything:**
```javascript
// Open browser console (F12), paste this:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Option B - Clear Just Auth:**
```javascript
// Open browser console (F12), paste this:
localStorage.removeItem('authToken');
localStorage.removeItem('refreshToken');
window.location.href = 'login.html';
```

**WHY:** Your token is expired (all those "Invalid token" errors) and old data is cached.

### Step 3: Test the APIs Directly

Before checking dashboards, test if backend works:

**Test 1: Check Admin API**
```bash
cd Backend
node -e "
const fetch = require('node-fetch');
const token = 'YOUR_TOKEN_HERE';

fetch('http://localhost:3037/api/admin/requests/recent?limit=10&onlyPending=true', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(data => {
  console.log('Total requests:', data.length);
  const housing = data.filter(r => r.type === 'housing_allowance');
  console.log('Housing requests:', housing.length);
  if (housing.length > 0) {
    console.log('✅ SUCCESS! Housing requests are returned by API');
    console.table(housing.map(h => ({ id: h.id, status: h.status, type: h.type })));
  } else {
    console.log('❌ FAIL! No housing requests returned');
  }
});
"
```

**Test 2: Check Employee API**
```bash
cd Backend
node -e "
const fetch = require('node-fetch');
const token = 'YOUR_TOKEN_HERE';

fetch('http://localhost:3037/api/housing-allowance/mine', {
  headers: { 'Authorization': 'Bearer ' + token }
})
.then(r => r.json())
.then(data => {
  console.log('Employee housing requests:', Array.isArray(data) ? data.length : 'Error');
  if (Array.isArray(data) && data.length > 0) {
    console.log('✅ SUCCESS! Employee can see their housing requests');
    console.table(data);
  } else {
    console.log('❌ FAIL! No requests or error:', data);
  }
});
"
```

### Step 4: Check Dashboards

**Admin Dashboard:**
1. Go to: http://localhost:3037/Frontend/HTML/admin-dashboard.html
2. Open browser console (F12)
3. Look for log: `✅ Admin API data loaded:`
4. Check `recentRequests` count
5. Look for housing requests in the list

**Employee Dashboard:**
1. Go to: http://localhost:3037/Frontend/HTML/employee-dashboard.html
2. Open browser console (F12)
3. Look for log: `✅ API data loaded:`
4. Check `housingAllowance: 2`
5. Scroll down to "الإشعارات الطلبات المعلقة" section
6. Housing requests should appear

### Step 5: If Still Not Showing

**Check Browser Console for Errors:**
```
F12 → Console tab
Look for RED errors like:
- "Invalid token" → Need to re-login
- "404 Not Found" → Backend not running
- "Failed to fetch" → Backend crashed
- "Unauthorized" → Token expired
```

**Check Backend Terminal for Errors:**
Look for:
- ✅ `Multi-approval initialized for housing allowance request`
- ✅ `Housing allowance request X created successfully`
- ❌ Any SQL errors
- ❌ Any "Unknown column" errors

## Common Issues & Solutions

### Issue 1: "Invalid token" errors
**Solution:** Log out and log back in to get fresh token

### Issue 2: Backend crashes on startup
**Solution:** Check if TypeScript is compiled:
```bash
cd Backend
npm run build
node server.js
```

### Issue 3: Still seeing 0 housing requests
**Solution:** Check query directly:
```bash
cd Backend
node check-housing-requests.js
```

This shows if data is in DB but API isn't returning it.

### Issue 4: API returns empty array
**Solution:** Check if getAllRecentRequests is being called:
Add console.log to Backend/src/modules/employee-requests/employee-requests.controller.ts:
```typescript
if (!onlyPending) {
  console.log('🔍 Admin requested all recent requests');
  const requests = await getAllRecentRequests(limit);
  console.log(`📊 Got ${requests.length} requests from getAllRecentRequests`);
  return res.json(requests);
}
```

## Expected Results After Fix

### Database:
```
✅ 2 housing requests exist
✅ Status: 'قيد الاعتماد'
✅ 6 approval records (3 approvers × 2 requests)
```

### Backend API:
```
GET /api/admin/requests/recent?onlyPending=true
✅ Returns 2+ requests including housing_allowance

GET /api/housing-allowance/mine
✅ Returns 2 requests for employee 6457
```

### Frontend:
```
Admin Dashboard:
✅ Shows "طلبات تحتاج موافقتك" section
✅ Displays HA-1 and HA-2 in list
✅ Type shows "بدل سكن"

Employee Dashboard:
✅ Shows housing requests in recent requests
✅ Status "قيد الاعتماد"
✅ Can click to view details
```

## Final Checklist

- [ ] Backend server restarted
- [ ] Browser cache cleared
- [ ] Logged out and back in
- [ ] No "Invalid token" errors in backend logs
- [ ] No errors in browser console
- [ ] Can see other request types (clearance, onboarding work?)
- [ ] Housing requests appear in database (run check script)
- [ ] Housing requests returned by API (test directly)
- [ ] Housing requests show in admin dashboard
- [ ] Housing requests show in employee dashboard

## If ALL ELSE FAILS

Create a fresh test request with current session:

1. Make sure backend is running
2. Log in to employee dashboard
3. Go to: http://localhost:3037/Frontend/HTML/employee-saudi-doctors-housing.html
4. Fill in the form
5. Submit
6. Open browser console - look for success message
7. Check backend terminal - should see "Housing allowance request X created"
8. Immediately refresh admin dashboard - new request should appear

If this new request ALSO doesn't show, then there's still a backend issue.

## Debug Commands

```bash
# Check if backend compiled
cd Backend
ls -la dist/

# Check current backend code
cd Backend/src/modules/employee-requests
cat employee-requests.controller.ts | grep "getAllRecentRequests"

# Should show:
# const requests = await getAllRecentRequests(limit);

# If it shows getEmployeeRequests, the file wasn't saved!
```

