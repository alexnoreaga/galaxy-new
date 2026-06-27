import React, { useState } from 'react';

const COLOR_MAP = {
  blue: {
    iconBg: 'from-blue-500 to-indigo-600',
    hoverBg: 'hover:bg-blue-50 hover:border-blue-200',
    chevronOpen: 'text-blue-500',
    contentBg: 'bg-blue-50 border-blue-100',
  },
  green: {
    iconBg: 'from-emerald-400 to-green-600',
    hoverBg: 'hover:bg-emerald-50 hover:border-emerald-200',
    chevronOpen: 'text-emerald-500',
    contentBg: 'bg-emerald-50 border-emerald-100',
  },
  orange: {
    iconBg: 'from-orange-400 to-amber-500',
    hoverBg: 'hover:bg-orange-50 hover:border-orange-200',
    chevronOpen: 'text-orange-500',
    contentBg: 'bg-orange-50 border-amber-100',
  },
  purple: {
    iconBg: 'from-violet-500 to-purple-600',
    hoverBg: 'hover:bg-violet-50 hover:border-violet-200',
    chevronOpen: 'text-violet-500',
    contentBg: 'bg-violet-50 border-violet-100',
  },
  rose: {
    iconBg: 'from-rose-400 to-pink-600',
    hoverBg: 'hover:bg-rose-50 hover:border-rose-200',
    chevronOpen: 'text-rose-500',
    contentBg: 'bg-rose-50 border-rose-100',
  },
};

export const Accordion = ({ title, content, icon, color = 'blue', minimal = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (minimal) {
    return (
      <div>
        <button
          className="w-full flex items-center justify-between py-3 text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-gray-400 flex-shrink-0 w-4 h-4 flex items-center justify-center">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
          <svg
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {isOpen && (
          <div className="pb-3 text-sm text-gray-500 leading-relaxed pl-6.5">
            {content}
          </div>
        )}
      </div>
    );
  }

  const c = COLOR_MAP[color] ?? COLOR_MAP.blue;

  return (
    <div className="group">
      <div
        className={`flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 bg-white border border-gray-100 shadow-sm hover:shadow-md ${c.hoverBg}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className='flex flex-row gap-3 items-center flex-1'>
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center text-white shadow-sm transition-transform duration-200 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
            {icon}
          </div>
          <h3 className='font-semibold text-gray-800 text-sm leading-snug'>{title}</h3>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${isOpen ? `rotate-180 ${c.chevronOpen}` : 'text-gray-400'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {isOpen && (
        <div className={`mt-1 mx-1 p-3 rounded-xl border text-sm text-gray-700 leading-relaxed ${c.contentBg}`}>
          {content}
        </div>
      )}
    </div>
  );
};
