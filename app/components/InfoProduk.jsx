import React from 'react'
import { useState } from 'react';

export const InfoProduk = ({deskripsi,specs,isibox}) => {

    const [selectedContent, setSelectedContent] = useState("description");
    const [descExpanded, setDescExpanded] = useState(false);

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
          {selectedContent === 'description' && (
            <div>
              <div
                className="relative overflow-hidden transition-all duration-300"
                style={{ maxHeight: descExpanded ? 'none' : '320px' }}
              >
                {deskripsi}
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
              <button
                onClick={() => setDescExpanded(e => !e)}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {descExpanded ? (
                  <>
                    Sembunyikan
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 1 1-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 0 1-1.06-1.06l4.25-4.25Z" clipRule="evenodd" />
                    </svg>
                  </>
                ) : (
                  <>
                    Baca Selengkapnya
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
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
  

