// Employee Contractor Housing Allowance Request
// Uses API client for backend integration
class ContractorHousingRequest {
    constructor() {
        this.currentStep = 1;
        this.data = null;
        this.init();
    }

    async init() {
        // Wait for dependencies
        if (window.waitForDependencies) {
            await window.waitForDependencies(['apiClient']);
        }
        
        this.clearDraftData();
        const form = document.getElementById('contractorHousingForm');
        if (form) form.reset();
        this.bindEvents();
        
        // Auto-fill from profile if available
        await this.loadProfileData();
    }

    bindEvents() {
        const form = document.getElementById('contractorHousingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submit();
            });
        }
        const submitBtn = document.getElementById('submitRequest');
        const printBtn = document.getElementById('printApplication');
        const inlinePrintBtn = document.getElementById('printBtn');
        if (submitBtn) submitBtn.addEventListener('click', () => this.submit());
        if (printBtn) printBtn.addEventListener('click', () => this.print());
        if (inlinePrintBtn) inlinePrintBtn.addEventListener('click', () => this.print());
    }

    clearDraftData() {
        localStorage.removeItem('contractorHousingDraft');
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            employeeName: get('employeeName'),
            employeeJob: get('employeeJob'),
            employeeNumber: get('employeeNumber'),
            employeeIdNumber: get('employeeIdNumber'),
            employeeNationality: get('employeeNationality'),
            contractYearStart: get('contractYearStart'),
            contractYearEnd: get('contractYearEnd'),
            familyMembers: get('familyMembers') || '1',
            requestDate: get('requestDate'),
            competentEmployeeName: get('competentEmployeeName'),
            housingHeadName: get('housingHeadName'),
            hrDirectorName: get('hrDirectorName')
        };
    }

    validate(data) {
        const required = [
            'employeeName',
            'employeeJob',
            'employeeNumber',
            'employeeIdNumber',
            'employeeNationality',
            'contractYearStart',
            'contractYearEnd',
            'requestDate'
        ];
        const hasAll = required.every(k => (data[k] || '').length > 0);
        if (!hasAll) {
            this.notify('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return false;
        }
        if (!/^\d+$/.test(data.employeeNumber)) {
            this.notify('رقم الموظف أرقام فقط', 'error');
            return false;
        }
        // Validate dates
        const startDate = new Date(data.contractYearStart);
        const endDate = new Date(data.contractYearEnd);
        if (endDate <= startDate) {
            this.notify('تاريخ نهاية السنة التعاقدية يجب أن يكون بعد تاريخ البداية', 'error');
            return false;
        }
        return true;
    }

    async submit() {
        const formData = this.collectForm();
        if (!this.validate(formData)) return;
        
        try {
            // Show loading
            this.notify('جاري إرسال الطلب...', 'info');
            
            // Submit to backend API
            if (window.apiClient) {
                const response = await window.apiClient.post('/contractor-housing', formData);
                
                if (response.success) {
                    this.data = response.data;
                    this.updatePrintView();
                    document.getElementById('applicationContainer').style.display = 'block';
                    document.getElementById('workflowControls').style.display = 'block';
                    document.getElementById('printBtn').style.display = 'inline-block';
                    this.currentStep = 5;
                    this.updateWorkflowUI();
                    this.notify('تم تقديم الطلب بنجاح! يمكنك الآن طباعة النموذج', 'success');
                } else {
                    throw new Error(response.message || 'فشل تقديم الطلب');
                }
            } else {
                // Fallback to localStorage if API not available
                this.data = {
                    id: 'CH-' + Date.now(),
                    type: 'contractor_housing_allowance',
                    employeeName: formData.employeeName,
                    employeeNumber: formData.employeeNumber,
                    position: formData.employeeJob,
                    department: 'المتعاقدين',
                    serviceType: 'بدل سكن متعاقدين',
                    nationality: formData.employeeNationality,
                    ...formData,
                    submittedAt: new Date().toISOString(),
                    status: 'submitted'
                };
                this.saveToInbox();
                this.updatePrintView();
                document.getElementById('applicationContainer').style.display = 'block';
                document.getElementById('workflowControls').style.display = 'block';
                document.getElementById('printBtn').style.display = 'inline-block';
                this.currentStep = 5;
                this.updateWorkflowUI();
                this.notify('تم تقديم الطلب بنجاح (وضع عدم الاتصال)', 'success');
            }
        } catch (error) {
            console.error('Error submitting contractor housing request:', error);
            this.notify(error.message || 'حدث خطأ أثناء تقديم الطلب', 'error');
        }
    }

    updatePrintView() {
        if (!this.data) return;
        const d = this.data;
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val || '—';
        };

        // Dates header
        const today = new Date();
        const greg = today.toLocaleDateString('en-GB');
        set('printGregorian', greg);
        set('printHijri', this.toApproxHijri(today));

        // Employee data
        set('p_employeeName', d.employeeName);
        set('p_employeeJob', d.employeeJob);
        set('p_employeeNumber', d.employeeNumber);
        set('p_employeeIdNumber', d.employeeIdNumber);
        set('p_employeeNationality', d.employeeNationality);
        set('p_familyMembers', d.familyMembers);

        // Contract year dates - format for display
        set('p_contractYearStartHijri', this.formatDateShort(d.contractYearStart));
        set('p_contractYearEndHijri', this.formatDateShort(d.contractYearEnd));
        set('p_contractYearStartNoPrior', this.formatDateShort(d.contractYearStart));
        set('p_contractYearEndNoPrior', this.formatDateShort(d.contractYearEnd));
        set('p_certificateContractStart', this.formatDateShort(d.contractYearStart));
        set('p_certificateContractEnd', this.formatDateShort(d.contractYearEnd));

        // Signatures
        set('p_employeeSignature', d.employeeName || '__________');
        set('p_residenceDeclarationName', d.employeeName || '__________');
        set('p_residenceDeclarationSignature', d.employeeName || '__________');
        set('p_noPriorDeclarationName', d.employeeName || '__________');
        set('p_noPriorDeclarationSignature', d.employeeName || '__________');
        set('p_familyMembersDeclare', d.familyMembers || '1');

        // Competent employee
        set('p_competentEmployeeName', d.competentEmployeeName || '—');
        set('p_competentEmployeeSignature', d.competentEmployeeName || '__________');

        // Certificate
        set('p_certificateEmployeeName', d.employeeName || '—');

        // Officials
        set('p_housingHeadName', d.housingHeadName || '—');
        set('p_housingHeadSignature', d.housingHeadName || '__________');
        set('p_hrDirectorName', d.hrDirectorName || '—');
        set('p_hrDirectorSignature', d.hrDirectorName || '__________');
    }

    updateWorkflowUI() {
        const steps = document.querySelectorAll('.workflow-step');
        steps.forEach((step, i) => {
            const num = i + 1;
            step.classList.remove('active', 'completed');
            if (num < this.currentStep) {
                step.classList.add('completed');
            } else if (num === this.currentStep) {
                step.classList.add('active');
            }
        });
        
        const submitBtn = document.getElementById('submitRequest');
        const printBtn = document.getElementById('printApplication');
        if (submitBtn) submitBtn.style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        if (printBtn) printBtn.style.display = this.currentStep === 5 ? 'inline-block' : 'none';
        
        const msg = {
            1: 'املأ البيانات واضغط "تقديم الطلب"',
            5: 'تم تقديم الطلب! اضغط "طباعة النموذج"'
        };
        const statusMsg = document.getElementById('statusMessage');
        if (statusMsg) {
            statusMsg.textContent = msg[this.currentStep] || msg[1];
        }
    }

    print() {
        this.saveToInbox();
        window.print();
        this.notify('تم إرسال النموذج للطباعة', 'success');
    }

    saveToInbox() {
        if (!this.data) return;
        
        // Save to certificate requests for admin inbox
        const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        const certIndex = certificateRequests.findIndex(req => req.id === this.data.id);
        if (certIndex !== -1) {
            certificateRequests[certIndex] = this.data;
        } else {
            certificateRequests.push(this.data);
        }
        localStorage.setItem('certificateRequests', JSON.stringify(certificateRequests));

        // Also save to a specific storage for contractor housing requests
        const contractorRequests = JSON.parse(localStorage.getItem('contractorHousingRequests') || '[]');
        const reqIndex = contractorRequests.findIndex(req => req.id === this.data.id);
        if (reqIndex !== -1) {
            contractorRequests[reqIndex] = this.data;
        } else {
            contractorRequests.push(this.data);
        }
        localStorage.setItem('contractorHousingRequests', JSON.stringify(contractorRequests));
    }

    clear() {
        const form = document.getElementById('contractorHousingForm');
        if (form) form.reset();
        document.getElementById('applicationContainer').style.display = 'none';
        document.getElementById('workflowControls').style.display = 'none';
        document.getElementById('printBtn').style.display = 'none';
        this.currentStep = 1;
        this.data = null;
        this.updateWorkflowUI();
    }

    notify(message, type = 'info') {
        const n = document.createElement('div');
        n.textContent = message;
        n.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 14px;border-radius:8px;color:#fff;font-weight:700;z-index:10000';
        const colors = {
            success: '#16a34a',
            error: '#dc2626',
            warning: '#f59e0b',
            info: '#2563eb'
        };
        n.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3000);
    }

    formatDate(v) {
        if (!v) return '—';
        try {
            const d = new Date(v);
            return d.toLocaleDateString('en-GB');
        } catch {
            return v;
        }
    }

    formatDateShort(v) {
        if (!v) return '—';
        try {
            const d = new Date(v);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            // Return format like "01 / 01" for display in the form
            return `${day} / ${month}`;
        } catch {
            return v;
        }
    }

    // Simple approx Hijri using toLocaleString if available
    toApproxHijri(date) {
        try {
            return date.toLocaleDateString('ar-SA-u-ca-islamic');
        } catch {
            return '—';
        }
    }

    async loadProfileData() {
        try {
            if (!window.apiClient) return;
            
            const profile = await window.apiClient.getProfile();
            if (!profile) return;
            
            // Auto-fill employee data from profile
            const fields = {
                employeeName: profile.full_name_ar || profile.first_name_ar || '',
                employeeNumber: profile.app_users_employee_number || profile.employee_number || '',
                employeeIdNumber: profile.national_id || '',
                employeeNationality: profile.nationality || 'سعودي',
            };
            
            // Fill form fields
            Object.keys(fields).forEach(key => {
                const element = document.getElementById(key);
                if (element && fields[key]) {
                    element.value = fields[key];
                }
            });
            
            console.log('✅ Auto-filled contractor housing form from profile');
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
}

// Global helper function
function clearContractorHousingForm() {
    if (window.contractorHousingRequest) {
        window.contractorHousingRequest.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.contractorHousingRequest = new ContractorHousingRequest();
});


