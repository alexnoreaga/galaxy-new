import React from 'react'
import { useState } from 'react';

export const InfoProduk = ({deskripsi,specs,isibox}) => {

    const [selectedContent, setSelectedContent] = useState("description");

    const handleContentChange = (content) => {
      setSelectedContent(content);
    };
  
    return (
      <div>
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {[
            {key: 'description', label: 'Deskripsi', show: true},
            {key: 'specs', label: 'Spesifikasi', show: !!specs.props.dangerouslySetInnerHTML?.__html},
            {key: 'box content', label: 'Isi Box', show: !!isibox, extraClass: 'sm:hidden md:flex lg:hidden'},
          ].filter(t => t.show).map(({key, label, extraClass = ''}) => (
            <button
              key={key}
              onClick={() => handleContentChange(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${extraClass} ${
                selectedContent === key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {selectedContent === 'description' && deskripsi}
          {selectedContent === 'box content' && isibox && (
            <ul className="flex flex-col gap-1.5">
              {isibox.split('\n').filter(Boolean).map((str) => (
                <li key={str} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                  {str}
                </li>
              ))}
            </ul>
          )}
          {selectedContent === 'specs' && specs}
        </div>
      </div>
    );
  }
  

