class SaudiAirlinesLetter {
    constructor() {
        this.currentStep = 1;
        this.data = null;
        this.passengersBody = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        this.passengersBody = document.getElementById('passengersBody');
        this.addPassengerRow();
        this.addPassengerRow();
        this.addPassengerRow();
        this.addPassengerRow();
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

            // Auto-populate fields
            const nameField = document.getElementById('employeeName');
            const empNumField = document.getElementById('employeeNumber');
            const deptField = document.getElementById('employeeDepartment');
            const contactField = document.getElementById('contactNumber');
            
            if (nameField && this.userProfile.name) {
                nameField.value = this.userProfile.name;
            }
            if (empNumField && this.userProfile.employee_number) {
                empNumField.value = this.userProfile.employee_number;
            }
            if (deptField && this.userProfile.department) {
                deptField.value = this.userProfile.department;
            }
            if (contactField && this.userProfile.phone) {
                contactField.value = this.userProfile.phone;
            }

            console.log('✅ User profile loaded and fields populated');
        } catch (error) {
            console.warn('Could not load user profile:', error);
            this.userProfile = JSON.parse(localStorage.getItem('authUser') || '{}');
        }
    }

    bindEvents() {
        document.getElementById('addPassenger')?.addEventListener('click', () => this.addPassengerRow());
        document.getElementById('submitBtn')?.addEventListener('click', () => this.submit());
        
        // Handle back button
        document.querySelector('[data-action="go-back"]')?.addEventListener('click', () => {
            window.location.href = 'employee-dashboard.html';
        });
    }

    addPassengerRow() {
        if (!this.passengersBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="passenger-index"></td>
            <td><input type="text" class="form-control passenger-name" placeholder="اسم المسافر"></td>
            <td><input type="date" class="form-control passenger-birth"></td>
            <td><input type="text" class="form-control passenger-notes" placeholder="ملاحظات"></td>
            <td style="text-align:center">
                <button type="button" class="remove-row">✖</button>
            </td>
        `;
        row.querySelector('.remove-row')?.addEventListener('click', () => {
            if (this.passengersBody.children.length > 1) {
                row.remove();
                this.updatePassengerIndexes();
            } else {
                row.querySelectorAll('input').forEach(input => input.value = '');
            }
        });
        this.passengersBody.appendChild(row);
        this.updatePassengerIndexes();
    }

    updatePassengerIndexes() {
        if (!this.passengersBody) return;
        [...this.passengersBody.children].forEach((row, index) => {
            const cell = row.querySelector('.passenger-index');
            if (cell) cell.textContent = index + 1;
        });
    }

    collectPassengers() {
        if (!this.passengersBody) return [];
        return [...this.passengersBody.children].map((row, index) => ({
            index: index + 1,
            name: row.querySelector('.passenger-name')?.value.trim() || '',
            birthDate: row.querySelector('.passenger-birth')?.value || '',
            notes: row.querySelector('.passenger-notes')?.value.trim() || ''
        })).filter(p => p.name.length > 0);
    }

    collectForm() {
        const get = (id) => (document.getElementById(id)?.value || '').trim();
        // Return snake_case to match backend schema
        return {
            request_date: get('requestDate'),
            letter_hijri_date: get('letterHijriDate') || null,
            department: get('employeeDepartment') || this.userProfile?.department,
            employee_name: get('employeeName') || this.userProfile?.name,
            employee_number: get('employeeNumber') || this.userProfile?.employee_number,
            contact_number: get('contactNumber') || this.userProfile?.phone || null,
            route_origin: get('routeOrigin'),
            route_stop1: get('routeStop1') || null,
            route_stop2: get('routeStop2') || null,
            route_return: get('routeReturn'),
            travel_start_date: get('travelStartDate'),
            travel_class: get('travelClass') || 'الدرجة السياحية (المخفضة)',
            closing_greeting: get('closingGreeting') || 'مع أطيب تحياتي،',
            hr_director_name: get('hrDirectorName') || 'أ / بدر عبيد الله العازمي',
            additional_notes: get('additionalNotes') || null,
            passengers: this.collectPassengers().map(p => ({
                index: p.index,
                name: p.name,
                birth_date: p.birthDate || null,
                notes: p.notes || null
            }))
        };
    }

    validate(data) {
        const required = [
            'request_date',
            'department',
            'employee_name',
            'employee_number',
            'route_origin',
            'route_return',
            'travel_start_date'
        ];
        const missingRequired = required.some(field => !data[field] || String(data[field]).length === 0);
        if (missingRequired) {
            this.notify('يرجى تعبئة جميع الحقول الأساسية.', 'error');
            return false;
        }
        if (!/^\d+$/.test(data.employee_number)) {
            this.notify('الرقم الوظيفي يجب أن يكون أرقاماً فقط.', 'error');
            return false;
        }
        if (data.contact_number && !/^05\d{8}$/.test(data.contact_number)) {
            this.notify('رقم التواصل يجب أن يكون بصيغة 05XXXXXXXX.', 'error');
            return false;
        }
        if (!data.passengers.length) {
            this.notify('أضف مسافراً واحداً على الأقل مع اسمه.', 'error');
            return false;
        }
        return true;
    }

    async submit() {
        const formData = this.collectForm();
        if (!this.validate(formData)) return;

        try {
            // Disable submit button
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';
            }

            // Submit to backend API
            const response = await window.apiClient.createAirlinesTicket(formData);
            
            // Success notification
            if (window.NotificationUtils) {
                window.NotificationUtils.showSuccess('تم تقديم طلب تذاكر الطيران بنجاح ✅');
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
            console.error('Error submitting airlines ticket request:', error);
            
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

    updateLetterView() {
        if (!this.data) return;
        const d = this.data;
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value && String(value).trim().length > 0 ? value : '—';
        };

        setText('printRequestDate', this.formatDate(d.requestDate));
        setText('printHijriDate', d.letterHijriDate || '—');
        setText('printDepartment', d.department);
        setText('printRouteOrigin', d.routeOrigin);
        setText('printRouteStop1', d.routeStop1 || '.......');
        setText('printRouteStop2', d.routeStop2 || '.......');
        setText('printRouteReturn', d.routeReturn);
        setText('printTravelClass', d.travelClass || 'الدرجة السياحية (المخفضة)');
        setText('printTravelStart', this.formatDate(d.travelStartDate));
        setText('printClosingGreeting', d.closingGreeting);
        setText('printHrDirectorName', d.hrDirectorName);
        setText('printAdditionalNotes', d.additionalNotes || '');

        this.renderPassengers(d.passengers);
    }

    renderPassengers(passengers) {
        const tbody = document.getElementById('printPassengersBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        passengers.forEach((passenger, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${passenger.name || '—'}</td>
                <td>${this.formatDate(passenger.birthDate)}</td>
                <td>${passenger.notes || '—'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateWorkflowUI() {
        const steps = document.querySelectorAll('.workflow-step');
        steps.forEach((step, index) => {
            const num = index + 1;
            step.classList.remove('active', 'completed');
            if (num < this.currentStep) step.classList.add('completed');
            else if (num === this.currentStep) step.classList.add('active');
        });
        const submitBtn = document.getElementById('submitRequest');
        const printBtn = document.getElementById('printLetter');
        if (submitBtn) submitBtn.style.display = this.currentStep === 1 ? 'inline-block' : 'none';
        if (printBtn) printBtn.style.display = this.currentStep === 5 ? 'inline-block' : 'none';
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = this.currentStep === 5
                ? 'تم تقديم الطلب! اضغط "طباعة الخطاب" لإكمال العملية.'
                : 'املأ البيانات واضغط "تقديم الطلب" لبدء العملية.';
        }
    }

    print() {
        this.saveToInbox();
        window.print();
        this.notify('تم إرسال الخطاب للطباعة وإلى صندوق الوارد الإداري.', 'success');
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

    clear() {
        const form = document.getElementById('airlinesLetterForm');
        if (form) form.reset();
        if (this.passengersBody) {
            this.passengersBody.innerHTML = '';
            this.addPassengerRow();
            this.addPassengerRow();
            this.addPassengerRow();
            this.addPassengerRow();
        }
        const container = document.getElementById('letterContainer');
        if (container) container.style.display = 'none';
        const workflow = document.getElementById('workflowControls');
        if (workflow) workflow.style.display = 'none';
        const printBtn = document.getElementById('printBtn');
        if (printBtn) printBtn.style.display = 'none';
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
        n.style.backgroundColor = colors[type] || colors.info;
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

function clearAirlinesLetterForm() {
    if (window.saLetter) {
        window.saLetter.clear();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.saLetter = new SaudiAirlinesLetter();
});

