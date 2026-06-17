// Admin Certificate Inbox JavaScript
class AdminCertificateInbox {
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

    async loadRequests() {
        try {
            // Try to load from API first
            if (window.apiClient && typeof window.apiClient.makeRequest === 'function') {
                // Load leave requests from database
                const leaveResponse = await window.apiClient.makeRequest('/leave-request', {
                    method: 'GET'
                });
                
                const leaveRequests = (leaveResponse.data || leaveResponse || []).map(req => ({
                    ...req,
                    type: 'leave_request',
                    leaveType: Array.isArray(req.leave_types) 
                        ? req.leave_types.map(t => t === 'exceptional' ? 'إجازة إستثنائية' : 'إجازة مرافقة مبتعث').join('، ')
                        : req.leave_types
                }));
                
                // Also try to get experience certificates
                let certificates = [];
                try {
                    const certResponse = await window.apiClient.makeRequest('/experience-certificate', {
                        method: 'GET'
                    });
                    certificates = certResponse.data || certResponse || [];
                } catch (error) {
                    console.warn('⚠️ Could not load certificates:', error.message);
                }
                
                // Combine both types
                this.requests = [...certificates, ...leaveRequests];
                this.filteredRequests = [...this.requests];
                
                console.log('✅ Loaded requests from database:', {
                    leave: leaveRequests.length,
                    certificates: certificates.length,
                    total: this.requests.length
                });
            } else {
                // Fallback to localStorage
                this.requests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
                this.filteredRequests = [...this.requests];
                console.log('⚠️ API not available, loaded from localStorage:', this.requests.length);
            }
        } catch (error) {
            console.error('❌ Error loading requests:', error);
            // Fallback to localStorage on error
            this.requests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
            this.filteredRequests = [...this.requests];
            console.log('⚠️ Using localStorage fallback due to error');
        }
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const departmentFilter = document.getElementById('departmentFilter').value;

        this.filteredRequests = this.requests.filter(request => {
            const statusMatch = !statusFilter || request.status === statusFilter;
            const departmentMatch = !departmentFilter || 
                (request.department || request.employeeDepartment) === departmentFilter;
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
                    <td colspan="10" style="text-align: center; padding: 40px; color: var(--muted);">
                        لا توجد طلبات
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredRequests.forEach((request, index) => {
            const row = document.createElement('tr');
            const requestType = this.getRequestType(request);
            row.innerHTML = `
                <td>${request.id || 'CR-' + String(index + 1).padStart(3, '0')}</td>
                <td>${requestType}</td>
                <td>${request.employeeName || 'غير محدد'}</td>
                <td>${request.employeeNumber || request.employeeId || 'غير محدد'}</td>
                <td>${request.department || request.employeeDepartment || 'غير محدد'}</td>
                <td>${request.position || request.employeePosition || request.jobTitle || 'غير محدد'}</td>
                <td>${this.formatDate(request.submittedAt || request.submittedDate)}</td>
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

    getRequestType(request) {
        if (request.type === 'leave_request') {
            return '🏖️ طلب إجازة';
        } else if (request.leaveType) {
            return '🏖️ طلب إجازة';
        } else {
            return '📋 شهادة خبرة';
        }
    }

    getStatusClass(status) {
        const statusMap = {
            'submitted': 'badge-pending',
            'approved': 'badge-approved',
            'ceo_approved': 'badge-ceo-approved',
            'rejected': 'badge-rejected'
        };
        return statusMap[status] || 'badge-pending';
    }

    getStatusText(status) {
        const statusMap = {
            'submitted': 'مقدمة',
            'approved': 'معتمدة من الإدارة',
            'ceo_approved': 'معتمدة من المدير التنفيذي',
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
        } else if (request.status === 'approved') {
            buttons += `
                <button class="action primary" onclick="inbox.ceoApprove(${index})">
                    👔 اعتماد المدير التنفيذي
                </button>
            `;
        } else if (request.status === 'ceo_approved') {
            buttons += `
            `;
        }

        return buttons;
    }

    viewRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        // Create modal or redirect to detail page
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
        `;

        const isLeaveRequest = request.type === 'leave_request' || request.leaveType;
        const title = isLeaveRequest ? 'تفاصيل طلب إجازة' : 'تفاصيل طلب شهادة الخبرة';
        
        let detailsHTML = '';
        if (isLeaveRequest) {
            // Leave request details
            detailsHTML = `
                <div><strong>اسم الموظف:</strong> ${request.employeeName || 'غير محدد'}</div>
                <div><strong>رقم الموظف:</strong> ${request.employeeNumber || request.employeeId || 'غير محدد'}</div>
                <div><strong>الوظيفة:</strong> ${request.jobTitle || request.position || 'غير محدد'}</div>
                <div><strong>رقم الهوية:</strong> ${request.employeeId || 'غير محدد'}</div>
                <div><strong>نوع الإجازة:</strong> ${request.leaveType || 'غير محدد'}</div>
                <div><strong>نوع الطلب:</strong> ${request.requestType === 'new' ? 'طلب جديد' : request.requestType === 'extension' ? 'تمديد إجازة' : 'غير محدد'}</div>
                <div><strong>مدة الإجازة:</strong> ${request.leaveDuration || 'غير محدد'}</div>
                <div><strong>من تاريخ:</strong> ${request.leaveFromDate || 'غير محدد'}</div>
                <div><strong>إلى تاريخ:</strong> ${request.leaveToDate || 'غير محدد'}</div>
                <div><strong>تاريخ التقديم:</strong> ${this.formatDate(request.submittedAt || request.submittedDate || request.requestDate)}</div>
                <div><strong>الحالة:</strong> ${this.getStatusText(request.status)}</div>
            `;
            if (request.leaveReasons) {
                detailsHTML += `
                    <div style="grid-column: 1 / -1;"><strong>مبررات الطلب:</strong><br>${request.leaveReasons}</div>
                `;
            }
        } else {
            // Experience certificate details
            detailsHTML = `
                <div><strong>اسم الموظف:</strong> ${request.employeeName || 'غير محدد'}</div>
                <div><strong>رقم الموظف:</strong> ${request.employeeNumber || request.employeeId || 'غير محدد'}</div>
                <div><strong>الوظيفة:</strong> ${request.position || request.employeePosition || 'غير محدد'}</div>
                <div><strong>القسم:</strong> ${request.department || request.employeeDepartment || 'غير محدد'}</div>
                <div><strong>الجنسية:</strong> ${request.nationality || request.employeeNationality || 'غير محدد'}</div>
                <div><strong>نوع الخدمة:</strong> ${request.serviceType || 'غير محدد'}</div>
                <div><strong>تاريخ بداية العقد:</strong> ${request.startDate || 'غير محدد'}</div>
                <div><strong>تاريخ نهاية العقد:</strong> ${request.endDate || 'غير محدد'}</div>
                <div><strong>سبب ترك العمل:</strong> ${request.reasonForLeaving || 'غير محدد'}</div>
                <div><strong>تاريخ التقديم:</strong> ${this.formatDate(request.submittedAt || request.submittedDate)}</div>
                <div><strong>الحالة:</strong> ${this.getStatusText(request.status)}</div>
            `;
        }

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <h3>${title}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                    ${detailsHTML}
                </div>
                <div style="text-align: center; margin-top: 20px;">
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

    async approveRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        try {
            if (window.apiClient && request.id && request.type === 'leave_request') {
                // Use API for leave requests
                await window.apiClient.makeRequest(`/leave-request/${request.id}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ notes: 'معتمد من الإدارة' })
                });
                
                console.log('✅ Leave request approved via API');
                this.showNotification('تم اعتماد طلب الإجازة بنجاح', 'success');
            } else {
                // Fallback to localStorage
                request.status = 'approved';
                request.approvedBy = this.getCurrentUser();
                request.approvedDate = new Date().toISOString();
                this.saveRequests();
                this.showNotification('تم اعتماد الطلب بنجاح', 'success');
            }
            
            await this.loadRequests();
            this.applyFilters();
        } catch (error) {
            console.error('❌ Error approving request:', error);
            this.showNotification('حدث خطأ أثناء اعتماد الطلب', 'error');
        }
    }

    async rejectRequest(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        const reason = prompt('يرجى إدخال سبب الرفض:');
        if (!reason) return; // User cancelled

        try {
            if (window.apiClient && request.id && request.type === 'leave_request') {
                // Use API for leave requests
                await window.apiClient.makeRequest(`/leave-request/${request.id}/reject`, {
                    method: 'PUT',
                    body: JSON.stringify({ reason })
                });
                
                console.log('✅ Leave request rejected via API');
                this.showNotification('تم رفض طلب الإجازة', 'info');
            } else {
                // Fallback to localStorage
                request.status = 'rejected';
                request.rejectedBy = this.getCurrentUser();
                request.rejectedDate = new Date().toISOString();
                request.rejection_reason = reason;
                this.saveRequests();
                this.showNotification('تم رفض الطلب', 'info');
            }
            
            await this.loadRequests();
            this.applyFilters();
        } catch (error) {
            console.error('❌ Error rejecting request:', error);
            this.showNotification('حدث خطأ أثناء رفض الطلب', 'error');
        }
    }

    ceoApprove(index) {
        const request = this.filteredRequests[index];
        if (!request) return;

        request.status = 'ceo_approved';
        request.ceoApprovedBy = this.getCurrentUser();
        request.ceoApprovedDate = new Date().toISOString();

        this.saveRequests();
        this.loadRequests();
        this.applyFilters();
        this.showNotification('تم اعتماد الطلب من المدير التنفيذي', 'success');
    }


    saveRequests() {
        // Update the main requests list
        this.requests.forEach((request, index) => {
            const filteredIndex = this.filteredRequests.findIndex(r => r.id === request.id);
            if (filteredIndex !== -1) {
                this.requests[index] = this.filteredRequests[filteredIndex];
            }
        });
        localStorage.setItem('certificateRequests', JSON.stringify(this.requests));
    }

    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'الإدارة';
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
    window.inbox = new AdminCertificateInbox();
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

