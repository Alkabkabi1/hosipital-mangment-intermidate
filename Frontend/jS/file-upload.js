// File Upload Utility
// Handles file upload functionality for all forms

class FileUploadManager {
  constructor(options = {}) {
    this.options = {
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      allowedTypes: options.allowedTypes || [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ],
      allowedExtensions: options.allowedExtensions || ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
      maxFiles: options.maxFiles || 5,
      uploadEndpoint: options.uploadEndpoint || '/api/upload',
      ...options
    };
    
    this.files = [];
    this.uploadedFiles = [];
  }

  // Initialize file upload for a container
  init(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.createUploadArea(container);
    this.setupEventListeners(container);
  }

  createUploadArea(container) {
    const uploadArea = document.createElement('div');
    uploadArea.className = 'file-upload-area';
    uploadArea.innerHTML = `
      <div class="upload-zone" id="uploadZone">
        <div class="upload-icon">📁</div>
        <h3>اسحب الملفات هنا أو اضغط للاختيار</h3>
        <p>الملفات المدعومة: ${this.options.allowedExtensions.join(', ')}</p>
        <p>الحد الأقصى لحجم الملف: ${Utils.formatFileSize(this.options.maxFileSize)}</p>
        <input type="file" id="fileInput" multiple accept="${this.options.allowedExtensions.join(',')}" style="display: none;">
        <button type="button" class="btn btn-secondary" onclick="document.getElementById('fileInput').click()">
          اختيار الملفات
        </button>
      </div>
      
      <div class="files-list" id="filesList"></div>
      
      <div class="upload-progress" id="uploadProgress" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="progress-text" id="progressText">جاري الرفع...</div>
      </div>
    `;

    container.appendChild(uploadArea);
  }

  setupEventListeners(container) {
    const uploadZone = container.querySelector('#uploadZone');
    const fileInput = container.querySelector('#fileInput');

    // File input change
    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      this.handleFiles(e.dataTransfer.files);
    });

    // Click to select files
    uploadZone.addEventListener('click', (e) => {
      if (e.target === uploadZone || e.target.closest('.upload-icon') || e.target.closest('h3')) {
        fileInput.click();
      }
    });
  }

  handleFiles(files) {
    const fileArray = Array.from(files);
    
    // Check total files limit
    if (this.files.length + fileArray.length > this.options.maxFiles) {
      showError(`لا يمكن رفع أكثر من ${this.options.maxFiles} ملفات`);
      return;
    }

    fileArray.forEach(file => {
      if (this.validateFile(file)) {
        this.addFile(file);
      }
    });

    this.updateFilesList();
  }

  validateFile(file) {
    // Check file size
    if (file.size > this.options.maxFileSize) {
      showError(`حجم الملف ${file.name} كبير جداً. الحد الأقصى ${Utils.formatFileSize(this.options.maxFileSize)}`);
      return false;
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!this.options.allowedExtensions.includes(fileExtension)) {
      showError(`نوع الملف ${file.name} غير مدعوم`);
      return false;
    }

    // Check MIME type
    if (this.options.allowedTypes.length > 0 && !this.options.allowedTypes.includes(file.type)) {
      showError(`نوع الملف ${file.name} غير مدعوم`);
      return false;
    }

    // Check if file already exists
    if (this.files.find(f => f.name === file.name && f.size === file.size)) {
      showError(`الملف ${file.name} موجود مسبقاً`);
      return false;
    }

    return true;
  }

  addFile(file) {
    const fileObj = {
      id: Utils.generateId('file'),
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // pending, uploading, uploaded, error
      progress: 0,
      url: null,
      error: null
    };

    this.files.push(fileObj);
  }

  removeFile(fileId) {
    this.files = this.files.filter(f => f.id !== fileId);
    this.updateFilesList();
  }

  updateFilesList() {
    const filesList = document.getElementById('filesList');
    if (!filesList) return;

    if (this.files.length === 0) {
      filesList.innerHTML = '';
      return;
    }

    const filesHTML = this.files.map(fileObj => `
      <div class="file-item" data-file-id="${fileObj.id}">
        <div class="file-info">
          <div class="file-icon">${this.getFileIcon(fileObj.type)}</div>
          <div class="file-details">
            <div class="file-name">${fileObj.name}</div>
            <div class="file-size">${Utils.formatFileSize(fileObj.size)}</div>
          </div>
        </div>
        
        <div class="file-status">
          ${this.getFileStatusHTML(fileObj)}
        </div>
        
        <div class="file-actions">
          ${fileObj.status === 'pending' ? `
            <button type="button" class="btn-sm btn-danger" onclick="fileUploadManager.removeFile('${fileObj.id}')">
              حذف
            </button>
          ` : ''}
          ${fileObj.status === 'uploaded' ? `
            <button type="button" class="btn-sm btn-info" onclick="fileUploadManager.downloadFile('${fileObj.id}')">
              تحميل
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    filesList.innerHTML = filesHTML;
  }

  getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType === 'application/pdf') return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  }

  getFileStatusHTML(fileObj) {
    switch (fileObj.status) {
      case 'pending':
        return '<span class="status-badge status-pending">في الانتظار</span>';
      case 'uploading':
        return `
          <div class="file-progress">
            <div class="progress-bar-small">
              <div class="progress-fill-small" style="width: ${fileObj.progress}%"></div>
            </div>
            <span class="progress-percent">${Math.round(fileObj.progress)}%</span>
          </div>
        `;
      case 'uploaded':
        return '<span class="status-badge status-success">تم الرفع</span>';
      case 'error':
        return `<span class="status-badge status-error" title="${fileObj.error}">خطأ</span>`;
      default:
        return '';
    }
  }

  // Upload all pending files
  async uploadAll() {
    const pendingFiles = this.files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      showInfo('لا توجد ملفات للرفع');
      return;
    }

    this.showUploadProgress();

    for (let i = 0; i < pendingFiles.length; i++) {
      const fileObj = pendingFiles[i];
      
      try {
        await this.uploadFile(fileObj);
      } catch (error) {
        console.error('Upload error:', error);
        fileObj.status = 'error';
        fileObj.error = error.message;
      }
      
      this.updateFilesList();
    }

    this.hideUploadProgress();
    
    const successCount = this.files.filter(f => f.status === 'uploaded').length;
    const errorCount = this.files.filter(f => f.status === 'error').length;
    
    if (errorCount === 0) {
      showSuccess(`تم رفع جميع الملفات بنجاح (${successCount} ملف)`);
    } else {
      showError(`تم رفع ${successCount} ملف، فشل في رفع ${errorCount} ملف`);
    }
  }

  async uploadFile(fileObj) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', fileObj.file);
      formData.append('type', 'document');

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          fileObj.progress = (e.loaded / e.total) * 100;
          fileObj.status = 'uploading';
          this.updateFilesList();
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            fileObj.status = 'uploaded';
            fileObj.url = response.url;
            fileObj.progress = 100;
            this.uploadedFiles.push(fileObj);
            resolve(response);
          } catch (error) {
            reject(new Error('خطأ في معالجة الاستجابة'));
          }
        } else {
          reject(new Error(`خطأ في الرفع: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('خطأ في الشبكة'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('انتهت مهلة الرفع'));
      });

      xhr.timeout = 60000; // 60 seconds timeout
      xhr.open('POST', this.options.uploadEndpoint);
      
      // Add authorization header if available
      if (window.apiClient && window.apiClient.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${window.apiClient.token}`);
      }

      xhr.send(formData);
    });
  }

  showUploadProgress() {
    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
      uploadProgress.style.display = 'block';
    }
  }

  hideUploadProgress() {
    const uploadProgress = document.getElementById('uploadProgress');
    if (uploadProgress) {
      uploadProgress.style.display = 'none';
    }
  }

  downloadFile(fileId) {
    const fileObj = this.files.find(f => f.id === fileId);
    if (fileObj && fileObj.url) {
      const link = document.createElement('a');
      link.href = fileObj.url;
      link.download = fileObj.name;
      link.click();
    }
  }

  // Get uploaded files data for form submission
  getUploadedFiles() {
    return this.uploadedFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.url
    }));
  }

  // Clear all files
  clear() {
    this.files = [];
    this.uploadedFiles = [];
    this.updateFilesList();
  }
}

