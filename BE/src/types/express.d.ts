import type { IUser } from "../models/userModel.js";
import type { ISubscription } from "../models/subscriptionModel.js";

declare global {
	namespace Express {
		interface Request {
			user?: IUser;
			/** Attached by checkLimit / requireFeature middleware after validation. */
			subscription?: ISubscription;
		}
	}
}

export {};
