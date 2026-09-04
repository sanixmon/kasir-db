import { generateStartReceiptHTML, generateFinishReceiptHTML, generateAdditionalReceiptHTML, getTrackUrl } from './receiptTemplates';

/**
 * Custom hook for DOM-based thermal receipt printing and QR code attachment.
 * Isolates DOM manipulation, QRCode integration, and window.print().
 */
export function useReceiptPrinter(options = {}) {
  const { currentShiftUser = '-' } = options;

  const triggerPrintReceipt = (html, qrText) => {
    if (typeof document === 'undefined') return;
    const area = document.getElementById('printArea');
    if (!area) return;
    area.innerHTML = html;
    area.style.display = 'block';

    setTimeout(() => {
      const qrEl = area.querySelector('#printQrCode');
      if (qrEl && qrText && typeof window !== 'undefined' && typeof window.QRCode !== 'undefined') {
        new window.QRCode(qrEl, {
          text: qrText,
          width: 120,
          height: 120,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
      setTimeout(() => {
        if (typeof window !== 'undefined' && typeof window.print === 'function') {
          window.print();
        }
        setTimeout(() => {
          area.style.display = 'none';
        }, 100);
      }, 500);
    }, 100);
  };

  const printStart = (session, shiftUser = currentShiftUser) => {
    if (!session) return;
    const html = generateStartReceiptHTML(session, shiftUser);
    const trackUrl = getTrackUrl(session.id);
    triggerPrintReceipt(html, trackUrl);
  };

  const printFinish = (txn) => {
    if (!txn) return;
    const html = generateFinishReceiptHTML(txn);
    const trackUrl = getTrackUrl(txn.id);
    triggerPrintReceipt(html, trackUrl);
  };

  const printAdditionalOrder = (session, addedItems, payMethod = 'cash', shiftUser = currentShiftUser) => {
    if (!session || !addedItems || addedItems.length === 0) return;
    const html = generateAdditionalReceiptHTML(session, addedItems, payMethod, shiftUser);
    const trackUrl = getTrackUrl(session.id);
    triggerPrintReceipt(html, trackUrl);
  };

  return {
    triggerPrintReceipt,
    printStart,
    printFinish,
    printAdditionalOrder
  };
}
