import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user, updateProfile } = useAuthStore();
  const notify = useNotifications();

  // Controlled form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state values when modal pops open
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setEmail(user.email);
      setUsername(user.username);
      setPassword('');
      setConfirmPassword('');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      notify('Passwords do not match.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = { name, email, username };
      if (password.trim() !== '') {
        payload.password = password;
      }

      const response = await api.put('/auth/profile', payload);
      
      // Update global Zustand state dynamically
      updateProfile({ name, email, username });
      
      notify('Account settings updated successfully.', 'success');
      onClose();
    } catch (err: any) {
      notify(err.response?.data?.error?.message || 'Failed to update profile values.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">User Account Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Box */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">Full Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">Email Address</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">Account Username</label>
            <input
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
            />
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] text-gray-400 font-light mb-2">Leave password fields blank if you do not wish to change it.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">New Password</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30"
                />
              </div>
            </div>
          </div>

          {/* Action Row Buttons */}
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
            <button
              type="button" onClick={onClose}
              className="px-3 py-1.5 border border-gray-200 text-xs font-semibold text-gray-500 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSaving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              {isSaving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
