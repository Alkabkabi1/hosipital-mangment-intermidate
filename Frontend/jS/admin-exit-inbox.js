// Admin Exit Request Inbox JavaScript
class AdminExitInbox {
    constructor() {
        this.requests = [];
        this.filteredRequests = [];
        this.init();
    }

    init() {
        this.loadRequests();
        this.bindEvents();
        this.renderTable();
    }

    bindEvents() {
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('departmentFilter').addEventListener('change', () => {
            this.applyFilters();
        });
    }

    loadRequests() {
        // Load from exitRequests localStorage
        const allRequests = JSON.parse(localStorage.getItem('exitRequests') || '[]');
        // Filter only exit_request type
        this.requests = allRequests.filter(req => req.type === 'exit_request');
        this.filteredRequests = [...this.requests];
        console.log('Loaded exit requests:', this.requests);
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const departmentFilter = document.getElementById('departmentFilter').value;

        this.filteredRequests = this.requests.filter(request => {
            const statusMatch = !statusFilter || request.status === statusFilter;
            const departmentMatch = !departmentFilter || request.department === departmentFilter;
            return statusMatch && departmentMatch;
        });

        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('requestsTableBody');
        tbody.innerHTML = '';

        if (this.filteredRequests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: var(--muted);">
                        لا توجد طلبات إنهاء عمل
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredRequests.forEach((request, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id || 'EX-' + String(index + 1).padStart(3, '0')}</td>
                <td>${request.employeeName || 'غير محدد'}</td>
                <td>${request.employeeNumber || 'غير محدد'}</td>
                <td>${request.department || 'غير محدد'}</td>
                <td>${request.jobTitle || 'غير محدد'}</td>
                <td>${this.formatDate(request.submittedAt)}</td>
                <td>
                    <span class="badge ${this.getStatusClass(request.status)}">
                        ${this.getStatusText(request.status)}
                    </span>
                </td>
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

    getStatusClass(status) {
        const statusMap = {
            'submitted': 'badge-submitted',
            'approved': 'badge-approved',
            'rejected': 'badge-rejected'
        };
        return statusMap[status] || 'badge-pending';
    }

    getStatusText(status) {
        const statusMap = {
            'submitted': 'مقدمة',
            'approved': 'معتمدة',
            'rejected': 'مرفوضة'
        };
        return statusMap[status] || 'غير محدد';
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
        let buttons = '';

        if (request.status === 'submitted') {
            buttons += `
                <button class="action success" onclick="inbox.approveRequest(${index})">
                    ✅ اعتماد
                </button>
                <button class="action danger" onclick="inbox.rejectRequest(${index})">
                    ❌ رفض
                </button>
            `;
        }

        return buttons;
    }

    viewRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        // Create modal to view request details
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h3>تفاصيل طلب إنهاء العمل</h3>
                
                <h4 style="margin-top: 20px; color: #2B6CB0;">البيانات الأساسية</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                    <div><strong>اسم الموظف:</strong> ${request.employeeName || 'غير محدد'}</div>
                    <div><strong>رقم الموظف:</strong> ${request.employeeNumber || 'غير محدد'}</div>
                    <div><strong>رقم الهوية:</strong> ${request.employeeId || 'غير محدد'}</div>
                    <div><strong>الوظيفة:</strong> ${request.jobTitle || 'غير محدد'}</div>
                    <div><strong>القسم:</strong> ${request.department || 'غير محدد'}</div>
                    <div><strong>المدير المباشر:</strong> ${request.supervisorName || 'غير محدد'}</div>
                    <div><strong>رقم الجوال:</strong> ${request.mobileNumber || 'غير محدد'}</div>
                    <div><strong>البريد الإلكتروني:</strong> ${request.email || 'غير محدد'}</div>
                </div>
                
                <h4 style="margin-top: 20px; color: #2B6CB0;">الأسئلة المفتوحة</h4>
                <div style="margin: 15px 0;">
                    <div style="margin-bottom: 15px;">
                        <strong>أسباب إنهاء العمل:</strong>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">${request.exitReasons || 'غير محدد'}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>بيئة العمل:</strong>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">${request.workEnvironment || 'غير محدد'}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>العلاقة مع المدير المباشر:</strong>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">${request.managerRelationship || 'غير محدد'}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>العلاقة مع الزملاء:</strong>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">${request.coworkerRelationship || 'غير محدد'}</div>
                    </div>
                    <div style="margin-bottom: 15px;">
                        <strong>الاقتراحات:</strong>
                        <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin-top: 5px;">${request.suggestions || 'لا توجد اقتراحات'}</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <div><strong>تاريخ التقديم:</strong> ${this.formatDate(request.submittedAt)}</div>
                    <div style="margin-top: 10px;"><strong>الحالة:</strong> <span class="badge ${this.getStatusClass(request.status)}">${this.getStatusText(request.status)}</span></div>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        إغلاق
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    approveRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        if (!confirm('هل أنت متأكد من اعتماد هذا الطلب؟')) return;

        request.status = 'approved';
        request.approvedBy = this.getCurrentUser();
        request.approvedDate = new Date().toISOString();

        this.saveRequests();
        this.loadRequests();
        this.applyFilters();
        this.showNotification('تم اعتماد طلب إنهاء العمل بنجاح', 'success');
    }

    rejectRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;

        request.status = 'rejected';
        request.rejectedBy = this.getCurrentUser();
        request.rejectedDate = new Date().toISOString();

        this.saveRequests();
        this.loadRequests();
        this.applyFilters();
        this.showNotification('تم رفض طلب إنهاء العمل', 'info');
    }

    saveRequests() {
        // Update both exitRequests and certificateRequests (since they're linked)
        localStorage.setItem('exitRequests', JSON.stringify(this.requests));
        
        // Also update in certificateRequests
        const certRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        this.requests.forEach(exitReq => {
            const index = certRequests.findIndex(r => r.id === exitReq.id);
            if (index !== -1) {
                certRequests[index] = exitReq;
            }
        });
        localStorage.setItem('certificateRequests', JSON.stringify(certRequests));
    }

    getCurrentUser() {
        const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
        return authUser.email || authUser.username || 'الإدارة';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Global function for load requests
function loadRequests() {
    if (window.inbox) {
        window.inbox.loadRequests();
        window.inbox.renderTable();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.inbox = new AdminExitInbox();
});

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyles);

