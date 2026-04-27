import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const axiosClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
});

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
		const accessToken = getValidAccessToken();

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
		const accessToken = getValidAccessToken();

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
		const accessToken = getValidAccessToken();

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
		const accessToken = getValidAccessToken();

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
		const accessToken = getValidAccessToken();

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
		const accessToken = getValidAccessToken();

		const { data } = await axiosClient.delete<BasicMessageResponse>(`/profile/skills/${skillId}`, {
			headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
		});

		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}
