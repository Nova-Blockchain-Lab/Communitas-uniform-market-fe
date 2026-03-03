export const getTimestampsForDay = (day: Date): number[] => {
  const timestamps: number[] = [];
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 0, 0, 0);
  for (let hour = new Date(start); hour <= end; hour.setHours(hour.getHours() + 1)) {
    timestamps.push(hour.getTime() / 1000);
  }
  return timestamps;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/** Get a Date rounded to the next whole hour, with optional offset */
export const getNextHour = (hourOffset = 0): Date => {
  const now = new Date();
  now.setHours(now.getHours() + hourOffset);
  now.setMinutes(0, 0, 0);
  return now;
};

/** Compute unix timestamps (seconds) for every hour in [startHour, endHour) across selected days */
export const computeHourTimestamps = (
  days: Date[],
  startHour: number,
  endHour: number
): number[] => {
  const now = Math.floor(Date.now() / 1000);
  const result: number[] = [];

  days.forEach((day) => {
    for (let h = startHour; h < endHour; h++) {
      const d = new Date(day);
      d.setHours(h, 0, 0, 0);
      const ts = Math.floor(d.getTime() / 1000);
      if (ts > now) {
        result.push(ts);
      }
    }
  });

  return Array.from(new Set(result)).sort((a, b) => a - b);
};
