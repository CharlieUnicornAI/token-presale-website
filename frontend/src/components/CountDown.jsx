import React, { useState, useEffect } from "react";

const CountdownTimer = () => {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2024-11-29T18:00:00+01:00"); // 18:00 Europe time (CET)

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="timer-comp w-[90%] mx-auto md:w-full">
      <div className="flex flex-row gap-[4px] md:gap-4">
        <div className="flex items-center">
          <div className="_vale">
            <span className="gradient-text font-normal text-sm md:text-base">
              {countdown.days}
            </span>
          </div>
          <div className="_tag text-white text-xs md:text-base ml-2">Days</div>
        </div>
        <div className="flex items-center">
          <div className="_vale">
            <span className="gradient-text font-normal text-sm md:text-base">
              {countdown.hours}
            </span>
          </div>
          <div className="_tag text-white text-xs md:text-base ml-2">Hours</div>
        </div>
        <div className="flex items-center">
          <div className="_vale">
            <span className="gradient-text font-normal text-sm md:text-base">
              {countdown.minutes}
            </span>
          </div>
          <div className="_tag text-white text-xs md:text-base ml-2">
            Minutes
          </div>
        </div>
        <div className="flex items-center">
          <div className="_vale">
            <span className="gradient-text font-normal text-sm md:text-base">
              {countdown.seconds}
            </span>
          </div>
          <div className="_tag text-white text-xs md:text-base ml-2">
            Seconds
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