// Global instance
window.fileUploadManager = new FileUploadManager();

// Initialize file upload when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Auto-initialize file upload areas
  const uploadContainers = document.querySelectorAll('.file-upload-container');
  uploadContainers.forEach(container => {
    window.fileUploadManager.init(container.id);
  });
});

// Add file upload CSS
const style = document.createElement('style');
style.textContent = `
  .file-upload-area {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .upload-zone {
    text-align: center;
    padding: 40px 20px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background: #f9fafb;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: #2B6CB0;
    background: #eff6ff;
  }
  
  .upload-icon {
    font-size: 3em;
    margin-bottom: 15px;
  }
  
  .upload-zone h3 {
    color: #374151;
    margin-bottom: 10px;
  }
  
  .upload-zone p {
    color: #6b7280;
    font-size: 14px;
    margin: 5px 0;
  }
  
  .files-list {
    margin-top: 20px;
  }
  
  .file-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 10px;
    background: white;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  
  .file-icon {
    font-size: 1.5em;
  }
  
  .file-details {
    flex: 1;
  }
  
  .file-name {
    font-weight: 600;
    color: #374151;
    margin-bottom: 4px;
  }
  
  .file-size {
    font-size: 13px;
    color: #6b7280;
  }
  
  .file-status {
    min-width: 100px;
  }
  
  .status-badge {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .status-pending { background: #fef3c7; color: #92400e; }
  .status-success { background: #d1fae5; color: #065f46; }
  .status-error { background: #fee2e2; color: #991b1b; }
  
  .file-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 120px;
  }
  
  .progress-bar-small {
    flex: 1;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
  }
  
  .progress-fill-small {
    height: 100%;
    background: #2B6CB0;
    transition: width 0.3s;
  }
  
  .progress-percent {
    font-size: 12px;
    color: #6b7280;
    min-width: 35px;
  }
  
  .file-actions {
    display: flex;
    gap: 8px;
  }
  
  .upload-progress {
    margin-top: 20px;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
    text-align: center;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  
  .progress-fill {
    height: 100%;
    background: #2B6CB0;
    transition: width 0.3s;
    animation: pulse 1.5s infinite;
  }
  
  .progress-text {
    color: #6b7280;
    font-size: 14px;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .btn-danger { background: #ef4444; color: white; }
  .btn-info { background: #0ea5e9; color: white; }
  
  .btn-sm:hover {
    opacity: 0.8;
  }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileUploadManager;
}
