import React, { useState } from 'react';

export const Accordion = ({ title, content,icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
      setIsOpen(!isOpen);
    };
  
    return (
      <div className="accordion">
        <div className="content-center mx-auto m-4 text-sm text-slate-500 accordion-title cursor-pointer flex justify-between items-center gap-2" onClick={toggleAccordion}>
            <div className='flex flex-row gap-2 items-center'>
                <div class>{icon}</div>
                <div>{title}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
</svg>

        </div>
        {isOpen && <div className="m-2 px-2 border-l-4 border-orange-300 accordion-content text-sm text-slate-500">{content}</div>}
      </div>
    );
}
