// Admin Employees Management JavaScript
// Handles admin employee management functionality

document.addEventListener('DOMContentLoaded', function() {
  // Check authentication and admin role
  if (!requireAuth()) return;

  const user = apiClient.getCurrentUser();
  if (user.role !== 'admin') {
    window.location.href = window.resolveFrontendPath('employee-dashboard.html');
    return;
  }

  // Initialize page
  loadEmployees();
  setupEventListeners();
  setupSearch();
});

let currentEmployees = [];
let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10;

function setupEventListeners() {
  // Add new employee button
  const addEmployeeBtn = document.getElementById('addEmployeeBtn');
  if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', showAddEmployeeModal);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadEmployees();
      showSuccess('تم تحديث البيانات');
    });
  }

  // Export button
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportEmployees);
  }

  // Pagination
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  
  if (prevPageBtn) prevPageBtn.addEventListener('click', () => changePage(currentPage - 1));
  if (nextPageBtn) nextPageBtn.addEventListener('click', () => changePage(currentPage + 1));
}

function setupSearch() {
  const searchInput = document.getElementById('employeeSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleSearch, 300));
  }

  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', handleSearch);
  }

  const departmentFilter = document.getElementById('departmentFilter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', handleSearch);
    loadDepartments();
  }
}

function pickArray(res, candidates = ['data', 'items', 'users', 'results', 'employees']) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    for (const k of candidates) {
      if (Array.isArray(res[k])) return res[k];
    }
  }
  return [];
}

