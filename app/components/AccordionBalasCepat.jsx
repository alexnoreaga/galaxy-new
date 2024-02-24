import React, { useState } from 'react';

export const AccordionBalasCepat = ({ title, content }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleAccordion = () => {
      setIsOpen(!isOpen);
    };

    const copyToClipboard = (objekCopy) => {
      


        const textToCopy = objekCopy
  
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        
        // Select and copy the text
        textArea.select();
        document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(textArea);
      };
  
    return (
      <div className="accordion border rounded-md p-1 m-1">
        <div className="content-center mx-auto my-1 text-sm text-slate-500 accordion-title cursor-pointer flex justify-between items-center gap-2" onClick={toggleAccordion}>
            <div className='flex flex-row gap-2 items-center'>
                <div className='text-xs'>{title}</div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500">
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
</svg>

        </div>
        {isOpen && <div className="m-2 px-2 border-l-4 border-orange-300 accordion-content text-xs text-slate-500 text-left" onClick={()=>copyToClipboard(content)}>{content}</div>}
      </div>
    );
}
