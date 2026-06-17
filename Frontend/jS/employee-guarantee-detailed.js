// Employee Guarantee Fine, Performance and Substitute Attendance
class GuaranteeDetailedRequest {
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
        const form = document.getElementById('guaranteeDetailedForm');
        if (form) form.reset();
        this.bindEvents();
        
        // Auto-fill from profile if available
        await this.loadProfileData();
    }

    bindEvents() {
        const form = document.getElementById('guaranteeDetailedForm');
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
        localStorage.removeItem('guaranteeDetailedDraft');
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            guarantorIdCard: get('guarantorIdCard'),
            guarantorIdSource: get('guarantorIdSource'),
            guarantorDepartment: get('guarantorDepartment'),
            guarantorAddress: get('guarantorAddress'),
            guarantorJob: get('guarantorJob'),
            guarantorWorkPhone: get('guarantorWorkPhone'),
            guarantorMobile: get('guarantorMobile'),
            guarantorNationality: get('guarantorNationality'),
            guaranteedName: get('guaranteedName'),
            guaranteedIqama: get('guaranteedIqama'),
            guaranteedIqamaDate: get('guaranteedIqamaDate'),
            guaranteedIqamaSource: get('guaranteedIqamaSource'),
            guaranteedSponsor: get('guaranteedSponsor'),
            caseDetails: get('caseDetails'),
            caseNumber: get('caseNumber'),
            requestDate: get('requestDate'),
            witness1Name: get('witness1Name'),
            witness2Name: get('witness2Name'),
            employerOfficial: get('employerOfficial')
        };
    }

    validate(data) {
        const required = [
            'guarantorIdCard', 'guarantorIdSource', 'guarantorDepartment', 'guarantorAddress',
            'guarantorJob', 'guarantorWorkPhone', 'guarantorMobile', 'guarantorNationality',
            'guaranteedName', 'guaranteedIqama', 'guaranteedIqamaDate', 'guaranteedIqamaSource',
            'guaranteedSponsor', 'caseDetails', 'caseNumber', 'requestDate'
        ];
        const hasAll = required.every(k => (data[k] || '').length > 0);
        if (!hasAll) {
            this.notify('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return false;
        }
        return true;
    }

    submit() {
        const data = this.collectForm();
        if (!this.validate(data)) return;
        
        this.data = {
            id: 'GD-' + Date.now(),
            type: 'guarantee_detailed',
            employeeName: data.guarantorIdCard, // Using ID card as identifier
            employeeNumber: data.guarantorIdCard,
            position: data.guarantorJob,
            department: data.guarantorDepartment,
            serviceType: 'كفالة غرم وأداء وحضور بديل',
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

        // Header
        set('printNumber', d.id);
        set('printDate', this.formatDate(d.requestDate));
        set('printDateHijri', this.toApproxHijri(new Date(d.requestDate)));

        // Guarantor data
        set('p_guarantorIdCard', d.guarantorIdCard);
        set('p_guarantorIdSource', d.guarantorIdSource);
        set('p_guarantorDepartment', d.guarantorDepartment);
        set('p_guarantorAddress', d.guarantorAddress);
        set('p_guarantorJob', d.guarantorJob);
        set('p_guarantorWorkPhone', d.guarantorWorkPhone);
        set('p_guarantorMobile', d.guarantorMobile);
        set('p_guarantorNationality', d.guarantorNationality);

        // Guaranteed person data
        set('p_guaranteedName', d.guaranteedName);
        set('p_guaranteedIqama', d.guaranteedIqama);
        set('p_guaranteedIqamaDate', this.formatDate(d.guaranteedIqamaDate));
        set('p_guaranteedIqamaSource', d.guaranteedIqamaSource);
        set('p_guaranteedSponsor', d.guaranteedSponsor);

        // Case details
        set('p_caseDetails', d.caseDetails);
        set('p_caseNumber', d.caseNumber);

        // Signatures
        set('p_guarantorSignatureName', d.guarantorIdCard || '—');
        set('p_guarantorSignature', d.guarantorIdCard || '__________');
        
        set('p_witness1Name', d.witness1Name || '—');
        set('p_witness1Signature', d.witness1Name || '__________');
        
        set('p_witness2Name', d.witness2Name || '—');
        set('p_witness2Signature', d.witness2Name || '__________');
        
        set('p_employerOfficial', d.employerOfficial || '—');
        set('p_employerOfficialSignature', d.employerOfficial || '__________');

        // Form number and date
        set('p_formNumber', d.id);
        set('p_formDateHijri', this.toApproxHijri(new Date(d.requestDate)));
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
        const guaranteeRequests = JSON.parse(localStorage.getItem('guaranteeDetailedRequests') || '[]');
        const reqIndex = guaranteeRequests.findIndex(req => req.id === this.data.id);
        if (reqIndex !== -1) {
            guaranteeRequests[reqIndex] = this.data;
        } else {
            guaranteeRequests.push(this.data);
        }
        localStorage.setItem('guaranteeDetailedRequests', JSON.stringify(guaranteeRequests));
    }

    clear() {
        const form = document.getElementById('guaranteeDetailedForm');
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

    // Simple approx Hijri using toLocaleString if available
    toApproxHijri(date) {
        try {
            if (typeof date === 'string') {
                date = new Date(date);
            }
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
                guarantorIdCard: profile.national_id || profile.employee_id_number || '',
                guarantorNationality: profile.nationality || 'سعودي',
                guarantorDepartment: profile.app_users_department_name || profile.department_name || '',
            };
            
            // Fill form fields
            Object.keys(fields).forEach(key => {
                const element = document.getElementById(key);
                if (element && fields[key]) {
                    element.value = fields[key];
                }
            });
            
            console.log('✅ Auto-filled guarantee detailed form from profile');
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
}

// Global helper function
function clearGuaranteeDetailedForm() {
    if (window.guaranteeDetailedRequest) {
        window.guaranteeDetailedRequest.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.guaranteeDetailedRequest = new GuaranteeDetailedRequest();
});


