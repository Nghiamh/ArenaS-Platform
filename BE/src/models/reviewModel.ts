import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReview extends Document {
  user_id: Types.ObjectId;
  court_id: Types.ObjectId;
  rating: number; // 1-5
  comment?: string;
  user_name: string;
  user_avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    court_id: { type: Schema.Types.ObjectId, ref: 'Court', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
    user_name: { type: String, required: true },
    user_avatar: { type: String },
  },
  { timestamps: true }
);

// Một user chỉ được review 1 sân 1 lần
reviewSchema.index({ user_id: 1, court_id: 1 }, { unique: true });
reviewSchema.index({ court_id: 1, createdAt: -1 });

export const ReviewModel = mongoose.model<IReview>('Review', reviewSchema);
