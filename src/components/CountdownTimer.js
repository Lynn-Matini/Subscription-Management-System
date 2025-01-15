import React, { useState, useEffect } from 'react';

function CountdownTimer({ timeRemaining }) {
  const [countdown, setCountdown] = useState({
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const secondsLeft = Math.max(0, timeRemaining);
      
      const months = Math.floor(secondsLeft / (30 * 24 * 60 * 60));
      const days = Math.floor((secondsLeft % (30 * 24 * 60 * 60)) / (24 * 60 * 60));
      const hours = Math.floor((secondsLeft % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((secondsLeft % (60 * 60)) / 60);
      const seconds = Math.floor(secondsLeft % 60);

      return { months, days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);

    setCountdown(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [timeRemaining]);

  return (
    <div className="countdown-timer">
      <div className="countdown-item">
        <span className="countdown-value">{countdown.months}</span>
        <span className="countdown-label">Months</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{countdown.days}</span>
        <span className="countdown-label">Days</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{countdown.hours}</span>
        <span className="countdown-label">Hours</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{countdown.minutes}</span>
        <span className="countdown-label">Min</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{countdown.seconds}</span>
        <span className="countdown-label">Sec</span>
      </div>
    </div>
  );
}

export default CountdownTimer; 