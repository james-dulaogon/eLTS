import React, { useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import api from "../services/api";

interface PublicTrackResult {
  "Tracking No.": string;
  Subject: string;
  "Last Action Date": string;
  "Current Status": string;
  "Progress Timeline / Remarks": string;
}

export default function PublicTrack() {
  const notify = useNotifications();
  const [trackingNoInput, setTrackingNoInput] = useState("");
  const [trackResult, setTrackResult] = useState<PublicTrackResult | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNoInput.trim()) return;

    setIsLoading(true);
    setTrackResult(null);

    try {
      // Hits the high-security unauthenticated search pathway
      const response = await api.get(
        `/measures/public-track?tn=${encodeURIComponent(trackingNoInput.trim())}`,
      );
      setTrackResult(response.data[0] || response.data);
      notify("Tracking record successfully located.", "success");
    } catch (err: any) {
      if (err.response?.status === 404) {
        notify(
          "No active legislative documents match that tracking number.",
          "error",
        );
      } else {
        notify(
          "System Error: Could not reach tracking repository service.",
          "error",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* 1. MINIMALIST TOP BRAND BAR */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold text-sm tracking-wider">
            eLTS
          </div>
          <h1 className="text-base font-bold text-gray-900">
            Sangguniang Bayan Application Tracking Portal
          </h1>
        </div>
        <a
          href="/login"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition"
        >
          Staff Login &rarr;
        </a>
      </header>

      {/* 2. MAIN CENTER ENGINE MATRIX WORKSPACE */}
      <div className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center space-y-6">
        {/* Core Control Searching Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-10 space-y-6 text-center">
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Track Your Document Status
            </h2>
            <p className="text-xs text-gray-500 font-light leading-relaxed">
              Enter your assigned Tracking Number (TN NO.) below to instantly
              monitor the legislative journey and status of your document.
            </p>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          >
            <input
              type="text"
              required
              placeholder="e.g., TN-620-26"
              value={trackingNoInput}
              onChange={(e) => setTrackingNoInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30 font-mono font-bold tracking-wider placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition whitespace-nowrap"
            >
              {isLoading ? "Searching documents..." : "Track Status"}
            </button>
          </form>
        </div>

        {/* 3. DYNAMIC SEARCH RESULTS PRESENTATION MATRIX DISPLAY */}
        {trackResult && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8 animate-fade-in space-y-6 text-left">
            <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Tracking Number
                </span>
                <h3 className="text-base font-mono font-black text-blue-600 mt-0.5">
                  {trackResult["Tracking No."]}
                </h3>
              </div>
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    trackResult["Current Status"] === "Enacted / Passed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {trackResult["Current Status"]}
                </span>
              </div>
            </div>

            {/* Structured Content Metadata Grid */}
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Document Title / Subject Matter
                </h4>
                <p className="mt-1 font-medium text-gray-800 leading-relaxed">
                  {trackResult.Subject}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Last Committee Action Date
                  </h4>
                  <p className="mt-1 font-semibold text-gray-700">
                    {new Date(
                      trackResult["Last Action Date"],
                    ).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Public Access Policy
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 font-light leading-normal">
                    To claim official scanned ordinance/resolution documents,
                    present this verified tracking number to your Sangguniang
                    Bayan office.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  Progress Timeline logs / Historical Remarks
                </h4>
                <div className="border-t border-gray-100 pt-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-sm" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900">
                      Official Progress Timeline & Historical Remarks
                    </h4>
                  </div>

                  {/* Active Step-by-Step Vertical Progress Track */}
                  <div className="relative pl-6 space-y-6 before:absolute before:bottom-2 before:top-2 before:left-[9px] before:w-0.5 before:bg-slate-200">
                    {(() => {
                      // Senior Parser Strategy: Split logging chunks dynamically by semicolons or clean break-lines
                      const rawRemarks =
                        trackResult["Progress Timeline / Remarks"] || "";
                      const timelineLogs = rawRemarks
                        .split(/[;\n]+/)
                        .map((log) => log.trim())
                        .filter((log) => log.length > 0);

                      if (timelineLogs.length === 0) {
                        return (
                          <p className="text-xs italic text-gray-400 font-light pl-2">
                            No milestones or tracking actions have been
                            officially recorded yet.
                          </p>
                        );
                      }

                      return timelineLogs.map((log, index) => {
                        const isLatest = index === timelineLogs.length - 1; // Highlights the most recent action item

                        // Dynamic status check keyword mapping tags
                        const isAdopted =
                          log.toLowerCase().includes("adopt") ||
                          log.toLowerCase().includes("enact") ||
                          log.toLowerCase().includes("pass");
                        const isReturned =
                          log.toLowerCase().includes("return") ||
                          log.toLowerCase().includes("enhance");

                        return (
                          <div
                            key={index}
                            className="relative flex items-start space-x-3 group animate-slide-in"
                          >
                            {/* Visual Node Accent Circle Icons */}
                            <div
                              className={`absolute -left-[23px] mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${
                                isLatest
                                  ? isAdopted
                                    ? "bg-emerald-500 border-emerald-500 shadow-md ring-4 ring-emerald-100"
                                    : isReturned
                                      ? "bg-red-500 border-red-500 shadow-md ring-4 ring-red-100"
                                      : "bg-blue-600 border-blue-600 shadow-md ring-4 ring-blue-100"
                                  : "bg-white border-slate-300 group-hover:border-blue-400"
                              }`}
                            >
                              {/* Central localized small bullet indicator core symbol */}
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-white" : "bg-slate-400"}`}
                              />
                            </div>

                            {/* Timeline Item Description Content Block */}
                            <div
                              className={`flex-1 p-3.5 rounded-xl border transition-all duration-200 ${
                                isLatest
                                  ? isAdopted
                                    ? "bg-emerald-50/40 border-emerald-200 shadow-sm"
                                    : isReturned
                                      ? "bg-red-50/40 border-red-200 shadow-sm"
                                      : "bg-blue-50/40 border-blue-200 shadow-sm"
                                  : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <span
                                  className={`text-xs font-bold ${
                                    isLatest
                                      ? isAdopted
                                        ? "text-emerald-700"
                                        : isReturned
                                          ? "text-red-700"
                                          : "text-blue-700"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {isLatest
                                    ? "💡 Latest Milestone Status Action"
                                    : `Step ${index + 1}`}
                                </span>

                                {/* Visual Status Badges */}
                                {isLatest && (
                                  <span
                                    className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                      isAdopted
                                        ? "bg-emerald-600 text-white"
                                        : isReturned
                                          ? "bg-red-600 text-white"
                                          : "bg-blue-600 text-white"
                                    }`}
                                  >
                                    Active Status Frame
                                  </span>
                                )}
                              </div>

                              <p
                                className={`mt-1.5 text-xs leading-relaxed font-medium ${isLatest ? "text-gray-900 font-bold" : "text-gray-600 font-light"}`}
                              >
                                {log}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. FOOTER CREDITS BRAND MARKS */}
      <footer className="text-center py-6 text-[10px] text-gray-400 font-light border-t border-gray-200 bg-white">
        &copy; 2026 eLegislative Tracking System (eLTS). Secure Citizen Query
        Portal Node.
      </footer>
    </div>
  );
}
