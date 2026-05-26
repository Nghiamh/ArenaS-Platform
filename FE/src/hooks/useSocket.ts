import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

type MatchFoundPayload = {
	matchId: string;
	match: unknown;
	sport: string;
};

type ReceiveMessagePayload = {
	_id: string;
	match_id: string;
	sender_id: string;
	message: string;
	createdAt: string;
};

type PlayerAcceptedPayload = {
	matchId: string;
	playerId: string;
};

type MatchConfirmedPayload = {
	matchId: string;
	match: unknown;
	sport: string;
};
type MatchCancelledPayload = {
	matchId: string;
	reason: 'timeout' | 'decline';
	isBackInQueue: boolean;
	ticket?: unknown;
};

type ChatVoteUpdatedPayload = {
	matchId: string;
	chat_deleted_by: string[];
	deleted: boolean;
	votesRemaining: number;
};

type PlayerCheckedInPayload = {
	matchId: string;
	playerId: string;
};

type MatchCompletedPayload = {
	matchId: string;
	match: unknown;
};

type PlayerReportedPayload = {
	matchId: string;
	reportId: string;
	reporterName: string;
	reason: string;
	description: string;
	createdAt: string;
};

type CourtBookedPayload = {
	matchId: string;
	bookedByUserId: string;
	courtName: string;
	date: string;
	start_time: string;
	end_time: string;
};

type CourtCancelledPayload = {
	matchId: string;
	cancelledByUserId: string;
	courtName: string;
	date: string;
	start_time: string;
	end_time: string;
	reason?: string;
};

type OpponentDepositRequiredPayload = {
	matchId: string;
	bookingId: string;
	bookedByUserId: string;
	courtName: string;
	date: string;
	start_time: string;
	end_time: string;
	total_price: number;
	opponent_amount: number;
	deadline: string;
};

type UseSocketReturn = {
	socket: Socket | null;
	isConnected: boolean;
	joinMatchRoom: (matchId: string) => void;
	leaveMatchRoom: (matchId: string) => void;
	sendMessage: (matchId: string, message: string) => void;
	onMatchFound: (callback: (payload: MatchFoundPayload) => void) => void;
	onReceiveMessage: (callback: (payload: ReceiveMessagePayload) => void) => void;
	onPlayerAccepted: (callback: (payload: PlayerAcceptedPayload) => void) => void;
	onMatchConfirmed: (callback: (payload: MatchConfirmedPayload) => void) => void;
	onMatchCancelled: (callback: (payload: MatchCancelledPayload) => void) => void;
	onChatVoteUpdated: (callback: (payload: ChatVoteUpdatedPayload) => void) => void;
	onPlayerCheckedIn: (callback: (payload: PlayerCheckedInPayload) => void) => void;
	onMatchCompleted: (callback: (payload: MatchCompletedPayload) => void) => void;
	onCourtBooked: (callback: (payload: CourtBookedPayload) => void) => void;
	onCourtCancelled: (callback: (payload: CourtCancelledPayload) => void) => void;
	onPlayerReported: (callback: (payload: PlayerReportedPayload) => void) => void;
	onOpponentDepositRequired: (callback: (payload: OpponentDepositRequiredPayload) => void) => void;
};

