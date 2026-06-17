class NonSaudiTravelOrder {
    constructor() {
        this.currentStep = 1;
        this.data = null;
        this.dependentsTableBody = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        this.dependentsTableBody = document.getElementById('dependentsTableBody');
        this.addDependentRow(); // add initial empty row
        await this.loadUserProfile();
        this.bindEvents();
    }

    async loadUserProfile() {
        try {
            // Get user from localStorage first
            const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
            
            // Try to fetch full profile from API
            if (window.apiClient) {
                const profileResponse = await window.apiClient.getProfile();
                this.userProfile = profileResponse.data || profileResponse || authUser;
            } else {
                this.userProfile = authUser;
            }

            // Auto-populate ALL contractor fields from employee profile
            const contractorNameField = document.getElementById('contractorName');
            const jobTitleField = document.getElementById('jobTitle');
            const departmentField = document.getElementById('department');
            const nationalityField = document.getElementById('nationality');
            const iqamaField = document.getElementById('iqamaNumber');
            const passportField = document.getElementById('passportNumber');
            const empNumField = document.getElementById('employeeNumber');
            const contactField = document.getElementById('contactNumber');
            
            if (contractorNameField && this.userProfile.name) {
                contractorNameField.value = this.userProfile.name;
            }
            if (jobTitleField && this.userProfile.job_title) {
                jobTitleField.value = this.userProfile.job_title;
            }
            if (departmentField && this.userProfile.department) {
                departmentField.value = this.userProfile.department;
            }
            if (nationalityField && this.userProfile.nationality) {
                nationalityField.value = this.userProfile.nationality;
            }
            if (iqamaField && this.userProfile.iqama_number) {
                iqamaField.value = this.userProfile.iqama_number;
            }
            if (passportField && this.userProfile.passport_number) {
                passportField.value = this.userProfile.passport_number;
            }
            if (empNumField && this.userProfile.employee_number) {
                empNumField.value = this.userProfile.employee_number;
            }
            if (contactField && this.userProfile.phone) {
                contactField.value = this.userProfile.phone;
            }

            console.log('✅ User profile loaded and ALL contractor fields auto-populated:', this.userProfile);
        } catch (error) {
            console.warn('Could not load user profile:', error);
            this.userProfile = JSON.parse(localStorage.getItem('authUser') || '{}');
        }
    }

    bindEvents() {
        document.getElementById('addDependentRow')?.addEventListener('click', () => this.addDependentRow());
        document.getElementById('submitBtn')?.addEventListener('click', () => this.submit());
        
        // Handle back button
        document.querySelector('[data-action="go-back"]')?.addEventListener('click', () => {
            window.location.href = 'employee-dashboard.html';
        });
    }

    addDependentRow() {
        if (!this.dependentsTableBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="form-control dependent-name" placeholder="اسم المرافق"></td>
            <td><input type="text" class="form-control dependent-relation" placeholder="القرابة"></td>
            <td><input type="text" class="form-control dependent-nationality" placeholder="الجنسية"></td>
            <td><input type="text" class="form-control dependent-iqama" placeholder="رقم الإقامة"></td>
            <td><input type="text" class="form-control dependent-passport" placeholder="رقم الجواز"></td>
            <td><input type="text" class="form-control dependent-notes" placeholder="ملاحظات"></td>
            <td style="text-align:center">
                <button type="button" class="remove-row">✖</button>
            </td>
        `;
        row.querySelector('.remove-row')?.addEventListener('click', () => {
            if (this.dependentsTableBody.children.length > 1) {
                row.remove();
            } else {
                // clear inputs instead of removing last row
                row.querySelectorAll('input').forEach(input => input.value = '');
            }
        });
        this.dependentsTableBody.appendChild(row);
    }

    collectDependents() {
        const rows = Array.from(this.dependentsTableBody?.querySelectorAll('tr') || []);
        return rows
            .map(row => {
                const get = (selector) => row.querySelector(selector)?.value.trim() || '';
                return {
                    name: get('.dependent-name'),
                    relation: get('.dependent-relation'),
                    nationality: get('.dependent-nationality'),
                    iqama: get('.dependent-iqama'),
                    passport: get('.dependent-passport'),
                    notes: get('.dependent-notes'),
                };
            })
            .filter(dep => Object.values(dep).some(value => value.length > 0));
    }

    toSnakeCase(str) {
        return str.replace(/([A-Z])/g, '_$1').toLowerCase();
    }

    transformToSnakeCase(obj) {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                result[this.toSnakeCase(key)] = this.transformToSnakeCase(value);
            } else {
                result[this.toSnakeCase(key)] = value;
            }
        }
        return result;
    }

    collectForm() {
        const getValue = (id) => (document.getElementById(id)?.value || '').trim();
        const getCheckbox = (id) => document.getElementById(id)?.checked || false;

        // Return in snake_case to match backend schema
        return {
            contractor_name: getValue('contractorName'),
            job_title: getValue('jobTitle'),
            department: getValue('department'),
            nationality: getValue('nationality'),
            iqama_number: getValue('iqamaNumber'),
            passport_number: getValue('passportNumber'),
            employee_number: getValue('employeeNumber') || this.userProfile?.employee_number,
            contact_number: getValue('contactNumber') || this.userProfile?.phone,
            travel_destination: getValue('travelDestination'),
            dependents: this.collectDependents(),
            work_start_date: getValue('workStartDate'),
            work_end_date: getValue('workEndDate'),
            work_duration_days: parseInt(getValue('workDurationDays')) || null,
            dependents_start_date: getValue('dependentsStartDate') || null,
            dependents_end_date: getValue('dependentsEndDate') || null,
            dependents_duration_days: parseInt(getValue('dependentsDurationDays')) || null,
            sponsor_name: getValue('sponsorName'),
            sponsor_id: getValue('sponsorId'),
            sponsor_commitment: getValue('sponsorCommitment'),
            sponsor_signature: getValue('sponsorSignature'),
            sponsor_signature_date: getValue('sponsorSignatureDate'),
            director_signature: getValue('directorSignature') || null,
            director_notes: getValue('directorNotes') || null,
            checklist: {
                form_approved: getCheckbox('checkFormApproved'),
                residence_valid: getCheckbox('checkResidenceValid'),
                passport_copies: getCheckbox('checkPassportCopies'),
                housing_form: getCheckbox('checkHousingForm'),
                pdf_upload: getCheckbox('checkPdfUpload'),
                other_notes: getCheckbox('checkOtherNotes'),
            },
            hr_officer_name: getValue('hrOfficerName'),
            hr_officer_signature: getValue('hrOfficerSignature') || null,
            hr_officer_stamp: getValue('hrOfficerStamp') || null,
            hr_manager_name: getValue('hrManagerName') || null,
            hr_manager_signature: getValue('hrManagerSignature') || null,
            hr_manager_stamp: getValue('hrManagerStamp') || null,
        };
    }

    validate(data) {
        const requiredFields = [
            'contractor_name',
            'job_title',
            'department',
            'nationality',
            'iqama_number',
            'passport_number',
            'travel_destination',
            'work_start_date',
            'work_end_date',
            'work_duration_days',
            'sponsor_name',
            'sponsor_signature',
            'sponsor_signature_date',
            'hr_officer_name'
        ];

        const hasMissing = requiredFields.some(field => {
            if (field === 'hr_officer_name') {
                return !data.hr_officer_name;
            }
            return !(data[field] && String(data[field]).length > 0);
        });

        if (hasMissing) {
            this.notify('يرجى تعبئة جميع الحقول الإلزامية.', 'error');
            return false;
        }

        if (data.iqamaNumber && !/^\d{10,}$/.test(data.iqamaNumber)) {
            this.notify('رقم الإقامة يجب أن يحتوي على أرقام فقط (10 خانات أو أكثر).', 'error');
            return false;
        }

        if (data.contactNumber && !/^05\d{8}$/.test(data.contactNumber)) {
            this.notify('رقم التواصل يجب أن يكون بصيغة 05XXXXXXXX.', 'error');
            return false;
        }

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
            const response = await window.apiClient.createTravelOrder(data);
            
            // Success notification
            if (window.NotificationUtils) {
                window.NotificationUtils.showSuccess('تم تقديم طلب أمر الإركاب بنجاح ✅');
            } else {
                alert('تم تقديم الطلب بنجاح!');
            }

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = window.resolveFrontendPath 
                    ? window.resolveFrontendPath('employee-dashboard.html')
                    : 'employee-dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Error submitting travel order:', error);
            
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
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value && String(value).trim().length > 0 ? value : '—';
        };

        const today = new Date();
        setText('printGregorian', today.toLocaleDateString('en-GB'));
        setText('printHijri', this.toApproxHijri(today));

        setText('p_contractorName', d.contractorName);
        setText('p_jobTitle', d.jobTitle);
        setText('p_department', d.department);
        setText('p_employeeNumber', d.employeeNumber || '—');
        setText('p_nationality', d.nationality);
        setText('p_iqamaNumber', d.iqamaNumber);
        setText('p_passportNumber', d.passportNumber);
        setText('p_contactNumber', d.contactNumber || '—');
        setText('p_travelDestination', d.travelDestination);
        setText('p_workPeriod', `${this.formatDate(d.workStartDate)} إلى ${this.formatDate(d.workEndDate)} (${d.workDurationDays || '—'} يوم)`);

        // Guarantee
        setText('p_sponsorName', d.sponsorName);
        setText('p_workStart', this.formatDate(d.workStartDate));
        setText('p_workEnd', this.formatDate(d.workEndDate));
        setText('p_workDuration', d.workDurationDays ? `${d.workDurationDays}` : '—');
        setText('p_dependentsStart', this.formatDate(d.dependentsStartDate));
        setText('p_dependentsEnd', this.formatDate(d.dependentsEndDate));
        setText('p_dependentsDuration', d.dependentsDurationDays ? `${d.dependentsDurationDays}` : '—');
        setText('p_sponsorCommitment', d.sponsorCommitment || 'أتعهد بصحة كافة البيانات أعلاه وبالالتزام بجميع التعليمات الصادرة.');
        setText('p_directorSignature', d.directorSignature || '—');
        setText('p_directorNotes', d.directorNotes || '—');
        setText('p_sponsorSignature', d.sponsorSignature);
        setText('p_sponsorSignatureDate', this.formatDate(d.sponsorSignatureDate));

        // HR checklist
        this.setCheckmark('p_checkFormApproved', d.checklist?.formApproved);
        this.setCheckmark('p_checkResidenceValid', d.checklist?.residenceValid);
        this.setCheckmark('p_checkPassportCopies', d.checklist?.passportCopies);
        this.setCheckmark('p_checkHousingForm', d.checklist?.housingForm);
        this.setCheckmark('p_checkPdfUpload', d.checklist?.pdfUpload);
        this.setCheckmark('p_checkOtherNotes', d.checklist?.otherNotes);

        // HR signatures
        setText('p_hrOfficerName', d.hrOfficer?.name || '—');
        setText('p_hrOfficerSignature', d.hrOfficer?.signature || '—');
        setText('p_hrOfficerStamp', d.hrOfficer?.stamp || '—');
        setText('p_hrManagerName', d.hrManager?.name || '—');
        setText('p_hrManagerSignature', d.hrManager?.signature || '—');
        setText('p_hrManagerStamp', d.hrManager?.stamp || '—');

        // Dependents table
        this.renderDependents(d.dependents || []);
    }

    renderDependents(dependents) {
        const tbody = document.getElementById('printDependentsBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!dependents.length) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align:center;color:#64748b">لا يوجد مرافقون</td>`;
            tbody.appendChild(row);
            return;
        }

        dependents.forEach(dep => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dep.name || '—'}</td>
                <td>${dep.relation || '—'}</td>
                <td>${dep.nationality || '—'}</td>
                <td>${dep.iqama || '—'}</td>
                <td>${dep.passport || '—'}</td>
                <td>${dep.notes || '—'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    setCheckmark(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ? '☑' : '☐';
    }

    updateWorkflowUI() {
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

        const submitButton = document.getElementById('submitRequest');
        const printButton = document.getElementById('printApplication');
        if (submitButton) submitButton.style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        if (printButton) printButton.style.display = this.currentStep === 5 ? 'inline-block' : 'none';

        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = this.currentStep === 5
                ? 'تم تقديم الطلب! اضغط "طباعة النموذج" لإكمال العملية.'
                : 'املأ البيانات واضغط "تقديم الطلب" لبدء العملية.';
        }
    }

    print() {
        this.saveToInbox();
        window.print();
        this.notify('تم إرسال النموذج للطباعة وإلى صندوق الوارد الإداري.', 'success');
    }

    saveToInbox() {
        if (!this.data) return;
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

    notify(message, type = 'info') {
        const node = document.createElement('div');
        node.textContent = message;
        node.style.cssText = `
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
        const colors = {
            success: '#16a34a',
            error: '#dc2626',
            warning: '#f59e0b',
            info: '#2563eb'
        };
        node.style.backgroundColor = colors[type] || colors.info;
        document.body.appendChild(node);
        setTimeout(() => node.remove(), 3200);
    }

    formatDate(value) {
        if (!value) return '—';
        try {
            return new Date(value).toLocaleDateString('en-GB');
        } catch {
            return value;
        }
    }

    toApproxHijri(date) {
        try {
            return date.toLocaleDateString('ar-SA-u-ca-islamic');
        } catch {
            return '—';
        }
    }
}

function clearTravelOrderForm() {
    const form = document.getElementById('travelOrderForm');
    if (form) form.reset();
    const tableBody = document.getElementById('dependentsTableBody');
    if (tableBody) tableBody.innerHTML = '';
    if (window.travelOrder) {
        window.travelOrder.addDependentRow();
        window.travelOrder.currentStep = 1;
        window.travelOrder.data = null;
        window.travelOrder.updateWorkflowUI();
    }
    document.getElementById('applicationContainer').style.display = 'none';
    document.getElementById('workflowControls').style.display = 'none';
    document.getElementById('printBtn').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    window.travelOrder = new NonSaudiTravelOrder();
});

