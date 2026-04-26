import axiosInstance from './axiosInstance';

const downloadPdf = async (url, filename) => {
  const response = await axiosInstance.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
};

export const invoiceService = {
  
  downloadSaleInvoice: (saleId, saleNumber) =>
    downloadPdf(`/invoices/sale/${saleId}`, `invoice-${saleNumber}.pdf`),

downloadPurchaseInvoice: (purchaseId, purchaseNumber) =>
    downloadPdf(`/invoices/purchase/${purchaseId}`, `po-${purchaseNumber}.pdf`),
};
