// Employee Certificate Request System - Single Page
class EmployeeCertificateRequest {
    constructor() {
        this.currentStep = 1;
        this.workflowData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
    }

    bindEvents() {
        // Form submission
        document.getElementById('certificateForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitRequest();
        });

        // Auto-save form data
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });
    }

    loadSavedData() {
        const savedData = localStorage.getItem('certificateRequestData');
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
            employeeName: document.getElementById('employeeName').value,
            employeeId: document.getElementById('employeeId').value,
            employeePosition: document.getElementById('employeePosition').value,
            employeeDepartment: document.getElementById('employeeDepartment').value,
            employeeNationality: document.getElementById('employeeNationality').value,
            serviceType: document.getElementById('serviceType').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reasonForLeaving: document.getElementById('reasonForLeaving').value
        };
        
        localStorage.setItem('certificateRequestData', JSON.stringify(formData));
    }

    async submitRequest() {
        if (!this.validateForm()) {
            this.showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Prepare data for API
        const formData = {
            employeeName: document.getElementById('employeeName').value,
            employeeNumber: document.getElementById('employeeId').value,
            department: document.getElementById('employeeDepartment').value,
            position: document.getElementById('employeePosition').value,
            nationality: document.getElementById('employeeNationality').value,
            serviceType: document.getElementById('serviceType').value,
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            reasonForLeaving: document.getElementById('reasonForLeaving').value
        };

        try {
            // Submit to backend API
            const response = await window.apiClient.makeRequest('/experience-certificate', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (response && response.success !== false) {
                console.log('✅ Experience certificate request submitted:', response);
                
                // Clear saved data
                localStorage.removeItem('certificateRequestData');
                
                // Show success and redirect
                this.showNotification('✅ تم تقديم طلب شهادة الخبرة بنجاح!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'employee-dashboard.html';
                }, 2000);
            } else {
                throw new Error(response?.message || 'فشل إرسال الطلب');
            }
        } catch (error) {
            console.error('Error submitting experience certificate:', error);
            this.showNotification('⚠️ حدث خطأ: ' + (error.message || 'فشل إرسال الطلب'), 'error');
        }
    }

    validateForm() {
        const requiredFields = ['employeeName', 'employeeId', 'employeePosition', 'employeeDepartment', 'employeeNationality', 'serviceType', 'startDate', 'endDate'];
        return requiredFields.every(field => {
            const element = document.getElementById(field);
            return element && element.value.trim() !== '';
        });
    }

    saveToRequestsList() {
        if (!this.workflowData) return;
        
        const requests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        requests.push(this.workflowData);
        localStorage.setItem('certificateRequests', JSON.stringify(requests));
    }

    clearForm() {
        document.getElementById('certificateForm').reset();
        localStorage.removeItem('certificateRequestData');
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
    if (window.certificateRequest) {
        window.certificateRequest.clearForm();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.certificateRequest = new EmployeeCertificateRequest();
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

