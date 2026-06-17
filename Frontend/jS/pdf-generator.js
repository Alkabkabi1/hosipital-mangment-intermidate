// PDF Generator for Approval Workflows
// Generates professional PDF documents with approval chain visualization

class PDFGenerator {
  constructor() {
    this.isJsPDFLoaded = false;
    this.loadJsPDF();
  }

  // Load jsPDF library dynamically
  async loadJsPDF() {
    if (typeof jsPDF !== 'undefined') {
      this.isJsPDFLoaded = true;
      return;
    }

    try {
      // Load jsPDF from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        this.isJsPDFLoaded = true;
        console.log('jsPDF loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load jsPDF');
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Error loading jsPDF:', error);
    }
  }

  // Wait for jsPDF to be available
  async waitForJsPDF() {
    let attempts = 0;
    while (!this.isJsPDFLoaded && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!this.isJsPDFLoaded) {
      throw new Error('jsPDF could not be loaded');
    }
  }

  // Generate PDF for request with approval chain
  async generateApprovalChainPDF(request, requestType = 'clearance') {
    try {
      await this.waitForJsPDF();
      
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Set up Arabic font support (if available)
      try {
        doc.addFont('https://fonts.gstatic.com/s/tajawal/v9/Tajawal-Regular.ttf', 'Tajawal', 'normal');
        doc.setFont('Tajawal');
      } catch (e) {
        console.warn('Arabic font not available, using default');
      }

      // Document setup
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let currentY = margin;

      // Header
      currentY = this.addHeader(doc, request, requestType, currentY, margin, contentWidth);
      
      // Request details
      currentY = this.addRequestDetails(doc, request, requestType, currentY, margin, contentWidth);
      
      // Department status (if available)
      if (request.departments && request.departments.length > 0) {
        currentY = this.addDepartmentStatus(doc, request, currentY, margin, contentWidth);
      }
      
      // Approval chain
      if (request.approvers && request.approvers.length > 0) {
        currentY = this.addApprovalChain(doc, request, currentY, margin, contentWidth, pageHeight);
      }
      
      // History/Audit trail
      if (request.history && request.history.length > 0) {
        currentY = this.addHistorySection(doc, request, currentY, margin, contentWidth, pageHeight);
      }

      // Footer
      this.addFooter(doc, pageHeight, margin, contentWidth);

      // Generate filename
      const filename = this.generateFilename(request, requestType);
      
      // Save the PDF
      doc.save(filename);
      
      return { success: true, filename };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Add header section
  addHeader(doc, request, requestType, startY, margin, contentWidth) {
    let currentY = startY;
    
    // Logo placeholder (you can add actual logo here)
    doc.setFillColor(43, 108, 176); // Primary color
    doc.rect(margin, currentY, 40, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('KAUH', margin + 20, currentY + 12, { align: 'center' });
    
    // Hospital name and title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('King Abdulaziz University Hospital', margin + 50, currentY + 8);
    doc.text('مستشفى الملك عبدالعزيز الجامعي', margin + 50, currentY + 16);
    
    currentY += 35;
    
    // Document title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    const title = requestType === 'clearance' ? 'تقرير طلب إخلاء طرف' : 'تقرير طلب مباشرة عمل';
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    
    // Request ID and status
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.text(`Request ID: #${request.id}`, margin, currentY);
    doc.text(`Status: ${request.status || 'غير محدد'}`, margin + 80, currentY);
    
    // Generation date
    const now = new Date().toLocaleDateString('ar-SA');
    doc.text(`Generated: ${now}`, pageWidth - margin, currentY, { align: 'right' });
    
    currentY += 20;
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    
    return currentY + 10;
  }

  // Add request details section
  addRequestDetails(doc, request, requestType, startY, margin, contentWidth) {
    let currentY = startY;
    
    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Request Details', margin, currentY);
    currentY += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // Employee details
    const employee = request.employee || {};
    const details = [
      { label: 'Employee Name', value: employee.name || 'غير محدد' },
      { label: 'Job Number', value: employee.jobNo || 'غير محدد' },
      { label: 'Email', value: employee.email || 'غير محدد' },
      { label: 'Department', value: employee.dept || 'غير محدد' },
      { label: 'Position', value: employee.title || 'غير محدد' },
      { label: 'Mobile', value: employee.mobile || 'غير محدد' }
    ];
    
    // Request specific details
    if (requestType === 'clearance' && request.details) {
      details.push(
        { label: 'Last Working Day', value: request.details.lastWorkDay || 'غير محدد' },
        { label: 'Reason', value: request.details.reason || 'غير محدد' }
      );
    } else if (requestType === 'onboarding' && request.details) {
      details.push(
        { label: 'Start Date', value: request.details.startDate || 'غير محدد' },
        { label: 'Position', value: request.details.position || 'غير محدد' },
        { label: 'Contract Type', value: request.details.contractType || 'غير محدد' }
      );
    }
    
    details.push(
      { label: 'Created Date', value: request.createdAt ? new Date(request.createdAt).toLocaleDateString('ar-SA') : 'غير محدد' },
      { label: 'Created By', value: request.createdBy || 'غير محدد' }
    );
    
    // Draw details in two columns
    const columnWidth = contentWidth / 2;
    let leftColumn = true;
    
    details.forEach((detail, index) => {
      const x = leftColumn ? margin : margin + columnWidth;
      
      doc.setFont(undefined, 'bold');
      doc.text(`${detail.label}:`, x, currentY);
      doc.setFont(undefined, 'normal');
      doc.text(detail.value, x + 40, currentY);
      
      if (!leftColumn) {
        currentY += 7;
      }
      leftColumn = !leftColumn;
    });
    
    if (!leftColumn) currentY += 7; // Adjust if last item was in left column
    
    return currentY + 10;
  }

  // Add department status section
  addDepartmentStatus(doc, request, startY, margin, contentWidth) {
    let currentY = startY;
    
    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Department Approvals', margin, currentY);
    currentY += 10;
    
    // Table header
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Department', margin + 2, currentY + 6);
    doc.text('Status', margin + 80, currentY + 6);
    doc.text('Approver', margin + 120, currentY + 6);
    doc.text('Date', margin + 160, currentY + 6);
    
    currentY += 10;
    
    // Department rows
    doc.setFont(undefined, 'normal');
    request.departments.forEach((dept, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY - 2, contentWidth, 8, 'F');
      }
      
      doc.text(dept.name || dept.id, margin + 2, currentY + 4);
      
      // Status with color
      this.setStatusColor(doc, dept.status);
      doc.text(dept.status || 'منتظر', margin + 80, currentY + 4);
      doc.setTextColor(0, 0, 0);
      
      doc.text(dept.approver_name || 'غير محدد', margin + 120, currentY + 4);
      doc.text(dept.approved_at ? new Date(dept.approved_at).toLocaleDateString('ar-SA') : '-', margin + 160, currentY + 4);
      
      currentY += 8;
    });
    
    return currentY + 10;
  }

  // Add approval chain section
  addApprovalChain(doc, request, startY, margin, contentWidth, pageHeight) {
    let currentY = startY;
    
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = margin;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Approval Chain', margin, currentY);
    currentY += 15;
    
    // Draw approval chain visually
    const stepWidth = contentWidth / Math.max(request.approvers.length, 1);
    const stepHeight = 40;
    
    request.approvers.forEach((approver, index) => {
      const x = margin + (index * stepWidth);
      const centerX = x + (stepWidth / 2);
      
      // Draw step box
      this.setApproverColor(doc, approver.status);
      doc.rect(x + 5, currentY, stepWidth - 10, stepHeight, 'F');
      
      // Step number
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}`, centerX, currentY + 8, { align: 'center' });
      
      // Approver details
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      
      const approverText = approver.role || approver.name || 'معتمد';
      doc.text(approverText, centerX, currentY + stepHeight + 8, { align: 'center', maxWidth: stepWidth - 10 });
      
      // Status
      doc.setFontSize(8);
      this.setStatusColor(doc, approver.status);
      doc.text(approver.status || 'منتظر', centerX, currentY + stepHeight + 15, { align: 'center' });
      
      // Draw arrow to next step
      if (index < request.approvers.length - 1) {
        doc.setDrawColor(100, 100, 100);
        doc.line(x + stepWidth - 5, currentY + stepHeight/2, x + stepWidth + 5, currentY + stepHeight/2);
        // Arrow head
        doc.line(x + stepWidth + 5, currentY + stepHeight/2, x + stepWidth, currentY + stepHeight/2 - 3);
        doc.line(x + stepWidth + 5, currentY + stepHeight/2, x + stepWidth, currentY + stepHeight/2 + 3);
      }
    });
    
    return currentY + stepHeight + 25;
  }

  // Add history section
  addHistorySection(doc, request, startY, margin, contentWidth, pageHeight) {
    let currentY = startY;
    
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      doc.addPage();
      currentY = margin;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('History & Audit Trail', margin, currentY);
    currentY += 10;
    
    // Table header
    doc.setFontSize(10);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Date', margin + 2, currentY + 6);
    doc.text('Action', margin + 40, currentY + 6);
    doc.text('By', margin + 100, currentY + 6);
    doc.text('Note', margin + 140, currentY + 6);
    
    currentY += 10;
    
    // History entries (show last 10)
    const recentHistory = request.history.slice(-10);
    doc.setFont(undefined, 'normal');
    
    recentHistory.forEach((entry, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 30) {
        doc.addPage();
        currentY = margin;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY - 2, contentWidth, 8, 'F');
      }
      
      const date = entry.at ? new Date(entry.at).toLocaleDateString('ar-SA') : '-';
      doc.text(date, margin + 2, currentY + 4);
      doc.text(entry.action || '-', margin + 40, currentY + 4);
      doc.text(entry.by || '-', margin + 100, currentY + 4);
      doc.text((entry.note || '').substring(0, 30), margin + 140, currentY + 4);
      
      currentY += 8;
    });
    
    return currentY + 10;
  }

  // Add footer
  addFooter(doc, pageHeight, margin, contentWidth) {
    const footerY = pageHeight - 15;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by KAUH HR Management System', margin, footerY);
    doc.text(new Date().toLocaleString('ar-SA'), pageWidth - margin, footerY, { align: 'right' });
  }

  // Set color based on status
  setStatusColor(doc, status) {
    switch (status) {
      case 'موافق':
      case 'معتمد':
        doc.setTextColor(22, 163, 74); // Green
        break;
      case 'مرفوض':
        doc.setTextColor(239, 68, 68); // Red
        break;
      case 'قيد الاعتماد':
        doc.setTextColor(59, 130, 246); // Blue
        break;
      default:
        doc.setTextColor(245, 158, 11); // Orange
    }
  }

  // Set approver box color
  setApproverColor(doc, status) {
    switch (status) {
      case 'موافق':
      case 'معتمد':
        doc.setFillColor(34, 197, 94); // Green
        break;
      case 'مرفوض':
        doc.setFillColor(239, 68, 68); // Red
        break;
      case 'قيد الاعتماد':
        doc.setFillColor(59, 130, 246); // Blue
        break;
      default:
        doc.setFillColor(156, 163, 175); // Gray
    }
  }

  // Generate filename
  generateFilename(request, requestType) {
    const type = requestType === 'clearance' ? 'clearance' : 'onboarding';
    const id = request.id || 'unknown';
    const date = new Date().toISOString().split('T')[0];
    return `${type}-request-${id}-${date}.pdf`;
  }

  // Quick export function for existing buttons
  async exportRequestPDF(requestId, requestType = 'clearance') {
    try {
      const storageKey = requestType === 'clearance' ? 'requestsClearance' : 'requestsOnboarding';
      const requests = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const request = requests.find(r => r.id === parseInt(requestId));
      
      if (!request) {
        throw new Error('Request not found');
      }
      
      await this.generateApprovalChainPDF(request, requestType);
      return { success: true };
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }
}

// Create global instance
window.PDFGenerator = new PDFGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFGenerator;
}
