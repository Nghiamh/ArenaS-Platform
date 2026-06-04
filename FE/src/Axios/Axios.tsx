import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const axiosClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor: attach Authorization header when a valid access token exists
axiosClient.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken')?.trim();

	if (token && token !== 'undefined' && token !== 'null') {
		config.headers = config.headers ?? {};
		(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	return config;
});

// Response interceptor: on 401 clear stored auth and notify UI so it stops making protected requests
axiosClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			try {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('currentUser');
				window.dispatchEvent(new Event('currentUserUpdated'));
			} catch {
				// ignore
			}
		}

		return Promise.reject(error);
	}
);

export type AuthUser = {
	id: string;
	name: string;
	dateOfBirth?: string;
	avatarUrl?: string;
	email: string;
	phone?: string;
	address?: string;
	userName: string;
	role: 'user' | 'owner' | 'admin';
	createdAt: string;
};

export type AuthResponse = {
	message: string;
	token: string;
	redirectPath: string;
	user: AuthUser;
};

export type LoginPayload = {
	identifier: string;
	password: string;
};

export type RegisterPayload = {
	name?: string;
	email: string;
	phone?: string;
	userName: string;
	password: string;
};

export type GoogleLoginPayload = {
	code: string;
};

export type ForgotPasswordPayload = {
	email: string;
};

export type ResetPasswordPayload = {
	token: string;
	password: string;
};

export type BasicMessageResponse = {
	message: string;
};

export type ProfileResponse = {
	message: string;
	user: AuthUser;
};

export type UpdateProfilePayload = {
	name?: string;
	phone?: string;
	dateOfBirth?: string;
	avatarUrl?: string;
	address?: string;
};

export type UserSkill = {
	id: string;
	sport: string;
	note?: string;
	level: number;
	play_frequency?: number;
	play_vibe?: "casual" | "balanced" | "competitive";
	rating_score: number;
	createdAt?: string;
	updatedAt?: string;
};

export type UserSkillsResponse = {
	message: string;
	skills: UserSkill[];
};

export type UserSkillResponse = {
	message: string;
	skill: UserSkill;
};

export type UserSkillPayload = {
	sport: string;
	note?: string;
	level: number;
	rating_score: number;
	play_frequency?: number;
	play_vibe?: string;
};

type ApiErrorPayload = {
	message?: string;
	error?: string;
};

function toErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError<ApiErrorPayload>;
		return axiosError.response?.data?.message ?? axiosError.response?.data?.error ?? 'Request failed';
	}

	return error instanceof Error ? error.message : 'Unexpected error';
}

function getValidAccessToken(): string | null {
	const token = localStorage.getItem('accessToken')?.trim();

	if (!token || token === 'undefined' || token === 'null') {
		return null;
	}

	return token;
}