export function useSocket(): UseSocketReturn {
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	// Store callback refs so they survive re-renders
	const matchFoundCb = useRef<((payload: MatchFoundPayload) => void) | null>(null);
	const receiveMessageCb = useRef<((payload: ReceiveMessagePayload) => void) | null>(null);
	const playerAcceptedCb = useRef<((payload: PlayerAcceptedPayload) => void) | null>(null);
	const matchConfirmedCb = useRef<((payload: MatchConfirmedPayload) => void) | null>(null);
	const matchCancelledCb = useRef<((payload: MatchCancelledPayload) => void) | null>(null);
	const chatVoteUpdatedCb = useRef<((payload: ChatVoteUpdatedPayload) => void) | null>(null);
	const playerCheckedInCb = useRef<((payload: PlayerCheckedInPayload) => void) | null>(null);
	const matchCompletedCb = useRef<((payload: MatchCompletedPayload) => void) | null>(null);
	const courtBookedCb = useRef<((payload: CourtBookedPayload) => void) | null>(null);
	const courtCancelledCb = useRef<((payload: CourtCancelledPayload) => void) | null>(null);
	const playerReportedCb = useRef<((payload: PlayerReportedPayload) => void) | null>(null);
	const opponentDepositRequiredCb = useRef<((payload: OpponentDepositRequiredPayload) => void) | null>(null);

	useEffect(() => {
		const token = localStorage.getItem('accessToken')?.trim();
		if (!token || token === 'undefined' || token === 'null') {
			return;
		}

		const socket = io(SOCKET_URL, {
			auth: { token },
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 2000,
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			setIsConnected(true);
			console.log('[Socket] Connected:', socket.id);
		});

		socket.on('disconnect', () => {
			setIsConnected(false);
			console.log('[Socket] Disconnected');
		});

		socket.on('connect_error', (err) => {
			console.error('[Socket] Connection error:', err.message);
			setIsConnected(false);
		});

		socket.on('match_found', (payload: MatchFoundPayload) => {
			console.log('[Socket] match_found:', payload);
			matchFoundCb.current?.(payload);
		});

		socket.on('receive_message', (payload: ReceiveMessagePayload) => {
			receiveMessageCb.current?.(payload);
		});

		socket.on('player_accepted', (payload: PlayerAcceptedPayload) => {
			console.log('[Socket] player_accepted:', payload);
			playerAcceptedCb.current?.(payload);
		});

		socket.on('match_confirmed', (payload: MatchConfirmedPayload) => {
			console.log('[Socket] match_confirmed:', payload);
			matchConfirmedCb.current?.(payload);
		});

		socket.on('match_cancelled', (payload: MatchCancelledPayload) => {
			console.log('[Socket] match_cancelled:', payload);
			matchCancelledCb.current?.(payload);
		});

		socket.on('chat_vote_updated', (payload: ChatVoteUpdatedPayload) => {
			console.log('[Socket] chat_vote_updated:', payload);
			chatVoteUpdatedCb.current?.(payload);
		});

		socket.on('player_checked_in', (payload: PlayerCheckedInPayload) => {
			console.log('[Socket] player_checked_in:', payload);
			playerCheckedInCb.current?.(payload);
		});

		socket.on('match_completed', (payload: MatchCompletedPayload) => {
			console.log('[Socket] match_completed:', payload);
			matchCompletedCb.current?.(payload);
		});

		socket.on('court_booked', (payload: CourtBookedPayload) => {
			console.log('[Socket] court_booked:', payload);
			courtBookedCb.current?.(payload);
		});

		socket.on('court_cancelled', (payload: CourtCancelledPayload) => {
			console.log('[Socket] court_cancelled:', payload);
			courtCancelledCb.current?.(payload);
		});

		socket.on('player_reported', (payload: PlayerReportedPayload) => {
			console.log('[Socket] player_reported:', payload);
			playerReportedCb.current?.(payload);
		});

		socket.on('opponent_deposit_required', (payload: OpponentDepositRequiredPayload) => {
			console.log('[Socket] opponent_deposit_required:', payload);
			opponentDepositRequiredCb.current?.(payload);
		});

		socket.on('error', (err: { message: string }) => {
			console.error('[Socket] Server error:', err.message);
		});

		return () => {
			socket.removeAllListeners();
			socket.disconnect();
			socketRef.current = null;
			setIsConnected(false);
		};
	}, []);

	const joinMatchRoom = useCallback((matchId: string) => {
		socketRef.current?.emit('join_match_room', { matchId });
	}, []);

	const leaveMatchRoom = useCallback((matchId: string) => {
		socketRef.current?.emit('leave_match_room', { matchId });
	}, []);

	const sendMessage = useCallback((matchId: string, message: string) => {
		socketRef.current?.emit('send_message', { matchId, message });
	}, []);

	const onMatchFound = useCallback((callback: (payload: MatchFoundPayload) => void) => {
		matchFoundCb.current = callback;
	}, []);

	const onReceiveMessage = useCallback((callback: (payload: ReceiveMessagePayload) => void) => {
		receiveMessageCb.current = callback;
	}, []);

	const onPlayerAccepted = useCallback((callback: (payload: PlayerAcceptedPayload) => void) => {
		playerAcceptedCb.current = callback;
	}, []);

	const onMatchConfirmed = useCallback((callback: (payload: MatchConfirmedPayload) => void) => {
		matchConfirmedCb.current = callback;
	}, []);

	const onMatchCancelled = useCallback((callback: (payload: MatchCancelledPayload) => void) => {
		matchCancelledCb.current = callback;
	}, []);

	const onChatVoteUpdated = useCallback((callback: (payload: ChatVoteUpdatedPayload) => void) => {
		chatVoteUpdatedCb.current = callback;
	}, []);

	const onPlayerCheckedIn = useCallback((callback: (payload: PlayerCheckedInPayload) => void) => {
		playerCheckedInCb.current = callback;
	}, []);

	const onMatchCompleted = useCallback((callback: (payload: MatchCompletedPayload) => void) => {
		matchCompletedCb.current = callback;
	}, []);

	const onCourtBooked = useCallback((callback: (payload: CourtBookedPayload) => void) => {
		courtBookedCb.current = callback;
	}, []);

	const onCourtCancelled = useCallback((callback: (payload: CourtCancelledPayload) => void) => {
		courtCancelledCb.current = callback;
	}, []);

	const onPlayerReported = useCallback((callback: (payload: PlayerReportedPayload) => void) => {
		playerReportedCb.current = callback;
	}, []);

	const onOpponentDepositRequired = useCallback((callback: (payload: OpponentDepositRequiredPayload) => void) => {
		opponentDepositRequiredCb.current = callback;
	}, []);

	return {
		socket: socketRef.current,
		isConnected,
		joinMatchRoom,
		leaveMatchRoom,
		sendMessage,
		onMatchFound,
		onReceiveMessage,
		onPlayerAccepted,
		onMatchConfirmed,
		onMatchCancelled,
		onChatVoteUpdated,
		onPlayerCheckedIn,
		onMatchCompleted,
		onCourtBooked,
		onCourtCancelled,
		onPlayerReported,
		onOpponentDepositRequired,
	};
}
