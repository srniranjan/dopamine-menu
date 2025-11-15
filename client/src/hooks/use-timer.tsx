import { useState, useEffect, useRef } from "react";

export function useTimer() {
  const [time, setTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, time]);

  const start = () => {
    if (time > 0) {
      setIsRunning(true);
    }
  };

  const pause = () => {
    setIsRunning(false);
  };

  const stop = () => {
    setIsRunning(false);
    setTime(0);
  };

  const resetTimer = (newTime: number) => {
    setIsRunning(false);
    setTime(newTime);
  };

  return {
    time,
    isRunning,
    start,
    pause,
    stop,
    setTime: resetTimer,
  };
}
