export type CalComEventType = {
  id: number;
  title: string;
  slug?: string;
  lengthInMinutes?: number;
};

export type CalComSlot = {
  startTime: string;
  endTime?: string;
};

export type CalComBooking = {
  uid: string;
  start?: string;
  end?: string;
};
