// Employee Reward/Ticket/Vacation Refund - Single Page
class RewardRefundRequest {
    constructor() {
        this.currentStep = 1;
        this.data = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        this.clearDraftData();
        const form = document.getElementById('rewardRefundForm');
        if (form) form.reset();
        await this.loadUserProfile();
        this.bindEvents();
    }

    async loadUserProfile() {
        try {
            const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
            if (window.apiClient) {
                const profileResponse = await window.apiClient.getProfile();
                this.userProfile = profileResponse.data || profileResponse || authUser;
            } else {
                this.userProfile = authUser;
            }

            // Auto-populate ALL fields from employee profile
            const nameField = document.getElementById('name');
            const nationalityField = document.getElementById('nationality');
            const positionField = document.getElementById('position');
            const contractTypeField = document.getElementById('contractType');
            const jobNoField = document.getElementById('jobNo');
            const deptField = document.getElementById('department');
            const requestDateField = document.getElementById('requestDate');
            
            if (nameField && this.userProfile.name) {
                nameField.value = this.userProfile.name;
            }
            if (nationalityField && this.userProfile.nationality) {
                nationalityField.value = this.userProfile.nationality;
            }
            if (positionField && this.userProfile.job_title) {
                positionField.value = this.userProfile.job_title;
            }
            if (contractTypeField && this.userProfile.contract_type) {
                contractTypeField.value = this.userProfile.contract_type;
            }
            if (jobNoField && this.userProfile.employee_number) {
                jobNoField.value = this.userProfile.employee_number;
            }
            if (deptField && this.userProfile.department) {
                deptField.value = this.userProfile.department;
            }
            if (requestDateField && !requestDateField.value) {
                requestDateField.value = new Date().toISOString().split('T')[0];
            }

            console.log('✅ User profile loaded and ALL fields auto-populated:', this.userProfile);
        } catch (error) {
            console.warn('Could not load user profile:', error);
            this.userProfile = JSON.parse(localStorage.getItem('authUser') || '{}');
        }
    }

    bindEvents() {
        document.getElementById('submitBtn')?.addEventListener('click', () => this.submit());
        
        // Handle back button
        document.querySelector('[data-action="go-back"]')?.addEventListener('click', () => {
            window.location.href = 'employee-dashboard.html';
        });
    }

    clearDraftData() {
        localStorage.removeItem('rewardRefundDraft');
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        const optEndService = Boolean(document.getElementById('optEndService')?.checked);
        const optVacationRefund = Boolean(document.getElementById('optVacationRefund')?.checked);
        const requestedRewards = [];
        if (optEndService) requestedRewards.push('end_service');
        if (optVacationRefund) requestedRewards.push('vacation_refund');
        const employeeDecision = document.querySelector('input[name="employeeDecision"]:checked')?.value || 'eligible';
        const hrDecision = document.querySelector('input[name="hrDecision"]:checked')?.value || 'eligible';
        
        // Return snake_case to match backend schema
        return {
            opt_end_service: optEndService,
            opt_vacation_refund: optVacationRefund,
            requested_rewards: requestedRewards,
            request_date: get('requestDate'),
            name: get('name') || this.userProfile?.name,
            nationality: get('nationality') || this.userProfile?.nationality || '',
            position: get('position') || this.userProfile?.job_title,
            contract_type: get('contractType'),
            job_no: get('jobNo') || this.userProfile?.employee_number,
            work_start: get('workStart'),
            record_no: get('recordNo'),
            contract_end: get('contractEnd'),
            department: get('department') || this.userProfile?.department,
            employee_signature: get('employeeSignature') || null,
            employee_sign_date: get('employeeSignDate') || null,
            employee_decision: employeeDecision,
            hr_decision: hrDecision,
            non_eligibility_reason: get('nonEligibilityReason') || null
        };
    }

