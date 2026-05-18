import mongoose, { Schema, Document } from 'mongoose';

export interface ICourtDashboard extends Document {
  court_id: mongoose.Types.ObjectId;
  sub_court_id: mongoose.Types.ObjectId;
  date: Date;
  total_slots: number;
  booked_slots: number;
  available_slots: number;
  blocked_slots: number;
  total_bookings: number;
  revenue: number;
  last_updated: Date;
}

const courtDashboardSchema = new Schema<ICourtDashboard>(
  {
    court_id: { 
      type: Schema.Types.ObjectId, 
      ref: 'Court', // Reference to the main Court model
      required: true 
    },
    sub_court_id: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
      // Note: This should ideally represent the start of the day (e.g., 00:00:00)
    },
    total_slots: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    booked_slots: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    available_slots: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    blocked_slots: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    total_bookings: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    revenue: { 
      type: Number, 
      required: true, 
      default: 0 
    },
  },
  {
    // Mongoose will automatically manage the last_updated field
    timestamps: {
      createdAt: false,
      updatedAt: 'last_updated',
    },
  }
);

// Compound index to ensure only one dashboard record per sub-court per day
// This makes queries for a specific day very fast and prevents duplicates
courtDashboardSchema.index({ court_id: 1, sub_court_id: 1, date: 1 }, { unique: true });

export const CourtDashboardModel = mongoose.model<ICourtDashboard>('CourtDashboard', courtDashboardSchema);
