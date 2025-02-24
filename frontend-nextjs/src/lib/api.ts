import { Invoice, UploadResponse } from '../types';

export async function uploadInvoice(file: File): Promise<UploadResponse> {
  // Create a FormData object and append the file
  const formData = new FormData();
  formData.append('file', file);

  // Declare the response variable properly
  const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN_API_URL}/api/upload_invoice`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    } else {
      const text = await response.text();
      throw new Error(`Upload failed: ${text}`);
    }
  }
  return response.json();
}

export async function getInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN_API_URL}/api/invoices`, {
    method: 'GET'
  });
  if (!response.ok) throw new Error('Failed to fetch invoices');
  const data = await response.json();
  return data as Invoice[];
}

export async function getInvoicePdf(invoiceId: string): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN_API_URL}/api/invoice_pdf/${invoiceId}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('PDF not found for this invoice');
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      const errorData: { detail?: string } = await response.json();
      throw new Error(errorData.detail || 'Failed to retrieve PDF');
    }
    throw new Error('Failed to retrieve PDF');
  }
  return response.blob();
}

export async function getAnomalies(): Promise<unknown> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_MAIN_API_URL}/api/anomalies`);
  if (!response.ok) throw new Error('Failed to fetch anomalies');
  return response.json();
}
