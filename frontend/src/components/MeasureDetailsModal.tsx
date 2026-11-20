import { useState, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

interface MeasureDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  measureId: number | null;
}

interface MeasureFullDetail {
  id: number;
  tracking_number: string;
  subject_text: string;
  cr_number: string;
  committee_name: string;
  committee_hearing_date: string;
  ordinance_resolution_number: string | null;
  remarks: string | null;
  legislature_term: string;
  doc_received_url: string | null;
  committee_report_url: string | null;
  scanned_measure_url: string | null;
  encoded_by: string | null;
  created_at: string;
}

export default function MeasureDetailsModal({
  isOpen,
  onClose,
  measureId,
}: MeasureDetailsModalProps) {
  const notify = useNotifications();
  const [detail, setDetail] = useState<MeasureFullDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !measureId) return;

    const fetchFullDetails = async () => {
      setIsLoading(true);
      setDetail(null);
      try {
        const res = await api.get(`/measures/detail/${measureId}`);
        setDetail(res.data);
      } catch (err: any) {
        notify(err.response?.data?.error || 'Failed to load document details.', 'error');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullDetails();
  }, [isOpen, measureId]);

  if (!isOpen) return null;

  const openPdf = (urlPath: string | null, label: string) => {
    if (!urlPath) {
      notify(`No ${label} PDF has been uploaded yet.`, 'info');
      return;
    }
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
    const baseUrl = apiBaseUrl
      ? apiBaseUrl.replace('/api', '')
      : 'http://localhost:5001';
    const fullUrl = urlPath.startsWith('http') ? urlPath : `${baseUrl}${urlPath}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-6 bg-blue-600 rounded-sm inline-block" />
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
                Legislative Measure Full Details
              </h3>
              {detail && (
                <p className="text-[11px] font-mono font-bold text-blue-600">
                  {detail.tracking_number} • {detail.legislature_term}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* MODAL SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-left">
          {isLoading || !detail ? (
            <div className="py-16 text-center text-sm text-gray-400 animate-pulse">
              Retrieving complete legislative record...
            </div>
          ) : (
            <>
              {/* STATUS & CORE IDENTIFIERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Tracking No. (TN)
                  </span>
                  <span className="text-sm font-mono font-black text-blue-600 mt-0.5 block">
                    {detail.tracking_number}
                  </span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Ordinance / Resolution No.
                  </span>
                  {detail.ordinance_resolution_number ? (
                    <span className="text-sm font-mono font-bold text-emerald-700 mt-0.5 block">
                      {detail.ordinance_resolution_number}
                    </span>
                  ) : (
                    <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                      Pending Enactment
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Committee Hearing Date
                  </span>
                  <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                    {new Date(detail.committee_hearing_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* COMMITTEE & LEGISLATURE METADATA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Committee Report & Assignment
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    CR No. {detail.cr_number} — {detail.committee_name}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Legislature Term
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    {detail.legislature_term}
                  </p>
                </div>
              </div>

              {/* FULL SUBJECT / TITLE */}
              <div className="space-y-1.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Subject / Measure Title
                </span>
                <div className="p-4 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 leading-relaxed">
                  {detail.subject_text}
                </div>
              </div>

              {/* DIGITAL ATTACHMENTS VIEWER SUITE */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Attached Digital Documents (PDF)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => openPdf(detail.doc_received_url, 'Document Received')}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      detail.doc_received_url
                        ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Document Received</p>
                      <p className="text-[10px] mt-0.5">
                        {detail.doc_received_url ? 'Click to view PDF' : 'Not uploaded'}
                      </p>
                    </div>
                    <span className="text-sm">{detail.doc_received_url ? '↗' : '—'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPdf(detail.committee_report_url, 'Committee Report')}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      detail.committee_report_url
                        ? 'border-blue-200 bg-blue-50/40 hover:bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Committee Report</p>
                      <p className="text-[10px] mt-0.5">
                        {detail.committee_report_url ? 'Click to view PDF' : 'Not uploaded'}
                      </p>
                    </div>
                    <span className="text-sm">{detail.committee_report_url ? '↗' : '—'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openPdf(detail.scanned_measure_url, 'Enacted Measure')}
                    className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      detail.scanned_measure_url
                        ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Enacted Measure</p>
                      <p className="text-[10px] mt-0.5">
                        {detail.scanned_measure_url ? 'Click to view PDF' : 'Not uploaded'}
                      </p>
                    </div>
                    <span className="text-sm">{detail.scanned_measure_url ? '↗' : '—'}</span>
                  </button>
                </div>
              </div>

              {/* REMARKS & LEGISLATIVE HISTORY */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Remarks &amp; Status History
                </span>
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {detail.remarks || 'No remarks recorded for this measure.'}
                </div>
              </div>

              {/* AUDIT FOOTER METADATA */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[10px] text-gray-400">
                <span>Encoded by: {detail.encoded_by || 'System'}</span>
                <span>
                  Date Logged:{' '}
                  {new Date(detail.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}