    validate(data) {
        const required = ['request_date','name','nationality','position','contract_type','job_no','work_start','record_no','contract_end','department'];
        const hasAll = required.every(k => (data[k] || '').length > 0);
        if (!hasAll) {
            this.notify('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return false;
        }
        if (!data.optEndService && !data.optVacationRefund) {
            this.notify('اختر نوع الطلب: مكافأة نهاية خدمة أو تعويض الإجازات (أو كلاهما)', 'error');
            return false;
        }
        if (!/^\d+$/.test(data.job_no)) { this.notify('الرقم الوظيفي أرقام فقط', 'error'); return false; }
        if (!/^\d+$/.test(data.record_no)) { this.notify('رقم السجل أرقام فقط', 'error'); return false; }
        return true;
    }

    async submit() {
        const data = this.collectForm();
        if (!this.validate(data)) return;
        
        try {
            // Disable submit button
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';
            }

            // Submit to backend API
            const response = await window.apiClient.createRewardRefund(data);
            
            // Success notification
            if (window.NotificationUtils) {
                window.NotificationUtils.showSuccess('تم تقديم طلب المكافأة/التعويض بنجاح ✅');
            } else {
                alert('تم تقديم الطلب بنجاح!');
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = window.resolveFrontendPath 
                    ? window.resolveFrontendPath('employee-dashboard.html')
                    : 'employee-dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Error submitting reward/refund request:', error);
            
            if (window.NotificationUtils) {
                window.NotificationUtils.showError(error.message || 'حدث خطأ في تقديم الطلب');
            } else {
                alert('حدث خطأ: ' + (error.message || 'حدث خطأ في تقديم الطلب'));
            }

            // Re-enable submit button
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '📤 تقديم الطلب';
            }
        }
    }

    updatePrintView() {
        if (!this.data) return;
        const d = this.data;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
        // dates header
        const today = new Date();
        const greg = today.toLocaleDateString('en-GB');
        document.getElementById('printGregorian').textContent = greg;
        document.getElementById('printHijri').textContent = this.toApproxHijri(today);

        // bilingual block checkboxes (only End of Service & Vacation refund per request)
        const isEnd = d.optEndService;
        const isVac = d.optVacationRefund;
        const setChecked = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
        setChecked('p_e_end', isEnd); setChecked('p_a_end', isEnd);
        setChecked('p_e_vac', isVac); setChecked('p_a_vac', isVac);

        // table values
        set('p_requestDate', this.formatDate(d.requestDate));
        set('p_name', d.name);
        set('p_nationality', d.nationality);
        set('p_position', d.position);
        set('p_contractType', d.contractType);
        set('p_jobNo', d.jobNo);
        set('p_workStart', this.formatDate(d.workStart));
        set('p_recordNo', d.recordNo);
        set('p_contractEnd', this.formatDate(d.contractEnd));
        set('p_department', d.department);

        // signature
        set('p_employeeSignature', d.employeeSignature);
        set('p_employeeSignDate', this.formatDate(d.employeeSignDate));
        // bilingual signatures
        set('p_engSigne', d.employeeSignature);
        set('p_arSign', d.employeeSignature);

        // decisions
        const empEligible = d.employeeDecision !== 'not_eligible';
        const hrEligible = d.hrDecision !== 'not_eligible';
        const empEligibleEl = document.getElementById('p_employeeEligible');
        const empNotEligibleEl = document.getElementById('p_employeeNotEligible');
        const hrEligibleEl = document.getElementById('p_hrEligible');
        const hrNotEligibleEl = document.getElementById('p_hrNotEligible');
        if (empEligibleEl) empEligibleEl.checked = empEligible;
        if (empNotEligibleEl) empNotEligibleEl.checked = !empEligible;
        if (hrEligibleEl) hrEligibleEl.checked = hrEligible;
        if (hrNotEligibleEl) hrNotEligibleEl.checked = !hrEligible;

        const reasonEl = document.getElementById('p_nonEligibilityReason');
        if (reasonEl) reasonEl.textContent = d.nonEligibilityReason || '—';
    }

    updateWorkflowUI() {
        const steps = document.querySelectorAll('.workflow-step');
        steps.forEach((step, i) => {
            const num = i + 1;
            step.classList.remove('active','completed');
            if (num < this.currentStep) step.classList.add('completed');
            else if (num === this.currentStep) step.classList.add('active');
        });
        document.getElementById('submitRequest').style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        document.getElementById('printApplication').style.display = this.currentStep === 5 ? 'inline-block' : 'none';
        const msg = {1:'املأ البيانات واضغط "تقديم الطلب"',5:'تم تقديم الطلب! اضغط "طباعة النموذج"'};
        document.getElementById('statusMessage').textContent = msg[this.currentStep] || msg[1];
    }

    print() {
        this.saveToInbox();
        window.print();
        this.notify('تم إرسال النموذج للطباعة', 'success');
    }

    saveToInbox() {
        if (!this.data) return;
        const list = JSON.parse(localStorage.getItem('rewardRefundRequests') || '[]');
        const existingIndex = list.findIndex(req => req.id === this.data.id);
        if (existingIndex !== -1) {
            list[existingIndex] = this.data;
        } else {
            list.push(this.data);
        }
        localStorage.setItem('rewardRefundRequests', JSON.stringify(list));

        const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
        const certIndex = certificateRequests.findIndex(req => req.id === this.data.id);
        if (certIndex !== -1) {
            certificateRequests[certIndex] = this.data;
        } else {
            certificateRequests.push(this.data);
        }
        localStorage.setItem('certificateRequests', JSON.stringify(certificateRequests));
    }

    clear() {
        const form = document.getElementById('rewardRefundForm');
        if (form) form.reset();
        document.getElementById('applicationContainer').style.display = 'none';
        document.getElementById('workflowControls').style.display = 'none';
        document.getElementById('printBtn').style.display = 'none';
        this.currentStep = 1;
        this.data = null;
        // إعادة ضبط خيارات الراديو الافتراضية
        const employeeDefault = document.querySelector('input[name="employeeDecision"][value="eligible"]');
        const hrDefault = document.querySelector('input[name="hrDecision"][value="eligible"]');
        if (employeeDefault) employeeDefault.checked = true;
        if (hrDefault) hrDefault.checked = true;
    }

    notify(message, type='info') {
        const n = document.createElement('div');
        n.textContent = message;
        n.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 14px;border-radius:8px;color:#fff;font-weight:700;z-index:10000';
        const colors={success:'#16a34a',error:'#dc2626',warning:'#f59e0b',info:'#2563eb'};
        n.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(n);
        setTimeout(()=>n.remove(),3000);
    }

    formatDate(v){
        if(!v) return '—';
        try{
            const d=new Date(v);
            return d.toLocaleDateString('en-GB');
        }catch{ return v; }
    }

    // Simple approx Hijri using toLocaleString if available
    toApproxHijri(date){
        try{
            return date.toLocaleDateString('ar-SA-u-ca-islamic');
        }catch{
            return '—';
        }
    }
}

// Global helpers
function clearRewardRefundForm(){
    if (window.rrRequest) window.rrRequest.clear();
}

document.addEventListener('DOMContentLoaded',()=>{
    window.rrRequest = new RewardRefundRequest();
});



