// Employee Leave Request Management
class LeaveRequestManager {
    constructor() {
        this.form = document.getElementById('leaveForm');
        this.certificateContainer = document.getElementById('certificateContainer');
        this.workflowControls = document.getElementById('workflowControls');
        this.printCertificateBtn = document.getElementById('printCertificate');
        this.statusMessage = document.getElementById('statusMessage');
        
        this.currentStep = 1;
        this.maxSteps = 4;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.setupDateValidation();
        this.loadUserData();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Print button
        this.printCertificateBtn.addEventListener('click', () => this.printCertificate());
        
        // Form field changes
        this.form.addEventListener('input', () => {
            this.validateForm();
            // Update certificate if it's visible
            if (this.certificateContainer.style.display === 'block') {
                const formData = this.getFormData();
                this.populateCertificate(formData);
            }
        });
        
        // Leave type changes
        document.querySelectorAll('input[name="leaveType"]').forEach(input => {
            input.addEventListener('change', () => this.handleLeaveTypeChange());
        });
        
        // Request type changes
        document.querySelectorAll('input[name="requestType"]').forEach(input => {
            input.addEventListener('change', () => this.handleRequestTypeChange());
        });
        
        // Job type changes
        document.querySelectorAll('input[name="jobType"]').forEach(input => {
            input.addEventListener('change', () => this.handleJobTypeChange());
        });
    }

