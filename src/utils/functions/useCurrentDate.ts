import { useState, useEffect } from 'react';

interface CurrentDateReturn {
  dayAndMonth: string;
  greeting: string;
}

/**
 * Hook that returns the current day/month and a time-based greeting.
 * @returns Object with dayAndMonth and greeting properties
 */
export function useCurrentDate(): CurrentDateReturn {
  const [dateInfo, setDateInfo] = useState<CurrentDateReturn>({
    dayAndMonth: '',
    greeting: '',
  });

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();

      // Format: "tuesday, Oct 6"
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const month = now.toLocaleDateString('en-US', { month: 'short' });
      const date = now.getDate();
      const dayAndMonth = `${dayName}, ${month} ${date}`;

      // Determine greeting based on current hour
      const hour = now.getHours();
      let greeting: string;

      if (hour >= 5 && hour < 12) {
        greeting = 'Good morning';
      } else if (hour >= 12 && hour < 17) {
        greeting = 'Good afternoon';
      } else {
        greeting = 'Good evening';
      }

      setDateInfo({ dayAndMonth, greeting });
    };

    // Initial update
    updateDate();

    // Update when time changes (minute boundary)
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeoutId = setTimeout(() => {
      updateDate();
      // Then set interval for every minute
      const intervalId = setInterval(updateDate, 60000);
      return () => clearInterval(intervalId);
    }, msUntilNextMinute);

    return () => clearTimeout(timeoutId);
  }, []);

  return dateInfo;
}
