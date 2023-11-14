import React from 'react'
import { useState } from 'react';

export const InfoProduk = ({deskripsi,specs,isibox}) => {
    const [selectedContent, setSelectedContent] = useState("description");

    const handleContentChange = (content) => {
      setSelectedContent(content);
    };
  
    return (
      <div className=''>
        <div className='flex flex-row gap-2 p-2'>
        
          <button onClick={() => handleContentChange("description")} className='border w-28 cursor-pointer rounded-md  font-bold text-black-700'>Deskripsi</button>
          <button onClick={() => handleContentChange("specs")} className='border w-28 cursor-pointer rounded-md  font-bold text-black-700'>Spesifikasi</button>
          <button onClick={() => handleContentChange("box content")} className='border w-28 cursor-pointer rounded-md  font-bold text-black-700'>Isi Box</button>
          
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
  

