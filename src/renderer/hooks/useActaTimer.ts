// useActaTimer - Hook for managing acta timer state
// Handles start time, end time, current time updates

import { useState, useEffect } from 'react';

export function useActaTimer(initialStartTime: Date | null = null, initialEndTime: Date | null = null) {
  const [startTime, setStartTime] = useState<Date | null>(initialStartTime);
  const [endTime, setEndTime] = useState<Date | null>(initialEndTime);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Update current time every second when timer is active
  useEffect(() => {
    if (startTime && !endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  const startTimer = () => {
    const now = new Date();
    setStartTime(now);
    setCurrentTime(now);
  };

  const stopTimer = () => {
    const now = new Date();
    setEndTime(now);
  };

  const resetTimer = () => {
    setStartTime(null);
    setEndTime(null);
    setCurrentTime(new Date());
  };

  return {
    startTime,
    endTime,
    currentTime,
    startTimer,
    stopTimer,
    resetTimer,
    setStartTime,
    setEndTime,
    setCurrentTime,
  };
}
