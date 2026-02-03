import React, { useState } from 'react';

export const Accordion = ({ title, content, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className="group">
        <div 
          className="flex items-center justify-between p-3 sm:p-4 rounded-lg cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 bg-white border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md"
          onClick={toggleAccordion}
        >
          <div className='flex flex-row gap-2.5 items-center flex-1'>
            <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 transition-all duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
              {icon}
            </div>
            <div className='flex-1'>
              <h3 className='font-semibold text-gray-800 text-sm leading-snug'>{title}</h3>
            </div>
          </div>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2} 
            stroke="currentColor" 
            className={`w-5 h-5 text-gray-400 transition-all duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        
        {isOpen && (
          <div className='mt-1 mx-1 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200'>
            <div className='text-sm text-gray-700 leading-relaxed'>{content}</div>
          </div>
        )}
      </div>
    );
}
