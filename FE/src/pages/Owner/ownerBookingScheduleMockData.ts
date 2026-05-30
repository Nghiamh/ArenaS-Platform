export type BookingTone = 'blue' | 'violet' | 'emerald' | 'slate';

export type BookingBlock = {
  customer: string;
  startHour: number;
  endHour: number;
  tone: BookingTone;
  note?: string;
};

export type CourtSchedule = {
  name: string;
  capacity: string;
  price: string;
  open: boolean;
  bookings: BookingBlock[];
};

export type WeekBookingBlock = BookingBlock & {
  dayIndex: number;
};

export type WeekCourtSchedule = CourtSchedule & {
  bookingsByDay: Record<number, WeekBookingBlock[]>;
};

export type FacilitySchedule = {
  name: string;
  location: string;
  accent: BookingTone;
  bookingCount: number;
  courts: CourtSchedule[];
};

export type WeekFacilitySchedule = Omit<FacilitySchedule, 'courts'> & {
  courts: WeekCourtSchedule[];
};

export const bookingHours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

export const bookingFilters = {
  facilities: ['Tất cả cơ sở', 'Champions Arena', 'Elite Football Complex', 'Victory Stadium'],
  statuses: ['Tất cả trạng thái', 'Đã xác nhận', 'Chờ thanh toán', 'Đã hoàn tất'],
};

export const bookingScheduleFacilities: FacilitySchedule[] = [
  {
    name: 'Champions Arena',
    location: 'Q. Bình Thạnh, TP. HCM',
    accent: 'blue',
    bookingCount: 3,
    courts: [
      {
        name: 'Sân A',
        capacity: '7 Người · 450K/giờ',
        price: '450K',
        open: true,
        bookings: [
          {
            customer: 'Nguyễn Văn An',
            startHour: 17,
            endHour: 19,
            tone: 'blue',
          },
        ],
      },
      {
        name: 'Sân B',
        capacity: '7 Người · 450K/giờ',
        price: '450K',
        open: true,
        bookings: [
          {
            customer: 'Trần ...',
            startHour: 19,
            endHour: 20,
            tone: 'blue',
            note: '19:00 - ...',
          },
        ],
      },
      {
        name: 'Sân C',
        capacity: '5 Người · 320K/giờ',
        price: '320K',
        open: true,
        bookings: [
          {
            customer: 'Phạm Thu Hà',
            startHour: 8,
            endHour: 10,
            tone: 'blue',
          },
        ],
      },
    ],
  },
  {
    name: 'Elite Football Complex',
    location: 'Q. 7, TP. HCM',
    accent: 'violet',
    bookingCount: 1,
    courts: [
      {
        name: 'Sân 1',
        capacity: '5 Người · 350K/giờ',
        price: '350K',
        open: true,
        bookings: [
          {
            customer: 'Lê Minh Cường',
            startHour: 15,
            endHour: 17,
            tone: 'violet',
          },
        ],
      },
      {
        name: 'Sân 2',
        capacity: '5 Người · 350K/giờ',
        price: '350K',
        open: true,
        bookings: [],
      },
      {
        name: 'Sân 3',
        capacity: '7 Người · 430K/giờ',
        price: '430K',
        open: false,
        bookings: [],
      },
    ],
  },
  {
    name: 'Victory Stadium',
    location: 'Q. 9, TP. HCM',
    accent: 'emerald',
    bookingCount: 1,
    courts: [
      {
        name: 'Sân 1',
        capacity: '7 Người · 500K/giờ',
        price: '500K',
        open: true,
        bookings: [],
      },
      {
        name: 'Sân 2',
        capacity: '7 Người · 500K/giờ',
        price: '500K',
        open: true,
        bookings: [],
      },
    ],
  },
];

export const bookingWeekDays = [
  { key: 'mon', label: 'T2', date: 2, total: 5 },
  { key: 'tue', label: 'T3', date: 3, total: 3 },
  { key: 'wed', label: 'T4', date: 4, total: 1 },
  { key: 'thu', label: 'T5', date: 5, total: 2 },
  { key: 'fri', label: 'T6', date: 6, total: 2 },
  { key: 'sat', label: 'T7', date: 7, total: 1 },
  { key: 'sun', label: 'CN', date: 8, total: 0 },
];

export const bookingWeekScheduleFacilities: WeekFacilitySchedule[] = [
  {
    name: 'Champions Arena',
    location: 'Q. Bình Thạnh, TP. HCM',
    accent: 'blue',
    bookingCount: 3,
    courts: [
      {
        name: 'Sân A',
        capacity: '7 Người',
        price: '450K',
        open: true,
        bookings: [],
        bookingsByDay: {
          0: [{ customer: 'An', startHour: 17, endHour: 19, tone: 'blue', dayIndex: 0 }],
          1: [{ customer: 'Bảo', startHour: 14, endHour: 17, tone: 'blue', dayIndex: 1 }],
          4: [{ customer: 'Sơn', startHour: 8, endHour: 10, tone: 'blue', dayIndex: 4 }],
        },
      },
      {
        name: 'Sân B',
        capacity: '7 Người',
        price: '450K',
        open: true,
        bookings: [],
        bookingsByDay: {
          0: [{ customer: 'Bình', startHour: 19, endHour: 20, tone: 'blue', dayIndex: 0 }],
          2: [{ customer: 'Hùng', startHour: 17, endHour: 19, tone: 'blue', dayIndex: 2 }],
        },
      },
      {
        name: 'Sân C',
        capacity: '5 Người',
        price: '320K',
        open: true,
        bookings: [],
        bookingsByDay: {
          0: [{ customer: 'Hà', startHour: 8, endHour: 10, tone: 'blue', dayIndex: 0 }],
          3: [{ customer: 'Mai', startHour: 9, endHour: 10, tone: 'blue', dayIndex: 3 }],
        },
      },
    ],
  },
  {
    name: 'Elite Football Complex',
    location: 'Q. 7, TP. HCM',
    accent: 'violet',
    bookingCount: 1,
    courts: [
      {
        name: 'Sân 1',
        capacity: '5 Người',
        price: '350K',
        open: true,
        bookings: [],
        bookingsByDay: {
          0: [{ customer: 'Cường', startHour: 15, endHour: 17, tone: 'violet', dayIndex: 0 }],
        },
      },
      {
        name: 'Sân 2',
        capacity: '5 Người',
        price: '350K',
        open: true,
        bookings: [],
        bookingsByDay: {
          1: [{ customer: 'Tùng', startHour: 8, endHour: 10, tone: 'violet', dayIndex: 1 }],
          4: [{ customer: 'Phong', startHour: 19, endHour: 21, tone: 'violet', dayIndex: 4 }],
        },
      },
      {
        name: 'Sân 3',
        capacity: '7 Người',
        price: '430K',
        open: false,
        bookings: [],
        bookingsByDay: {},
      },
    ],
  },
  {
    name: 'Victory Stadium',
    location: 'Q. 9, TP. HCM',
    accent: 'emerald',
    bookingCount: 1,
    courts: [
      {
        name: 'Sân Chính',
        capacity: '11 Người',
        price: '600K',
        open: true,
        bookings: [],
        bookingsByDay: {
          0: [{ customer: 'Long', startHour: 16, endHour: 18, tone: 'emerald', dayIndex: 0 }],
          2: [{ customer: 'Đức', startHour: 14, endHour: 16, tone: 'emerald', dayIndex: 2 }],
        },
      },
    ],
  },
];