/**
 * Admin Privileges Overview Page - Modern Edition
 * Displays all privileged users and request approval permissions
 */

(async function() {
  console.log('🔐 Admin Privileges Overview - Initializing...');

  // Wait for dependencies
  if (typeof apiClient === 'undefined') {
    console.error('❌ apiClient not available');
    return;
  }

  let allData = null;
  let filteredUsers = [];

  // Role color mapping
  const roleColors = {
    'ADMIN': '#ef4444',
    'MANAGER': '#f59e0b',
    'HR': '#8b5cf6',
    'FINANCE': '#10b981',
    'IT': '#3b82f6',
    'COMMISSIONER': '#ec4899'
  };

  // Role emoji mapping
  const roleEmojis = {
    'ADMIN': '👑',
    'MANAGER': '📊',
    'HR': '👔',
    'FINANCE': '💰',
    'IT': '💻',
    'COMMISSIONER': '⏰'
  };

  // Request type icons
  const requestIcons = {
    'clearance': '🔄',
    'direct': '🚀',
    'onboarding': '📝',
    'delegation': '🤝',
    'certificate': '📜',
    'experience': '📋',
    'leave': '🏖️',
    'exit': '🚪',
    'assignment': '📌',
    'assignment_termination': '🔚',
    'internal_transfer': '↔️',
    'maternity_leave': '🤰',
    'housing_allowance': '🏠',
    'travel_order': '✈️',
    'reward_refund': '💰',
    'airlines_ticket': '🎫'
  };

  /**
   * Fetch privileges data from API
   */
  async function fetchPrivilegesData() {
    try {
      console.log('🔄 Fetching privileges overview from API...');
      const response = await apiClient.getPrivilegesOverview();
      console.log('📦 API Response:', response);
      
      if (response && response.success && response.data) {
        console.log('✅ Privileges data loaded successfully');
        return response.data;
      } else if (response && response.privilegedUsers) {
        // Handle direct data response (no wrapper)
        console.log('✅ Privileges data loaded (direct format)');
        return response;
      }
      
      throw new Error('Failed to fetch privileges data or invalid response format');
    } catch (error) {
      console.error('❌ Error fetching privileges:', error);
      console.error('📋 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      throw error;
    }
  }

  /**
   * Render statistics
   */
  function renderStats(summary) {
    document.getElementById('stat-total').textContent = summary.totalPrivilegedUsers || 0;
    document.getElementById('stat-admin').textContent = summary.admins || 0;
    document.getElementById('stat-manager').textContent = summary.managers || 0;
    document.getElementById('stat-hr').textContent = summary.hr || 0;
    document.getElementById('stat-finance').textContent = summary.finance || 0;
    document.getElementById('stat-it').textContent = summary.it || 0;
    document.getElementById('stat-commissioner').textContent = summary.commissioners || 0;
  }

  /**
   * Get initials from name
   */
  function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Adjust color brightness
   */
  function adjustColor(color, amount) {
    const clamp = (num) => Math.min(Math.max(num, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * Format date
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Render request card
   */
  function renderRequestCard(requestType) {
    const icon = requestIcons[requestType.type] || '📄';
    
    // Count required vs optional approvers
    const requiredCount = requestType.approvers.filter(a => a.required).length;
    const optionalCount = requestType.approvers.filter(a => !a.required).length;
    const totalCount = requestType.approvers.length;
    
    const summaryHTML = `
      <div class="approvers-summary">
        <span style="font-size: 1.25rem;">📋</span>
        <span><strong>يتطلب ${requiredCount} موافقة${requiredCount > 1 ? '' : ''} إلزامية</strong></span>
        ${optionalCount > 0 ? `<span style="opacity:0.8">+ ${optionalCount} اختيارية</span>` : ''}
        <span style="margin-right:auto;opacity:0.7">(${totalCount} معتمد)</span>
      </div>
    `;
    
    const approversHTML = requestType.approvers.map((approver, index) => {
      const badgeClass = approver.required ? 'badge-required' : 'badge-optional';
      const badgeText = approver.required ? '✓ إلزامي' : '○ اختياري';
      const emoji = roleEmojis[approver.role] || '•';
      
      return `
        <div class="approver-item">
          <div class="approver-order">${index + 1}</div>
          <div class="approver-info">
            <div class="approver-role">
              <span>${emoji}</span>
              <span>${approver.roleAr}</span>
            </div>
            <div class="approver-role-en">${approver.role}</div>
          </div>
          <span class="approver-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="request-card">
        <div class="request-header">
          <div class="request-title-group">
            <h3>${requestType.nameAr}</h3>
            <p>${requestType.nameEn}</p>
          </div>
          <div class="request-icon">${icon}</div>
        </div>
        ${summaryHTML}
        <div class="approvers-list">
          ${approversHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render user card
   */
  function renderUserCard(user) {
    const initials = getInitials(user.nameAr || user.name);
    const primaryRole = user.roles[0];
    const primaryColor = roleColors[primaryRole] || '#64748b';
    const darkerColor = adjustColor(primaryColor, -30);

    const rolesBadges = user.roles.map(role => {
      const color = roleColors[role] || '#64748b';
      const emoji = roleEmojis[role] || '•';
      const roleAr = user.rolesAr[user.roles.indexOf(role)] || role;
      return `<span class="role-badge" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)})">${emoji} ${roleAr}</span>`;
    }).join('');

    const metaItems = [];
    
    if (user.position) {
      metaItems.push(`<div class="user-meta-item">📍 ${user.position}</div>`);
    }
    
    if (user.department) {
      metaItems.push(`<div class="user-meta-item">🏢 ${user.department}</div>`);
    }
    
    const tempHTML = user.type === 'temporary' && user.delegationPeriod ? `
      <div class="commissioner-badge">
        <strong>⏰ مفوض مؤقت</strong><br>
        <div style="margin-top: 0.375rem;">
          من: <strong>${formatDate(user.delegationPeriod.start)}</strong><br>
          إلى: <strong>${user.delegationPeriod.end ? formatDate(user.delegationPeriod.end) : 'غير محدد'}</strong>
        </div>
      </div>
    ` : '';

    return `
      <div class="user-card" data-roles="${user.roles.join(',')}" data-name="${user.name.toLowerCase()}" data-email="${user.email.toLowerCase()}">
        <div class="user-header">
          <div class="user-avatar" style="background: linear-gradient(135deg, ${primaryColor}, ${darkerColor})">${initials}</div>
          <div class="user-info">
            <h4>${user.nameAr || user.name}</h4>
            <div class="user-email">📧 ${user.email}</div>
          </div>
        </div>
        <div class="user-roles">
          ${rolesBadges}
        </div>
        ${metaItems.length > 0 ? `<div class="user-meta">${metaItems.join('')}</div>` : ''}
        ${tempHTML}
      </div>
    `;
  }

  /**
   * Render all data
   */
  function renderData(data) {
    // Render statistics
    renderStats(data.summary);

    // Render request types
    const requestGrid = document.getElementById('requestGrid');
    requestGrid.innerHTML = data.requestTypes.map(rt => renderRequestCard(rt)).join('');

    // Render users
    filteredUsers = data.privilegedUsers;
    renderUsers(filteredUsers);
  }

  /**
   * Render users
   */
  function renderUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    if (users.length === 0) {
      usersGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">🔍</div>
          <p style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">لا توجد نتائج</p>
          <p style="font-size: 0.875rem; color: var(--text-muted);">جرب تغيير معايير البحث أو الفلتر</p>
        </div>
      `;
    } else {
      usersGrid.innerHTML = users.map(user => renderUserCard(user)).join('');
    }
  }

  /**
   * Apply filters
   */
  window.applyFilters = function() {
    if (!allData) return;

    const searchTerm = document.getElementById('filterSearch').value.toLowerCase().trim();
    const roleFilter = document.getElementById('filterRole').value;

    filteredUsers = allData.privilegedUsers.filter(user => {
      // Search filter
      const matchesSearch = !searchTerm || 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm) ||
        (user.nameAr && user.nameAr.includes(searchTerm));

      // Role filter
      const matchesRole = !roleFilter || user.roles.includes(roleFilter);

      return matchesSearch && matchesRole;
    });

    renderUsers(filteredUsers);
    
    // Show notification
    console.log(`✅ Filtered to ${filteredUsers.length} users`);
  };

  /**
   * Reset filters
   */
  window.resetFilters = function() {
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterRole').value = '';
    if (allData) {
      filteredUsers = allData.privilegedUsers;
      renderUsers(filteredUsers);
    }
    console.log('🔄 Filters reset');
  };

  /**
   * Initialize page
   */
  async function init() {
    try {
      console.log('🚀 Initializing Admin Privileges Overview page...');
      
      // Show loading
      document.getElementById('loading').style.display = 'flex';
      document.getElementById('content').style.display = 'none';

      // Check if apiClient is available
      if (typeof apiClient === 'undefined') {
        throw new Error('apiClient is not available. Make sure api-client.js is loaded.');
      }

      if (typeof apiClient.getPrivilegesOverview !== 'function') {
        throw new Error('apiClient.getPrivilegesOverview is not a function. Check api-client.js version.');
      }

      // Fetch data
      console.log('📡 Calling API...');
      allData = await fetchPrivilegesData();
      console.log('✅ Privileges data loaded:', allData);
      console.log('📊 Summary:', allData.summary);
      console.log('👥 Users count:', allData.privilegedUsers?.length);
      console.log('📋 Request types count:', allData.requestTypes?.length);

      // Validate data structure
      if (!allData.privilegedUsers || !allData.requestTypes || !allData.summary) {
        throw new Error('Invalid data structure received from API');
      }

      // Render data
      console.log('🎨 Rendering data...');
      renderData(allData);

      // Hide loading, show content
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';

      // Add enter key listener for search
      document.getElementById('filterSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFilters();
        }
      });

      console.log('✅ Admin Privileges Overview - Ready!');
    } catch (error) {
      console.error('❌ Error initializing page:', error);
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      
      if (error.response) {
        console.error('❌ API Response:', error.response);
      }
      
      document.getElementById('loading').innerHTML = `
        <div style="text-align:center">
          <div style="font-size:4rem;margin-bottom:1rem;opacity:0.5">⚠️</div>
          <div style="color:var(--danger);font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">حدث خطأ في تحميل البيانات</div>
          <div style="color:var(--text-muted);font-size:0.875rem;margin-bottom:0.5rem">${error.message || 'خطأ غير معروف'}</div>
          <details style="margin:1rem 0;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;">
            <summary style="cursor:pointer;color:var(--primary);font-weight:600;">عرض التفاصيل التقنية</summary>
            <pre style="background:#1e293b;color:#e2e8f0;padding:1rem;border-radius:8px;margin-top:0.5rem;font-size:0.75rem;overflow-x:auto;text-align:left;">${error.stack || error.message}</pre>
          </details>
          <button class="btn btn-primary" onclick="location.reload()">🔄 إعادة المحاولة</button>
        </div>
      `;
    }
  }

  // Start initialization
  init();
})();
