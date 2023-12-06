import React from 'react'
import { useState } from 'react';

export const InfoProduk = ({deskripsi,specs,isibox}) => {

    console.log(isibox)
  
    const [selectedContent, setSelectedContent] = useState("description");

    const handleContentChange = (content) => {
      setSelectedContent(content);
    };
  
    return (
      <div className=''>
        <div className='flex flex-wrap gap-2 p-2 flex-auto'>
        
          <button onClick={() => handleContentChange("description")} className={`text-center w-28 py-1 cursor-pointer ${selectedContent == 'description' && ' rounded-md bg-slate-100 text-slate-500'}  font-bold text-black-700`}>DESKRIPSI</button>
          {specs.props.dangerouslySetInnerHTML?.__html &&<button onClick={() => handleContentChange("specs")} className={`w-28 py-1 cursor-pointer ${selectedContent == 'specs' && ' rounded-md bg-slate-100 text-slate-500'}  font-bold text-black-700`}>SPESIFIKASI</button>}
          {isibox && <button onClick={() => handleContentChange("box content")} className={`block py-1 sm:hidden md:block lg:hidden w-28 cursor-pointer ${selectedContent == 'box content' && ' rounded-md bg-slate-100 text-slate-500'}  font-bold text-black-700`}>ISI BOX</button>}
          
        </div>
        <div className='mt-2'>
          {selectedContent === "description" && (
            <div>
              <div>{deskripsi}</div>
            </div>
          )}
          {selectedContent === "box content" && (
            <div className='w-full prose '>
              {isibox.split('\n').map(str => <div className='text-sm p-1' key={str}>{str}</div>)}
            </div>
          )}
          {selectedContent === "specs" && (
            <div>
              {specs}
            </div>
          )}
        </div>
      </div>
    );
  }
  

