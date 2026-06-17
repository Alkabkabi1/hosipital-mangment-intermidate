class SaudiDoctorsHousingForm {
    constructor() {
        this.currentStep = 1;
        this.data = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const form = document.getElementById('housingForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submit();
            });
        }
        document.getElementById('submitRequest')?.addEventListener('click', () => this.submit());
        document.getElementById('printBtn')?.addEventListener('click', () => this.print());
        document.getElementById('printApplication')?.addEventListener('click', () => this.print());
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        return {
            doctorName: get('doctorName'),
            doctorJob: get('doctorJob'),
            doctorNumber: get('doctorNumber'),
            doctorDepartment: get('doctorDepartment'),
            doctorNationality: get('doctorNationality'),
            letterDate: get('letterDate'),
            hijriDate: get('hijriDate'),
            housingDirector: get('housingDirector'),
            housingManagerNote: get('housingManagerNote'),
            financeNote: get('financeNote'),
            socialStatus: get('socialStatus'),
            allowanceReason: get('allowanceReason'),
            employeeNotes: get('employeeNotes'),
            periodStart: get('periodStart') || '',
            periodEnd: get('periodEnd') || '',
            financeName: get('financeName') || '',
            hrDirector: get('hrDirector') || '',
        };
    }

    validate(data) {
        const required = [
            'doctorName',
            'doctorJob',
            'doctorNumber',
            'doctorDepartment',
            'doctorNationality',
            'letterDate'
        ];
        const missing = required.some(field => !(data[field] && data[field].length > 0));
        if (missing) {
            this.notify('يرجى تعبئة جميع الحقول الأساسية.', 'error');
            return false;
        }
        if (!/^\d+$/.test(data.doctorNumber)) {
            this.notify('رقم الموظف يجب أن يكون أرقاماً فقط.', 'error');
            return false;
        }
        return true;
    }

    async submit() {
        const data = this.collectForm();
        if (!this.validate(data)) return;

        const submitBtn = document.querySelector('#housingForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'جاري الإرسال...';
        }

        try {
            // Check if API client is available
            if (!window.apiClient) {
                throw new Error('API client not initialized');
            }

            console.log('📤 Submitting housing allowance request via API...');

            // Get current user info
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            // Submit via API with proper formatting
            const response = await window.apiClient.makeRequest('/housing-allowance', {
                method: 'POST',
                body: JSON.stringify({
                    employeeName: data.doctorName,
                    employeeNumber: data.doctorNumber,
                    jobTitle: data.doctorJob,
                    department: data.doctorDepartment,
                    nationality: data.doctorNationality || 'سعودي',
                    letterDate: data.letterDate,
                    hijriDate: data.hijriDate || null,
                    housingDirector: data.housingDirector || null,
                    housingManagerNote: data.housingManagerNote || null,
                    financeNote: data.financeNote || null,
                    socialStatus: data.socialStatus || null,
                    allowanceReason: data.allowanceReason || null,
                    periodStart: data.periodStart || null,
                    periodEnd: data.periodEnd || null,
                    financeName: data.financeName || null,
                    hrDirector: data.hrDirector || null,
                    employeeNotes: data.employeeNotes || null
                })
            });

            console.log('✅ Housing allowance request submitted:', response);

            if (response && response.data && response.data.id) {
                const requestData = {
                    id: response.data.id,
                    reference_number: `HA-${response.data.id}`,
                    type: 'housing_allowance',
                    submittedAt: new Date().toISOString(),
                    status: 'قيد الاعتماد',
                    ...data,
                    employeeName: data.doctorName,
                    employeeNumber: data.doctorNumber,
                    position: data.doctorJob,
                    department: data.doctorDepartment,
                    serviceType: 'بدل سكن أطباء سعوديين'
                };

                this.data = requestData;
                this.updatePrintView();
                document.getElementById('applicationContainer').style.display = 'block';
                document.getElementById('workflowControls').style.display = 'block';
                document.getElementById('printBtn').style.display = 'inline-block';
                this.currentStep = 5;
                this.updateWorkflowUI();
                
                // Show success notification
                if (window.showSuccess) {
                    window.showSuccess(`تم تقديم طلب بدل السكن بنجاح! الرقم المرجعي: HA-${response.data.id}`);
                } else {
                    this.notify('تم تقديم الطلب بنجاح! يمكنك الآن طباعة الاستمارة.', 'success');
                }

                // Redirect after delay
                setTimeout(() => {
                    window.location.href = window.resolveFrontendPath ? 
                        window.resolveFrontendPath('employee-dashboard.html') : 
                        'employee-dashboard.html';
                }, 2000);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('❌ Error submitting housing allowance request:', error);
            
            // Show error using global notification system if available
            if (window.showError) {
                window.showError(error.message || 'حدث خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.');
            } else {
                this.notify('حدث خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.', 'error');
            }
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'تقديم الطلب';
            }
        }
    }

    updatePrintView() {
        if (!this.data) return;
        const d = this.data;
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value && String(value).trim().length > 0 ? value : '—';
        };

        set('p_letterDate', this.formatDate(d.letterDate));
        set('p_hijriDate', d.hijriDate || '—');
        set('p_formNumber', d.id);
        set('p_doctorName', d.doctorName);
        set('p_doctorJob', d.doctorJob);
        set('p_doctorNumber', d.doctorNumber);
        set('p_doctorDepartment', d.doctorDepartment);
        set('p_doctorNationality', d.doctorNationality);
        set('p_housingDirector', d.housingDirector || '—');
        set('p_periodStart', this.formatDate(d.periodStart));
        set('p_periodEnd', this.formatDate(d.periodEnd));

        set('p_doctorNameSig', d.doctorName);
        set('p_housingDirectorName', d.housingDirector || '—');
        set('p_housingManagerNote', d.housingManagerNote || '—');
        set('p_financeName', d.financeName || '—');
        set('p_financeNote', d.financeNote || '—');
        set('p_hrDirector', d.hrDirector || '—');
        set('p_socialStatus', d.socialStatus || '—');
        set('p_allowanceReason', d.allowanceReason || '—');
        set('p_employeeNotes', d.employeeNotes || '—');

        const today = new Date();
        set('p_footerDate', today.toLocaleDateString('en-GB'));
        set('p_footerNumber', d.id);
        set('p_employeeSignature', d.doctorName ? d.doctorName : '__________');
    }

    updateWorkflowUI() {
        const steps = document.querySelectorAll('.workflow-step');
        steps.forEach((step, i) => {
            const num = i + 1;
            step.classList.remove('active', 'completed');
            if (num < this.currentStep) step.classList.add('completed');
            else if (num === this.currentStep) step.classList.add('active');
        });
        const submitBtn = document.getElementById('submitRequest');
        const printBtn = document.getElementById('printApplication');
        if (submitBtn) submitBtn.style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        if (printBtn) printBtn.style.display = this.currentStep === 5 ? 'inline-block' : 'none';
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = this.currentStep === 5
                ? 'تم تقديم الطلب! اضغط "طباعة الاستمارة" لإكمال العملية.'
                : 'املأ البيانات واضغط "تقديم الطلب" لبدء العملية.';
        }
    }

    print() {
        this.saveToInbox();
        window.print();
        this.notify('تم إرسال الاستمارة للطباعة وإلى صندوق الوارد الإداري.', 'success');
    }

    saveToInbox() {
        if (!this.data) return;
        // Save to localStorage as fallback for admin inbox
        const storageKey = 'certificateRequests';
        const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const index = list.findIndex(item => item.id === this.data.id);
        if (index >= 0) {
            list[index] = this.data;
        } else {
            list.push(this.data);
        }
        localStorage.setItem(storageKey, JSON.stringify(list));
    }

    clear() {
        const form = document.getElementById('housingForm');
        if (form) form.reset();
        document.getElementById('applicationContainer').style.display = 'none';
        document.getElementById('workflowControls').style.display = 'none';
        document.getElementById('printBtn').style.display = 'none';
        this.currentStep = 1;
        this.data = null;
        this.updateWorkflowUI();
    }

    notify(message, type='info') {
        const n = document.createElement('div');
        n.textContent = message;
        n.style.cssText = `
            position:fixed;
            top:20px;
            right:20px;
            padding:12px 16px;
            border-radius:10px;
            color:#fff;
            font-weight:700;
            z-index:10000;
            box-shadow:0 10px 30px rgba(15,23,42,0.15);
        `;
        const colors = {success:'#16a34a', error:'#dc2626', warning:'#f59e0b', info:'#2563eb'};
        n.style.background = colors[type] || colors.info;
        document.body.appendChild(n);
        setTimeout(() => n.remove(), 3200);
    }

    formatDate(value) {
        if (!value) return '—';
        try {
            return new Date(value).toLocaleDateString('en-GB');
        } catch {
            return value;
        }
    }
}

function clearHousingForm() {
    if (window.saHousingForm) {
        window.saHousingForm.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.saHousingForm = new SaudiDoctorsHousingForm();
});
