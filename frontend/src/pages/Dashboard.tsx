import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../context/useAuthStore';
import { useNotifications } from '../context/NotificationContext';
import { useConfirmation } from '../context/ConfirmationContext';
import api from '../services/api';

interface LegislativeMeasure {
  id: number;
  "Tracking No.": string;
  Subject: string;
  "CR NO.": string;
  "Committee Hearing Date": string;
  "Ordinance/Resolution No.": string | null;
  Remarks: string;
  doc_received_url: string;
  committee_report_url: string;
  scanned_measure_url: string | null;
}

interface Legislature {
  id: number;
  term_label: string;
  is_active: boolean;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const notify = useNotifications();
  const confirm = useConfirmation();
  const [measures, setMeasures] = useState<LegislativeMeasure[]>([]);
  const [legislatures, setLegislatures] = useState<Legislature[]>([]);
  const [activeLegId, setActiveLegId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch matrix records and terms configuration simultaneously
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [matrixRes, legRes] = await Promise.all([
        api.get('/measures/matrix'),
        api.get('/legislatures/current') // Endpoint fetching active array
      ]);
      setMeasures(matrixRes.data);

      // For demonstration setup fallback mock if database arrays are blank initially
      if (legRes.data.length > 0) {
        setLegislatures(legRes.data);
        const active = legRes.data.find((l: Legislature) => l.is_active);
        if (active) setActiveLegId(active.id);
      } else {
        const mockLegs = [
          { id: 1, term_label: '22ND SANGGUNIANG BAYAN (2025-2028)', is_active: true },
          { id: 2, term_label: '21ST SANGGUNIANG BAYAN (2022-2025)', is_active: false }
        ];
        setLegislatures(mockLegs);
        setActiveLegId(1);
      }
    } catch (err) {
      console.error('Failed to grab matrix records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Administrative Context Switching Handler with Security Gate Warn Locks
  const handleLegislatureToggle = async (targetId: number, targetLabel: string) => {
    if (user?.role !== 'Admin') {
      notify('Only system administrators can change the legislature.', 'warning');
      return;
    }
    if (targetId === activeLegId) return;

    const confirmSwitch = await confirm({
      title: 'Switch active legislature?',
      message: `You are about to change the active term to "${targetLabel}". This will change the legislature used to filter active data.`,
      confirmLabel: 'Switch legislature',
      cancelLabel: 'Keep current term',
    });

    if (confirmSwitch) {
      try {
        await api.put('/legislatures/switch', { targetLegislatureId: targetId });
        setActiveLegId(targetId);
        // Refresh table context elements instantly
        fetchDashboardData();
      } catch (err: any) {
        notify(err.response?.data?.error?.message || 'Failed to switch legislature.', 'error');
      }
    }
  };

  // Safe file viewing click dispatch pipeline
  const viewDocument = (urlPath: string | null) => {
    if (!urlPath) {
      notify('No scanned copy has been uploaded for this workflow state yet.', 'info');
      return;
    }
    // Resolves dynamically to the Synology backend static download upload mounts
    const fullUrl = urlPath.startsWith('http') ? urlPath : `http://localhost:5000${urlPath}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Filter computation layer based on search box input matching Track No. or Subject strings
  const filteredMeasures = measures.filter(m =>
    m["Tracking No."].toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.Subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m["CR NO."].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* 1. TOP GLOBAL RESPONSIVE NAVBAR ACCENT CHIPS */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg font-bold tracking-wider text-sm">eLTS</div>
          <h1 className="text-lg font-bold text-gray-900 hidden sm:block">eLegislative Tracking System</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-sm font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER GRID LAYOUT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* 2. ADMIN PANEL CONFIGS SECTION */}
        {user?.role === 'Admin' && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Administration Console — Legislature Context Selection</h2>
              <p className="text-xs text-gray-500">Switch active focus fields to filter workspace items by operating year profiles.</p>
            </div>
            <div className="flex flex-wrap gap-4 pt-1">
              {legislatures.map((leg) => (
                <label
                  key={leg.id}
                  className={`flex items-center px-4 py-2.5 rounded-lg border cursor-pointer text-sm font-medium transition ${
                    activeLegId === leg.id
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="legislature-context"
                    checked={activeLegId === leg.id}
                    onChange={() => handleLegislatureToggle(leg.id, leg.term_label)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                  />
                  {leg.term_label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 3. MATRIX CONTROLS BAR: SEARCH CHANNELS & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-full sm:max-w-md relative">
            <input
              type="text"
              placeholder="Search by Tracking No., Subject summary, or CR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/50"
            />
            <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 absolute left-3 top-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
            </svg>
          </div>

          {(user?.role === 'Admin' || user?.role === 'Document_Clerk') && (
            <a
              href="/dashboard/intake"
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm text-center transition"
            >
              + Add New Measure
            </a>
          )}
        </div>

        {/* 4. CORE DATA TABLE MATRIX — 6 EXACT RESPONSIVE COLUMNS */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <th className="py-3 px-4 w-[110px]">Tracking No.</th>
                  <th className="py-3 px-6 w-[320px]">Subject</th>
                  <th className="py-3 px-4 w-[180px]">CR No. / Committee</th>
                  <th className="py-3 px-4 w-[140px]">Hearing Date</th>
                  <th className="py-3 px-4 w-[160px]">Ordinance/Res No.</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-900">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500 font-medium">
                      Streaming records safely from Synology Storage Array...
                    </td>
                  </tr>
                ) : filteredMeasures.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500 font-light">
                      No matching tracking elements located in this legislature slice context frame.
                    </td>
                  </tr>
                ) : (
                  filteredMeasures.map((measure) => (
                    <tr key={measure.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-4 font-semibold text-blue-700">{measure["Tracking No."]}</td>
                      <td className="py-4 px-6">{measure.Subject}</td>
                      <td className="py-4 px-4">{measure["CR NO."]}</td>
                      <td className="py-4 px-4">
                        {measure["Committee Hearing Date"]
                          ? new Date(measure["Committee Hearing Date"]).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="py-4 px-4">{measure["Ordinance/Resolution No."] || '—'}</td>
                      <td className="py-4 px-4">
                        <p>{measure.Remarks || '—'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" onClick={() => viewDocument(measure.doc_received_url)} className="text-xs text-blue-600 hover:underline">
                            Received document
                          </button>
                          <button type="button" onClick={() => viewDocument(measure.committee_report_url)} className="text-xs text-blue-600 hover:underline">
                            Committee report
                          </button>
                          <button type="button" onClick={() => viewDocument(measure.scanned_measure_url)} className="text-xs text-blue-600 hover:underline">
                            Scanned measure
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
