"use client"

import { useState } from "react";

export default function ExpandingPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Container */}
      <div
        className={`
          overflow-hidden
          transition-all duration-300 ease-out
          bg-white border border-gray-200 shadow-lg
          rounded-xl
          ${
            open
              ? "w-[100%] h-64 p-4"
              : "w-[5%] h-12 p-0"
          }
        `}
      >
        {/* Button (collapsed state) */}
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="w-full h-full flex items-center justify-center
                       bg-black text-white rounded-xl
                       hover:bg-gray-800 transition"
          >
            +
          </button>
        )}

        {/* Panel Content (expanded state) */}
        {open && (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Expanded Panel</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 text-sm text-gray-600">
              Put anything here — filters, settings, text, forms, etc.
            </div>

            <div className="mt-3">
              <button className="px-3 py-2 bg-black text-white rounded-lg text-sm">
                Action
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
