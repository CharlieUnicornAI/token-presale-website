import React, { useState, useEffect } from "react";

const ProgressBar = ({ current, limit }) => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    if (current && limit) {
      const calculatedPercent = Math.min((current / limit) * 100, 100);
      setPercent(calculatedPercent);
    }
  }, [current, limit]);

  return (
    <div className="relative progress-container pt-1 w-[70%] ml-24 md:m-0 md:w-full">
      <div className="flex mb-2 items-center justify-between">
        <div className="w-full relative h-0">
          <span
            className="text-xs inline-block py-1 px-2 bg-gradient absolute progress-wrapper w-[100px] md:w-[150px] h-[30px] top-0 [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]"
            style={{ right: `${100 - percent}%` }}
          >
            <span className="absolute inset-[1px] bg-[#1C1C1C] opacity-90 font-semibold flex items-center justify-center [clip-path:polygon(0%_0.9em,_0.9em_0%,_100%_0%,_100%_calc(100%_-_0.9em),_calc(100%_-_0.9em)_100%,_0_100%)]">
              <span className="gradient-text text-xs md:text-sm">
                {current}
              </span>
            </span>
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-[#444444]">
        <div
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
