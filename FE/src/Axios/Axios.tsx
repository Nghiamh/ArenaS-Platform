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
	email: string;
	userName: string;
};

export type AuthResponse = {
	message: string;
	token: string;
	user: AuthUser;
};

export type LoginPayload = {
	identifier: string;
	password: string;
};

export type RegisterPayload = {
	email: string;
	userName: string;
	password: string;
};

export type GoogleLoginPayload = {
	code: string;
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
