import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Type definitions for administrative view tracking switches
type SettingsTab = 'default' | 'committees' | 'legislatures' | 'users';

export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('default');

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      {/* Centralized Card Layout Frame matching the Measure Form Page */}
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-10 space-y-8 flex flex-col min-h-[600px]">
        
        {/* ==========================================
            1. WORKSPACE PAGE HEADER BLOCK
           ========================================== */}
        <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-sm inline-block" />
              System Settings
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Configure system repositories and manage core platform properties.
            </p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition py-1.5 px-3 border border-gray-200 rounded-lg max-w-fit shadow-sm bg-white"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        {/* ==========================================
            2. INTERACTIVE MODULE SELECTION TABS BAR
           ========================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('committees')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'committees'
                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span>Committees</span>
          </button>

          <button
            onClick={() => setActiveTab('legislatures')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'legislatures'
                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Legislatures</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'users'
                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>User Accounts</span>
          </button>
        </div>

        {/* ==========================================
            3. DYNAMIC WORKING PLATFORM BODY PANEL
           ========================================== */}
        <div className="flex-1 border border-gray-100 rounded-xl bg-slate-50/50 p-6 flex flex-col justify-center min-h-[300px]">
          
          {/* DEFAULT WORKSPACE VIEW LANDING PAGE */}
          {activeTab === 'default' && (
            <div className="text-center max-w-sm mx-auto space-y-3 animate-fade-in">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
              </div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">System Configuration Console</h2>
              <p className="text-xs font-light text-gray-500 leading-relaxed">
                Select an administrative module tab button layout above to add, modify, and track platform variables including active committees registry records, legislative year bounds, and clerk profiles.
              </p>
            </div>
          )}

          {/* PLACEHOLDER MOUNT STACKS FOR SUBSEQUENT IMPLEMENTATION STEPS */}
          {activeTab === 'committees' && (
            <div className="text-center text-xs text-gray-400 font-light">Committee panel block mounting sequence pending...</div>
          )}
          {activeTab === 'legislatures' && (
            <div className="text-center text-xs text-gray-400 font-light">Legislature structural panel block mounting sequence pending...</div>
          )}
          {activeTab === 'users' && (
            <div className="text-center text-xs text-gray-400 font-light">User profiles workflow panel block mounting sequence pending...</div>
          )}

        </div>

      </div>
    </div>
  );
}