function requireAccessToken(): string {
	const accessToken = getValidAccessToken();

	if (!accessToken) {
		throw new Error('missing_token');
	}

	return accessToken;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
	try {
		const { data } = await axiosClient.post<AuthResponse>('/auth/login', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
	try {
		const { data } = await axiosClient.post<AuthResponse>('/auth/register', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function loginWithGoogle(payload: GoogleLoginPayload): Promise<AuthResponse> {
	try {
		const { data } = await axiosClient.post<AuthResponse>('/auth/google', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type VerifyEmailPayload = {
	token: string;
};

export async function verifyEmail(payload: VerifyEmailPayload): Promise<BasicMessageResponse> {
	try {
		const { data } = await axiosClient.post<BasicMessageResponse>('/auth/verify-email', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<BasicMessageResponse> {
	try {
		const { data } = await axiosClient.post<BasicMessageResponse>('/auth/forgot-password', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<BasicMessageResponse> {
	try {
		const { data } = await axiosClient.post<BasicMessageResponse>('/auth/reset-password', payload);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getCurrentUserProfile(): Promise<ProfileResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.get<ProfileResponse>('/profile/me', {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function updateCurrentUserProfile(
	payload: UpdateProfilePayload,
): Promise<ProfileResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.put<ProfileResponse>('/profile/me', payload, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getCurrentUserSkills(): Promise<UserSkillsResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.get<UserSkillsResponse>('/profile/skills', {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function createCurrentUserSkill(payload: UserSkillPayload): Promise<UserSkillResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.post<UserSkillResponse>('/profile/skills', payload, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function updateCurrentUserSkill(
	skillId: string,
	payload: UserSkillPayload,
): Promise<UserSkillResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.put<UserSkillResponse>(`/profile/skills/${skillId}`, payload, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function deleteCurrentUserSkill(skillId: string): Promise<BasicMessageResponse> {
	try {
		const accessToken = requireAccessToken();

		const { data } = await axiosClient.delete<BasicMessageResponse>(`/profile/skills/${skillId}`, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type OwnerCourtStatus = 'available' | 'closed' | 'open' | 'pending';

export type OwnerCourtCoordinates = {
	latitude: number;
	longitude: number;
};

export type SubCourtType = 'football_5' | 'football_7' | 'badminton' | 'tennis' | 'pickleball' | 'other';

export type SubCourtStatus = 'open' | 'closed';

export type SubCourt = {
	_id?: string;
	name: string;
	type: SubCourtType;
	surface?: string;
	price_per_hour: number;
	status: SubCourtStatus;
};

export type OwnerCourt = {
	id: string;
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	amenities: string[];
	images: string[];
	open_time?: string;
	close_time?: string;
	avg_rating: number;
	status: OwnerCourtStatus;
	number_of_courts: number;
	sub_courts: SubCourt[];
	createdAt?: string;
	updatedAt?: string;
};

export type OwnerCourtPayload = {
	name: string;
	sports: string[];
	price_per_hour: number;
	location: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	amenities: string[];
	images: string[];
	open_time?: string;
	close_time?: string;
	status: OwnerCourtStatus;
	sub_courts: Array<{
		name: string;
		type: SubCourtType;
		surface?: string;
		price_per_hour: number;
		status: SubCourtStatus;
	}>;
};

export type PublicCourt = OwnerCourt;

type PublicCourtsResponse = {
	message: string;
	courts: PublicCourt[];
};

type OwnerCourtsResponse = {
	message: string;
	courts: OwnerCourt[];
};

type OwnerCourtResponse = {
	message: string;
	court: OwnerCourt;
};

function withAuthHeaders() {
	const accessToken = requireAccessToken();
	return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
}

export async function getOwnerCourts(): Promise<OwnerCourt[]> {
	try {
		const { data } = await axiosClient.get<OwnerCourtsResponse>('/owner/courts', {
			headers: withAuthHeaders(),
		});

		return data.courts;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// ADMIN — COURT MANAGEMENT
// ---------------------------------------------------------------------------

export type AdminCourt = OwnerCourt & {
	owner_id: string;
};

type AdminCourtsResponse = {
	message: string;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	courts: AdminCourt[];
};

type AdminCourtResponse = {
	message: string;
	court: AdminCourt;
};

export async function adminGetAllCourts(params?: {
	status?: string;
	sport?: string;
	keyword?: string;
	page?: number;
	limit?: number;
}): Promise<{ courts: AdminCourt[]; total: number; totalPages: number }> {
	try {
		const { data } = await axiosClient.get<AdminCourtsResponse>('/admin/courts', {
			headers: withAuthHeaders(),
			params,
		});
		return { courts: data.courts, total: data.total, totalPages: data.totalPages };
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminApproveCourt(courtId: string): Promise<AdminCourt> {
	try {
		const { data } = await axiosClient.post<AdminCourtResponse>(
			`/admin/courts/${courtId}/approve`,
			{},
			{ headers: withAuthHeaders() },
		);
		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminRejectCourt(courtId: string): Promise<AdminCourt> {
	try {
		const { data } = await axiosClient.post<AdminCourtResponse>(
			`/admin/courts/${courtId}/reject`,
			{},
			{ headers: withAuthHeaders() },
		);
		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminUpdateCourtStatus(
	courtId: string,
	status: 'available' | 'closed' | 'pending',
): Promise<AdminCourt> {
	try {
		const { data } = await axiosClient.put<AdminCourtResponse>(
			`/admin/courts/${courtId}/status`,
			{ status },
			{ headers: withAuthHeaders() },
		);
		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// ADMIN — INCOME MANAGEMENT
// ---------------------------------------------------------------------------

export type AdminIncomeType = 'deposit' | 'subscription';

export type AdminIncomeEntry = {
	id: string;
	type: AdminIncomeType;
	amount: number;
	userName: string;
	userEmail: string;
	description: string;
	transferCode?: string;
	createdAt: string;
};

export type AdminIncomeSummary = {
	totalRevenue: number;
	depositTotal: number;
	depositCount: number;
	subscriptionTotal: number;
	subscriptionCount: number;
	thisMonthRevenue: number;
	lastMonthRevenue: number;
};

export type AdminIncomeResponse = {
	message: string;
	summary: AdminIncomeSummary;
	total: number;
	page: number;
	limit: number;
	totalPages: number;
	items: AdminIncomeEntry[];
};

export async function adminGetIncome(params?: {
	type?: 'all' | AdminIncomeType;
	page?: number;
	limit?: number;
	dateFrom?: string;
	dateTo?: string;
}): Promise<AdminIncomeResponse> {
	try {
		const { data } = await axiosClient.get<AdminIncomeResponse>('/admin/income', {
			headers: withAuthHeaders(),
			params,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// ADMIN — USER MANAGEMENT
// ---------------------------------------------------------------------------

export type AdminUserRole = 'user' | 'owner' | 'admin';

export type AdminUser = {
	_id: string;
	name?: string;
	userName: string;
	email: string;
	phone?: string;
	address?: string;
	avatarUrl?: string;
	role: AdminUserRole;
	isBanned?: boolean;
	authProvider: 'local' | 'google';
	xp?: number;
	points?: number;
	reliability_score?: number;
	completed_matches_count?: number;
	canceled_matches_count?: number;
	createdAt: string;
	updatedAt: string;
};

type AdminUsersResponse = {
	message: string;
	users: AdminUser[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

type AdminUserResponse = {
	message: string;
	user: AdminUser;
};

export type AdminGetUsersParams = {
	keyword?: string;
	role?: 'all' | AdminUserRole;
	status?: 'all' | 'active' | 'banned';
	page?: number;
	limit?: number;
};

export type AdminCreateUserPayload = {
	name: string;
	email: string;
	userName: string;
	password: string;
	phone?: string;
	role?: AdminUserRole;
};

export type AdminUpdateUserPayload = {
	name?: string;
	phone?: string;
	address?: string;
	role?: AdminUserRole;
	isBanned?: boolean;
	password?: string;
};

export async function adminGetAllUsers(
	params?: AdminGetUsersParams,
): Promise<{ users: AdminUser[]; total: number; totalPages: number; page: number }> {
	try {
		const { data } = await axiosClient.get<AdminUsersResponse>('/admin/users', {
			headers: withAuthHeaders(),
			params,
		});
		return { users: data.users, total: data.total, totalPages: data.totalPages, page: data.page };
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminCreateUserAccount(payload: AdminCreateUserPayload): Promise<AdminUser> {
	try {
		const { data } = await axiosClient.post<AdminUserResponse>('/admin/users', payload, {
			headers: withAuthHeaders(),
		});
		return data.user;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminUpdateUserAccount(
	userId: string,
	payload: AdminUpdateUserPayload,
): Promise<AdminUser> {
	try {
		const { data } = await axiosClient.put<AdminUserResponse>(`/admin/users/${userId}`, payload, {
			headers: withAuthHeaders(),
		});
		return data.user;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminDeleteUserAccount(userId: string): Promise<{ message: string }> {
	try {
		const { data } = await axiosClient.delete<{ message: string }>(`/admin/users/${userId}`, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getPublicCourts(params?: { sport?: string }): Promise<PublicCourt[]> {
	try {
		const { data } = await axiosClient.get<PublicCourtsResponse>('/courts/public', {
			params,
		});

		return data.courts;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getPublicCourtById(courtId: string): Promise<PublicCourt> {
	try {
		const { data } = await axiosClient.get<{ message: string; court: PublicCourt }>(`/courts/public/${courtId}`);
		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getOwnerCourtById(courtId: string): Promise<OwnerCourt> {
	try {
		const { data } = await axiosClient.get<OwnerCourtResponse>(`/owner/courts/${courtId}`, {
			headers: withAuthHeaders(),
		});

		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function createOwnerCourt(payload: OwnerCourtPayload): Promise<OwnerCourt> {
	try {
		const { data } = await axiosClient.post<OwnerCourtResponse>('/owner/courts', payload, {
			headers: withAuthHeaders(),
		});

		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function updateOwnerCourt(courtId: string, payload: OwnerCourtPayload): Promise<OwnerCourt> {
	try {
		const { data } = await axiosClient.put<OwnerCourtResponse>(`/owner/courts/${courtId}`, payload, {
			headers: withAuthHeaders(),
		});

		return data.court;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function deleteOwnerCourt(courtId: string): Promise<BasicMessageResponse> {
	try {
		const { data } = await axiosClient.delete<BasicMessageResponse>(`/owner/courts/${courtId}`, {
			headers: withAuthHeaders(),
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// COURT DASHBOARD / STATS / REVENUE
// ---------------------------------------------------------------------------

export type OwnerRevenueResponse = {
	today: number;
	todayTrend: number;
	week: number;
	weekTrend: number;
	month: number;
	monthTrend: number;
};

export async function getOwnerRevenue(): Promise<OwnerRevenueResponse> {
	try {
		const { data } = await axiosClient.get<OwnerRevenueResponse>('/wallet/revenue', {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type CourtDashboard = {
	_id: string;
	court_id: string;
	sub_court_id: string;
	date: string;
	total_slots: number;
	booked_slots: number;
	available_slots: number;
	blocked_slots: number;
	total_bookings: number;
	revenue: number;
	last_updated: string;
};

// Booking APIs
export type CourtSlotStatus = 'available' | 'booked' | 'locked';

export type CourtSlotDetail = {
	start: string;
	end: string;
	status: CourtSlotStatus;
	booking_id?: string;
};

export type CourtSlotData = {
	_id: string;
	court_id: string;
	sub_court_id: string;
	date: string;
	slots: CourtSlotDetail[];
};

export async function getCourtSlots(courtId: string, date: string): Promise<CourtSlotData[]> {
	try {
		const { data } = await axiosClient.get<CourtSlotData[]>(`/bookings/slots/${courtId}`, {
			params: { date },
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getCourtDashboard(courtId: string, date?: string): Promise<CourtDashboard[]> {
	try {
		const { data } = await axiosClient.get<CourtDashboard[]>(`/dashboard/${courtId}`, {
			headers: withAuthHeaders(),
			params: { date },
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function seedCourtDashboardData(courtId: string, payload?: Partial<CourtDashboard>): Promise<{ message: string, dashboard: CourtDashboard }> {
	try {
		const { data } = await axiosClient.post<{ message: string, dashboard: CourtDashboard }>(`/dashboard/${courtId}/seed`, payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type OwnerBooking = {
	_id: string;
	court_id: string;
	sub_court_id: string;
	date: string;
	start_time: string;
	end_time: string;
	customer_name: string;
	customer_phone?: string;
	note?: string;
	total_price: number;
	status: string;
	source: string;
	tone: 'blue' | 'violet' | 'emerald' | 'slate';
	createdAt: string;
};

export async function getOwnerBookings(params?: { startDate?: string; endDate?: string }): Promise<OwnerBooking[]> {
	try {
		const { data } = await axiosClient.get<{ message: string; bookings: OwnerBooking[] }>('/bookings/owner-bookings', {
			headers: withAuthHeaders(),
			params,
		});
		return data.bookings;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type OwnerListBookingsResponse = {
	message: string;
	bookings: OwnerBooking[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export async function getOwnerListBookings(params?: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<OwnerListBookingsResponse> {
	try {
		const { data } = await axiosClient.get<OwnerListBookingsResponse>('/bookings/owner-list-bookings', {
			headers: withAuthHeaders(),
			params,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type CreateOwnerBookingPayload = {
	court_id: string;
	sub_court_id: string;
	date: string;
	start_time: string;
	end_time: string;
	customer_name: string;
	customer_phone?: string;
	note?: string;
	status?: string;
	source?: string;
	tone?: string;
};

export async function createOwnerBooking(payload: CreateOwnerBookingPayload): Promise<OwnerBooking> {
	try {
		const { data } = await axiosClient.post<{ message: string; booking: OwnerBooking }>('/bookings/owner-bookings', payload, {
			headers: withAuthHeaders(),
		});
		return data.booking;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// PRICING PLANS
// ---------------------------------------------------------------------------

export type FEPlan = {
	_id: string;
	name: string;
	displayName: string;
	description: string;
	pricing: {
		monthly: number;
		yearly: number;
	};
	features: {
		max_locations: number;
		max_courts: number;
		max_bookings_per_month: number;
		online_booking: boolean;
		ai_matchmaking: boolean;
		api_integration: boolean;
		analytics_dashboard: boolean;
		priority_support: boolean;
		custom_branding: boolean;
	};
	isCustom: boolean;
	isActive: boolean;
	sortOrder: number;
	createdAt?: string;
	updatedAt?: string;
};

export type PricingPlansResponse = {
	success: boolean;
	count: number;
	plans: FEPlan[];
};

export async function getPricingPlans(): Promise<FEPlan[]> {
	try {
		const { data } = await axiosClient.get<PricingPlansResponse>('/plans');
		return data.plans;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// SUBSCRIPTIONS
// ---------------------------------------------------------------------------

export type FESubscription = {
	id: string;
	plan: {
		_id: string;
		name: string;
		displayName: string;
		description: string;
		sortOrder?: number;
	};
	billingCycle: 'monthly' | 'yearly';
	status: 'active' | 'expired' | 'cancelled';
	startDate: string;
	endDate: string;
	amountPaid: number;
	currentFeatures: FEPlan['features'];
	daysRemaining: number;
};

export type CheckoutResponse = {
	success: boolean;
	message: string;
	isFree?: boolean;
	checkout: {
		paymentCode: string;
		qrUrl: string;
		amount: number;
		basePrice: number;
		unusedCredit: number;
		isUpgrade: boolean;
		billingCycle: 'monthly' | 'yearly';
		plan: {
			id: string;
			name: string;
			displayName: string;
		};
		expiresAt: string;
	};
};

export type MySubscriptionResponse = {
	success: boolean;
	message: string;
	subscription: FESubscription;
};

export async function createSubscriptionCheckout(
	planId: string,
	billingCycle: 'monthly' | 'yearly',
): Promise<CheckoutResponse> {
	try {
		const { data } = await axiosClient.post<CheckoutResponse>('/subscriptions/checkout', {
			planId,
			billingCycle,
		}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMySubscription(): Promise<FESubscription> {
	try {
		const { data } = await axiosClient.get<MySubscriptionResponse>('/subscriptions/me', {
			headers: withAuthHeaders(),
		});
		return data.subscription;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function cancelMySubscription(): Promise<BasicMessageResponse> {
	try {
		const { data } = await axiosClient.delete<BasicMessageResponse>('/subscriptions/me', {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getSubscriptionCheckoutStatus(
	paymentCode: string,
): Promise<{ success: boolean; status: 'pending' | 'completed' | 'expired' }> {
	try {
		const { data } = await axiosClient.get<{ success: boolean; status: 'pending' | 'completed' | 'expired' }>(
			`/subscriptions/checkout-status/${paymentCode}`,
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}



export type MyStatusSubscriptionResponse = {
	success: boolean;
	subscription: {
		_id: string;
		ownerId: string;
		status: 'active' | 'expired' | 'cancelled';
		billingCycle: 'monthly' | 'yearly';
		startDate: string;
		endDate: string;
		amountPaid: number;
		currentFeatures: FEPlan['features'];
		planId: {
			_id: string;
			name: string;
			displayName: string;
			sortOrder: number;
			description?: string;
			pricing?: { monthly: number; yearly: number };
			features?: FEPlan['features'];
		};
		isSimulated?: boolean;
	};
};

export async function getCurrentSubscriptionStatus(): Promise<MyStatusSubscriptionResponse['subscription']> {
	try {
		const { data } = await axiosClient.get<MyStatusSubscriptionResponse>('/subscriptions/my-status', {
			headers: withAuthHeaders(),
		});
		return data.subscription;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export type ValidateSubscriptionActionResponse = {
	success: boolean;
	action: 'renew' | 'upgrade' | 'downgrade';
	allowed: boolean;
	message: string;
	billingCycle: 'monthly' | 'yearly';
	closeToExpiry?: boolean;
	currentPlan?: {
		id: string;
		name: string;
		displayName: string;
		sortOrder: number;
	};
	targetPlan?: {
		id: string;
		name: string;
		displayName: string;
		sortOrder: number;
	};
	pricing: {
		basePrice: number;
		unusedCredit: number;
		netAmount: number;
		daysRemaining: number;
	};
	reason?: string;
	details?: {
		currentUsage: {
			locations: number;
			courts: number;
		};
		targetLimits: {
			locations: number;
			courts: number;
		};
		violations: string[];
		recommendations: string[];
		featureLosses: string[];
	};
	warningMessage?: string;
};

export async function validateSubscriptionAction(
	targetPlanId: string,
	billingCycle: 'monthly' | 'yearly',
): Promise<ValidateSubscriptionActionResponse> {
	try {
		const { data } = await axiosClient.post<ValidateSubscriptionActionResponse>('/subscriptions/validate-action', {
			targetPlanId,
			billingCycle,
		}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		if (axios.isAxiosError(error) && error.response?.data) {
			const data = error.response.data as any;
			if (data.action === 'downgrade') {
				return data as ValidateSubscriptionActionResponse;
			}
		}
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// USER BOOKING
// ---------------------------------------------------------------------------

export type UserBookingPayload = {
	court_id: string;
	sub_court_id: string;
	date: string;
	start_time: string;
	end_time: string;
	match_id?: string;
};

export type UserBookingResponse = {
	message: string;
	booking: {
		_id: string;
		court_id: string;
		sub_court_id: string;
		court_name: string;
		sub_court_name: string;
		date: string;
		start_time: string;
		end_time: string;
		total_price: number;
		status: string;
		slots_booked: number;
		wallet_balance: number;
	};
};

export type UserBooking = {
	_id: string;
	user_id: string;
	court_id: string;
	sub_court_id: string;
	date: string;
	start_time: string;
	end_time: string;
	customer_name: string;
	customer_phone?: string;
	note?: string;
	total_price: number;
	status: string;
	source: string;
	tone?: string;
	court_name: string;
	sub_court_name: string;
	match_id?: {
		_id: string;
		participants: {
			_id: string;
			name: string;
			userName: string;
			avatarUrl?: string;
		}[];
	};
	createdAt: string;
	updatedAt?: string;
};

export type MyBookingsResponse = {
	message: string;
	bookings: UserBooking[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export async function userBookCourt(payload: UserBookingPayload): Promise<UserBookingResponse> {
	try {
		const { data } = await axiosClient.post<UserBookingResponse>('/bookings/user-book', payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function lockSlots(payload: Omit<UserBookingPayload, 'match_id'>): Promise<{ message: string }> {
	try {
		const { data } = await axiosClient.post<{ message: string }>('/bookings/lock-slots', payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function unlockSlots(payload: { court_id: string; sub_court_id: string; date: string }): Promise<{ message: string }> {
	try {
		const { data } = await axiosClient.post<{ message: string }>('/bookings/unlock-slots', payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMyBookings(params?: { status?: string; page?: number; limit?: number }): Promise<MyBookingsResponse> {
	try {
		const { data } = await axiosClient.get<MyBookingsResponse>('/bookings/my-bookings', {
			headers: withAuthHeaders(),
			params,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function cancelBooking(bookingId: string): Promise<{ message: string; refundAmount: number; refundPercentage: number }> {
	try {
		const { data } = await axiosClient.post(`/bookings/${bookingId}/cancel`, {}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function opponentPayBooking(bookingId: string): Promise<{
	message: string;
	booking: {
		_id: string;
		status: string;
		total_price: number;
		opponent_amount: number;
		wallet_balance: number;
	};
}> {
	try {
		const { data } = await axiosClient.post(`/bookings/${bookingId}/opponent-pay`, {}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMatchPendingDeposit(matchId: string): Promise<{
	pending_deposit: { bookingId: string; amount: number; deadline: string | null } | null;
	expired?: boolean;
}> {
	try {
		const { data } = await axiosClient.get(`/bookings/match/${matchId}/pending-deposit`, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------

export type CourtReview = {
	_id: string;
	user_id: string;
	court_id: string;
	rating: number;
	comment?: string;
	user_name: string;
	user_avatar?: string;
	createdAt: string;
};

export type CourtReviewsResponse = {
	reviews: CourtReview[];
	total: number;
	avgRating: number;
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type CanReviewResponse = {
	canReview: boolean;
};

export async function getCourtReviews(courtId: string, page = 1, limit = 10): Promise<CourtReviewsResponse> {
	try {
		const { data } = await axiosClient.get<CourtReviewsResponse>(`/reviews/court/${courtId}`, {
			params: { page, limit },
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getCanReview(courtId: string): Promise<CanReviewResponse> {
	try {
		const { data } = await axiosClient.get<CanReviewResponse>(`/reviews/can-review/${courtId}`, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function createReview(payload: {
	court_id: string;
	rating: number;
	comment?: string;
}): Promise<{ message: string; review: CourtReview }> {
	try {
		const { data } = await axiosClient.post<{ message: string; review: CourtReview }>('/reviews', payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function updateReview(reviewId: string, payload: { rating: number; comment?: string }): Promise<{ message: string; review: CourtReview }> {
	try {
		const { data } = await axiosClient.put<{ message: string; review: CourtReview }>(`/reviews/${reviewId}`, payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function deleteReview(reviewId: string): Promise<{ message: string }> {
	try {
		const { data } = await axiosClient.delete<{ message: string }>(`/reviews/${reviewId}`, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMyCourtReview(courtId: string): Promise<CourtReview | null> {
	try {
		const { data } = await axiosClient.get<{ review: CourtReview | null }>(`/reviews/my-review/${courtId}`, {
			headers: withAuthHeaders(),
		});
		return data.review;
	} catch (error: unknown) {
		return null;
	}
}

export type FEReportChatMessage = {
	sender_id: string;
	sender_name: string;
	message: string;
	createdAt: string;
};

export type FEReport = {
	_id: string;
	reporter_id: {
		_id: string;
		name?: string;
		userName: string;
		avatarUrl?: string;
	};
	target_id: string;
	target_type: 'user' | 'court';
	reason: string;
	description: string;
	status: 'pending' | 'resolved' | 'dismissed';
	chat_logs: FEReportChatMessage[];
	appeal_description?: string;
	appeal_created_at?: string;
	createdAt: string;
	updatedAt: string;
};

export type GetReportsResponse = {
	message: string;
	reports: FEReport[];
};

export type AppealReportResponse = {
	message: string;
	report: FEReport;
};

export async function getMyReports(): Promise<GetReportsResponse> {
	try {
		const accessToken = requireAccessToken();
		const { data } = await axiosClient.get<GetReportsResponse>('/profile/me/reports', {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function appealReport(reportId: string, appealDescription: string): Promise<AppealReportResponse> {
	try {
		const accessToken = requireAccessToken();
		const { data } = await axiosClient.post<AppealReportResponse>(
			`/profile/me/reports/${reportId}/appeal`,
			{ appealDescription },
			{
				headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
			}
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// OWNER REGISTRATION APPLICATION
// ---------------------------------------------------------------------------

export type OwnerApplicationStatus = 'pending' | 'approved' | 'rejected';

export type OwnerApplicationUser = {
	_id: string;
	name?: string;
	userName: string;
	email: string;
	phone?: string;
	avatarUrl?: string;
	address?: string;
	createdAt?: string;
};

export type OwnerApplication = {
	_id: string;
	userId: OwnerApplicationUser | string;
	businessName: string;
	businessAddress: string;
	phone: string;
	identityCard: string;
	bankAccount?: string;
	description?: string;
	largeCourts?: number;
	smallCourts?: number;
	status: OwnerApplicationStatus;
	rejectionReason?: string;
	createdAt: string;
	updatedAt: string;
};

export type OwnerApplicationPayload = {
	businessName: string;
	businessAddress: string;
	phone: string;
	identityCard: string;
	bankAccount?: string;
	description?: string;
	largeCourts?: number;
	smallCourts?: number;
};

export type MyOwnerApplicationResponse = {
	message: string;
	application: OwnerApplication | null;
};

export type AdminOwnerApplicationsResponse = {
	message: string;
	applications: OwnerApplication[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type OwnerApplicationActionResponse = {
	message: string;
	application: OwnerApplication;
};

export async function submitOwnerApplication(
	payload: OwnerApplicationPayload,
): Promise<OwnerApplicationActionResponse> {
	try {
		const { data } = await axiosClient.post<OwnerApplicationActionResponse>(
			'/profile/me/owner-application',
			payload,
			{ headers: withAuthHeaders() },
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMyOwnerApplication(): Promise<MyOwnerApplicationResponse> {
	try {
		const { data } = await axiosClient.get<MyOwnerApplicationResponse>(
			'/profile/me/owner-application',
			{ headers: withAuthHeaders() },
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminGetOwnerApplications(params?: {
	status?: 'all' | OwnerApplicationStatus;
	page?: number;
	limit?: number;
}): Promise<AdminOwnerApplicationsResponse> {
	try {
		const { data } = await axiosClient.get<AdminOwnerApplicationsResponse>(
			'/admin/owner-applications',
			{ params },
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminApproveOwnerApplication(
	applicationId: string,
): Promise<OwnerApplicationActionResponse> {
	try {
		const { data } = await axiosClient.post<OwnerApplicationActionResponse>(
			`/admin/owner-applications/${applicationId}/approve`,
			{},
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminRejectOwnerApplication(
	applicationId: string,
	reason?: string,
): Promise<OwnerApplicationActionResponse> {
	try {
		const { data } = await axiosClient.post<OwnerApplicationActionResponse>(
			`/admin/owner-applications/${applicationId}/reject`,
			{ reason },
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function adminRevokeOwnerApplication(
	applicationId: string,
): Promise<{ message: string }> {
	try {
		const { data } = await axiosClient.post<{ message: string }>(
			`/admin/owner-applications/${applicationId}/revoke`,
			{},
		);
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------------------

export type NotificationType =
	| 'owner_application_submitted'
	| 'owner_application_approved'
	| 'owner_application_rejected'
	| 'court_submitted'
	| 'court_approved'
	| 'court_rejected'
	| 'deposit_received'
	| 'subscription_activated'
	| 'booking_created'
	| 'booking_cancelled';

export type FENotification = {
	_id: string;
	recipientId?: string;
	recipientRole?: 'admin' | 'owner' | 'user';
	type: NotificationType;
	title: string;
	message: string;
	read: boolean;
	link?: string;
	metadata?: Record<string, string>;
	createdAt: string;
};

export type NotificationsResponse = {
	message: string;
	notifications: FENotification[];
	unreadCount: number;
};

export async function getMyNotifications(params?: {
	limit?: number;
	unread?: boolean;
}): Promise<NotificationsResponse> {
	try {
		const { data } = await axiosClient.get<NotificationsResponse>('/notifications', {
			params: { limit: params?.limit, unread: params?.unread },
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getUnreadNotificationCount(): Promise<number> {
	try {
		const { data } = await axiosClient.get<{ count: number }>('/notifications/unread-count');
		return data.count;
	} catch {
		return 0;
	}
}

export async function markNotificationRead(notificationId: string): Promise<void> {
	try {
		await axiosClient.put(`/notifications/${notificationId}/read`);
	} catch {
		// ignore
	}
}

export async function markAllNotificationsRead(): Promise<void> {
	try {
		await axiosClient.put('/notifications/read-all');
	} catch {
		// ignore
	}
}