    setupFormValidation() {
        // Employee ID validation
        const employeeId = document.getElementById('employeeId');
        employeeId.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.slice(0, 10);
            }
        });

        // Employee number validation
        const employeeNumber = document.getElementById('employeeNumber');
        employeeNumber.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        // Mobile number validation
        const mobileNumber = document.getElementById('mobileNumber');
        if (mobileNumber) {
            mobileNumber.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
                if (e.target.value.length > 10) {
                    e.target.value = e.target.value.slice(0, 10);
                }
            });
        }
    }

    setupDateValidation() {
        const fromDate = document.getElementById('leaveFromDate');
        const toDate = document.getElementById('leaveToDate');
        
        fromDate.addEventListener('change', () => {
            if (fromDate.value && toDate.value) {
                this.validateDateRange();
            }
        });
        
        toDate.addEventListener('change', () => {
            if (fromDate.value && toDate.value) {
                this.validateDateRange();
            }
        });
    }

    validateDateRange() {
        const fromDate = new Date(document.getElementById('leaveFromDate').value);
        const toDate = new Date(document.getElementById('leaveToDate').value);
        
        if (toDate < fromDate) {
            alert('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
            document.getElementById('leaveToDate').value = '';
        }
    }

    handleLeaveTypeChange() {
        const checkedTypes = Array.from(document.querySelectorAll('input[name="leaveType"]:checked'))
            .map(input => input.value);
        
        // Update certificate display
        this.updateCertificateLeaveType(checkedTypes);
        
        // Update full certificate if visible
        if (this.certificateContainer.style.display === 'block') {
            const formData = this.getFormData();
            this.populateCertificate(formData);
        }
    }

    handleRequestTypeChange() {
        const selectedType = document.querySelector('input[name="requestType"]:checked');
        if (selectedType) {
            this.updateCertificateRequestType(selectedType.value);
            
            // Update full certificate if visible
            if (this.certificateContainer.style.display === 'block') {
                const formData = this.getFormData();
                this.populateCertificate(formData);
            }
        }
    }

    handleJobTypeChange() {
        const selectedType = document.querySelector('input[name="jobType"]:checked');
        if (selectedType) {
            this.updateCertificateJobType(selectedType.value);
            
            // Update full certificate if visible
            if (this.certificateContainer.style.display === 'block') {
                const formData = this.getFormData();
                this.populateCertificate(formData);
            }
        }
    }

    loadUserData() {
        // Load user data from localStorage or session
        const userData = this.getUserData();
        if (userData) {
            this.populateForm(userData);
        }
        
        // Set default request date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('requestDate').value = today;
    }

    getUserData() {
        // Try to get user data from localStorage
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            return JSON.parse(userData);
        }
        
        // Default data for demo
        return {
            employeeName: 'أحمد محمد العتيبي',
            employeeNumber: '12345',
            jobTitle: 'ممرض',
            employeeId: '1234567890',
            appointmentDate: '2020-01-15'
        };
    }

    populateForm(userData) {
        if (userData.employeeName) document.getElementById('employeeName').value = userData.employeeName;
        if (userData.employeeNumber) document.getElementById('employeeNumber').value = userData.employeeNumber;
        if (userData.jobTitle) document.getElementById('jobTitle').value = userData.jobTitle;
        if (userData.employeeId) document.getElementById('employeeId').value = userData.employeeId;
        if (userData.appointmentDate) document.getElementById('appointmentDate').value = userData.appointmentDate;
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
            }
        });
        
        // Check if at least one leave type is selected
        const leaveTypes = document.querySelectorAll('input[name="leaveType"]:checked');
        if (leaveTypes.length === 0) {
            isValid = false;
        }
        
        return isValid;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }
        
        // Generate certificate first
        this.generateCertificate();
        
        // Then show workflow controls
        this.showWorkflowControls();
        this.updateStatusMessage('تم تقديم الطلب بنجاح! سيتم مراجعته من قبل الإدارة.');
        
        // Send to admin
        this.notifyAdmin();
    }

    generateCertificate() {
        const formData = this.getFormData();
        console.log('Generating certificate with data:', formData);
        
        // Wait a bit to ensure DOM is ready
        setTimeout(() => {
            this.populateCertificate(formData);
            this.certificateContainer.style.display = 'block';
            this.printCertificateBtn.style.display = 'inline-block';
            
            // Scroll to certificate
            this.certificateContainer.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    getFormData() {
        const data = {};
        
        // Get all form fields directly by ID
        data.employeeName = document.getElementById('employeeName').value;
        data.employeeNumber = document.getElementById('employeeNumber').value;
        data.jobTitle = document.getElementById('jobTitle').value;
        data.employeeId = document.getElementById('employeeId').value;
        data.appointmentDate = document.getElementById('appointmentDate').value;
        data.leaveDuration = document.getElementById('leaveDuration').value;
        data.previousLeaveDuration = document.getElementById('previousLeaveDuration').value;
        data.leaveFromDate = document.getElementById('leaveFromDate').value;
        data.leaveToDate = document.getElementById('leaveToDate').value;
        data.leaveReasons = document.getElementById('leaveReasons').value;
        data.employeeSignatureName = document.getElementById('employeeSignatureName').value;
        data.employeeSignature = document.getElementById('employeeSignature').value;
        data.requestDate = document.getElementById('requestDate').value;
        
        // Get leave types
        data.leaveTypes = Array.from(document.querySelectorAll('input[name="leaveType"]:checked'))
            .map(input => input.value);
        
        // Get request type
        const requestType = document.querySelector('input[name="requestType"]:checked');
        data.requestType = requestType ? requestType.value : '';
        
        // Get job type
        const jobType = document.querySelector('input[name="jobType"]:checked');
        data.jobType = jobType ? jobType.value : '';
        
        console.log('Form data collected:', data);
        return data;
    }

    populateCertificate(data) {
        // Basic employee info
        this.updateElement('certEmployeeName', data.employeeName || '[اسم الموظف]');
        this.updateElement('certEmployeeNumber', data.employeeNumber || '[رقم الموظف]');
        this.updateElement('certJobTitle', data.jobTitle || '[المسمى الوظيفي]');
        this.updateElement('certEmployeeId', data.employeeId || '[رقم الهوية]');
        this.updateElement('certAppointmentDate', this.formatDate(data.appointmentDate) || '[تاريخ التعيين]');
        
        // Job type
        const jobTypeText = data.jobType === 'civil' ? 'خدمة مدنية' : 
                           data.jobType === 'self' ? 'تشغيل ذاتي' : '[نوع الوظيفة]';
        this.updateElement('certJobType', jobTypeText);
        
        // Leave type
        const leaveTypeText = this.getLeaveTypeText(data.leaveTypes);
        this.updateElement('certLeaveType', leaveTypeText);
        
        // Request type
        const requestTypeText = data.requestType === 'new' ? 'طلب جديد' : 
                               data.requestType === 'extension' ? 'تمديد إجازة' : '[نوع الطلب]';
        this.updateElement('certRequestType', requestTypeText);
        
        // Leave details
        this.updateElement('certLeaveDuration', data.leaveDuration || '[مدة الإجازة]');
        this.updateElement('certLeaveFromDate', this.formatDate(data.leaveFromDate) || '[من تاريخ]');
        this.updateElement('certLeaveToDate', this.formatDate(data.leaveToDate) || '[إلى تاريخ]');
        this.updateElement('certPreviousLeaveDuration', data.previousLeaveDuration || '[مدة الإجازة السابقة]');
        
        // Reasons
        this.updateElement('certLeaveReasons', data.leaveReasons || '[مبررات الطلب]');
        
        // Employee signature
        this.updateElement('certEmployeeSignatureName', data.employeeSignatureName || '[اسم الموظف]');
        this.updateElement('certEmployeeSignature', data.employeeSignature || '[التوقيع]');
        this.updateElement('certRequestDate', this.formatDate(data.requestDate) || '[تاريخ الطلب]');
        
        console.log('Certificate populated with data:', data);
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        } else {
            console.warn(`Element with ID ${elementId} not found`);
        }
    }

    getLeaveTypeText(leaveTypes) {
        if (!leaveTypes || leaveTypes.length === 0) return '[نوع الإجازة]';
        
        const typeMap = {
            'exceptional': 'إجازة إستثنائية',
            'student': 'إجازة مرافقة مبتعث'
        };
        
        return leaveTypes.map(type => typeMap[type] || type).join('، ');
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid date
        
        return date.toLocaleDateString('ar-SA');
    }

    showWorkflowControls() {
        this.workflowControls.style.display = 'block';
        this.updateWorkflowSteps();
    }

    updateWorkflowSteps() {
        for (let i = 1; i <= this.maxSteps; i++) {
            const step = document.getElementById(`step${i}`);
            if (i < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (i === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        }
    }

    updateStatusMessage(message) {
        this.statusMessage.textContent = message;
    }

    async notifyAdmin() {
        // Send leave request to database via API
        const requestData = this.getFormData();
        
        try {
            // Prepare data for API
            const apiData = {
                employeeName: requestData.employeeName,
                employeeNumber: requestData.employeeNumber,
                employeeId: requestData.employeeId,
                jobTitle: requestData.jobTitle,
                appointmentDate: requestData.appointmentDate,
                jobType: requestData.jobType,
                leaveTypes: requestData.leaveTypes, // Array
                requestType: requestData.requestType,
                leaveDuration: requestData.leaveDuration,
                leaveFromDate: requestData.leaveFromDate,
                leaveToDate: requestData.leaveToDate,
                previousLeaveDuration: requestData.previousLeaveDuration || '',
                leaveReasons: requestData.leaveReasons,
                employeeSignatureName: requestData.employeeSignatureName,
                employeeSignature: requestData.employeeSignature,
                requestDate: requestData.requestDate
            };
            
            // Send to backend API
            if (window.apiClient && typeof window.apiClient.createLeaveRequest === 'function') {
                // Use dedicated API method
                const response = await window.apiClient.createLeaveRequest(apiData);
                
                console.log('✅ Leave request saved to database:', response);
                alert('تم إرسال طلب الإجازة بنجاح! رقم الطلب: ' + (response.data?.id || response.id));
            } else if (window.apiClient && typeof window.apiClient.makeRequest === 'function') {
                // Fallback to generic makeRequest
                const response = await window.apiClient.makeRequest('/leave-request', {
                    method: 'POST',
                    body: JSON.stringify(apiData)
                });
                
                console.log('✅ Leave request saved to database:', response);
                alert('تم إرسال طلب الإجازة بنجاح!');
            } else {
                // Fallback to localStorage if API not available
                console.warn('⚠️ API not available, using localStorage fallback');
                console.log('apiClient status:', window.apiClient);
                const leaveRequest = {
                    id: Date.now(),
                    type: 'leave_request',
                    ...apiData,
                    leaveType: this.getLeaveTypeText(requestData.leaveTypes),
                    status: 'submitted',
                    submittedAt: new Date().toISOString(),
                    priority: 'normal'
                };
                
                const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
                certificateRequests.push(leaveRequest);
                localStorage.setItem('certificateRequests', JSON.stringify(certificateRequests));
                
                console.log('📦 Leave request saved to localStorage');
                alert('تم حفظ طلب الإجازة محلياً!');
            }
        } catch (error) {
            console.error('❌ Error submitting leave request:', error);
            alert('حدث خطأ أثناء إرسال الطلب: ' + error.message);
        }
    }

    printCertificate() {
        // Hide form and workflow controls for printing
        const formContainer = document.querySelector('.form-container');
        const workflowControls = document.querySelector('.workflow-controls');
        
        formContainer.style.display = 'none';
        workflowControls.style.display = 'none';
        
        // Print
        window.print();
        
        // Show elements again
        setTimeout(() => {
            formContainer.style.display = 'block';
            workflowControls.style.display = 'block';
        }, 1000);
    }

    updateCertificateLeaveType(leaveTypes) {
        const leaveTypeText = this.getLeaveTypeText(leaveTypes);
        this.updateElement('certLeaveType', leaveTypeText);
    }

    updateCertificateRequestType(requestType) {
        const requestTypeText = requestType === 'new' ? 'طلب جديد' : 
                               requestType === 'extension' ? 'تمديد إجازة' : '[نوع الطلب]';
        this.updateElement('certRequestType', requestTypeText);
    }

    updateCertificateJobType(jobType) {
        const jobTypeText = jobType === 'civil' ? 'خدمة مدنية' : 
                           jobType === 'self' ? 'تشغيل ذاتي' : '[نوع الوظيفة]';
        this.updateElement('certJobType', jobTypeText);
    }
}

// Clear form function
function clearForm() {
    document.getElementById('leaveForm').reset();
    document.getElementById('certificateContainer').style.display = 'none';
    document.getElementById('printCertificate').style.display = 'none';
    document.getElementById('workflowControls').style.display = 'none';
    
    // Reset workflow steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
    }
    document.getElementById('step1').classList.add('active');
}

// Initialize when DOM is loaded AND dependencies are ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Leave Request page loading...');
    
    // Wait for dependencies before initializing
    if (typeof window.waitForDependencies === 'function') {
        window.waitForDependencies(() => {
            console.log('✅ Leave Request: All dependencies loaded, initializing...');
            new LeaveRequestManager();
        }, ['apiClient', 'resolveFrontendPath']);
    } else {
        // Fallback if dependency guard not available
        console.warn('⚠️ Dependency guard not found, initializing directly');
        setTimeout(() => {
            new LeaveRequestManager();
        }, 1000);
    }
});

// Export for use in other files
window.LeaveRequestManager = LeaveRequestManager;
