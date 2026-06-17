// Admin Dashboard Inline Script - Extracted for CSP Compliance

document.addEventListener('DOMContentLoaded', function() {
  /* ===== حارس الأدمن ===== */
  const authUser = (typeof requireAdmin === 'function') ? requireAdmin() : null;
  if (!authUser) { /* تم التحويل داخل requireAdmin */ }

  /* ===== أدوات تخزين ===== */
  const get = (k, fb=[]) => { try{ const v=JSON.parse(localStorage.getItem(k)||'null'); return v??fb }catch{return fb} };
  const set = (k,v)=>localStorage.setItem(k, JSON.stringify(v));

  const L = {
    direct:     ()=>get('requestsDirect'),
    onboarding: ()=>get('requestsOnboarding'),
    clearance:  ()=>get('requestsClearance'),
    delegs:     ()=>get('delegations'),
    notifs:     ()=>window.NotificationStore ? window.NotificationStore.getAll() : [],
    adminEmails:()=>{
      const emails = get('adminEmails', []);
      if (authUser?.email && !emails.includes(authUser.email)) {
        emails.push(authUser.email);
      }
      return emails;
    }
  };

  /* هيدر */
  if (authUser?.email) {
    const avatar = document.getElementById('avatar');
    if (avatar) {
      avatar.textContent = authUser.email[0].toUpperCase();
    }
  }
  
  // Logout function is now provided by notification-utils.js globally
  // window.logout is already available
  
  // مراقبة التغييرات في الإشعارات
  window.addEventListener('storage', function(e) {
    if (e.key === (window.NotificationStore ? window.NotificationStore.getStorageKey() : 'notifications')) {
      setTimeout(() => {
        drawNotifs();
      }, 100);
    }
  });

  /* تواريخ آمنة */
  const safeDate = (d, withTime=false)=>{
    const dt = new Date(d);
    if (isNaN(+dt)) return '-';
    return withTime ? dt.toLocaleString('ar-SA') : dt.toLocaleDateString('ar-SA');
  };

  /* المهل */
  const currentApprover = r => (r.approvers||[]).find(a=>a.status==='قيد الاعتماد');
  const isOverdue = r => {
    const cur = currentApprover(r);
    const due = cur?.dueAt ? new Date(cur.dueAt) : null;
    return !!(due && !isNaN(+due) && Date.now() > +due && r.status !== 'مكتمل');
  };

  const dueBadge = r => {
    const cur = currentApprover(r);
    const due = cur?.dueAt ? new Date(cur.dueAt) : null;
    if(!due || isNaN(+due)) return '';
    const diff = +due - Date.now();
    const hours = Math.floor(diff / (1000*60*60));
    if(diff<0) return '<span class="timer t-late">متأخر</span>';
    if(hours<24) return '<span class="timer t-warn">أقل من يوم</span>';
    return '<span class="timer t-ok">في الوقت</span>';
  };

  /* —— توحيد الطلبات لتسهيل الحسابات —— */
  const PENDING_SET = new Set(['قيد الاعتماد','قيد الانتظار','قيد المراجعة']);

  function normalizeRequest(r, type) {
    // التاريخ
    const createdAt = r.createdAt ?? r.created_at ?? r.request_date ?? r.date ?? Date.now();

    // الحالة
    const status = r.status ?? r.current_status ?? 'قيد الاعتماد';

    // الموظف
    const employee = r.employee ?? r.createdBy ?? {
      name: r.employee_name ?? r.name ?? null,
      email: r.employee_email ?? r.email ?? null,
      department: r.department_name ?? r.department ?? r.dept ?? null
    };

    // المعتمد الحالي/المهلة
    let approvers = Array.isArray(r.approvers) ? r.approvers : (r.approvals ?? []);
    if (!approvers?.length && PENDING_SET.has(status)) {
      // مهلة افتراضية 3 أيام إن لم توجد dueAt
      const dueAt = new Date((+new Date(createdAt)) + 3*24*60*60*1000).toISOString();
      approvers = [{ name: r.approver_name || '-', role: r.approver_role || '', status: 'قيد الاعتماد', dueAt }];
    }

    // رقم المرجع/المعرّف (للتنقل لصفحة التفاصيل)
    const id = r.id ?? r.reference_number ?? r.reference ?? r.ref ?? r.reqNo;

    return {
      id,
      sourceId: r.id ?? id,               // يُستخدم في زر "تفاصيل"
      _kind: (type === 'clearance') ? 'إخلاء طرف' : 'مباشرة عمل',
      type,
      status,
      createdAt,
      employee,
      approvers
    };
  }

  function collectRequests() {
    const direct     = (L.direct()     || []).map(r => normalizeRequest(r, 'onboarding'));
    const onboarding = (L.onboarding() || []).map(r => normalizeRequest(r, 'onboarding'));
    const clearance  = (L.clearance()  || []).map(r => normalizeRequest(r, 'clearance'));
    return [...direct, ...onboarding, ...clearance]
           .sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
  }

  /* —— حساب الـKPI وكتابتها في الـDOM —— */
  function updateKPIs() {
    const all = collectRequests();
    const today = (d) => {
      const x=new Date(d), n=new Date();
      return x.getFullYear()===n.getFullYear() && x.getMonth()===n.getMonth() && x.getDate()===n.getDate();
    };
    const isOverdueKPI = (r) => {
      const cur = (r.approvers||[]).find(a=>a.status==='قيد الاعتماد');
      const due = cur?.dueAt ? new Date(cur.dueAt) : null;
      return !!(due && !isNaN(+due) && Date.now() > +due && r.status!=='مكتمل');
    };

    // اليوم معلّقة
    const directToday    = all.filter(r => r.type!=='clearance' && PENDING_SET.has(r.status) && today(r.createdAt)).length;
    const clearanceToday = all.filter(r => r.type==='clearance' && PENDING_SET.has(r.status) && today(r.createdAt)).length;

    // متأخرة SLA>3 (اعتمدنا dueAt من التطبيع أعلاه عند الحاجة)
    const clearanceOverdue = all.filter(r => r.type==='clearance' && isOverdueKPI(r)).length;

    // تفويضات فعّالة
    const delegations = JSON.parse(localStorage.getItem('delegations')||'[]');
    const activeDelegations = delegations.filter(d => d.isActive || d.active === true || d.status === 'active').length;

    const setKPI = (id,val)=>{ const el=document.getElementById(id); if(el) el.textContent = String(val); };
    setKPI('kpi-direct-today',       directToday);
    setKPI('kpi-clearance-today',    clearanceToday);
    setKPI('kpi-clearance-overdue',  clearanceOverdue);
    setKPI('kpi-delegations-active', activeDelegations);
  }

  /* رسم الطلبات */
  function drawRequests(){
    const tbody = document.querySelector('#last-rows');
    if (!tbody) return;

    const allRequests = collectRequests().slice(0, 10);

    if (allRequests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted)">لا توجد بيانات</td></tr>';
      return;
    }

    tbody.innerHTML = allRequests.map(r => {
      const badge = r.status==='مكتمل' ? 'b-done' : (r.status==='مرفوض' ? 'b-rej' : 'b-pend');
      const cur   = (r.approvers||[]).find(a=>a.status==='قيد الاعتماد');
      const curName = cur ? ((cur.name||'-') + (cur.role ? ` (${cur.role})` : '')) : '-';
      const empName = r.employee?.name || r.employee?.email || 'غير محدد';
      const dept    = r.employee?.department || 'غير محدد';
      return `
        <tr>
          <td>${r.id ?? '-'}</td>
          <td>${r._kind}</td>
          <td><span class="badge ${badge}">${r.status}</span></td>
          <td>${curName}</td>
          <td>${dueBadge(r)}</td>
          <td>${empName}</td>
          <td>${dept}</td>
          <td>${safeDate(r.createdAt)}</td>
          <td><button class="btn-sm" data-action="view-admin-details" data-id="${r.sourceId}" data-kind="${r._kind}">تفاصيل</button></td>
        </tr>`;
    }).join('');
  }

  /* رسم الإشعارات */
  function drawNotifs(){
    const container = document.getElementById('notif-list');
    if (!container) return;
    
    const notifs = L.notifs().slice(0, 5);
    
    if (notifs.length === 0) {
      container.innerHTML = '<div style="text-align:center;color:var(--muted);padding:20px">لا توجد إشعارات</div>';
      return;
    }

    container.innerHTML = notifs.map(n => `
      <div class="n-item">
        <div class="n-dot"></div>
        <div style="flex:1">
          <div class="n-title">${n.title || 'إشعار'}</div>
          <div style="color:var(--muted);font-size:12px">${n.message || ''}</div>
          <div class="n-time">${safeDate(n.timestamp, true)}</div>
        </div>
      </div>
    `).join('');

    // تحديث عداد الإشعارات
    const unread = notifs.filter(n => n.unread).length;
    const badge = document.getElementById('notif-count');
    if (badge) {
      if (unread > 0) {
        badge.style.display = 'block';
        badge.textContent = String(unread);
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /* Event Delegation for Admin Dashboard */
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const href = btn.dataset.href;
    const id = btn.dataset.id;
    const kind = btn.dataset.kind;

    try {
      switch (action) {
        case 'navigate':
          if (href) {
            location.href = href;
          }
          break;
        case 'logout':
          window.logout();
          break;
        case 'mark-all-read':
          markAllRead();
          break;
        case 'view-admin-details':
          viewAdminDetails(id, kind);
          break;
      }
    } catch (err) {
      console.error('Admin button action error:', err);
      if (window.showError) {
        window.showError('حدث خطأ غير متوقع');
      }
    }
  });

  function markAllRead() {
    if (window.NotificationStore) {
      const all = window.NotificationStore.getAll();
      const updated = all.map(n => ({ ...n, unread: false }));
      window.NotificationStore.setAll(updated);
      drawNotifs();
    }
  }

  function viewAdminDetails(id, kind) {
    if (kind === 'إخلاء طرف') {
      location.href = `admin-clearance-detail.html?id=${id}`;
    } else {
      location.href = `admin-direct-detail.html?id=${id}`;
    }
  }

  // Initialize dashboard
  drawRequests();
  drawNotifs();
  updateKPIs(); // تحديث بطاقات KPI

  // تحديث تلقائي عند تغيّر التخزين
  window.addEventListener('storage', (e)=>{
    if (['requestsDirect','requestsOnboarding','requestsClearance','delegations'].includes(e.key)) {
      drawRequests();
      updateKPIs();
    }
  });

  console.log('✅ Admin dashboard inline script loaded with KPI support');
});
