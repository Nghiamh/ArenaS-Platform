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
};

export type UserSkill = {
	id: string;
	sport: string;
	note?: string;
	level: number;
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

export type OwnerCourtStatus = 'available' | 'closed' | 'open';

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
// COURT DASHBOARD / STATS
// ---------------------------------------------------------------------------

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
