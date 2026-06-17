// Employee Dashboard Inline Script - Extracted for CSP Compliance
// This file contains all the inline JavaScript from employee-dashboard.html

document.addEventListener('DOMContentLoaded', function() {
  /* ===== التحقق ===== */
  const authUser = JSON.parse(localStorage.getItem('authUser')||'null');
  if(!authUser){ location.href='login.html'; }
  const myEmail = (authUser.email||'').toLowerCase();

  /* ===== دالة تسجيل الخروج ===== */
  // Logout function is now provided by notification-utils.js globally
  // window.logout is already available

  /* ===== أفاتار يفتح الملف الشخصي ===== */
  (function setupAvatar(){
    const avatar = document.getElementById('avatar');
    if (avatar) {
      const ch = (authUser.email||'?').trim()[0] || 'U';
      avatar.textContent = ch.toUpperCase();
      avatar.addEventListener('click', ()=> location.href='employee-profile.html');
    }
  })();

  /* ===== البيانات ===== */
  const directs = JSON.parse(localStorage.getItem('requestsDirect')||'[]');
  const onboardings = JSON.parse(localStorage.getItem('requestsOnboarding')||'[]');
  const clears  = JSON.parse(localStorage.getItem('requestsClearance')||'[]');
  const delegs  = JSON.parse(localStorage.getItem('delegations')||'[]');
  const notisAll= window.safeNotificationStore ? window.safeNotificationStore().getAll() : [];
  const notis   = notisAll.filter(n=>!n.recipient || n.recipient===myEmail);

  /* ===== الجرس ===== */
  (function renderBell(){
    const bell = document.getElementById('bell');
    const bellDot = document.getElementById('bellDot');
    
    if (bell && bellDot) {
      const unread = notis.filter(n=>n.unread).length;
      if(unread>0){ bellDot.style.display='flex'; bellDot.textContent = String(unread); }
      
      bell.addEventListener('click', () => {
        // Use global notification system
        if (window.markAllNotificationsRead) {
          window.markAllNotificationsRead();
        }
        bellDot.style.display='none';
        const gridElement = document.querySelector('.grid');
        if (gridElement) {
          window.scrollTo({top: gridElement.offsetTop - 12, behavior:'smooth'});
        }
      });
    }
  })();

  /* ===== أدوات ===== */
  const isMine = r => (r.createdBy?.toLowerCase?.()===myEmail) || (r.employee?.email?.toLowerCase?.()===myEmail);
  const isToday = ts => { const d=new Date(ts), n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate(); };
  const fmtDate = ts => new Date(ts).toLocaleDateString('ar-SA',{year:'numeric',month:'short',day:'numeric'});
  const fmtDT   = ts => new Date(ts).toLocaleString('ar-SA');

  /* ===== KPIs ===== */
  const myDirectsToday = directs.filter(r=>isMine(r) && isToday(r.createdAt)).length;
  const myClearsToday  = clears.filter(r=>isMine(r) && isToday(r.createdAt)).length;
  const myOverdue = [...directs,...clears].filter(r=>isMine(r) && r.status!=='مكتمل' && ((Date.now()-new Date(r.createdAt).getTime())>3*24*60*60*1000)).length;
  const myDelegActive = delegs.filter(d=>d.status==='نشط' && d.employee?.email?.toLowerCase()===myEmail).length;

  // Update KPI displays
  const kDirectToday = document.getElementById('kDirectToday');
  const kClearToday = document.getElementById('kClearToday');
  const kOverdue = document.getElementById('kOverdue');
  const kDelegActive = document.getElementById('kDelegActive');

  if (kDirectToday) kDirectToday.textContent = myDirectsToday;
  if (kClearToday) kClearToday.textContent = myClearsToday;
  if (kOverdue) kOverdue.textContent = myOverdue;
  if (kDelegActive) kDelegActive.textContent = myDelegActive;

  /* ===== Commissioner System ===== */
  let hasCommissionerAccess = false;
  let isCommissionerView = false;

  function checkCommissionerAccess() {
    const userEmail = authUser?.email?.toLowerCase();
    if (!userEmail) return false;
    
    return delegs.some(d => {
      const isTargetUser = d.targetUser?.email?.toLowerCase() === userEmail;
      const isAccepted = d.status === 'مقبول' || d.status === 'نشط';
      const hasScope = d.scope && d.scope.includes('approval');
      return isTargetUser && isAccepted && hasScope;
    });
  }

  // Initialize commissioner functionality
  function initializeCommissionerFeatures() {
    const currentAccess = checkCommissionerAccess();
    
    if (currentAccess !== hasCommissionerAccess) {
      hasCommissionerAccess = currentAccess;
      toggleCommissionerButton();
      
      if (currentAccess) {
        console.log('Commissioner delegation accepted, showing inbox button');
        if (window.showSuccess) {
          window.showSuccess('تم قبول التفويض. يمكنك الآن الوصول إلى وارد الطلبات.');
        }
      } else {
        console.log('Commissioner delegation revoked, hiding inbox button');
      }
    }
  }

  // Toggle commissioner button visibility
  function toggleCommissionerButton() {
    const commissionerBtn = document.getElementById('commissionerInboxBtn');
    if (commissionerBtn) {
      if (hasCommissionerAccess) {
        commissionerBtn.style.display = 'inline-flex';
      } else {
        commissionerBtn.style.display = 'none';
      }
    }
  }

  // Commissioner view toggle
  window.toggleCommissionerView = function() {
    isCommissionerView = !isCommissionerView;
    const btn = document.getElementById('commissionerInboxBtn');
    
    if (btn) {
      btn.textContent = isCommissionerView ? 'طلباتي الشخصية' : 'وارد الطلبات';
      btn.style.background = isCommissionerView ? '#dc2626' : '#2563eb';
    }
    
    renderRequestTable();
  };

  /* ===== Request Table Rendering ===== */
  function renderRequestTable() {
    const tbody = document.querySelector('#last-table tbody');
    if (!tbody) return;

    let allRequests = [];

    if (isCommissionerView && hasCommissionerAccess) {
      // Show all pending requests that commissioner can act on
      allRequests = [...directs, ...clears].filter(r => 
        r.status !== 'مكتمل' && r.status !== 'مرفوض'
      );
    } else {
      // Show only user's own requests
      allRequests = [...directs, ...clears].filter(r => isMine(r));
    }

    // Sort by creation date (newest first)
    allRequests.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take only recent requests
    allRequests = allRequests.slice(0, 10);

    tbody.innerHTML = '';

    if (allRequests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#6b7280;padding:20px;">لا توجد طلبات</td></tr>';
      return;
    }

    allRequests.forEach(r => {
      const badge = r.status==='مكتمل'?'b-done':(r.status==='مرفوض'?'b-rej':'b-pend');
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r._kind}</td>
        <td><span class="badge ${badge}">${r.status}</span></td>
        <td>${fmtDate(r.createdAt)}</td>
        <td></td>`;
      
      const btn = document.createElement('button');
      btn.className = 'btn-sm';
      btn.textContent = 'تفاصيل';
      btn.dataset.action = 'view-details';
      btn.dataset.id = r.id;
      btn.dataset.kind = r._kind;
      btn.dataset.commissioner = isCommissionerView && hasCommissionerAccess ? 'true' : 'false';
      
      tr.lastElementChild.appendChild(btn);
      tbody.appendChild(tr);
    });
  }

  /* ===== Event Delegation for Buttons ===== */
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const kind = btn.dataset.kind;
    const href = btn.dataset.href;
    const isCommissioner = btn.dataset.commissioner === 'true';

    try {
      switch (action) {
        case 'navigate':
          if (href) {
            location.href = href;
          }
          break;
        case 'view-details':
          if (isCommissioner) {
            showCommissionerDetails(id, kind);
          } else {
            showDetails(id, kind);
          }
          break;
        case 'toggle-commissioner':
          toggleCommissionerView();
          break;
        case 'logout':
          window.logout();
          break;
        case 'print-modal':
          window.printModalContent();
          break;
        case 'export-modal':
          window.exportModalContent();
          break;
        case 'close-modal':
          window.closeModal();
          break;
      }
    } catch (err) {
      console.error('Button action error:', err);
      if (window.showError) {
        window.showError('حدث خطأ غير متوقع');
      }
    }
  });

  /* ===== Detail Functions ===== */
  function showDetails(id, kind) {
    // Updated to use new dedicated detail pages
    if(kind==='إخلاء طرف') {
      location.href = `employee-clearance-detail.html?id=${id}`;
    } else if (kind === 'مباشرة عمل' || kind === 'onboarding') {
      location.href = `employee-onboarding-detail.html?id=${id}`;
    } else {
      // Fallback for other types
      location.href = `employee-onboarding-detail.html?id=${id}`;
    }
  }

  function showCommissionerDetails(id, kind) {
    // Admin detail pages (commissioners use admin pages)
    if(kind==='إخلاء طرف') {
      location.href = `admin-clearance-detail.html?id=${id}&commissioner=true`;
    } else if (kind === 'مباشرة عمل' || kind === 'onboarding') {
      location.href = `admin-direct-detail.html?id=${id}&commissioner=true`;
    } else {
      location.href = `admin-direct-detail.html?id=${id}&commissioner=true`;
    }
  }

  /* ===== Initialize Everything ===== */
  initializeCommissionerFeatures();
  renderRequestTable();

  /* ===== Monitor Delegation Changes ===== */
  function setupCommissionerWatcher() {
    setInterval(checkCommissionerAccess, 3000);
    
    window.addEventListener('storage', function(e) {
      if (e.key === 'delegations' || e.key === 'commissionerData') {
        setTimeout(() => {
          checkCommissionerAccess();
          if (hasCommissionerAccess) {
            renderRequestTable();
          }
        }, 100);
      }
    });
  }

  setupCommissionerWatcher();

  /* ===== Modal Functions ===== */
  let currentModalRequest = null;

  window.showDetails = function(id, kind) {
    showDetails(id, kind);
  };

  window.showCommissionerDetails = function(id, kind) {
    showCommissionerDetails(id, kind);
  };

  window.closeModal = function() {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  window.printModalContent = function() {
    if (!currentModalRequest) return;
    
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>تفاصيل الطلب #${currentModalRequest.id}</title>
        <style>
          body { font-family: 'Tajawal', Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 20px; }
          .detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .detail-item { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
          .detail-item b { display: block; margin-bottom: 5px; color: #333; }
          .badge { padding: 4px 8px; border-radius: 15px; font-size: 12px; }
          .b-done { background: #d1fae5; color: #065f46; }
          .b-pend { background: #fef3c7; color: #92400e; }
          .b-rej { background: #fee2e2; color: #991b1b; }
        </style>
        <script src="../jS/role-assignment-manager.js"></script>
      </head>
      <body>
        <div class="header">
          <h1>مستشفى الملك عبدالعزيز</h1>
          <h2>تفاصيل الطلب #${currentModalRequest.id}</h2>
        </div>
        ${document.getElementById('modalBody').innerHTML}
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  window.exportModalContent = function() {
    if (!currentModalRequest) return;
    
    const exportData = {
      id: currentModalRequest.id,
      type: currentModalRequest._kind,
      status: currentModalRequest.status,
      createdAt: currentModalRequest.createdAt,
      employee: currentModalRequest.employee,
      details: currentModalRequest.details || {},
      exportedAt: new Date().toISOString(),
      exportedBy: myEmail
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `request-${currentModalRequest.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success message
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: #d1fae5; color: #065f46; padding: 12px 20px;
      border: 1px solid #a7f3d0; border-radius: 8px;
      font-family: 'Tajawal', sans-serif;
    `;
    successMsg.textContent = 'تم تصدير البيانات بنجاح';
    document.body.appendChild(successMsg);

    setTimeout(() => {
      if (successMsg.parentNode) {
        successMsg.parentNode.removeChild(successMsg);
      }
    }, 3000);
  };

  // Initialize modal event listeners
  const closeModalBtn = document.getElementById('closeModal');
  const printModalBtn = document.getElementById('printModalBtn');
  const exportModalBtn = document.getElementById('exportModalBtn');
  const modal = document.getElementById('modal');

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', window.closeModal);
  }
  if (printModalBtn) {
    printModalBtn.addEventListener('click', window.printModalContent);
  }
  if (exportModalBtn) {
    exportModalBtn.addEventListener('click', window.exportModalContent);
  }
  if (modal) {
    modal.addEventListener('click', e => { if(e.target === modal) window.closeModal(); });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', e => { 
    if(e.key === 'Escape') window.closeModal(); 
  });

  console.log('✅ Employee dashboard inline script loaded');
});
