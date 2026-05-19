import { axiosClient } from './Axios';

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

export type MatchmakingTicket = {
	_id: string;
	user_id: string;
	court_id?: string;
	sport: string;
	location: {
		type: 'Point';
		coordinates: [number, number]; // [lng, lat]
	};
	status: 'WAITING' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
	matched_with?: string;
	match_id?: string;
	expires_at: string;
	createdAt?: string;
	updatedAt?: string;
};

export type MatchParticipant = {
	_id: string;
	name: string;
	userName: string;
	avatarUrl?: string;
};

export type MatchCourt = {
	_id: string;
	name: string;
	location: string;
	sports: string[];
	price_per_hour?: number;
};

export type MatchData = {
	_id: string;
	participants: MatchParticipant[];
	owner_id: { _id: string; name: string; userName: string };
	court_id: MatchCourt;
	sport: string;
	match_score: number;
	chat_deleted_by: string[];
	status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
	scheduled_at?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type JoinMatchmakingPayload = {
	sport: string;
	longitude: number;
	latitude: number;
	court_id?: string;
};

export type JoinMatchmakingResponse = {
	success: boolean;
	message: string;
	ticket: MatchmakingTicket;
};

export type CancelMatchmakingResponse = {
	success: boolean;
	message: string;
	ticket: MatchmakingTicket;
};

export type MatchmakingStatusResponse = {
	success: boolean;
	status: 'IDLE' | 'WAITING' | 'MATCHED';
	message?: string;
	ticket: MatchmakingTicket | null;
	waitMinutes?: number;
};

export type ChatMessageData = {
	_id: string;
	match_id: string;
	sender_id: string | { _id: string; name: string; userName: string; avatarUrl?: string };
	message: string;
	createdAt: string;
};

export type ChatHistoryResponse = {
	success: boolean;
	messages: ChatMessageData[];
	deleted?: boolean;
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export type VoteChatDeleteResponse = {
	success: boolean;
	message: string;
	deleted: boolean;
	votesRemaining: number;
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function withAuthHeaders() {
	const token = localStorage.getItem('accessToken')?.trim();
	if (!token || token === 'undefined' || token === 'null') {
		throw new Error('missing_token');
	}
	return { Authorization: `Bearer ${token}` };
}

function toErrorMessage(error: unknown): string {
	if (typeof error === 'object' && error !== null && 'response' in error) {
		const axiosErr = error as { response?: { data?: { message?: string; error?: string } } };
		return axiosErr.response?.data?.message ?? axiosErr.response?.data?.error ?? 'Request failed';
	}
	return error instanceof Error ? error.message : 'Unexpected error';
}

// ---------------------------------------------------------------------------
// MATCHMAKING API
// ---------------------------------------------------------------------------

export async function joinMatchmaking(payload: JoinMatchmakingPayload): Promise<JoinMatchmakingResponse> {
	try {
		const { data } = await axiosClient.post<JoinMatchmakingResponse>('/matchmaking/join', payload, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function cancelMatchmaking(): Promise<CancelMatchmakingResponse> {
	try {
		const { data } = await axiosClient.post<CancelMatchmakingResponse>('/matchmaking/cancel', {}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function getMatchmakingStatus(): Promise<MatchmakingStatusResponse> {
	try {
		const { data } = await axiosClient.get<MatchmakingStatusResponse>('/matchmaking/status', {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

// ---------------------------------------------------------------------------
// CHAT API
// ---------------------------------------------------------------------------

export async function getChatHistory(
	matchId: string,
	page = 1,
	limit = 50,
): Promise<ChatHistoryResponse> {
	try {
		const { data } = await axiosClient.get<ChatHistoryResponse>(`/chat/${matchId}/history`, {
			headers: withAuthHeaders(),
			params: { page, limit },
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}

export async function voteChatDelete(matchId: string): Promise<VoteChatDeleteResponse> {
	try {
		const { data } = await axiosClient.post<VoteChatDeleteResponse>(`/chat/${matchId}/delete`, {}, {
			headers: withAuthHeaders(),
		});
		return data;
	} catch (error: unknown) {
		throw new Error(toErrorMessage(error));
	}
}
