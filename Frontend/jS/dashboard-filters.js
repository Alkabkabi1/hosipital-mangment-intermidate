/**
 * Dashboard Filtering and Search Utilities
 * Provides filtering, search, and sorting for dashboard tables
 */

class DashboardFilters {
  constructor(containerId, dataSource, renderFunction) {
    this.containerId = containerId;
    this.dataSource = dataSource;
    this.renderFunction = renderFunction;
    this.filters = {
      status: '',
      type: '',
      search: ''
    };
    this.sortBy = 'date';
    this.sortOrder = 'desc';
    this.init();
  }

  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`Container ${this.containerId} not found`);
      return;
    }
    this.createFilterUI();
    this.attachEventListeners();
  }

  createFilterUI() {
    // Check if filters already exist
    if (document.getElementById(`${this.containerId}-filters`)) return;

    const filtersHTML = `
      <div id="${this.containerId}-filters" class="dashboard-filters" style="
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: center;
        padding: 12px;
        background: #f9fafb;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      ">
        <div style="flex: 1; min-width: 200px;">
          <input 
            type="search" 
            id="${this.containerId}-search" 
            placeholder="بحث في الطلبات..." 
            style="
              width: 100%;
              padding: 10px 14px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              font-size: 14px;
              font-family: 'Tajawal', system-ui, sans-serif;
            "
          />
        </div>
        <select 
          id="${this.containerId}-status-filter" 
          style="
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Tajawal', system-ui, sans-serif;
            min-width: 150px;
          "
        >
          <option value="">جميع الحالات</option>
          <option value="pending">قيد الاعتماد</option>
          <option value="approved">مكتمل</option>
          <option value="rejected">مرفوض</option>
        </select>
        <select 
          id="${this.containerId}-type-filter" 
          style="
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Tajawal', system-ui, sans-serif;
            min-width: 150px;
          "
        >
          <option value="">جميع الأنواع</option>
          <option value="clearance">إخلاء طرف</option>
          <option value="onboarding">مباشرة عمل</option>
          <option value="delegation">تفويض</option>
        </select>
        <select 
          id="${this.containerId}-sort" 
          style="
            padding: 10px 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Tajawal', system-ui, sans-serif;
            min-width: 150px;
          "
        >
          <option value="date-desc">الأحدث أولاً</option>
          <option value="date-asc">الأقدم أولاً</option>
          <option value="status">حسب الحالة</option>
          <option value="type">حسب النوع</option>
        </select>
        <button 
          id="${this.containerId}-clear-filters" 
          style="
            padding: 10px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
            cursor: pointer;
            font-size: 14px;
            font-family: 'Tajawal', system-ui, sans-serif;
            font-weight: 600;
          "
          onmouseover="this.style.background='#f3f4f6'"
          onmouseout="this.style.background='#fff'"
        >
          مسح الفلاتر
        </button>
      </div>
    `;

    // Insert before the container
    this.container.insertAdjacentHTML('beforebegin', filtersHTML);
  }

  attachEventListeners() {
    const searchInput = document.getElementById(`${this.containerId}-search`);
    const statusFilter = document.getElementById(`${this.containerId}-status-filter`);
    const typeFilter = document.getElementById(`${this.containerId}-type-filter`);
    const sortSelect = document.getElementById(`${this.containerId}-sort`);
    const clearBtn = document.getElementById(`${this.containerId}-clear-filters`);

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filters.search = e.target.value.toLowerCase();
        this.applyFilters();
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.applyFilters();
      });
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.filters.type = e.target.value;
        this.applyFilters();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [field, order] = e.target.value.split('-');
        this.sortBy = field;
        this.sortOrder = order || 'desc';
        this.applyFilters();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  normalizeStatus(status) {
    if (!status) return '';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('قيد') || statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('مكتمل') || statusLower.includes('approved') || statusLower.includes('completed')) return 'approved';
    if (statusLower.includes('مرفوض') || statusLower.includes('rejected')) return 'rejected';
    return '';
  }

  applyFilters() {
    let filtered = Array.isArray(this.dataSource) ? [...this.dataSource] : [];

    // Apply search filter
    if (this.filters.search) {
      filtered = filtered.filter(item => {
        const searchText = this.filters.search;
        const searchable = [
          item.id,
          item.reference_number,
          item.type,
          item.employee?.name,
          item.employee?.email,
          item.status
        ].join(' ').toLowerCase();
        return searchable.includes(searchText);
      });
    }

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(item => {
        const normalizedStatus = this.normalizeStatus(item.status);
        return normalizedStatus === this.filters.status;
      });
    }

    // Apply type filter
    if (this.filters.type) {
      filtered = filtered.filter(item => {
        return item.type === this.filters.type;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          const dateA = new Date(a.createdAt || a.created_at || 0);
          const dateB = new Date(b.createdAt || b.created_at || 0);
          comparison = dateA - dateB;
          break;
        case 'status':
          const statusA = this.normalizeStatus(a.status);
          const statusB = this.normalizeStatus(b.status);
          comparison = statusA.localeCompare(statusB);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    // Render filtered results
    if (this.renderFunction) {
      this.renderFunction(filtered);
    }

    // Update result count
    this.updateResultCount(filtered.length);
  }

  updateResultCount(count) {
    let countElement = document.getElementById(`${this.containerId}-result-count`);
    if (!countElement) {
      const filtersContainer = document.getElementById(`${this.containerId}-filters`);
      if (filtersContainer) {
        countElement = document.createElement('div');
        countElement.id = `${this.containerId}-result-count`;
        countElement.style.cssText = `
          margin-right: auto;
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        `;
        filtersContainer.insertBefore(countElement, filtersContainer.firstChild);
      }
    }
    if (countElement) {
      const total = Array.isArray(this.dataSource) ? this.dataSource.length : 0;
      countElement.textContent = `عرض ${count} من ${total}`;
    }
  }

  clearFilters() {
    this.filters = { status: '', type: '', search: '' };
    this.sortBy = 'date';
    this.sortOrder = 'desc';

    const searchInput = document.getElementById(`${this.containerId}-search`);
    const statusFilter = document.getElementById(`${this.containerId}-status-filter`);
    const typeFilter = document.getElementById(`${this.containerId}-type-filter`);
    const sortSelect = document.getElementById(`${this.containerId}-sort`);

    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (typeFilter) typeFilter.value = '';
    if (sortSelect) sortSelect.value = 'date-desc';

    this.applyFilters();
  }

  updateDataSource(newData) {
    this.dataSource = newData;
    this.applyFilters();
  }
}

// Make available globally
window.DashboardFilters = DashboardFilters;

