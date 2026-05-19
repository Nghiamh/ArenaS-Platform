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

type UseSocketReturn = {
	socket: Socket | null;
	isConnected: boolean;
	joinMatchRoom: (matchId: string) => void;
	leaveMatchRoom: (matchId: string) => void;
	sendMessage: (matchId: string, message: string) => void;
	onMatchFound: (callback: (payload: MatchFoundPayload) => void) => void;
	onReceiveMessage: (callback: (payload: ReceiveMessagePayload) => void) => void;
};

export function useSocket(): UseSocketReturn {
	const socketRef = useRef<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	// Store callback refs so they survive re-renders
	const matchFoundCb = useRef<((payload: MatchFoundPayload) => void) | null>(null);
	const receiveMessageCb = useRef<((payload: ReceiveMessagePayload) => void) | null>(null);

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

	return {
		socket: socketRef.current,
		isConnected,
		joinMatchRoom,
		leaveMatchRoom,
		sendMessage,
		onMatchFound,
		onReceiveMessage,
	};
}
