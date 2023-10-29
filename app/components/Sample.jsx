import React, { useState } from 'react';



const ImageGallery = ({ productData }) => {
    const [selectedImage, setSelectedImage] = useState(productData.images.edges[0].node.src);
    const [startIndex, setStartIndex] = useState(0);
  
    const handleImageChange = (newImageSrc) => {
      setSelectedImage(newImageSrc);
    };
  
    const nextImages = () => {
      const nextStartIndex = startIndex + 4;
      if (nextStartIndex < productData.images.edges.length) {
        setStartIndex(nextStartIndex);
        handleImageChange(productData.images.edges[nextStartIndex].node.src);
      }
    };
  
    const previousImages = () => {
      const previousStartIndex = startIndex - 4;
      if (previousStartIndex >= 0) {
        setStartIndex(previousStartIndex);
        handleImageChange(productData.images.edges[previousStartIndex].node.src);
      }
    };
  
    const displayedImages = productData.images.edges.slice(startIndex, startIndex + 4);
  
    return (
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="md:w-2/3">
          <img src={selectedImage} alt="Product" className="w-full h-auto" />
        </div>
        <div className="md:w-1/3">
          <div className="grid grid-cols-4 gap-2">
            {displayedImages.map((image) => (
              <div
                key={image.node.id}
                onClick={() => handleImageChange(image.node.src)}
                className={`cursor-pointer transition-opacity duration-300 hover:opacity-75 ${selectedImage === image.node.src ? 'opacity-75' : 'opacity-100'}`}
              >
                <img src={image.node.src} alt="Product" className="w-full h-auto" />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {startIndex > 0 && (
              <button onClick={previousImages} className="text-blue-500 hover:text-blue-700">
                Previous
              </button>
            )}
            {startIndex + 4 < productData.images.edges.length && (
              <button onClick={nextImages} className="text-blue-500 hover:text-blue-700">
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

export default ImageGallery;