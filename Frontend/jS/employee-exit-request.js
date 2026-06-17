// Employee Exit Request System - Single Page
class EmployeeExitRequest {
    constructor() {
        this.currentStep = 1;
        this.workflowData = null;
        this.init();
    }

    init() {
        // مسح البيانات المحفوظة تلقائياً
        this.clearSavedData();
        this.bindEvents();
        this.loadSavedData();
    }

    clearSavedData() {
        // مسح البيانات المحفوظة
        localStorage.removeItem('exitRequestData');
        localStorage.removeItem('exitRequests');
        
        // مسح البيانات من شهادات الخبرة أيضاً
        const certRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        const filteredRequests = certRequests.filter(req => req.type !== 'exit_request');
        localStorage.setItem('certificateRequests', JSON.stringify(filteredRequests));
    }

    bindEvents() {
        // Form submission
        document.getElementById('exitForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });

        // Workflow buttons
        document.getElementById('submitRequest').addEventListener('click', () => this.submitRequest());
        document.getElementById('printCertificate').addEventListener('click', () => this.printCertificate());

        // Auto-save form data
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });
}

    loadSavedData() {
        const savedData = localStorage.getItem('exitRequestData');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = data[key];
                }
            });
        }
    }

    saveFormData() {
        const formData = {
            // بيانات الموظف الأساسية
            employeeName: document.getElementById('employeeName').value,
            employeeNumber: document.getElementById('employeeNumber').value,
            employeeId: document.getElementById('employeeId').value,
            jobTitle: document.getElementById('jobTitle').value,
            department: document.getElementById('department').value,
            supervisorName: document.getElementById('supervisorName').value,
            mobileNumber: document.getElementById('mobileNumber').value,
            email: document.getElementById('email').value,
            
            // الأسئلة المفتوحة
            exitReasons: document.getElementById('exitReasons').value,
            workEnvironment: document.getElementById('workEnvironment').value,
            managerRelationship: document.getElementById('managerRelationship').value,
            coworkerRelationship: document.getElementById('coworkerRelationship').value,
            suggestions: document.getElementById('suggestions').value,
            
            // نوع الخدمة غير محدد لطلبات إنهاء العمل
            serviceType: 'غير محدد'
        };
        
        localStorage.setItem('exitRequestData', JSON.stringify(formData));
    }

    async submitRequest() {
        if (!this.validateForm()) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Collect form data for backend
        const formData = {
            employeeName: document.getElementById('employeeName').value,
            employeeNumber: document.getElementById('employeeNumber').value,
            employeeIdNumber: document.getElementById('employeeId').value,
            jobTitle: document.getElementById('jobTitle').value,
            department: document.getElementById('department').value,
            supervisorName: document.getElementById('supervisorName').value,
            mobileNumber: document.getElementById('mobileNumber').value,
            email: document.getElementById('email').value,
            
            // الأسئلة المفتوحة
            exitReasons: document.getElementById('exitReasons').value,
            workEnvironment: document.getElementById('workEnvironment').value,
            managerRelationship: document.getElementById('managerRelationship').value,
            coworkerRelationship: document.getElementById('coworkerRelationship').value,
            suggestions: document.getElementById('suggestions').value || null,
        };

        try {
            // Show loading
            this.showNotification('جاري تقديم الطلب...', 'info');
            
            // Get auth token
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                this.showNotification('يرجى تسجيل الدخول أولاً', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }

            // Check if apiClient is available
            if (!window.apiClient || typeof window.apiClient.makeRequest !== 'function') {
                this.showNotification('نظام الاتصال غير متاح، يرجى إعادة تحميل الصفحة', 'error');
                console.error('❌ apiClient is not available');
                return;
            }

            // Submit to backend using apiClient
            const result = await window.apiClient.makeRequest('/exit-request', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!result || result.success === false) {
                throw new Error(result?.message || 'فشل تقديم الطلب');
            }

            console.log('✅ Exit request submitted successfully:', result);

            // Clear saved data
            localStorage.removeItem('exitRequestData');
            
            // Show success message
            this.showNotification('✅ تم تقديم طلب إنهاء العمل بنجاح! سيتم مراجعته من قبل الإدارة', 'success');
            
            // Show confirmation modal
            this.showSuccessModal(result.data?.id);
            
        } catch (error) {
            console.error('❌ Error submitting exit request:', error);
            this.showNotification('حدث خطأ: ' + error.message, 'error');
        }
    }

    updateCertificateDisplay() {
        if (!this.workflowData) return;

        // Update certificate content - بيانات الموظف الأساسية
        document.getElementById('certEmployeeName').textContent = this.workflowData.employeeName;
        document.getElementById('certEmployeeNumber').textContent = this.workflowData.employeeNumber;
        document.getElementById('certEmployeeId').textContent = this.workflowData.employeeIdNumber || this.workflowData.employeeId;
        document.getElementById('certJobTitle').textContent = this.workflowData.jobTitle;
        document.getElementById('certDepartment').textContent = this.workflowData.department;
        document.getElementById('certSupervisor').textContent = this.workflowData.supervisorName;
        document.getElementById('certMobileNumber').textContent = this.workflowData.mobileNumber;
        document.getElementById('certEmail').textContent = this.workflowData.email;
        
        // Update text areas - الأسئلة المفتوحة
        document.getElementById('certExitReasons').textContent = this.workflowData.exitReasons || 'غير محدد';
        document.getElementById('certWorkEnvironment').textContent = this.workflowData.workEnvironment || 'غير محدد';
        document.getElementById('certManagerRelationship').textContent = this.workflowData.managerRelationship || 'غير محدد';
        document.getElementById('certCoworkerRelationship').textContent = this.workflowData.coworkerRelationship || 'غير محدد';
        document.getElementById('certSuggestions').textContent = this.workflowData.suggestions || 'لا توجد اقتراحات';

        // Show certificate
        document.getElementById('certificateContainer').style.display = 'block';
    }

    showSuccessModal(requestId) {
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
        
        modal.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 12px; max-width: 500px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                <div style="font-size: 60px; margin-bottom: 20px;">✅</div>
                <h2 style="color: #10b981; margin-bottom: 15px;">تم تقديم الطلب بنجاح!</h2>
                <p style="color: #64748b; margin-bottom: 10px;">رقم الطلب: <strong>${requestId || 'EXIT-' + Date.now()}</strong></p>
                <p style="color: #64748b; margin-bottom: 25px;">سيتم مراجعة طلبك من قبل الإدارة</p>
                <p style="color: #64748b; margin-bottom: 25px;">سيمكنك طباعة الشهادة بعد الموافقة على الطلب</p>
                <button onclick="window.location.href='employee-dashboard.html'" style="
                    background: #2B6CB0;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 10px;
                ">العودة إلى لوحة التحكم</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    printCertificate() {
        // This will only be called from the view page after approval
        window.print();
        this.showNotification('تم إرسال الشهادة للطباعة', 'success');
    }

    validateForm() {
        const requiredFields = [
            'employeeName', 'employeeNumber', 'employeeId', 'jobTitle',
            'department', 'supervisorName', 'mobileNumber', 'email',
            'exitReasons', 'workEnvironment', 'managerRelationship', 
            'coworkerRelationship'
        ];
        
        // التحقق من الحقول المطلوبة
        const basicValidation = requiredFields.every(field => {
            const element = document.getElementById(field);
            return element && element.value.trim() !== '';
        });
        
        // التحقق من صحة رقم الموظف (أرقام فقط)
        const employeeNumber = document.getElementById('employeeNumber').value;
        const employeeNumberValid = /^[0-9]+$/.test(employeeNumber);
        
        // التحقق من صحة رقم الهوية (10 أرقام بالضبط)
        const employeeId = document.getElementById('employeeId').value;
        const employeeIdValid = /^[0-9]{10}$/.test(employeeId);
        
        // التحقق من صحة رقم الجوال (يبدأ بـ 05 و 10 أرقام)
        const mobileNumber = document.getElementById('mobileNumber').value;
        const mobileNumberValid = /^05[0-9]{8}$/.test(mobileNumber);
        
        // التحقق من صحة البريد الإلكتروني
        const email = document.getElementById('email').value;
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        // عرض رسائل الخطأ
        if (!employeeNumberValid) {
            this.showNotification('رقم الموظف يجب أن يحتوي على أرقام فقط', 'error');
            return false;
        }
        
        if (!employeeIdValid) {
            this.showNotification('رقم الهوية يجب أن يحتوي على 10 أرقام بالضبط', 'error');
            return false;
        }
        
        if (!mobileNumberValid) {
            this.showNotification('رقم الجوال يجب أن يبدأ بـ 05 ويحتوي على 10 أرقام بالضبط', 'error');
            return false;
        }
        
        if (!emailValid) {
            this.showNotification('البريد الإلكتروني غير صحيح', 'error');
            return false;
        }
        
        return basicValidation && employeeNumberValid && employeeIdValid && mobileNumberValid && emailValid;
    }

    updateUI() {
        // Update workflow steps
        const steps = document.querySelectorAll('.workflow-step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
            }
        });

        // Update buttons
        document.getElementById('submitRequest').style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        document.getElementById('printCertificate').style.display = this.currentStep === 5 ? 'inline-block' : 'none';

        // Update status message
        this.updateStatusMessage();
    }

    updateStatusMessage() {
        const messages = {
            1: 'املأ البيانات واضغط "تقديم الطلب" لبدء العملية',
            5: 'تم تقديم الطلب بنجاح! اضغط "طباعة الشهادة"'
        };
        
        document.getElementById('statusMessage').textContent = messages[this.currentStep] || messages[1];
    }

    saveToRequestsList() {
        if (!this.workflowData) return;
        
        // Save to both exit requests and certificate requests for admin inbox
        const exitRequests = JSON.parse(localStorage.getItem('exitRequests') || '[]');
        const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        
        exitRequests.push(this.workflowData);
        certificateRequests.push(this.workflowData);
        
        localStorage.setItem('exitRequests', JSON.stringify(exitRequests));
        localStorage.setItem('certificateRequests', JSON.stringify(certificateRequests));
    }

    clearForm() {
        document.getElementById('exitForm').reset();
        localStorage.removeItem('exitRequestData');
        document.getElementById('workflowControls').style.display = 'none';
        document.getElementById('certificateContainer').style.display = 'none';
        this.currentStep = 1;
        this.workflowData = null;
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

// Global function for clear button
function clearForm() {
    if (window.exitRequest) {
        window.exitRequest.clearForm();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.exitRequest = new EmployeeExitRequest();
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