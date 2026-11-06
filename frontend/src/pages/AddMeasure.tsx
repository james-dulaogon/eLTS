import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import api from "../services/api";

interface Committee {
  id: number;
  name: string;
}

interface Legislature {
  id: number;
  term_label: string;
  is_active: boolean;
}

export default function AddMeasure() {
  const addNotification = useNotifications();

  // Form Fields State
  const [trackingNumber, setTrackingNumber] = useState("");
  const [subjectText, setSubjectText] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [committeeId, setCommitteeId] = useState("");
  const [committeeHearingDate, setCommitteeHearingDate] = useState("");
  const [ordinanceResolutionNumber, setOrdinanceResolutionNumber] =
    useState("");
  const [remarks, setRemarks] = useState("");

  // Storage Registries
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [activeLegislature, setActiveLegislature] =
    useState<Legislature | null>(null);

  // File Upload State
  const [docReceived, setDocReceived] = useState<File | null>(null);
  const [committeeReport, setCommitteeReport] = useState<File | null>(null);
  const [scannedMeasure, setScannedMeasure] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLegislatureId, setSelectedLegislatureId] = useState("");
  const [legislaturesList, setLegislaturesList] = useState<Legislature[]>([]);

  // Pre-load active term requirements and official committee dropdown selectors
  useEffect(() => {
    const loadFormRegistries = async () => {
      try {
        const [committeeRes, legRes] = await Promise.all([
          api.get("/committees"),
          api.get("/legislatures/all"),
        ]);
        setCommittees(committeeRes.data);

        const data = legRes.data;
        let list: Legislature[] = [];
        let active: Legislature | null = null;

        if (Array.isArray(data)) {
          list = data;
          active = data.find((l: Legislature) => l.is_active) || null;
        } else if (data && data.is_active) {
          list = [data];
          active = data;
        }

        setLegislaturesList(list);

        if (active) {
          setActiveLegislature(active);
          setSelectedLegislatureId(active.id.toString()); // Pre-select the active legislature
        } else {
          setActiveLegislature({
            id: 1,
            term_label: "22ND SANGGUNIANG BAYAN (2025-2028)",
            is_active: true,
          });
          setSelectedLegislatureId("1");
        }
      } catch (err) {
        addNotification("Registry Link Failure", "error");
      }
    };
    loadFormRegistries();
  }, [addNotification]);

const handleFormSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!activeLegislature) return;

  setIsSubmitting(true);
  try {
    // Send directly as pure JSON since binary attachments are now decoupled from the intake step
    await api.post('/measures/upload-measure', {
      tracking_number: trackingNumber,
      subject_text: subjectText,
      cr_number: crNumber,
      committee_id: committeeId,
      committee_hearing_date: committeeHearingDate,
      legislature_id: selectedLegislatureId,
      remarks: remarks,
      ordinance_resolution_number: ordinanceResolutionNumber || null
    });
    
    addNotification('Measure Saved. Now you can upload attachments using the table menu.', 'success');
    window.location.href = '/dashboard';
  } catch (err: any) {
    addNotification('Error saving measure', 'error');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-10 space-y-8">
        {/* Header Summary Profile block */}
        <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-6 bg-blue-600 rounded-sm inline-block" />
              Document Intake — Add New Measure
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Currently compiling data for active track segment:{" "}
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {activeLegislature?.term_label}
              </span>
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition py-1.5 px-3 border border-gray-200 rounded-lg max-w-fit"
          >
            &larr; Back to Dashboard
          </a>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* GRID SECTION 1: Dynamic Primary Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                1. Tracking Number (TN NO.)
              </label>
              <input
                type="text"
                required
                placeholder="e.g., TN-620-26"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/40 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                2. Committee Report No. (CR NO.)
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 06-2026"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                3. Committee Assignment
              </label>
              <select
                required
                value={committeeId}
                onChange={(e) => setCommitteeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Choose Committee --</option>
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                7. Legislative Term
              </label>
              <select
                required
                value={selectedLegislatureId}
                onChange={(e) => setSelectedLegislatureId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">-- Choose Legislative Term --</option>
                {legislaturesList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.term_label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GRID SECTION 2: Dynamic Dates & Ord/Res */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                5. Committee Hearing Date Occurred
              </label>
              <input
                type="date"
                required
                value={committeeHearingDate}
                onChange={(e) => setCommitteeHearingDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                6. Ordinance / Resolution Number{" "}
                <span className="text-gray-400 font-light text-[10px] lowercase">
                  (nullable)
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g., Ord-104-2026 (Leave blank if pending review)"
                value={ordinanceResolutionNumber}
                onChange={(e) => setOrdinanceResolutionNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/40"
              />
            </div>
          </div>

          {/* TEXT BLOCK LAYOUT SECTIONS */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                7. Subject Description / Measure Content Title
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide a full description of the resolution measure..."
                value={subjectText}
                onChange={(e) => setSubjectText(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/40 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                7. Remarks Timeline Log Entry
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Hearing 10-19-2026; Adopted 10-21-2026; Returned for enhancement..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/40 font-light leading-normal"
              />
            </div>

            {/* SUBMIT TRIGGERS BAR */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
              <a
                href="/dashboard"
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? "Saving..." : "Document Saved →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
