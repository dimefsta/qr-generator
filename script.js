(function () {
  'use strict';

  // DOM Elements Cache
  const form = document.getElementById('qr-form');
  const input = document.getElementById('url-input');
  const clearBtn = document.getElementById('clear-btn');
  const errorMsg = document.getElementById('input-error-msg');
  const errorMsgText = errorMsg.querySelector('span');
  const previewSection = document.getElementById('preview-section');
  const qrCanvas = document.getElementById('qr-code');
  const qrContainer = document.getElementById('qr-container');
  const qrCaption = document.getElementById('qr-caption');
  const downloadPngBtn = document.getElementById('download-png-btn');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const copyBtn = document.getElementById('copy-btn');
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  
  let currentQrInstance = null;
  let toastTimeout = null;

  // Toast Notification Helper
  function showToast(message, isError = false) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastText.textContent = message;
    toast.style.backgroundColor = isError ? 'var(--color-error)' : 'var(--color-text-main)';
    toast.classList.add('toast-visible');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('toast-visible');
    }, 3000);
  }

  // Validation & URL Normalization
  function normalizeContent(rawText) {
    const trimmed = rawText.trim();
    if (!trimmed) return '';
    const domainPattern = /^(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
    if (domainPattern.test(trimmed)) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }

  function showError(message) {
    input.classList.add('input-error');
    errorMsgText.textContent = message;
    errorMsg.classList.add('visible');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  }

  function clearError() {
    input.classList.remove('input-error');
    errorMsg.classList.remove('visible');
    input.removeAttribute('aria-invalid');
  }

  // QR Code Generator
  function generateQrCode(text) {
    if (typeof QRious === 'undefined') {
      showToast('QR code engine failed to load. Check internet connection.', true);
      return;
    }
    try {
      currentQrInstance = new QRious({
        element: qrCanvas,
        value: text,
        size: 600,
        level: 'H',
        foreground: '#0f172a',
        background: '#ffffff'
      });

      qrCanvas.setAttribute('aria-label', `QR code representing: ${text}`);
      qrCaption.textContent = text;
      qrCaption.title = text;

      previewSection.classList.add('active');
      qrContainer.classList.remove('animate-pop');
      void qrContainer.offsetWidth;
      qrContainer.classList.add('animate-pop');

      if (window.innerWidth < 640) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } catch (err) {
      console.error('QR Generation failed:', err);
      showToast('Could not generate QR code. Content may be too long.', true);
    }
  }

  // Download & Export Handlers
  function downloadPng() {
    if (!currentQrInstance) return;
    try {
      const dataUrl = qrCanvas.toDataURL('image/png');
      const safeName = 'qr-code-' + Date.now() + '.png';
      const link = document.createElement('a');
      link.download = safeName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('PNG image downloaded!');
    } catch (err) {
      console.error('PNG download error:', err);
      showToast('Failed to download image.', true);
    }
  }

  function downloadPdf() {
    if (!currentQrInstance) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('PDF library is unavailable.', true);
      return;
    }
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgData = qrCanvas.toDataURL('image/png');
      const valueText = input.value.trim();
      const pageWidth = doc.internal.pageSize.getWidth();
      const qrSize = 100;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 65;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      doc.text('QR Code', pageWidth / 2, 40, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const truncatedCaption = valueText.length > 60 ? valueText.slice(0, 57) + '...' : valueText;
      doc.text(truncatedCaption, pageWidth / 2, 50, { align: 'center' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 4, 4);

      doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      const dateString = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated on ${dateString}`, pageWidth / 2, qrY + qrSize + 25, { align: 'center' });

      doc.save('qr-code-' + Date.now() + '.pdf');
      showToast('PDF document downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Failed to create PDF.', true);
    }
  }

  async function copyToClipboard() {
    if (!currentQrInstance) return;
    if (!navigator.clipboard) {
      showToast('Clipboard API not supported in this browser.', true);
      return;
    }
    try {
      qrCanvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('Could not convert QR code.', true);
          return;
        }
        try {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showToast('QR code copied to clipboard!');
        } catch (err) {
          console.warn('Clipboard write error:', err);
          showToast('Direct image copy unsupported. Please use Download.', true);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Failed to copy to clipboard.', true);
    }
  }

  // Event Listeners
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearError();
    const rawValue = input.value;
    const normalized = normalizeContent(rawValue);
    if (!normalized) {
      showError('Please enter a URL or text to generate a QR code.');
      return;
    }
    if (normalized !== rawValue && normalized.startsWith('https://')) {
      input.value = normalized;
    }
    generateQrCode(normalized);
  });

  input.addEventListener('input', () => {
    clearError();
    if (input.value.trim().length > 0) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.remove('visible');
    clearError();
    input.focus();
  });

  downloadPngBtn.addEventListener('click', downloadPng);
  downloadPdfBtn.addEventListener('click', downloadPdf);
  copyBtn.addEventListener('click', copyToClipboard);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (input.value) {
        input.value = '';
        clearBtn.classList.remove('visible');
        clearError();
      }
    }
  });
})();