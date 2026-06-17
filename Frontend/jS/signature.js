/**
 * Developer Signature Component
 * Adds developer signature to all pages
 */

(function() {
  'use strict';

  // Create signature HTML
  const signatureHTML = `
    <div class="developer-signature">
      <a href="https://www.linkedin.com/in/norah-alkabkabi-744093274" 
         target="_blank" 
         rel="noopener noreferrer"
         class="signature-badge" 
         title="N.K - Connect with me on LinkedIn">
        N.K
        <div class="signature-dropdown">
          <img src="public/WhatsApp Image 2025-10-21 at 09.05.03_1cf3a633.jpg" 
               alt="Contact QR Code" 
               class="signature-dropdown-image">
        </div>
      </a>
    </div>
  `;

  // Inject signature CSS
  const signatureStyles = document.createElement('style');
  signatureStyles.textContent = `
    .developer-signature {
      position: fixed;
      bottom: 15px;
      right: 15px;
      z-index: 9999;
      pointer-events: auto;
    }

    .signature-badge {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2B6CB0 0%, #1a5490 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(43, 108, 176, 0.4);
      transition: all 0.3s ease;
      letter-spacing: 1px;
      text-decoration: none;
    }

    .signature-badge:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(43, 108, 176, 0.6);
    }

    .signature-dropdown {
      position: absolute;
      bottom: 50px;
      right: 0;
      background: white;
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px) scale(0.9);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      pointer-events: none;
    }

    .signature-badge:hover .signature-dropdown {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    .signature-dropdown-image {
      width: 120px;
      height: auto;
      display: block;
      border-radius: 8px;
    }

    .signature-dropdown::before {
      content: '';
      position: absolute;
      bottom: -8px;
      right: 8px;
      width: 16px;
      height: 16px;
      background: white;
      transform: rotate(45deg);
      box-shadow: 4px 4px 8px rgba(0,0,0,0.1);
    }

    /* Mobile styles */
    @media (max-width: 768px) {
      .developer-signature {
        bottom: 12px;
        right: 12px;
      }
      
      .signature-badge {
        width: 36px;
        height: 36px;
        font-size: 12px;
      }

      .signature-dropdown {
        bottom: 45px;
        padding: 8px;
      }

      .signature-dropdown-image {
        width: 100px;
      }
    }

    /* No padding needed since it's in corner */
    body {
      padding-bottom: 0 !important;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .signature-qr-container {
        background: rgba(255, 255, 255, 0.98);
      }
    }

    /* Print: hide signature */
    @media print {
      .developer-signature {
        display: none !important;
      }
      
      body {
        padding-bottom: 0 !important;
      }
    }
  `;

  // Add signature when DOM is ready
  function addSignature() {
    // Don't add if already exists
    if (document.querySelector('.developer-signature')) {
      return;
    }

    // Add styles
    document.head.appendChild(signatureStyles);

    // Add signature HTML
    document.body.insertAdjacentHTML('beforeend', signatureHTML);

    console.log('✅ Developer signature added - Click to visit LinkedIn, Hover to see QR code');
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSignature);
  } else {
    addSignature();
  }

  // Also expose globally for manual initialization
  window.addDeveloperSignature = addSignature;
})();

