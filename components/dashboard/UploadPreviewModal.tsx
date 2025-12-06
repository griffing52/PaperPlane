"use client";

import React from "react";

interface UploadPreviewModalProps {
  isOpen: boolean;
  isUploading: boolean;
  imageSrc: string | null;
  onClose: () => void;
}

export default function UploadPreviewModal({
  isOpen,
  isUploading,
  imageSrc,
  onClose,
}: UploadPreviewModalProps) {
  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-800 max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {isUploading ? "Processing Upload" : "Upload Status"}
          </h3>

          {isUploading ? (
            <div className="animate-pulse flex space-x-2 items-center text-xs text-blue-400">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span>Analyzing Logbook...</span>
            </div>
          ) : (
            <div className="flex space-x-2 items-center text-xs text-green-400">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>Complete</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
            {}
            <img
              src={imageSrc}
              alt="Logbook Upload Preview"
              className="object-contain w-full h-full"
            />
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className={`w-full sm:w-auto min-w-[120px] rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
              isUploading
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20"
            }`}
          >
            {isUploading ? "Please wait..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}