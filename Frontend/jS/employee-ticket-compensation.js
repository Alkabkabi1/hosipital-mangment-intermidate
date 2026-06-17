// Employee Ticket Compensation for Non-Saudi Contractors and Companions
class TicketCompensationRequest {
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
        const form = document.getElementById('ticketCompensationForm');
        if (form) form.reset();
        this.bindEvents();
        
        // Auto-fill from profile if available
        await this.loadProfileData();
    }

    bindEvents() {
        const form = document.getElementById('ticketCompensationForm');
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
        localStorage.removeItem('ticketCompensationDraft');
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        const getChecked = (id) => document.getElementById(id)?.checked || false;
        
        // Collect companions data
        const companions = [];
        const rows = document.querySelectorAll('#companionsTableBody tr');
        rows.forEach(row => {
            const name = row.querySelector('input[name="name"]')?.value?.trim();
            const relationship = row.querySelector('input[name="relationship"]')?.value?.trim();
            const iqama = row.querySelector('input[name="iqama"]')?.value?.trim();
            const passport = row.querySelector('input[name="passport"]')?.value?.trim();
            const nationality = row.querySelector('input[name="nationality"]')?.value?.trim();
            
            if (name || iqama || passport) {
                companions.push({ name, relationship, iqama, passport, nationality });
            }
        });

        // Collect declarations
        const declarations = [];
        document.querySelectorAll('input[name="declarations"]:checked').forEach(cb => {
            declarations.push(cb.value);
        });

        return {
            companions,
            declarations,
            jobTitle: get('jobTitle'),
            employeeIqama: get('employeeIqama'),
            employeeNumber: get('employeeNumber'),
            employeeSignature: get('employeeSignature'),
            requestDate: get('requestDate'),
            oldContractStart: get('oldContractStart'),
            oldContractEnd: get('oldContractEnd'),
            newContractStart: get('newContractStart'),
            newContractEnd: get('newContractEnd'),
            fullVacation: getChecked('fullVacation'),
            partialVacation: getChecked('partialVacation'),
            vacationPeriodStart: get('vacationPeriodStart'),
            vacationPeriodEnd: get('vacationPeriodEnd'),
            hasExitReentryVisa: getChecked('hasExitReentryVisa'),
            companionsResidencyExceeded: getChecked('companionsResidencyExceeded'),
            maleDependentsCheck: getChecked('maleDependentsCheck'),
            payrollAccountant: get('payrollAccountant'),
            hrDirector: get('hrDirector')
        };
    }

    validate(data) {
        const required = ['jobTitle', 'employeeIqama', 'employeeNumber', 'requestDate'];
        const hasAll = required.every(k => (data[k] || '').length > 0);
        if (!hasAll) {
            this.notify('يرجى تعبئة جميع الحقول المطلوبة', 'error');
            return false;
        }
        if (!/^\d+$/.test(data.employeeNumber)) {
            this.notify('رقم الموظف أرقام فقط', 'error');
            return false;
        }
        if (data.companions.length === 0) {
            this.notify('يرجى إضافة بيانات المتعاقد على الأقل', 'error');
            return false;
        }
        if (data.declarations.length === 0) {
            this.notify('يرجى اختيار إقرار واحد على الأقل', 'error');
            return false;
        }
        return true;
    }

    submit() {
        const data = this.collectForm();
        if (!this.validate(data)) return;
        
        const mainCompanion = data.companions.find(c => c.relationship === 'المتعاقد') || data.companions[0];
        
        this.data = {
            id: 'TC-' + Date.now(),
            type: 'ticket_compensation',
            employeeName: mainCompanion?.name || '',
            employeeNumber: data.employeeNumber,
            position: data.jobTitle,
            department: 'المتعاقدين غير السعوديين',
            serviceType: 'تعويض تذاكر',
            nationality: mainCompanion?.nationality || '',
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
        const setChecked = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.checked = !!val;
        };

        // Dates header
        const today = new Date();
        const greg = today.toLocaleDateString('en-GB');
        set('printGregorian', greg);
        set('printHijri', this.toApproxHijri(today));

        // Companions table
        const tbody = document.getElementById('printCompanionsTableBody');
        if (tbody) {
            tbody.innerHTML = '';
            d.companions.forEach(comp => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = comp.name || '—';
                row.insertCell(1).textContent = comp.relationship || '—';
                row.insertCell(2).textContent = comp.iqama || '—';
                row.insertCell(3).textContent = comp.passport || '—';
                row.insertCell(4).textContent = comp.nationality || '—';
            });
        }

        // Declarations
        setChecked('p_declaration1', d.declarations.includes('no_exit_reentry'));
        setChecked('p_declaration2', d.declarations.includes('exit_reentry_own_expense'));
        setChecked('p_declaration3', d.declarations.includes('no_previous_ticket'));

        // Employee data
        set('p_jobTitle', d.jobTitle);
        set('p_employeeIqama', d.employeeIqama);
        set('p_employeeNumber', d.employeeNumber);
        set('p_employeeSignature', d.employeeSignature || d.employeeName || '__________');

        // Contract periods
        set('p_oldContractStart', this.formatDateShort(d.oldContractStart));
        set('p_oldContractEnd', this.formatDateShort(d.oldContractEnd));
        set('p_newContractStart', this.formatDateShort(d.newContractStart));
        set('p_newContractEnd', this.formatDateShort(d.newContractEnd));
        set('p_vacationPeriodStart', this.formatDateShort(d.vacationPeriodStart));
        set('p_vacationPeriodEnd', this.formatDateShort(d.vacationPeriodEnd));

        // Vacation status
        setChecked('p_fullVacation', d.fullVacation);
        setChecked('p_partialVacation', d.partialVacation);

        // Visa and dependents
        setChecked('p_hasExitReentryVisa', d.hasExitReentryVisa);
        setChecked('p_companionsResidencyExceeded', d.companionsResidencyExceeded);
        setChecked('p_maleDependentsCheck', d.maleDependentsCheck);

        // Officials
        set('p_payrollAccountant', d.payrollAccountant || '—');
        set('p_payrollAccountantSig', d.payrollAccountant || '__________');
        set('p_hrDirector', d.hrDirector || '—');
        set('p_hrDirectorSig', d.hrDirector || '__________');

        // Form number and date
        set('p_formNumber', d.id);
        set('p_formDate', this.formatDateShort(d.requestDate));
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

        // Also save to a specific storage for ticket compensation requests
        const ticketRequests = JSON.parse(localStorage.getItem('ticketCompensationRequests') || '[]');
        const reqIndex = ticketRequests.findIndex(req => req.id === this.data.id);
        if (reqIndex !== -1) {
            ticketRequests[reqIndex] = this.data;
        } else {
            ticketRequests.push(this.data);
        }
        localStorage.setItem('ticketCompensationRequests', JSON.stringify(ticketRequests));
    }

    clear() {
        const form = document.getElementById('ticketCompensationForm');
        if (form) form.reset();
        
        // Reset companions table to one row
        const tbody = document.getElementById('companionsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td><input type="text" name="name" class="form-control" placeholder="اسم المتعاقد" required></td>
                    <td><input type="text" name="relationship" class="form-control" value="المتعاقد" readonly></td>
                    <td><input type="text" name="iqama" class="form-control" required></td>
                    <td><input type="text" name="passport" class="form-control" required></td>
                    <td><input type="text" name="nationality" class="form-control" required></td>
                    <td></td>
                </tr>
            `;
        }
        
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
            
            // Auto-fill employee data from profile  
            const fields = {
                employeeName: profile.full_name_ar || profile.first_name_ar || '',
                employeeNumber: profile.app_users_employee_number || profile.employee_number || '',
                employeeNationality: profile.nationality || '',
            };
            
            // Fill form fields
            Object.keys(fields).forEach(key => {
                const element = document.getElementById(key);
                if (element && fields[key]) {
                    element.value = fields[key];
                }
            });
            
            console.log('✅ Auto-filled ticket compensation form from profile');
        } catch (error) {
            console.error('Error loading profile data:', error);
        }
    }
}

// Global helper function to add companion row
function addCompanionRow() {
    const tbody = document.getElementById('companionsTableBody');
    if (!tbody) return;
    
    const row = tbody.insertRow();
    row.innerHTML = `
        <td><input type="text" name="name" class="form-control" placeholder="اسم المرافق" required></td>
        <td><input type="text" name="relationship" class="form-control" placeholder="مثل: زوجة، ابن، ..." required></td>
        <td><input type="text" name="iqama" class="form-control" required></td>
        <td><input type="text" name="passport" class="form-control" required></td>
        <td><input type="text" name="nationality" class="form-control" required></td>
        <td><button type="button" onclick="this.closest('tr').remove()" style="padding:6px 12px;background:#dc2626;color:#fff;border:none;border-radius:4px;cursor:pointer">حذف</button></td>
    `;
}

// Global helper function
function clearTicketCompensationForm() {
    if (window.ticketCompensationRequest) {
        window.ticketCompensationRequest.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.ticketCompensationRequest = new TicketCompensationRequest();
});


