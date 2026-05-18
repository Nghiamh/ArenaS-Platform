import mongoose, { Document, Schema, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BookingSource = 'app' | 'phone' | 'direct';

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
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    source: { type: String, enum: ['app', 'phone', 'direct'], default: 'app' },
    tone: { type: String, enum: ['blue', 'violet', 'emerald', 'slate'], default: 'blue' },
  },
  { timestamps: true }
);

bookingSchema.index({ court_id: 1, date: 1 });
bookingSchema.index({ user_id: 1 });

export const BookingModel = mongoose.model<IBooking>('Booking', bookingSchema);
