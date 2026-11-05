import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSettingsModal({ isOpen, onClose }: AdminSettingsModalProps) {
  const notify = useNotifications();
  const [committeeName, setCommitteeName] = useState('');
  const [legislatureLabel, setLegislatureLabel] = useState('');
  const [isSavingCommittee, setIsSavingCommittee] = useState(false);
  const [isSavingLeg, setIsSavingLeg] = useState(false);

  if (!isOpen) return null;

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeName.trim()) return;
    setIsSavingCommittee(true);
    try {
      await api.post('/committees', { name: committeeName });
      notify('Committee name registered successfully.', 'success');
      setCommitteeName('');
    } catch (err: any) {
      notify(err.response?.data?.error || 'Failed to save committee.', 'error');
    } finally {
      setIsSavingCommittee(false);
    }
  };

  const handleSaveLegislature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legislatureLabel.trim()) return;
    setIsSavingLeg(true);
    try {
      // Endpoint to insert a new legislature term record row
      await api.post('/legislatures', { term_label: legislatureLabel });
      notify('Legislative term registered successfully.', 'success');
      setLegislatureLabel('');
    } catch (err: any) {
      notify(err.response?.data?.error || 'Failed to save legislative term.', 'error');
    } finally {
      setIsSavingLeg(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section 1: Add Committee */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Add Committee</label>
          <form onSubmit={handleSaveCommittee} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Committee on Rules"
              value={committeeName}
              onChange={(e) => setCommitteeName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
              required
            />
            <button
              type="submit"
              disabled={isSavingCommittee}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            >
              {isSavingCommittee ? 'Saving...' : 'Save Committee'}
            </button>
          </form>
        </div>

        {/* Section 2: Add Legislature */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">Add Legislature</label>
          <form onSubmit={handleSaveLegislature} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., 22ND SANGGUNIANG BAYAN (2025-2028)"
              value={legislatureLabel}
              onChange={(e) => setLegislatureLabel(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
              required
            />
            <button
              type="submit"
              disabled={isSavingLeg}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
            >
              {isSavingLeg ? 'Saving...' : 'Save Legislature'}
            </button>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-200 text-xs font-semibold text-gray-500 rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
