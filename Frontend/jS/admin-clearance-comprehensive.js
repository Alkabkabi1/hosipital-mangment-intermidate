// Admin Clearance Detail - Comprehensive Data Display
// Populates additional clearance-specific fields from payload_json

/**
 * Displays clearance-specific details from payload_json
 */
window.displayClearanceSpecificInfo = function(data) {
  const card = document.getElementById('clearanceDetailsCard');
  const grid = document.getElementById('clearanceDetailsGrid');
  
  if (!card || !grid) return;
  
  const items = [];
  
  // Clearance type and reasons
  if (data.clearanceType || data.clearance_type) {
    const type = data.clearanceType || data.clearance_type;
    const typeMap = {
      'end_of_service': 'إخلاء طرف نهاية خدمة',
      'end_mid_service': 'إخلاء طرف خدمة متوسطة'
    };
    items.push({ label: 'نوع إخلاء الطرف', value: typeMap[type] || type });
  }
  
  if (data.specificReason || data.specific_reason) {
    const reason = data.specificReason || data.specific_reason;
    const reasonMap = {
      'retirement': 'التقاعد',
      'due_to_assignment': 'بسبب التكليف',
      'end_of_contract': 'انتهاء العقد',
      'resignation': 'الاستقالة',
      'death': 'الوفاة',
      'disability': 'العجز',
      'other': 'أخرى'
    };
    items.push({ label: 'السبب المحدد', value: reasonMap[reason] || reason });
  }
  
  if (data.otherReasonText) {
    items.push({ label: 'تفاصيل السبب الآخر', value: data.otherReasonText });
  }
  
  if (data.lastWorkingDay || data.last_work_day) {
    items.push({ 
      label: 'آخر يوم عمل', 
      value: window.DetailUtils ? window.DetailUtils.formatDate(data.lastWorkingDay || data.last_work_day) : (data.lastWorkingDay || data.last_work_day)
    });
  }
  
  // Display if we have data
  if (items.length > 0) {
    card.style.display = 'block';
    grid.innerHTML = items.map(item => `
      <div><strong>${item.label}:</strong> <b>${escapeHtml(String(item.value))}</b></div>
    `).join('');
  } else {
    card.style.display = 'none';
  }
};

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

console.log('✅ Admin clearance comprehensive data display loaded');

