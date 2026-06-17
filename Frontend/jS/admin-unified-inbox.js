// Admin Unified Inbox - All Request Types in One Place
class AdminUnifiedInbox {
    constructor() {
        this.requests = [];
        this.filteredRequests = [];
        this.activeTab = 'all';
        this.API_BASE = 'http://localhost:3037/api';
        this.init();
    }

    init() {
        this.loadRequests();
        console.log('✅ Unified Inbox initialized');
    }

    async loadRequests() {
        try {
            console.log('📥 Loading all requests from backend...');
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                console.error('No auth token found');
                window.location.href = 'login.html';
                return;
            }

            // Fetch ALL requests from backend
            const response = await fetch(`${this.API_BASE}/admin/requests/recent?limit=1000&onlyPending=false`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.requests = Array.isArray(data) ? data : (data.data || []);
            
            console.log(`✅ Loaded ${this.requests.length} requests from backend`);
            console.log('Request types:', this.countByType(this.requests));
            
            this.updateCounts();
            this.applyFilters();
            
        } catch (error) {
            console.error('❌ Error loading requests:', error);
            // Fallback to localStorage if API fails
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        console.log('📦 Loading from localStorage (fallback)...');
        const clearance = JSON.parse(localStorage.getItem('requestsClearance') || '[]');
        const onboarding = JSON.parse(localStorage.getItem('requestsOnboarding') || '[]');
        const delegation = JSON.parse(localStorage.getItem('requestsDelegation') || '[]');
        const certificate = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        const experience = JSON.parse(localStorage.getItem('experienceRequests') || '[]');
        const exit = JSON.parse(localStorage.getItem('exitRequests') || '[]');

        this.requests = [
            ...clearance.map(r => ({ ...r, type: 'clearance', _kind: 'إخلاء طرف' })),
            ...onboarding.map(r => ({ ...r, type: 'onboarding', _kind: 'مباشرة عمل' })),
            ...delegation.map(r => ({ ...r, type: 'delegation', _kind: 'تفويض' })),
            ...certificate.map(r => ({ ...r, type: 'certificate', _kind: 'شهادة تعريف' })),
            ...experience.map(r => ({ ...r, type: 'experience', _kind: 'شهادة خبرة' })),
            ...exit.filter(r => r.type === 'exit_request').map(r => ({ ...r, type: 'exit', _kind: 'إنهاء العمل' }))
        ];

        console.log(`✅ Loaded ${this.requests.length} requests from localStorage`);
        this.updateCounts();
        this.applyFilters();
    }

    countByType(requests) {
        const counts = {};
        requests.forEach(r => {
            counts[r.type] = (counts[r.type] || 0) + 1;
        });
        return counts;
    }

    updateCounts() {
        const counts = {
            all: this.requests.length,
            onboarding: this.requests.filter(r => r.type === 'onboarding').length,
            clearance: this.requests.filter(r => r.type === 'clearance').length,
            certificate: this.requests.filter(r => r.type === 'certificate').length,
            experience: this.requests.filter(r => r.type === 'experience').length,
            exit: this.requests.filter(r => r.type === 'exit').length,
            delegation: this.requests.filter(r => r.type === 'delegation').length
        };

        Object.keys(counts).forEach(type => {
            const el = document.getElementById(`count-${type}`);
            if (el) el.textContent = counts[type];
        });
    }

    setActiveTab(type) {
        this.activeTab = type;
        
        // Update tab UI
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`.tab[data-type="${type}"]`)?.classList.add('active');
        
        this.applyFilters();
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';

        this.filteredRequests = this.requests.filter(request => {
            // Type filter
            const typeMatch = this.activeTab === 'all' || request.type === this.activeTab;
            
            // Status filter
            const statusMatch = !statusFilter || 
                               request.status === statusFilter || 
                               request.status?.includes(statusFilter);
            
            // Search filter
            const searchMatch = !searchTerm || 
                              (request.employee_name || request.employee?.name || '').toLowerCase().includes(searchTerm) ||
                              (request.employee_email || request.employee?.email || '').toLowerCase().includes(searchTerm) ||
                              (request.employee_dept || request.employee?.department || '').toLowerCase().includes(searchTerm);
            
            return typeMatch && statusMatch && searchMatch;
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('requestsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty">
                        <div class="empty-icon">📭</div>
                        <div>لا توجد طلبات</div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by creation date (newest first)
        const sortedRequests = [...this.filteredRequests].sort((a, b) => {
            const dateA = new Date(a.created_at || a.submittedAt || 0);
            const dateB = new Date(b.created_at || b.submittedAt || 0);
            return dateB - dateA;
        });

        sortedRequests.forEach((request, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.reference_number || request.id || index + 1}</td>
                <td><span class="type-badge type-${request.type}">${request._kind || this.getTypeLabel(request.type)}</span></td>
                <td>${request.employee_name || request.employee?.name || 'غير محدد'}</td>
                <td>${request.employee_dept || request.employee?.department || 'غير محدد'}</td>
                <td>${request.employee_email || request.employee?.email || 'غير محدد'}</td>
                <td>${this.formatDate(request.created_at || request.request_date || request.submittedAt)}</td>
                <td><span class="status-badge status-${this.normalizeStatus(request.status)}">${request.status || 'غير محدد'}</span></td>
                <td>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="action" onclick="inbox.viewRequest(${index})">
                            👁️ عرض
                        </button>
                        ${this.getActionButtons(request, index)}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getTypeLabel(type) {
        const labels = {
            'onboarding': 'مباشرة عمل',
            'clearance': 'إخلاء طرف',
            'certificate': 'شهادة تعريف',
            'experience': 'شهادة خبرة',
            'exit': 'إنهاء العمل',
            'delegation': 'تفويض',
            'assignment': 'تكليف',
            'assignment_termination': 'إنهاء تكليف',
            'internal_transfer': 'نقل داخلي',
            'maternity_leave': 'إجازة أمومة',
            'housing_allowance': 'بدل سكن'
        };
        // Handle both exact matches and variations
        const normalizedType = (type || '').toLowerCase();
        return labels[normalizedType] || type;
    }

    normalizeStatus(status) {
        if (!status) return 'pending';
        return status.replace(/\s+/g, '-');
    }

    formatDate(dateString) {
        if (!dateString) return 'غير محدد';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'غير محدد';
            return date.toLocaleDateString('ar-SA');
        } catch (error) {
            return 'غير محدد';
        }
    }

    getActionButtons(request, index) {
        const status = request.status || '';
        const isPending = status === 'pending' || status === 'submitted' || status === 'قيد الاعتماد';

        if (isPending) {
            return `
                <button class="action success" onclick="inbox.approveRequest(${index})">
                    ✅ اعتماد
                </button>
                <button class="action danger" onclick="inbox.rejectRequest(${index})">
                    ❌ رفض
                </button>
            `;
        }

        return '';
    }

    async viewRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        // Navigate to appropriate detail page based on type (all 11 request types)
        const detailPages = {
            'clearance': 'admin-clearance-detail.html',
            'onboarding': 'admin-direct-detail.html',
            'delegation': 'admin-delegation-detail.html',
            'certificate': 'admin-certificate-detail.html',
            'experience': 'admin-experience-detail.html',  // Moved from hidden/
            'exit': 'admin-exit-inbox.html',               // Use existing exit inbox for now
            'leave_request': 'admin-leave-detail.html',    // Add proper leave request routing
            'assignment': 'admin-assignment-detail.html',
            'assignment_termination': 'admin-assignment-termination-detail.html',
            'internal_transfer': 'admin-internal-transfer-detail.html',
            'maternity_leave': 'admin-leave-detail.html',
            'housing_allowance': 'admin-housing-allowance-detail.html'
        };
        
        const detailPage = detailPages[request.type] || 'admin-direct-detail.html';
        window.location.href = `${detailPage}?id=${request.id}`;
    }

    async approveRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        if (!confirm(`هل أنت متأكد من اعتماد هذا الطلب؟\n\nالموظف: ${request.employee_name || request.employee?.name}\nالنوع: ${request._kind || request.type}`)) {
            return;
        }

        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${this.API_BASE}/admin/requests/${request.type}/${request.id}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note: '' })
            });

            if (!response.ok) {
                throw new Error('فشل في اعتماد الطلب');
            }

            this.showNotification('تم اعتماد الطلب بنجاح', 'success');
            await this.loadRequests();
            
        } catch (error) {
            console.error('Error approving request:', error);
            this.showNotification('حدث خطأ أثناء اعتماد الطلب', 'error');
        }
    }

    async rejectRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        const note = prompt(`سبب الرفض (اختياري):\n\nالموظف: ${request.employee_name || request.employee?.name}`);
        if (note === null) return; // User cancelled

        try {
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${this.API_BASE}/admin/requests/${request.type}/${request.id}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note })
            });

            if (!response.ok) {
                throw new Error('فشل في رفض الطلب');
            }

            this.showNotification('تم رفض الطلب', 'info');
            await this.loadRequests();
            
        } catch (error) {
            console.error('Error rejecting request:', error);
            this.showNotification('حدث خطأ أثناء رفض الطلب', 'error');
        }
    }

    exportToExcel() {
        // Simple CSV export
        let csv = 'الرقم,النوع,اسم الموظف,القسم,البريد الإلكتروني,تاريخ التقديم,الحالة\n';
        
        this.filteredRequests.forEach(request => {
            csv += `${request.reference_number || request.id},`;
            csv += `${request._kind || request.type},`;
            csv += `${request.employee_name || request.employee?.name || ''},`;
            csv += `${request.employee_dept || request.employee?.department || ''},`;
            csv += `${request.employee_email || request.employee?.email || ''},`;
            csv += `${this.formatDate(request.created_at || request.request_date || request.submittedAt)},`;
            csv += `${request.status}\n`;
        });

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `requests_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global functions
function navigateToPage(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    window.location.href = 'login.html';
}

// Initialize when DOM is loaded
let inbox;
document.addEventListener('DOMContentLoaded', function() {
    // Check auth
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    // Update avatar
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const avatar = document.getElementById('avatar');
    if (avatar && authUser.email) {
        avatar.textContent = authUser.email[0].toUpperCase();
    }

    // Initialize inbox
    inbox = new AdminUnifiedInbox();
});

