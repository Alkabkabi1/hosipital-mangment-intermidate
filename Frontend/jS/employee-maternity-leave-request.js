class MaternityLeaveRequest {
	constructor() {
		this.currentStep = 1;
		this.data = null;
		this.bind();
	}

	bind() {
		const form = document.getElementById('maternityForm');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.submit();
		});
		document.getElementById('clearBtn').addEventListener('click', () => this.clear());
		document.getElementById('printBtn').addEventListener('click', () => this.print());
		document.getElementById('submitBtn').addEventListener('click', () => this.submit());
		document.getElementById('printBtn2').addEventListener('click', () => this.print());
	}

	collect() {
		const v = (id) => (document.getElementById(id)?.value || '').trim();
		const reqType = document.querySelector('input[name="reqType"]:checked')?.value || 'new';
		const approvalOption = document.querySelector('input[name="approvalOption"]:checked')?.value || 'approve';
		return {
			id: 'ML-' + Date.now(),
			type: 'maternity_leave_request',
			requestType: reqType === 'extend' ? 'extension' : 'new',
			employeeName: v('empName'),
			jobTitle: v('jobTitle'),
			employeeId: v('empId'),
			serviceType: v('serviceType'),
			department: v('department'),
			appointmentDate: v('appointmentDate'),
			leaveFromDate: v('leaveFrom'),
			leaveToDate: v('leaveTo'),
			leaveDuration: v('leaveDuration'),
			employeeSignature: v('employeeSignature'),
			pledgeDate: v('pledgeDate'),
			approvalOption,
			deferPeriod: v('deferPeriod'),
			managerName: v('managerName'),
			managerSignature: v('managerSignature'),
			// attachments (names only)
			attachBirthNoticeName: document.getElementById('attachBirthNotice')?.files?.[0]?.name || '',
			attachBirthCertName: document.getElementById('attachBirthCert')?.files?.[0]?.name || '',
			submittedAt: new Date().toISOString(),
			status: 'submitted'
		};
	}

	validate(d) {
		const req = ['employeeName','jobTitle','employeeId','serviceType','department','appointmentDate','leaveFromDate','leaveToDate','leaveDuration'];
		if (!req.every(k => (d[k] || '').length)) {
			this.toast('يرجى تعبئة جميع الحقول المطلوبة','error'); return false;
		}
		if (!/^\d{10}$/.test(d.employeeId)) { this.toast('رقم الهوية يجب أن يكون 10 أرقام','error'); return false; }
		if (+d.leaveDuration <= 0) { this.toast('مدة الإجازة غير صحيحة','error'); return false; }
		if (d.approvalOption === 'defer' && !d.deferPeriod) { this.toast('الرجاء تحديد مدة التأجيل','error'); return false; }
		return true;
	}

	async submit() {
		const d = this.collect();
		if (!this.validate(d)) return;
		
		try {
			// Check if API client is available
			if (window.apiClient) {
				// Submit via API
				const response = await window.apiClient.post('/maternity-leave', {
					employeeName: d.employeeName,
					jobTitle: d.jobTitle,
					employeeId: d.employeeId,
					serviceType: d.serviceType,
					department: d.department,
					appointmentDate: d.appointmentDate,
					leaveFromDate: d.leaveFromDate,
					leaveToDate: d.leaveToDate,
					leaveDuration: d.leaveDuration,
					requestType: d.requestType,
					employeeSignature: d.employeeSignature,
					pledgeDate: d.pledgeDate,
					approvalOption: d.approvalOption,
					deferPeriod: d.deferPeriod,
					managerName: d.managerName,
					managerSignature: d.managerSignature,
					attachBirthNoticeName: d.attachBirthNoticeName,
					attachBirthCertName: d.attachBirthCertName
				});
				
				if (response.success) {
					d.id = response.data.id;
					this.toast('تم تقديم الطلب بنجاح وإرساله للاعتماد', 'success');
				} else {
					this.toast('حدث خطأ في تقديم الطلب: ' + (response.message || 'خطأ غير معروف'), 'error');
					return;
				}
			} else {
				// Fallback to localStorage
				console.warn('API client not available, using localStorage fallback');
			}
		} catch (error) {
			console.error('Error submitting maternity leave request:', error);
			this.toast('حدث خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.', 'error');
			return;
		}

		this.data = d;
		this.fillPrint();
		document.getElementById('printContainer').style.display = 'block';
		document.getElementById('workflowControls').style.display = 'block';
		document.getElementById('printBtn').style.display = 'inline-block';
		this.currentStep = 5;
		this.updateSteps();
		this.toast('تم تقديم الطلب بنجاح، يمكنك الطباعة الآن','success');
	}

	fillPrint() {
		const d = this.data; if (!d) return;
		const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
		// dates
		const today = new Date();
		document.getElementById('p_greg').textContent = today.toLocaleDateString('en-GB');
		try { document.getElementById('p_hijri').textContent = today.toLocaleDateString('ar-SA-u-ca-islamic'); } catch { document.getElementById('p_hijri').textContent = '—'; }
		// fields
		set('p_reqType', d.requestType === 'extension' ? 'تمديد إجازة' : 'طلب جديد');
		set('p_empName', d.employeeName);
		set('p_jobTitle', d.jobTitle);
		set('p_empId', d.employeeId);
		set('p_serviceType', d.serviceType);
		set('p_department', d.department);
		set('p_appointmentDate', this.fmt(d.appointmentDate));
		set('p_leaveFrom', this.fmt(d.leaveFromDate));
		set('p_leaveTo', this.fmt(d.leaveToDate));
		set('p_leaveDuration', d.leaveDuration);
		set('p_employeeSignature', d.employeeSignature || '—');
		set('p_employeeSignature2', d.employeeSignature || '—');
		set('p_empName2', d.employeeName);
		set('p_pledgeDate', this.fmt(d.pledgeDate));
		// manager section
		const approve = d.approvalOption !== 'defer';
		const elApprove = document.getElementById('p_approvalApprove');
		if (elApprove) elApprove.checked = approve;
		set('p_deferPeriod', approve ? '—' : (d.deferPeriod || '—'));
		set('p_managerName', d.managerName || '—');
		set('p_managerSignature', d.managerSignature || '—');
		// attachments
		const setText=(id,val)=>{const el=document.getElementById(id);if(el)el.textContent=val&&val.trim()?val:'—';};
		setText('p_attachBirthNotice', d.attachBirthNoticeName);
		setText('p_attachBirthCert', d.attachBirthCertName);
		// progress chips
		['ps1','ps2','ps3','ps4','ps5'].forEach((id,i)=> {
			const el = document.getElementById(id);
			if (!el) return;
			el.classList.toggle('completed', i < 4); // وصول للطباعة
			el.classList.toggle('active', i === 4);
		});
	}

	updateSteps() {
		const steps = document.querySelectorAll('.workflow-step');
		steps.forEach((s,i)=> {
			const n=i+1;
			s.classList.remove('active','completed');
			if (n < this.currentStep) s.classList.add('completed');
			if (n === this.currentStep) s.classList.add('active');
		});
		document.getElementById('submitBtn').style.display = this.currentStep===1?'inline-block':'none';
		document.getElementById('printBtn2').style.display = this.currentStep===5?'inline-block':'none';
		document.getElementById('statusMessage').textContent = this.currentStep===5 ? 'تم تقديم الطلب. يمكنك الطباعة.' : 'املأ البيانات واضغط "تقديم الطلب".';
	}

	print() {
		this.saveToInbox();
		window.print();
		this.toast('تم إرسال الطلب للطباعة','success');
	}

	saveToInbox() {
		if (!this.data) return;
		// Save to localStorage as fallback for admin inbox
		const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
		const idx = leaveRequests.findIndex(r => r.id === this.data.id);
		if (idx !== -1) leaveRequests[idx] = this.data; else leaveRequests.push(this.data);
		localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));

		const certificateRequests = JSON.parse(localStorage.getItem('certificateRequests') || '[]');
		const cidx = certificateRequests.findIndex(r => r.id === this.data.id);
		if (cidx !== -1) certificateRequests[cidx] = this.data; else certificateRequests.push(this.data);
		localStorage.setItem('certificateRequests', JSON.stringify(certificateRequests));
	}

	clear() {
		const form = document.getElementById('maternityForm');
		form.reset();
		document.getElementById('printContainer').style.display = 'none';
		document.getElementById('workflowControls').style.display = 'none';
		this.currentStep = 1;
		this.updateSteps();
		this.data = null;
	}

	toast(msg,type='info'){
		const n=document.createElement('div');
		n.textContent=msg;
		n.style.cssText='position:fixed;top:20px;right:20px;padding:12px 14px;border-radius:8px;color:#fff;font-weight:700;z-index:10000';
		const colors={success:'#16a34a',error:'#dc2626',info:'#2563eb',warning:'#f59e0b'};
		n.style.backgroundColor=colors[type]||colors.info;
		document.body.appendChild(n); setTimeout(()=>n.remove(),2500);
	}
	fmt(d){try{return new Date(d).toLocaleDateString('en-GB')}catch{return d||'—'}}
}

document.addEventListener('DOMContentLoaded',()=>{ 
	window.maternityReq = new MaternityLeaveRequest(); 
});
