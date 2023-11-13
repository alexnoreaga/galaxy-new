import React, { useState } from 'react';


export const Carousel = ({ images }) => {

    console.log(images.nodes[0].fields[0].reference.image.url)

    const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.nodes.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.nodes.length) % images.nodes.length);
  };

  return (
    <>
    <div style={{ textAlign: 'center' }}>
      <button onClick={prevImage}>Previous</button>
      <img src={images.nodes[currentIndex].fields[0].reference.image.url} alt={`Image ${currentIndex + 1}`} style={{ maxWidth: '100%' }} />
      <button onClick={nextImage}>Next</button>
    </div>
    </>
  )
}
