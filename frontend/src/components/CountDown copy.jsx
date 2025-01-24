import React, { useEffect, useState } from "react";

const CountdownTimer = () => {
  const targetDateKey = 'targetDate';
  const initialTargetDate = localStorage.getItem(targetDateKey) || getDefaultTargetDate();

  const [targetDate, setTargetDate] = useState(new Date(initialTargetDate));
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());

  // Calculate time remaining until the target date
  function calculateTimeRemaining() {
    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / (1000 * 60)) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  // Update time remaining every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Get default target date (14 days from now)
  function getDefaultTargetDate() {
    const defaultTarget = new Date();
    defaultTarget.setDate(defaultTarget.getDate() + 14); // Add 14 days to the current date
    return defaultTarget;
  }

  // Save target date to local storage
  useEffect(() => {
    localStorage.setItem(targetDateKey, targetDate.toISOString());
  }, [targetDate]);
  return (
    <div className="timer" style={{ color: '#42423c',  }}>
       {timeRemaining.days} days {timeRemaining.hours} hours {timeRemaining.minutes} minutes {timeRemaining.seconds} seconds
      {/* {formatTime(hours)} : {formatTime(minutes)} : {formatTime(seconds)} */}
      {/* Time Remaining: {timeRemaining.days} days, {timeRemaining.hours} hours, {timeRemaining.minutes} minutes, {timeRemaining.seconds} seconds */}
    </div>
  );
};

export default CountdownTimer;
