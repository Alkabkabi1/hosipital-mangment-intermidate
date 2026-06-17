// Employee Guarantee Fine and Performance
class GuaranteeFineRequest {
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
        const form = document.getElementById('guaranteeFineForm');
        if (form) form.reset();
        this.bindEvents();
        
        // Auto-fill from profile if available
        await this.loadProfileData();
    }

    bindEvents() {
        const form = document.getElementById('guaranteeFineForm');
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
        localStorage.removeItem('guaranteeFineDraft');
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            guarantorName: get('guarantorName'),
            guarantorJob: get('guarantorJob'),
            guarantorId: get('guarantorId'),
            guarantorMobile: get('guarantorMobile'),
            guaranteedName: get('guaranteedName'),
            guaranteedJob: get('guaranteedJob'),
            guaranteedId: get('guaranteedId'),
            guaranteedMobile: get('guaranteedMobile'),
            department: get('department'),
            contractYearStart: get('contractYearStart'),
            contractYearEnd: get('contractYearEnd'),
            requestDate: get('requestDate'),
            departmentHead: get('departmentHead')
        };
    }

    validate(data) {
        const required = [
            'guarantorName', 'guarantorJob', 'guarantorId', 'guarantorMobile',
            'guaranteedName', 'guaranteedJob', 'guaranteedId', 'guaranteedMobile',
            'department', 'contractYearStart', 'contractYearEnd', 'requestDate'
        ];
        const hasAll = required.every(k => (data[k] || '').length > 0);
        if (!hasAll) {
            this.notify('يرجى تعبئة جميع الحقول المطلوبة', 'error');
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

    submit() {
        const data = this.collectForm();
        if (!this.validate(data)) return;
        
        this.data = {
            id: 'GF-' + Date.now(),
            type: 'guarantee_fine_performance',
            employeeName: data.guarantorName,
            employeeNumber: data.guarantorId,
            position: data.guarantorJob,
            department: data.department,
            serviceType: 'كفالة غرم وأداء',
            ...data,
            submittedAt: new Date().toISOString(),
            status: 'submitted'
        };
        
        this.updatePrintView();
        document.getElementById('applicationContainer').style.display = 'block';
        document.getElementById('workflowControls').style.display = 'block';
        document.getElementById('printBtn').style.display = 'inline-block';
        this.currentStep = 5; // Jump to print step as per requirements
        this.updateWorkflowUI();
        this.notify('تم تقديم الطلب بنجاح! يمكنك الآن طباعة النموذج', 'success');
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

        // Guarantor data
        set('p_guarantorName', d.guarantorName);
        set('p_guarantorJob', d.guarantorJob);
        set('p_guarantorId', d.guarantorId);
        set('p_guarantorMobile', d.guarantorMobile);

        // Guaranteed person data
        set('p_guaranteedName', d.guaranteedName);
        set('p_guaranteedJob', d.guaranteedJob);
        set('p_guaranteedId', d.guaranteedId);
        set('p_guaranteedMobile', d.guaranteedMobile);

        // Department and contract dates
        set('p_department', d.department);
        set('p_contractYearStartHijri', this.formatDateShort(d.contractYearStart));
        set('p_contractYearEndHijri', this.formatDateShort(d.contractYearEnd));

        // Signatures
        set('p_guarantorSignatureName', d.guarantorName || '—');
        set('p_guarantorSignature', d.guarantorName || '__________');
        set('p_guarantorDate', this.formatDate(d.requestDate));
        
        set('p_departmentHead', d.departmentHead || '—');
        set('p_departmentHeadSignature', d.departmentHead || '__________');
        set('p_departmentHeadDate', this.formatDate(d.requestDate));
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

        // Also save to specific storage
        const guaranteeRequests = JSON.parse(localStorage.getItem('guaranteeFineRequests') || '[]');
        const reqIndex = guaranteeRequests.findIndex(req => req.id === this.data.id);
        if (reqIndex !== -1) {
            guaranteeRequests[reqIndex] = this.data;
        } else {
            guaranteeRequests.push(this.data);
        }
        localStorage.setItem('guaranteeFineRequests', JSON.stringify(guaranteeRequests));
    }

    clear() {
        const form = document.getElementById('guaranteeFineForm');
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
            
            // Auto-fill guarantor data from profile
            const fields = {
                guarantorName: profile.full_name_ar || profile.first_name_ar || '',
                guarantorId: profile.national_id || profile.employee_id_number || '',
            };
            
            // Fill form fields
            Object.keys(fields).forEach(key => {
                const element = document.getElementById(key);
                if (element && fields[key]) {
                    element.value = fields[key];
                }
            });
            
            console.log('✅ Auto-filled guarantee fine form from profile');
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
}

// Global helper function
function clearGuaranteeFineForm() {
    if (window.guaranteeFineRequest) {
        window.guaranteeFineRequest.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.guaranteeFineRequest = new GuaranteeFineRequest();
});


