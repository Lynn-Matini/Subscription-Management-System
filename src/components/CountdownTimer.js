import React, { useState, useEffect } from 'react';

function CountdownTimer({ timeRemaining }) {
  const [countdown, setCountdown] = useState({
    months: 0,
    days: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!timeRemaining) return { months: 0, days: 0 };

      const secondsInDay = 86400;
      const secondsInMonth = secondsInDay * 30; // Approximate month as 30 days

      const months = Math.floor(timeRemaining / secondsInMonth);
      const days = Math.floor((timeRemaining % secondsInMonth) / secondsInDay);

      return {
        months,
        days
      };
    };

    setCountdown(calculateTimeLeft());

    const timer = setInterval(() => {
      setCountdown(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  return (
    <div className="countdown-timer">
      {countdown.months > 0 && (
        <div className="countdown-item">
          <span className="countdown-value">{countdown.months}</span>
          <span className="countdown-label">{countdown.months === 1 ? 'Month' : 'Months'}</span>
        </div>
      )}
      <div className="countdown-item">
        <span className="countdown-value">{countdown.days}</span>
        <span className="countdown-label">{countdown.days === 1 ? 'Day' : 'Days'}</span>
      </div>
    </div>
  );
}

export default CountdownTimer; 