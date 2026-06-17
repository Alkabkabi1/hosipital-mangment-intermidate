# Testing New Forms Integration

## Forms Added
1. **Maternity Leave Request (طلب إجازة رعاية مولود)**
   - Frontend: `Frontend/HTML/employee-maternity-leave-request.html`
   - JavaScript: `Frontend/JS/employee-maternity-leave-request.js`
   - Backend API: `/maternity-leave`

2. **Housing Allowance Request (بدل سكن أطباء سعوديين)**
   - Frontend: `Frontend/HTML/employee-saudi-doctors-housing.html`
   - JavaScript: `Frontend/JS/employee-saudi-doctors-housing.js`
   - Backend API: `/housing-allowance`

## Database Tables Created
- `Maternity_Leave_Requests`
- `Maternity_Leave_Status_History`
- `Housing_Allowance_Requests`
- `Housing_Allowance_Status_History`

## Multi-Approval Integration
Both forms are integrated with the multi-approval workflow system:

### Maternity Leave Approval Rules
- HR (Order 1)
- MANAGER (Order 2)

### Housing Allowance Approval Rules
- HR (Order 1)
- FINANCE (Order 2)
- MANAGER (Order 3)

## API Endpoints

### Maternity Leave
- `POST /maternity-leave` - Create request
- `GET /maternity-leave/my-requests` - Get user's requests
- `GET /maternity-leave` - Get all requests (admin)
- `GET /maternity-leave/:id` - Get specific request
- `PATCH /maternity-leave/:id/status` - Update status

### Housing Allowance
- `POST /housing-allowance` - Create request
- `GET /housing-allowance/my-requests` - Get user's requests
- `GET /housing-allowance` - Get all requests (admin)
- `GET /housing-allowance/:id` - Get specific request
- `PATCH /housing-allowance/:id/status` - Update status

## Dashboard Integration
Both forms have been added to the employee dashboard dropdown menu:
- 👶 طلب إجازة رعاية مولود
- 🏠 بدل سكن أطباء سعوديين

## Testing Steps

1. **Run Database Migration**
   ```sql
   -- Execute Backend/migrations/add_maternity_housing_requests.sql
   ```

2. **Start Backend Server**
   ```bash
   cd Backend
   npm run dev
   ```

3. **Access Forms**
   - Open employee dashboard: `http://localhost:3037/Frontend/HTML/employee-dashboard.html`
   - Click "طلب جديد" dropdown
   - Select either new form
   - Fill out and submit

4. **Verify API Integration**
   - Forms should submit via API if `window.apiClient` is available
   - Fallback to localStorage if API is not available
   - Check browser network tab for API calls

5. **Test Multi-Approval**
   - Submit a request as employee
   - Login as HR/Manager/Finance user
   - Check approval workflow in admin panels

## Features
- ✅ Full-stack implementation
- ✅ Multi-approval workflow
- ✅ Database persistence
- ✅ API validation with Zod schemas
- ✅ Status history tracking
- ✅ Role-based access control
- ✅ Print functionality
- ✅ Arabic RTL support
- ✅ Responsive design
