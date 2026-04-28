import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type CourtStatus = "available" | "closed" | "open";

export interface ICourtCoordinates {
	type: "Point";
	coordinates: [number, number];
}

export interface ICourt extends Document {
	owner_id: Types.ObjectId;
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates?: ICourtCoordinates;
	amenities: string[];
	images: string[];
	avg_rating: number;
	status: CourtStatus;
	createdAt?: Date;
	updatedAt?: Date;
}

interface ICourtModel extends Model<ICourt> {}

const courtCoordinatesSchema = new Schema<ICourtCoordinates>(
	{
		type: {
			type: String,
			required: true,
			default: "Point",
			enum: ["Point"],
		},
		coordinates: {
			type: [Number],
			required: true,
			validate: {
				validator(value: number[]) {
					return Array.isArray(value) && value.length === 2 && value.every((coordinate) => typeof coordinate === "number");
				},
				message: "coordinates must contain [longitude, latitude]",
			},
		},
	},
	{ _id: false }
);

const courtSchema = new Schema<ICourt, ICourtModel>(
	{
		owner_id: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: "User",
		},
		name: {
			type: String,
			required: true,
			trim: true,
		},
		sports: {
			type: [String],
			required: true,
			default: [],
			validate: {
				validator(value: string[]) {
					return Array.isArray(value) && value.length > 0;
				},
				message: "sports must contain at least one item",
			},
		},
		price_per_hour: {
			type: Number,
			required: true,
			min: 0,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
		coordinates: {
			type: courtCoordinatesSchema,
			required: false,
			default: undefined,
		},
		amenities: {
			type: [String],
			required: true,
			default: [],
		},
		images: {
			type: [String],
			required: true,
			default: [],
		},
		avg_rating: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
			max: 5,
		},
		status: {
			type: String,
			required: true,
			default: "available",
			enum: ["available", "closed", "open"],
		},
	},
	{
		timestamps: true,
		collection: "courts",
	}
);

courtSchema.index({ coordinates: "2dsphere" });
courtSchema.index({ owner_id: 1, name: 1 }, { unique: true });

const Court = mongoose.models.Court || mongoose.model<ICourt>("Court", courtSchema);

export default Court;