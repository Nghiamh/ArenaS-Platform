import mongoose, { Document, Schema } from "mongoose";

export type NotificationType =
	| "owner_application_submitted"   // admin receives: user submitted owner application
	| "owner_application_approved"    // user receives: admin approved owner application
	| "owner_application_rejected"    // user receives: admin rejected owner application
	| "court_submitted"               // admin receives: owner submitted court for review
	| "court_approved"                // owner receives: admin approved their court
	| "court_rejected"                // owner receives: admin rejected their court
	| "deposit_received"              // user receives: wallet deposit confirmed
	| "subscription_activated"        // owner receives: subscription plan activated
	| "booking_created"               // owner receives: someone booked a court
	| "booking_cancelled";            // owner receives: someone cancelled a court

export interface INotification extends Document {
	recipientId?: mongoose.Types.ObjectId;  // specific user (null = target by role)
	recipientRole?: "admin" | "owner" | "user"; // role-wide notification
	type: NotificationType;
	title: string;
	message: string;
	read: boolean;
	link?: string;
	metadata?: Record<string, string>;
	createdAt: Date;
	updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
	{
		recipientId: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: false,
			index: true,
		},
		recipientRole: {
			type: String,
			required: false,
			enum: ["admin", "owner", "user"],
		},
		type: {
			type: String,
			required: true,
			enum: [
				"owner_application_submitted",
				"owner_application_approved",
				"owner_application_rejected",
				"court_submitted",
				"court_approved",
				"court_rejected",
				"deposit_received",
				"subscription_activated",
				"booking_created",
				"booking_cancelled",
			],
		},
		title: { type: String, required: true, trim: true },
		message: { type: String, required: true, trim: true },
		read: { type: Boolean, required: true, default: false },
		link: { type: String, required: false, trim: true },
		metadata: { type: Schema.Types.Mixed, required: false },
	},
	{ timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipientRole: 1, read: 1, createdAt: -1 });

const Notification =
	mongoose.models.Notification ||
	mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
