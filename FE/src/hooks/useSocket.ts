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

let socketInstance: Socket | null = null;
let connectedToken: string | null = null;

const callbacksRegistry = {
	matchFound: null as ((payload: MatchFoundPayload) => void) | null,
	receiveMessage: null as ((payload: ReceiveMessagePayload) => void) | null,
	playerAccepted: null as ((payload: PlayerAcceptedPayload) => void) | null,
	matchConfirmed: null as ((payload: MatchConfirmedPayload) => void) | null,
	matchCancelled: null as ((payload: MatchCancelledPayload) => void) | null,
	chatVoteUpdated: null as ((payload: ChatVoteUpdatedPayload) => void) | null,
	playerCheckedIn: null as ((payload: PlayerCheckedInPayload) => void) | null,
	matchCompleted: null as ((payload: MatchCompletedPayload) => void) | null,
	courtBooked: null as ((payload: CourtBookedPayload) => void) | null,
	courtCancelled: null as ((payload: CourtCancelledPayload) => void) | null,
	playerReported: null as ((payload: PlayerReportedPayload) => void) | null,
	opponentDepositRequired: null as ((payload: OpponentDepositRequiredPayload) => void) | null,
};

export function useSocket(): UseSocketReturn {
	const [isConnected, setIsConnected] = useState(socketInstance?.connected ?? false);

	useEffect(() => {
		const token = localStorage.getItem('accessToken')?.trim();
		if (!token || token === 'undefined' || token === 'null') {
			if (socketInstance) {
				socketInstance.disconnect();
				socketInstance = null;
				connectedToken = null;
			}
			setIsConnected(false);
			return;
		}

		// Reconnect if the token changes
		if (socketInstance && connectedToken !== token) {
			socketInstance.disconnect();
			socketInstance = null;
		}

		if (!socketInstance) {
			connectedToken = token;
			socketInstance = io(SOCKET_URL, {
				auth: { token },
				transports: ['websocket', 'polling'],
				reconnection: true,
				reconnectionAttempts: 10,
				reconnectionDelay: 2000,
			});

			socketInstance.on('connect', () => {
				setIsConnected(true);
				console.log('[Socket] Connected:', socketInstance?.id);
			});

			socketInstance.on('disconnect', () => {
				setIsConnected(false);
				console.log('[Socket] Disconnected');
			});

			socketInstance.on('connect_error', (err) => {
				console.error('[Socket] Connection error:', err.message);
				setIsConnected(false);
			});

			socketInstance.on('match_found', (payload: MatchFoundPayload) => {
				console.log('[Socket] match_found:', payload);
				callbacksRegistry.matchFound?.(payload);
			});

			socketInstance.on('receive_message', (payload: ReceiveMessagePayload) => {
				callbacksRegistry.receiveMessage?.(payload);
			});

			socketInstance.on('player_accepted', (payload: PlayerAcceptedPayload) => {
				console.log('[Socket] player_accepted:', payload);
				callbacksRegistry.playerAccepted?.(payload);
			});

			socketInstance.on('match_confirmed', (payload: MatchConfirmedPayload) => {
				console.log('[Socket] match_confirmed:', payload);
				callbacksRegistry.matchConfirmed?.(payload);
			});

			socketInstance.on('match_cancelled', (payload: MatchCancelledPayload) => {
				console.log('[Socket] match_cancelled:', payload);
				callbacksRegistry.matchCancelled?.(payload);
			});

			socketInstance.on('chat_vote_updated', (payload: ChatVoteUpdatedPayload) => {
				console.log('[Socket] chat_vote_updated:', payload);
				callbacksRegistry.chatVoteUpdated?.(payload);
			});

			socketInstance.on('player_checked_in', (payload: PlayerCheckedInPayload) => {
				console.log('[Socket] player_checked_in:', payload);
				callbacksRegistry.playerCheckedIn?.(payload);
			});

			socketInstance.on('match_completed', (payload: MatchCompletedPayload) => {
				console.log('[Socket] match_completed:', payload);
				callbacksRegistry.matchCompleted?.(payload);
			});

			socketInstance.on('court_booked', (payload: CourtBookedPayload) => {
				console.log('[Socket] court_booked:', payload);
				callbacksRegistry.courtBooked?.(payload);
			});

			socketInstance.on('court_cancelled', (payload: CourtCancelledPayload) => {
				console.log('[Socket] court_cancelled:', payload);
				callbacksRegistry.courtCancelled?.(payload);
			});

			socketInstance.on('player_reported', (payload: PlayerReportedPayload) => {
				console.log('[Socket] player_reported:', payload);
				callbacksRegistry.playerReported?.(payload);
			});

			socketInstance.on('opponent_deposit_required', (payload: OpponentDepositRequiredPayload) => {
				console.log('[Socket] opponent_deposit_required:', payload);
				callbacksRegistry.opponentDepositRequired?.(payload);
			});

			socketInstance.on('error', (err: { message: string }) => {
				console.error('[Socket] Server error:', err.message);
			});
		} else {
			setIsConnected(socketInstance.connected);
		}

		const handleConnect = () => setIsConnected(true);
		const handleDisconnect = () => setIsConnected(false);

		socketInstance.on('connect', handleConnect);
		socketInstance.on('disconnect', handleDisconnect);

		return () => {
			if (socketInstance) {
				socketInstance.off('connect', handleConnect);
				socketInstance.off('disconnect', handleDisconnect);
			}
		};
	}, []);

	const joinMatchRoom = useCallback((matchId: string) => {
		socketInstance?.emit('join_match_room', { matchId });
	}, []);

	const leaveMatchRoom = useCallback((matchId: string) => {
		socketInstance?.emit('leave_match_room', { matchId });
	}, []);

	const sendMessage = useCallback((matchId: string, message: string) => {
		socketInstance?.emit('send_message', { matchId, message });
	}, []);

	const onMatchFound = useCallback((callback: (payload: MatchFoundPayload) => void) => {
		callbacksRegistry.matchFound = callback;
	}, []);

	const onReceiveMessage = useCallback((callback: (payload: ReceiveMessagePayload) => void) => {
		callbacksRegistry.receiveMessage = callback;
	}, []);

	const onPlayerAccepted = useCallback((callback: (payload: PlayerAcceptedPayload) => void) => {
		callbacksRegistry.playerAccepted = callback;
	}, []);

	const onMatchConfirmed = useCallback((callback: (payload: MatchConfirmedPayload) => void) => {
		callbacksRegistry.matchConfirmed = callback;
	}, []);

	const onMatchCancelled = useCallback((callback: (payload: MatchCancelledPayload) => void) => {
		callbacksRegistry.matchCancelled = callback;
	}, []);

	const onChatVoteUpdated = useCallback((callback: (payload: ChatVoteUpdatedPayload) => void) => {
		callbacksRegistry.chatVoteUpdated = callback;
	}, []);

	const onPlayerCheckedIn = useCallback((callback: (payload: PlayerCheckedInPayload) => void) => {
		callbacksRegistry.playerCheckedIn = callback;
	}, []);

	const onMatchCompleted = useCallback((callback: (payload: MatchCompletedPayload) => void) => {
		callbacksRegistry.matchCompleted = callback;
	}, []);

	const onCourtBooked = useCallback((callback: (payload: CourtBookedPayload) => void) => {
		callbacksRegistry.courtBooked = callback;
	}, []);

	const onCourtCancelled = useCallback((callback: (payload: CourtCancelledPayload) => void) => {
		callbacksRegistry.courtCancelled = callback;
	}, []);

	const onPlayerReported = useCallback((callback: (payload: PlayerReportedPayload) => void) => {
		callbacksRegistry.playerReported = callback;
	}, []);

	const onOpponentDepositRequired = useCallback((callback: (payload: OpponentDepositRequiredPayload) => void) => {
		callbacksRegistry.opponentDepositRequired = callback;
	}, []);

	return {
		socket: socketInstance,
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
