import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Send,
	ChevronDown,
	Trash2,
	Loader2,
	MessageSquareOff,
	ShieldAlert,
} from 'lucide-react';
import {
	getChatHistory,
	voteChatDelete,
	type ChatMessageData,
} from '../../Axios/matchmakingApi';
import { useSocket } from '../../hooks/useSocket';
import './ChatPage.css';

function formatMessageTime(isoStr: string): string {
	try {
		const d = new Date(isoStr);
		return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
	} catch {
		return '';
	}
}

function getSenderId(sender: ChatMessageData['sender_id']): string {
	if (typeof sender === 'string') return sender;
	return sender._id;
}

function getSenderName(sender: ChatMessageData['sender_id']): string {
	if (typeof sender === 'string') return '';
	return sender.name ?? sender.userName ?? '';
}

export const ChatPage: React.FC = () => {
	const { matchId } = useParams<{ matchId: string }>();
	const navigate = useNavigate();
	const { joinMatchRoom, leaveMatchRoom, sendMessage: socketSendMessage, onReceiveMessage, isConnected } = useSocket();

	const [currentUserId, setCurrentUserId] = useState<string>('');
	const [messages, setMessages] = useState<ChatMessageData[]>([]);
	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [chatDeleted, setChatDeleted] = useState(false);
	const [deleteVoting, setDeleteVoting] = useState(false);
	const [deleteVotesRemaining, setDeleteVotesRemaining] = useState<number | null>(null);
	const [showScrollFab, setShowScrollFab] = useState(false);
	const [error, setError] = useState('');

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const messagesContainerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Load current user id
	useEffect(() => {
		try {
			const stored = localStorage.getItem('currentUser');
			if (stored) {
				const parsed = JSON.parse(stored);
				setCurrentUserId(parsed.id ?? parsed._id ?? '');
			}
		} catch {
			// ignore
		}
	}, []);

	// Auth guard
	useEffect(() => {
		const token = localStorage.getItem('accessToken')?.trim();
		if (!token || token === 'undefined' || token === 'null') {
			navigate('/login');
		}
	}, [navigate]);

	// Join socket room
	useEffect(() => {
		if (matchId && isConnected) {
			joinMatchRoom(matchId);
		}

		return () => {
			if (matchId) {
				leaveMatchRoom(matchId);
			}
		};
	}, [matchId, isConnected, joinMatchRoom, leaveMatchRoom]);

	// Load chat history
	useEffect(() => {
		if (!matchId) return;

		setLoading(true);
		getChatHistory(matchId)
			.then((res) => {
				if (res.deleted) {
					setChatDeleted(true);
					setMessages([]);
				} else {
					setMessages(res.messages);
				}
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : 'Không thể tải tin nhắn');
			})
			.finally(() => setLoading(false));
	}, [matchId]);

	// Listen for new messages from socket
	useEffect(() => {
		onReceiveMessage((payload) => {
			setMessages((prev) => {
				// Avoid duplicates
				if (prev.some((m) => m._id === payload._id)) return prev;
				return [...prev, payload as ChatMessageData];
			});

			// Auto-scroll if near bottom
			requestAnimationFrame(() => {
				scrollToBottom();
			});
		});
	}, [onReceiveMessage]);

	// Auto-scroll on initial load
	useEffect(() => {
		if (!loading && messages.length > 0) {
			scrollToBottom();
		}
	}, [loading, messages.length]);

	// Scroll detection for FAB
	const handleScroll = useCallback(() => {
		const container = messagesContainerRef.current;
		if (!container) return;
		const isNearBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight < 100;
		setShowScrollFab(!isNearBottom);
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, []);

	// Send message
	const handleSend = useCallback(() => {
		if (!inputText.trim() || !matchId || sending || chatDeleted) return;

		const text = inputText.trim();
		setInputText('');
		setSending(true);

		socketSendMessage(matchId, text);
		setSending(false);
		inputRef.current?.focus();
	}, [inputText, matchId, sending, chatDeleted, socketSendMessage]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);

	// Vote to delete chat
	const handleVoteDelete = useCallback(async () => {
		if (!matchId || deleteVoting) return;

		const confirmed = window.confirm(
			'Bạn muốn vote xoá lịch sử chat?\nCần cả 2 người chơi đồng ý mới xoá được.',
		);
		if (!confirmed) return;

		setDeleteVoting(true);
		try {
			const res = await voteChatDelete(matchId);
			setDeleteVotesRemaining(res.votesRemaining);
			if (res.deleted) {
				setChatDeleted(true);
				setMessages([]);
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Lỗi';
			if (msg === 'already_voted') {
				setError('Bạn đã vote xoá rồi.');
			} else {
				setError(msg);
			}
		} finally {
			setDeleteVoting(false);
		}
	}, [matchId, deleteVoting]);

	// Group consecutive messages by sender
	const shouldShowSender = (msg: ChatMessageData, index: number): boolean => {
		if (index === 0) return true;
		const prev = messages[index - 1];
		return getSenderId(prev.sender_id) !== getSenderId(msg.sender_id);
	};

	if (!matchId) {
		return (
			<div className="chat-page">
				<div className="chat-deleted-overlay">
					<ShieldAlert className="w-12 h-12 text-red-400" />
					<p className="text-slate-400">Match không hợp lệ.</p>
					<button
						onClick={() => navigate('/matchmaking')}
						className="text-blue-400 hover:underline text-sm"
					>
						Quay lại Tìm Đối Thủ
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="chat-page">
			{/* Header */}
			<div className="chat-header">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate('/matchmaking')}
						className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-700/60 bg-slate-800/50 text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
					>
						<ArrowLeft className="w-4 h-4" />
					</button>
					<div className="flex-1 min-w-0">
						<h1 className="text-base font-bold text-white truncate">Chat Đối Thủ</h1>
						<div className="flex items-center gap-1.5 text-xs">
							<span
								className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
							/>
							<span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
								{isConnected ? 'Đang kết nối' : 'Mất kết nối'}
							</span>
						</div>
					</div>
					<button
						type="button"
						onClick={handleVoteDelete}
						disabled={deleteVoting || chatDeleted}
						className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-700/60 bg-slate-800/50 text-slate-500 transition hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
						title="Vote xoá chat"
					>
						{deleteVoting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Trash2 className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			{/* Vote remaining banner */}
			{deleteVotesRemaining != null && deleteVotesRemaining > 0 && !chatDeleted && (
				<div className="chat-vote-banner text-amber-300">
					<ShieldAlert className="w-4 h-4 shrink-0" />
					<span>
						Đã vote xoá. Còn cần <strong>{deleteVotesRemaining}</strong> vote nữa để xoá chat.
					</span>
				</div>
			)}

			{/* Error */}
			{error && (
				<div className="mx-5 mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
					{error}
				</div>
			)}

			{/* Loading */}
			{loading && (
				<div className="flex-1 flex items-center justify-center">
					<Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
				</div>
			)}

			{/* Chat deleted */}
			{chatDeleted && !loading && (
				<div className="chat-deleted-overlay">
					<MessageSquareOff className="w-14 h-14 text-slate-600" />
					<p className="text-slate-400 text-sm text-center">
						Lịch sử chat đã được xoá bởi tất cả các bên.
					</p>
					<button
						onClick={() => navigate('/matchmaking')}
						className="text-blue-400 hover:underline text-sm"
					>
						Quay lại Tìm Đối Thủ
					</button>
				</div>
			)}

			{/* Messages */}
			{!loading && !chatDeleted && (
				<>
					<div
						ref={messagesContainerRef}
						className="chat-messages arena-scroll"
						onScroll={handleScroll}
					>
						{messages.length === 0 && (
							<div className="chat-system-msg mt-8">
								<p>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện! 👋</p>
							</div>
						)}

						{messages.map((msg, idx) => {
							const senderId = getSenderId(msg.sender_id);
							const isMine = senderId === currentUserId;
							const showName = !isMine && shouldShowSender(msg, idx);

							return (
								<div
									key={msg._id}
									className={`chat-bubble ${isMine ? 'chat-bubble-mine' : 'chat-bubble-other'}`}
								>
									{showName && (
										<div className="chat-sender-name">{getSenderName(msg.sender_id)}</div>
									)}
									<div className="text-sm">{msg.message}</div>
									<div className="chat-bubble-time">
										{formatMessageTime(msg.createdAt)}
									</div>
								</div>
							);
						})}

						<div ref={messagesEndRef} />
					</div>

					{/* Scroll to bottom FAB */}
					{showScrollFab && (
						<button
							type="button"
							onClick={scrollToBottom}
							className="chat-scroll-fab"
						>
							<ChevronDown className="w-4 h-4" />
						</button>
					)}

					{/* Input area */}
					<div className="chat-input-area">
						<div className="flex items-center gap-2.5">
							<input
								ref={inputRef}
								type="text"
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Nhập tin nhắn..."
								className="chat-input"
								maxLength={1000}
								autoComplete="off"
							/>
							<button
								type="button"
								onClick={handleSend}
								disabled={!inputText.trim() || sending}
								className="chat-send-btn"
							>
								<Send className="w-4 h-4" />
							</button>
						</div>
					</div>
				</>
			)}
		</div>
	);
};
