import React, { useEffect, useState, useRef } from "react";

// InfiniteSlider Component
const InfiniteSlider = ({ images, animTime = 20000 }) => {
  const sliderRef = useRef(null);
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [oldWidth, setOldWidth] = useState(0);
  const [start, setStart] = useState(0);
  const [stop, setStop] = useState(false);
  const [prevStop, setPrevStop] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [sliderContent, setSliderContent] = useState(images);

  useEffect(() => {
    const handleResize = () => {
      if (sliderRef.current) {
        setOldWidth(sliderRef.current.offsetWidth);
        setWidth(sliderRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const animate = () => {
      const minWidth = 2 * window.innerWidth;

      if (sliderRef.current) {
        while (width < minWidth) {
          setSliderContent((prevContent) => [...prevContent, ...images]);
          setWidth(sliderRef.current.offsetWidth);
        }
      }

      requestAnimationFrame(controlAnimation);
    };

    animate();
  }, [images, width]);

  const controlAnimation = (timestamp) => {
    if (stop) {
      if (!prevStop) {
        sliderRef.current.style.marginLeft = getComputedStyle(sliderRef.current).marginLeft;
        setPrevStop(true);
        setStart(timestamp);
      }
    } else if (!stop && prevStop) {
      setPrevStop(false);
      setStart((start) => start + (timestamp - start));
    } else {
      if (refresh >= 1) {
        setStart(timestamp);
        sliderRef.current.style.marginLeft = 0;
        setRefresh(0);
        requestAnimationFrame(controlAnimation);
        return;
      }

      if (timestamp - start >= animTime) {
        setRefresh(1);
      }

      const perc = ((timestamp - start) / animTime) * oldWidth;
      sliderRef.current.style.marginLeft = `${-perc}px`;
    }
    requestAnimationFrame(controlAnimation);
  };

  const handleMouseEnter = () => {
    setStop(true);
  };

  const handleMouseLeave = () => {
    setStop(false);
  };

  return (
    <div
      ref={containerRef}
      id="slider-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={sliderRef} className="slider">
        {sliderContent.map((src, index) => (
          <span key={index}>
            <img src={src} alt={`slider-img-${index}`} />
          </span>
        ))}
      </div>
    </div>
  );
};

export default InfiniteSlider;
