import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { getInvoices, getInvoicePdf } from '../../lib/api';
import type { Invoice } from '../types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export default function InvoicesPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('created_at');
    const [order, setOrder] = useState('desc');
    const perPage = 10;
    const [error, setError] = useState<string | null>(null);
    const retryCount = useRef(0);
    const isMounted = useRef(true);

    const { 
        data: invoiceData,
        isLoading,
        isError,
        error: queryError,
        isSuccess,
        refetch
    } = useQuery({
        queryKey: ['invoices', currentPage, sortBy, order],
        queryFn: () => getInvoices(currentPage, perPage, sortBy, order),
        retry: MAX_RETRIES - 1,
        retryDelay: (attempt) => RETRY_DELAY * (attempt + 1),
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    // Reset error state on success
    useEffect(() => {
        if (isSuccess && isMounted.current) {
            retryCount.current = 0;
            setError(null);
        }
    }, [isSuccess]);

    // Enhanced error handling
    useEffect(() => {
        if (isError && isMounted.current) {
            retryCount.current++;
            const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
            
            if (retryCount.current < MAX_RETRIES) {
                toast.error(`Failed to load invoices (attempt ${retryCount.current}/${MAX_RETRIES}). Retrying...`);
            } else {
                setError('Failed to load invoices after multiple attempts.');
                toast.error(`Failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
            }
        }
    }, [isError, queryError]);

    // Cleanup mounted state
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleViewPdf = async (invoiceNumber: string) => {
        const toastId = toast.loading('Fetching PDF...');
        let timeoutId: NodeJS.Timeout | null = null;
        
        try {
            // Set a client-side timeout to prevent hanging requests
            const timeoutPromise = new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('PDF fetch timed out after 20 seconds'));
                }, 20000);
            });
            
            // Race the fetch against the timeout
            const blob = await Promise.race([
                getInvoicePdf(invoiceNumber),
                timeoutPromise
            ]);
            
            // Clear timeout if fetch succeeded
            if (timeoutId) clearTimeout(timeoutId);
            
            // Check if the blob is valid
            if (!blob || blob.size === 0) {
                throw new Error('Empty or invalid PDF received');
            }
            
            // Create and validate the blob URL
            const url = window.URL.createObjectURL(blob);
            
            // Try to open the PDF in a new window
            const newWindow = window.open(url, '_blank');
            
            if (!newWindow) {
                toast.error('Please allow popups to view PDFs', { id: toastId });
            } else {
                toast.success('PDF opened successfully', { id: toastId });
                
                // Monitor if PDF viewer becomes ready
                const checkWindowLoaded = () => {
                    try {
                        if (newWindow.document.readyState === 'complete') {
                            toast.dismiss(toastId);
                        } else {
                            setTimeout(checkWindowLoaded, 1000);
                        }
                    } catch (e) {
                        // Access might be denied due to cross-origin policy
                        toast.dismiss(toastId);
                    }
                };
                
                setTimeout(checkWindowLoaded, 1000);
            }
            
            // Clean up the blob URL after a longer delay, giving browser time to load it
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 60000); // 60 seconds delay before revoking URL
            
        } catch (error) {
            console.error('Error viewing PDF:', error);
            
            // Clear timeout if it exists
            if (timeoutId) clearTimeout(timeoutId);
            
            // Provide specific error messages based on the error type
            let errorMessage = 'Failed to load PDF';
            
            if (error instanceof Error) {
                if (error.message.includes('timed out')) {
                    errorMessage = 'PDF loading timed out. The file may be too large or the server is busy.';
                } else if (error.message.includes('not found')) {
                    errorMessage = 'PDF not found. The file may have been deleted or moved.';
                } else if (error.message.includes('Failed to retrieve PDF from S3')) {
                    errorMessage = 'Unable to retrieve PDF from storage. Please try again later.';
                } else if (error.message.includes('Invalid response')) {
                    errorMessage = 'Server returned an invalid PDF response format.';
                } else {
                    errorMessage = error.message;
                }
            }
            
            toast.error(errorMessage, { id: toastId });
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setOrder('desc');
        }
    };

    const renderSortArrow = (column: string) => {
        if (sortBy !== column) return null;
        return order === 'asc' ? ' ↑' : ' ↓';
    };

    return (
        <div className="max-w-7xl mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Invoices</h1>
                <div className="flex gap-4">
                    <Link
                        href="/upload"
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Upload New
                    </Link>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {isLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="ml-2 text-gray-600">Loading invoices...</p>
                </div>
            )}

            {!isLoading && invoiceData?.data && invoiceData.data.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No invoices found.</p>
                    <Link
                        href="/upload"
                        className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Upload your first invoice
                    </Link>
                </div>
            )}

            {invoiceData?.data && invoiceData.data.length > 0 && (
                <div className="overflow-x-auto shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('id')}
                                >
                                    ID{renderSortArrow('id')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('vendor_name')}
                                >
                                    Vendor{renderSortArrow('vendor_name')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('invoice_number')}
                                >
                                    Invoice Number{renderSortArrow('invoice_number')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('invoice_date')}
                                >
                                    Date{renderSortArrow('invoice_date')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('total_amount')}
                                >
                                    Total{renderSortArrow('total_amount')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('confidence')}
                                >
                                    Confidence{renderSortArrow('confidence')}
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                                    onClick={() => handleSort('status')}
                                >
                                    Status{renderSortArrow('status')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoiceData?.data.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.vendor_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoice_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invoice.invoice_date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">£{invoice.total_amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {invoice.confidence !== undefined && invoice.confidence !== null
                                            ? `${(invoice.confidence * 100).toFixed(1)}%`
                                            : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${invoice.status === 'valid' ? 'bg-green-100 text-green-800' : 
                                              invoice.status === 'needs_review' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-red-100 text-red-800'}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <button
                                            onClick={() => handleViewPdf(invoice.invoice_number)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {invoiceData?.pagination && invoiceData.pagination.total_pages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-3 py-1">
                        Page {currentPage} of {invoiceData.pagination.total_pages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(invoiceData.pagination.total_pages, p + 1))}
                        disabled={currentPage === invoiceData.pagination.total_pages}
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}