import mongoose, { Schema, Document } from 'mongoose';

export type SlotStatus = 'available' | 'booked' | 'locked' | 'maintenance';

export interface ISlot {
  start: string; // Ví dụ: '06:00'
  end: string;   // Ví dụ: '06:30'
  status: SlotStatus;
  booking_id?: mongoose.Types.ObjectId;
  locked_by?: mongoose.Types.ObjectId;
  locked_at?: Date;
  reason?: string;
}

export interface ICourtSlot extends Document {
  court_id: mongoose.Types.ObjectId;
  sub_court_id: mongoose.Types.ObjectId;
  date: string; // Định dạng 'YYYY-MM-DD'
  slots: ISlot[];
}

const slotSchema = new Schema<ISlot>({
  start: { type: String, required: true },
  end: { type: String, required: true },
  status: { type: String, enum: ['available', 'booked', 'locked', 'maintenance'], default: 'available' },
  booking_id: { type: Schema.Types.ObjectId, ref: 'Booking' }, // Có thể ref tới model Booking sau này
  locked_by: { type: Schema.Types.ObjectId, ref: 'User' },
  locked_at: { type: Date },
  reason: { type: String },
}, { _id: false });

const courtSlotSchema = new Schema<ICourtSlot>({
  court_id: { type: Schema.Types.ObjectId, ref: 'Court', required: true },
  sub_court_id: { type: Schema.Types.ObjectId, required: true },
  date: { type: String, required: true },
  slots: [slotSchema],
});

// Composite index để query nhanh và đảm bảo một sân nhỏ trong 1 ngày chỉ có 1 danh sách slot
courtSlotSchema.index({ court_id: 1, sub_court_id: 1, date: 1 }, { unique: true });

export const CourtSlotModel = mongoose.model<ICourtSlot>('CourtSlot', courtSlotSchema);
