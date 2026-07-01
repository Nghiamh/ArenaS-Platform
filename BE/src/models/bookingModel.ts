import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'waiting_opponent' | 'confirmed' | 'cancelled' | 'completed';
export type BookingSource = 'app' | 'phone' | 'direct';

export interface IBookingParticipant {
  userId: Types.ObjectId;
  amount: number;
  status: 'paid' | 'unpaid' | 'refunded';
}

export interface IBooking extends Document {
  user_id?: Types.ObjectId; // Optional if booked by owner via phone/direct
  court_id: Types.ObjectId;
  sub_court_id: Types.ObjectId;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  customer_name: string;
  customer_phone?: string;
  note?: string;
  total_price: number;
  status: BookingStatus;
  source: BookingSource;
  tone?: 'blue' | 'violet' | 'emerald' | 'slate';
  match_id?: Types.ObjectId;
  participants?: IBookingParticipant[];
  opponent_deadline?: Date;
  voucher_id?: Types.ObjectId;
  voucher_code?: string;
  voucher_points_used?: number;
  voucher_discount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    court_id: { type: Schema.Types.ObjectId, ref: 'Court', required: true },
    sub_court_id: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    customer_name: { type: String, required: true },
    customer_phone: { type: String },
    note: { type: String },
    total_price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'waiting_opponent', 'confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    source: { type: String, enum: ['app', 'phone', 'direct'], default: 'app' },
    tone: { type: String, enum: ['blue', 'violet', 'emerald', 'slate'], default: 'blue' },
    match_id: { type: Schema.Types.ObjectId, ref: 'Match' },
    participants: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      amount: { type: Number, required: true },
      status: { type: String, enum: ['paid', 'unpaid', 'refunded'], default: 'unpaid' }
    }],
    opponent_deadline: { type: Date, required: false },
    voucher_id: { type: Schema.Types.ObjectId, ref: 'Voucher' },
    voucher_code: { type: String },
    voucher_points_used: { type: Number, default: 0 },
    voucher_discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookingSchema.index({ court_id: 1, date: 1 });
bookingSchema.index({ user_id: 1 });
// Used by matchmakingController.completeMatch and bookingController
bookingSchema.index({ match_id: 1 });
// Used by matchBookingTimeoutCron every minute — critical for performance
bookingSchema.index({ status: 1, opponent_deadline: 1 });
// Used by getOwnerBookings to filter by court
bookingSchema.index({ court_id: 1, status: 1 });

export const BookingModel = mongoose.model<IBooking>('Booking', bookingSchema);
