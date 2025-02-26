import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { getInvoicePdf, getInvoices } from '../../lib/api';
import { Invoice } from '../types';

// Updated Yup schema to expect invoice_date as string
const schema = yup.object().shape({
  vendor_name: yup.string().required('Vendor name is required'),
  total_amount: yup.number().positive('Total must be positive').required('Total is required'),
  invoice_number: yup.string().required('Invoice number is required'),
  invoice_date: yup.string().required('Invoice date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// Update FormInputs type to use string for invoice_date
type FormInputs = {
  vendor_name: string;
  total_amount: number;
  invoice_number: string;
  invoice_date: string;
};

export default function ReviewPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Updated function to handle downloading PDF
  const handleViewPdf = async (invoiceId: string) => {
    if (!invoiceId || invoiceId === 'undefined') {
      toast.error("No invoice ID available to view PDF.");
      return;
    }
    
    console.log('Attempting to view PDF for invoice:', invoiceId);
    let objectUrl: string | undefined;
    
    try {
      const blob = await getInvoicePdf(invoiceId);
      console.log('Received blob:', blob);
      
      objectUrl = window.URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = `${invoiceId}.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(`Failed to fetch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedInvoices = await getInvoices();
      // Filter to only show invoices that need review or have confidence below threshold
      const reviewInvoices = fetchedInvoices.filter((invoice) => 
        invoice.status === "needs_review" || 
        invoice.status === "failed" ||
        (invoice.confidence !== undefined && invoice.confidence < 0.7)
      );
      setInvoices(reviewInvoices);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      toast.error('Failed to load invoices for review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Enhanced onSubmit with better error handling
  const onSubmit: (data: FormInputs) => Promise<void> = async (data: FormInputs) => {
    if (!selectedInvoice?.invoice_number) {
      toast.error('No invoice selected');
      return;
    }

    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_MAIN_API_URL}/api/invoices/${selectedInvoice.invoice_number}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          validation_status: 'valid',  // After review, mark as valid
          confidence: 1.0  // Set confidence to 1.0 after manual review
        }),
      });

      toast.success('Invoice updated successfully');
      setSelectedInvoice(null);
      await fetchInvoices(); // Refresh the list
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice');
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Review Invoices</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {loading && (
        <p className="text-gray-500 text-center py-4">Loading invoices for review...</p>
      )}
      
      {!loading && invoices.length === 0 && (
        <p className="text-gray-500 text-center py-8">No invoices require review at this time.</p>
      )}
      
      {selectedInvoice ? (
        // Begin form with react-hook-form
        <FormSection selectedInvoice={selectedInvoice} onSubmit={onSubmit} setSelectedInvoice={setSelectedInvoice} loading={loading} />
      ) : (
        <ul className="space-y-4">
          {invoices.map((invoice, idx) => (
            <li key={`${invoice.invoice_number}-${idx}`} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Invoice: {invoice.invoice_number}</p>
                  <p className="text-sm text-gray-600">Vendor: {invoice.vendor_name}</p>
                  <p className="text-sm text-gray-600">Amount: £{invoice.total_amount.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    Confidence: {invoice.confidence !== undefined && invoice.confidence !== null
                      ? `${(invoice.confidence * 100).toFixed(1)}%`
                      : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">Status: {invoice.status || 'Unknown'}</p>
                  <button
                    onClick={() => {
                      console.log('Button clicked for invoice:', invoice.invoice_number);
                      handleViewPdf(invoice.invoice_number);
                    }}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View PDF
                  </button>
                </div>
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// New component for the form section using react-hook-form
function FormSection({ 
  selectedInvoice, 
  onSubmit, 
  setSelectedInvoice, 
  loading 
}: { 
  selectedInvoice: Invoice;
  onSubmit: (data: FormInputs) => Promise<void>;
  setSelectedInvoice: (inv: Invoice | null) => void;
  loading: boolean;
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInputs>({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (selectedInvoice) {
      reset({
        ...selectedInvoice,
        invoice_date: selectedInvoice.invoice_date // Keep as string, no Date conversion
      });
    }
  }, [selectedInvoice, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Edit Invoice {selectedInvoice.invoice_number}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
          <input
            type="text"
            {...register('vendor_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.vendor_name && <p className="text-red-500 text-sm mt-1">{errors.vendor_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
          <input
            type="text"
            {...register('invoice_number')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
          <input
            type="date"
            {...register('invoice_date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
          <input
            type="number"
            step="0.01"
            {...register('total_amount')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.total_amount && <p className="text-red-500 text-sm mt-1">{errors.total_amount.message}</p>}
        </div>
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedInvoice(null)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}