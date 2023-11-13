import React from 'react'
import { useState } from 'react';

export const InfoProduk = ({deskripsi}) => {
    const [selectedContent, setSelectedContent] = useState("description");

    const handleContentChange = (content) => {
      setSelectedContent(content);
    };
  
    return (
      <div>
        <div>
          <button onClick={() => handleContentChange("description")}>Description</button>
          <button onClick={() => handleContentChange("box content")}>Box Content</button>
          <button onClick={() => handleContentChange("specs")}>Specs</button>
        </div>
        <div>
          {selectedContent === "description" && (
            <div>
              <h2>Description</h2>
              <div>{deskripsi}</div>
            </div>
          )}
          {selectedContent === "box content" && (
            <div>
              <h2>Box Content</h2>
              {/* Add your box content here */}
            </div>
          )}
          {selectedContent === "specs" && (
            <div>
              <h2>Specs</h2>
              {/* Add your specs content here */}
            </div>
          )}
        </div>
      </div>
    );
  }
  

