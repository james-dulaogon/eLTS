import React, { useState, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

interface UploadAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  measureId: number | null;
  fieldName: 'doc_received' | 'committee_report' | 'scanned_measure' | null;
  fieldLabel: string;
  onUploadSuccess: () => void;
}

export default function UploadAttachmentModal({
  isOpen,
  onClose,
  measureId,
  fieldName,
  fieldLabel,
  onUploadSuccess,
}: UploadAttachmentModalProps) {
  const notify = useNotifications();
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !measureId || !fieldName) return null;

  const validateAndUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      notify('Format Rejected: Only PDF files are authorized.', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      notify('Payload Too Large: File exceeds 20MB constraint ceiling.', 'error');
      return;
    }

    setIsUploading(true);
    notify('Valid file uploaded.', 'info');

    const formData = new FormData();
    formData.append('id', measureId.toString());
    formData.append(fieldName, file);

    try {
      await api.put('/measures/upload-single-attachment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      notify('Upload Complete', 'success');
      onUploadSuccess();
      onClose();
    } catch (err) {
      notify('Upload Failure','error');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and Drop Event Listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
        
        {/* Header Summary Profile Block */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Upload Attachment Replacement</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-light">Target Section: <span className="font-semibold text-blue-600">{fieldLabel}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* DRAG & DROP INTERACTIVE ZONE */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[180px] ${
            isDragActive 
              ? 'border-blue-600 bg-blue-50/40' 
              : 'border-gray-300 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && validateAndUpload(e.target.files[0])}
            accept=".pdf"
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-2 animate-pulse text-blue-600">
              <svg className="w-8 h-8 mx-auto animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18" /></svg>
              <p className="text-xs font-semibold">Streaming Binary Stream...</p>
            </div>
          ) : (
            <div className="space-y-2 text-gray-500">
              <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-xs font-bold text-gray-700">Drag and drop your PDF document here</p>
              <p className="text-[11px] font-light text-gray-400">or <span className="text-blue-600 font-semibold underline">browse local files</span> (Max 20MB)</p>
            </div>
          )}
        </div>

        {/* Warning Callout Box */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start space-x-2">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-[11px] leading-normal text-amber-800 font-light">
            <strong>Notice:</strong> If a document file already exists for this measure selection state, uploading a new PDF will instantly overwrite and purge the old record path.
          </p>
        </div>

      </div>
    </div>
  );
}
