import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ value, onChange, options, className = '', dropdownClassName = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between outline-none transition-all cursor-pointer ${className}`}
      >
        <span className="truncate pr-3">{selectedOption?.label}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-[105%] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 min-w-full ${dropdownClassName}`}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors text-xs cursor-pointer ${
                value === opt.value ? 'bg-blue-50/80 font-black text-[#005a9c]' : 'font-bold text-gray-700'
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
