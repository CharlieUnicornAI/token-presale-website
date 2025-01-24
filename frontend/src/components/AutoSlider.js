import React, { useState, useEffect } from 'react';

const images = [
  // require('./../assets/RMupdate.jpg'),
  require('./../assets/1.png'),
  require('./../assets/2.png'),
  require('./../assets/3.png'),
  require('./../assets/4.png'),
  require('./../assets/uniswap8205.png'),
  // require('./../assets/images/logo5.png')/
];

function AutoSlider({ interval = 3000, visibleCount = 5 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setCurrent(prevCurrent => (prevCurrent + 1) % images.length);
    }, interval);
    return () => clearTimeout(id);
  }, [current, interval]);

  const displayImages = () => {
    let itemsToDisplay = [];
    for (let i = 0; i < visibleCount; i++) {
      let index = (current + i) % images.length; // Wrap around the images array
      itemsToDisplay.push(images[index]);
    }
    return itemsToDisplay;
  };

  return (
    <div className="listing ">
      {displayImages().map((img, index) => (
        <img key={index} src={img} alt='' className='w-full h-full'/>
      ))}
    </div>
  );
}

export default AutoSlider;