async function loadEmployees(page = 1, search = '', status = '', department = '') {
  try {
    showLoadingState();

    // Fetch employees from database API
    const response = await apiClient.getAllEmployeesAdmin({
      page,
      search,
      status,
      department
    });

    // Extract data from response { success: true, data: [] }
    const data = response?.data || response;
    let allEmployees = Array.isArray(data) ? data : [];

    // Apply filters if needed
    let filtered = allEmployees;
    const q = (search || '').trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(emp => {
        const hay = `${emp.first_name || ''} ${emp.last_name || ''} ${emp.employee_number || ''} ${emp.position || ''} ${emp.department_name || ''} ${emp.email || ''} ${emp.phone || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (department) {
      filtered = filtered.filter(emp => String(emp.department_id || emp.department_name) === String(department));
    }
    if (status) {
      filtered = filtered.filter(emp => (emp.status || 'active') === status);
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    currentEmployees = filtered.slice(start, end);
    currentPage = page;
    totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    displayEmployees(currentEmployees);
    updatePagination();

  } catch (error) {
    console.error('Employees loading error:', error);
    showError('حدث خطأ في تحميل الموظفين: ' + (error.message || error));
  } finally {
    hideLoadingState();
  }
}

function displayEmployees(employees) {
  const employeesContainer = document.getElementById('employeesContainer');
  if (!employeesContainer) return;

  if (employees.length === 0) {
    employeesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>لا يوجد موظفون</h3>
        <p>لم يتم العثور على موظفين بالمعايير المحددة</p>
        <button class="btn btn-primary" onclick="showAddEmployeeModal()">إضافة موظف جديد</button>
      </div>
    `;
    return;
  }

  const employeesHTML = employees.map(employee => `
    <div class="employee-card">
      <div class="employee-header">
        <div class="employee-avatar">
          ${getInitials(employee.first_name, employee.last_name)}
        </div>
        <div class="employee-info">
          <h3>${employee.first_name} ${employee.last_name}</h3>
          <p class="employee-number">#${employee.employee_number}</p>
          <p class="employee-position">${employee.position || 'غير محدد'}</p>
        </div>
        <div class="employee-status">
          <span class="status-badge status-${employee.status}">${getStatusDisplayName(employee.status)}</span>
        </div>
      </div>
      
      <div class="employee-details">
        <div class="detail-item">
          <span class="label">القسم:</span>
          <span class="value">${employee.department_name || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
          <span class="label">البريد الإلكتروني:</span>
          <span class="value">${employee.email || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
          <span class="label">الهاتف:</span>
          <span class="value">${employee.phone || 'غير محدد'}</span>
        </div>
        <div class="detail-item">
          <span class="label">تاريخ التوظيف:</span>
          <span class="value">${formatDate(employee.hire_date)}</span>
        </div>
        <div class="detail-item">
          <span class="label">حساب المستخدم:</span>
          <span class="value">${employee.user_name ? `${employee.user_name} (${employee.user_email})` : 'غير مرتبط'}</span>
        </div>
      </div>
      
      <div class="employee-actions">
        <button class="btn-sm btn-primary" onclick="editEmployee(${employee.employee_id})">
          تعديل
        </button>
        <button class="btn-sm btn-info" onclick="viewEmployeeDetails(${employee.employee_id})">
          عرض
        </button>
        <button class="btn-sm ${employee.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                onclick="toggleEmployeeStatus(${employee.employee_id}, '${employee.status === 'active' ? 'inactive' : 'active'}')">
          ${employee.status === 'active' ? 'تعطيل' : 'تفعيل'}
        </button>
        <button class="btn-sm btn-danger" onclick="deleteEmployee(${employee.employee_id})">
          حذف
        </button>
      </div>
    </div>
  `).join('');

  employeesContainer.innerHTML = employeesHTML;
}

function updatePagination() {
  const paginationInfo = document.getElementById('paginationInfo');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');

  if (paginationInfo) {
    paginationInfo.textContent = `صفحة ${currentPage} من ${totalPages}`;
  }

  if (prevPageBtn) {
    prevPageBtn.disabled = currentPage <= 1;
  }

  if (nextPageBtn) {
    nextPageBtn.disabled = currentPage >= totalPages;
  }
}

function changePage(newPage) {
  if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
    const searchInput = document.getElementById('employeeSearch');
    const statusFilter = document.getElementById('statusFilter');
    const departmentFilter = document.getElementById('departmentFilter');

    loadEmployees(
      newPage,
      searchInput?.value || '',
      statusFilter?.value || '',
      departmentFilter?.value || ''
    );
  }
}

function handleSearch() {
  const searchInput = document.getElementById('employeeSearch');
  const statusFilter = document.getElementById('statusFilter');
  const departmentFilter = document.getElementById('departmentFilter');

  loadEmployees(
    1, // Reset to first page
    searchInput?.value || '',
    statusFilter?.value || '',
    departmentFilter?.value || ''
  );
}

async function loadDepartments() {
  try {
    const departments = await apiClient.makeRequest('/admin/departments');
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (departmentFilter && departments) {
      departmentFilter.innerHTML = '<option value="">جميع الأقسام</option>' +
        departments.map(dept => `<option value="${dept.department_id}">${dept.name_ar}</option>`).join('');
    }
    
  } catch (error) {
    console.error('Departments loading error:', error);
  }
}

function showAddEmployeeModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content large">
      <div class="modal-header">
        <h3>إضافة موظف جديد</h3>
        <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="modal-body">
        <form id="addEmployeeForm">
          <div class="form-grid">
            <div class="form-group">
              <label for="employeeNumber">رقم الموظف *</label>
              <input type="text" id="employeeNumber" class="input" required>
            </div>
            
            <div class="form-group">
              <label for="firstName">الاسم الأول *</label>
              <input type="text" id="firstName" class="input" required>
            </div>
            
            <div class="form-group">
              <label for="lastName">اسم العائلة *</label>
              <input type="text" id="lastName" class="input" required>
            </div>
            
            <div class="form-group">
              <label for="fullNameAr">الاسم الكامل بالعربية</label>
              <input type="text" id="fullNameAr" class="input">
            </div>
            
            <div class="form-group">
              <label for="position">المسمى الوظيفي</label>
              <input type="text" id="position" class="input">
            </div>
            
            <div class="form-group">
              <label for="departmentSelect">القسم</label>
              <select id="departmentSelect" class="select">
                <option value="">اختر القسم</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="hireDate">تاريخ التوظيف</label>
              <input type="date" id="hireDate" class="input">
            </div>
            
            <div class="form-group">
              <label for="salary">الراتب</label>
              <input type="number" id="salary" class="input" step="0.01" min="0">
            </div>
            
            <div class="form-group">
              <label for="employeePhone">الهاتف</label>
              <input type="tel" id="employeePhone" class="input">
            </div>
            
            <div class="form-group">
              <label for="employeeEmail">البريد الإلكتروني</label>
              <input type="email" id="employeeEmail" class="input">
            </div>
            
            <div class="form-group full-width">
              <label for="jobDescription">الوصف الوظيفي</label>
              <textarea id="jobDescription" class="textarea" rows="4" placeholder="أدخل الوصف الوظيفي التفصيلي للموظف"></textarea>
            </div>
            
            <div class="form-group full-width">
              <label for="address">العنوان</label>
              <textarea id="address" class="textarea" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label for="nationalId">رقم الهوية</label>
              <input type="text" id="nationalId" class="input">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">إضافة الموظف</button>
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Load departments for the select
  loadDepartmentsForModal();
  
  // Handle form submission
  const form = modal.querySelector('#addEmployeeForm');
  form.addEventListener('submit', handleAddEmployee);
  
  // Close modal when clicking outside
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

async function loadDepartmentsForModal() {
  try {
    const departments = await apiClient.makeRequest('/admin/departments');
    const departmentSelect = document.getElementById('departmentSelect');
    
    if (departmentSelect && departments) {
      departmentSelect.innerHTML = '<option value="">اختر القسم</option>' +
        departments.map(dept => `<option value="${dept.department_id}">${dept.name_ar}</option>`).join('');
    }
    
  } catch (error) {
    console.error('Departments loading error:', error);
  }
}

async function handleAddEmployee(e) {
  e.preventDefault();
  
  const formData = {
    employee_number: document.getElementById('employeeNumber').value.trim(),
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    full_name_ar: document.getElementById('fullNameAr').value.trim() || null,
    position: document.getElementById('position').value.trim() || null,
    job_description: document.getElementById('jobDescription').value.trim() || null,
    department_id: document.getElementById('departmentSelect').value || null,
    hire_date: document.getElementById('hireDate').value || null,
    salary: document.getElementById('salary').value ? parseFloat(document.getElementById('salary').value) : null,
    phone: document.getElementById('employeePhone').value.trim() || null,
    email: document.getElementById('employeeEmail').value.trim() || null,
    address: document.getElementById('address').value.trim() || null,
    national_id: document.getElementById('nationalId').value.trim() || null
  };
  
  try {
    await apiClient.makeRequest('/admin/employees', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    showSuccess('تم إضافة الموظف بنجاح');
    document.querySelector('.modal-overlay').remove();
    loadEmployees(); // Refresh the list
    
  } catch (error) {
    console.error('Add employee error:', error);
    showError(error.message || 'حدث خطأ في إضافة الموظف');
  }
}

async function editEmployee(employeeId) {
  // This would show an edit modal similar to add modal but populated with employee data
  showInfo('صفحة تعديل الموظف ستكون متاحة قريباً');
}

function viewEmployeeDetails(employeeId) {
  // This would show a detailed view of the employee
  showInfo('صفحة تفاصيل الموظف ستكون متاحة قريباً');
}

async function toggleEmployeeStatus(employeeId, newStatus) {
  if (!confirm(`هل أنت متأكد من ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} هذا الموظف؟`)) {
    return;
  }

  try {
    await apiClient.makeRequest(`/admin/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    
    showSuccess(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} الموظف بنجاح`);
    loadEmployees(); // Refresh the list
    
  } catch (error) {
    console.error('Status update error:', error);
    showError('حدث خطأ في تحديث حالة الموظف');
  }
}

async function deleteEmployee(employeeId) {
  if (!confirm('هل أنت متأكد من حذف هذا الموظف؟ هذا الإجراء لا يمكن التراجع عنه.')) {
    return;
  }

  try {
    // Use the correct API endpoint for deleting users
    await apiClient.makeRequest(`/admin/users/${employeeId}`, {
      method: 'DELETE'
    });
    
    showSuccess('تم حذف الموظف بنجاح');
    loadEmployees(); // Refresh the list
    
  } catch (error) {
    console.error('Delete employee error:', error);
    showError('حدث خطأ في حذف الموظف: ' + (error.message || error));
  }
}

function exportEmployees() {
  // Simple CSV export
  const csvContent = generateCSV(currentEmployees);
  downloadCSV(csvContent, 'employees.csv');
  showSuccess('تم تصدير البيانات بنجاح');
}

function generateCSV(employees) {
  const headers = ['رقم الموظف', 'الاسم الأول', 'اسم العائلة', 'المسمى الوظيفي', 'القسم', 'البريد الإلكتروني', 'الهاتف', 'الحالة'];
  const rows = employees.map(emp => [
    emp.employee_number,
    emp.first_name,
    emp.last_name,
    emp.position || '',
    emp.department_name || '',
    emp.email || '',
    emp.phone || '',
    getStatusDisplayName(emp.status)
  ]);
  
  return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility functions
function getInitials(firstName, lastName) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
}

function getStatusDisplayName(status) {
  const statusNames = {
    active: 'نشط',
    inactive: 'غير نشط',
    terminated: 'منتهي الخدمة'
  };
  return statusNames[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showLoadingState() {
  const employeesContainer = document.getElementById('employeesContainer');
  if (employeesContainer) {
    employeesContainer.innerHTML = '<div class="loading-state">جاري تحميل الموظفين...</div>';
  }
}

function hideLoadingState() {
  // Loading state will be replaced by displayEmployees
}

// Export employees for making deleteEmployee global
window.deleteEmployee = deleteEmployee;

// Add admin employees-specific CSS
const adminEmployeesStyles = document.createElement('style');
adminEmployeesStyles.textContent = `
  .employee-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: all 0.3s;
  }
  
  .employee-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    transform: translateY(-2px);
  }
  
  .employee-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #f3f4f6;
  }
  
  .employee-avatar {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #2B6CB0, #60a5fa);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;
  }
  
  .employee-info {
    flex: 1;
  }
  
  .employee-info h3 {
    margin: 0 0 5px 0;
    color: #374151;
    font-size: 18px;
  }
  
  .employee-number {
    margin: 0 0 3px 0;
    color: #6b7280;
    font-size: 14px;
    font-weight: 600;
  }
  
  .employee-position {
    margin: 0;
    color: #9ca3af;
    font-size: 14px;
  }
  
  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .status-active { background: #d1fae5; color: #065f46; }
  .status-inactive { background: #fee2e2; color: #991b1b; }
  .status-terminated { background: #f3f4f6; color: #374151; }
  
  .employee-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }
  
  .detail-item .label {
    font-weight: 600;
    color: #374151;
  }
  
  .detail-item .value {
    color: #6b7280;
  }
  
  .employee-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-primary { background: #2B6CB0; color: white; }
  .btn-info { background: #0ea5e9; color: white; }
  .btn-success { background: #10b981; color: white; }
  .btn-warning { background: #f59e0b; color: white; }
  .btn-danger { background: #ef4444; color: white; }
  .btn-secondary { background: #6b7280; color: white; }
  
  .search-filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .pagination-controls button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .empty-icon {
    font-size: 4em;
    margin-bottom: 20px;
  }
  
  .empty-state h3 {
    color: #374151;
    margin-bottom: 10px;
  }
  
  .empty-state p {
    color: #6b7280;
    margin-bottom: 20px;
  }
  
  .loading-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .modal-content.large {
    max-width: 800px;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .form-group.full-width {
    grid-column: 1 / -1;
  }
  
  .form-actions {
    display: flex;
    gap: 10px;
    margin-top: 30px;
    justify-content: flex-end;
  }
`;
document.head.appendChild(adminEmployeesStyles);
