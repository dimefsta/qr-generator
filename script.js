// Helper function to validate URLs
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
}

document.getElementById('generate-btn').addEventListener('click', () => {
  const url = document.getElementById('url-input').value.trim();

  if (!isValidUrl(url)) {
    alert('Please enter a valid URL (e.g., https://example.com)');
    return;
  }

  const qrCode = new QRious({
    element: document.getElementById('qr-code'),
    value: url,
    size: 250,
  });

  document.getElementById('download-section').classList.remove('hidden');
});

document.getElementById('download-img').addEventListener('click', () => {
  const canvas = document.getElementById('qr-code');
  const link = document.createElement('a');
  link.href = canvas.toDataURL();
  link.download = 'qr-code.png';
  link.click();
});

document.getElementById('download-pdf').addEventListener('click', () => {
  const canvas = document.getElementById('qr-code');
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.addImage(imgData, 'PNG', 10, 10, 50, 50);
  pdf.save('qr-code.pdf');
});
