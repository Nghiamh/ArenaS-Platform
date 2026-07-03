import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	ArrowLeft,
	Send,
	ChevronDown,
	Loader2,
	ShieldAlert,
	MapPin,
	Clock,
} from 'lucide-react';
import {
	getChatHistory,
	type ChatMessageData,
} from '../../Axios/matchmakingApi';
import { opponentPayBooking } from '../../Axios/Axios';
import { useSocket } from '../../hooks/useSocket';
import { DepositModal } from '../WalletPage/DepositModal';

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
	const { joinMatchRoom, leaveMatchRoom, sendMessage: socketSendMessage, onReceiveMessage, onOpponentDepositRequired, onCourtCancelled, isConnected } = useSocket();

	const [currentUserId, setCurrentUserId] = useState<string>('');
	const [messages, setMessages] = useState<ChatMessageData[]>([]);
	const [inputText, setInputText] = useState('');
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [showScrollFab, setShowScrollFab] = useState(false);
	const [error, setError] = useState('');
	const [courtId, setCourtId] = useState<string | null>(null);

	// Opponent deposit payment in chat
	const [depositInfo, setDepositInfo] = useState<{ bookingId: string; amount: number; deadline: string } | null>(null);
	const [depositCountdown, setDepositCountdown] = useState(0);
	const [depositPayLoading, setDepositPayLoading] = useState(false);
	const [depositPaid, setDepositPaid] = useState(false);
	const [showDeposit, setShowDeposit] = useState(false);
	const [missingAmount, setMissingAmount] = useState<number | null>(null);

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
				setMessages(res.messages ?? []);
				if (res.court_id) {
					setCourtId(res.court_id);
				}
				// Populate pending deposit info from API response
				if (res.pending_deposit && !depositInfo && !depositPaid) {
					setDepositInfo({
						bookingId: res.pending_deposit.bookingId,
						amount: res.pending_deposit.amount,
						deadline: res.pending_deposit.deadline,
					});
					const remainingSec = Math.max(0, Math.floor((new Date(res.pending_deposit.deadline).getTime() - Date.now()) / 1000));
					setDepositCountdown(remainingSec);
				}
			})
			.catch((err) => {
				setError(err instanceof Error ? err.message : 'Không thể tải tin nhắn');
			})
			.finally(() => setLoading(false));
	}, [matchId]);

	// NOTE: pending_deposit is hydrated from getChatHistory (above) on initial load,
	// and updated in real-time via the opponent_deposit_required socket event (below).
	// No extra polling/scanning needed here.

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

	// Listen for opponent_deposit_required to get bookingId
	useEffect(() => {
		onOpponentDepositRequired((payload) => {
			if (payload.matchId === matchId) {
				setDepositInfo({
					bookingId: payload.bookingId,
					amount: payload.opponent_amount,
					deadline: payload.deadline,
				});
				const remainingSec = Math.max(0, Math.floor((new Date(payload.deadline).getTime() - Date.now()) / 1000));
				setDepositCountdown(remainingSec);
				setDepositPaid(false);
			}
		});
	}, [onOpponentDepositRequired, matchId]);

	// Listen for court_cancelled — clear deposit banner & stop countdown
	useEffect(() => {
		onCourtCancelled((payload) => {
			if (payload.matchId === matchId) {
				setDepositInfo(null);
				setDepositCountdown(0);
				setDepositPaid(false);
			}
		});
	}, [onCourtCancelled, matchId]);

	// Deposit countdown timer
	useEffect(() => {
		if (!depositInfo || depositCountdown <= 0 || depositPaid) return;
		const timer = setInterval(() => {
			setDepositCountdown((prev) => {
				if (prev <= 1) return 0;
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [depositInfo, depositCountdown, depositPaid]);


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
		if (messagesContainerRef.current) {
			messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
		}
	}, []);

	// Send message
	const handleSend = useCallback(() => {
		if (!inputText.trim() || !matchId || sending) return;

		const text = inputText.trim();
		setInputText('');
		setSending(true);

		socketSendMessage(matchId, text);
		setSending(false);
		inputRef.current?.focus();
	}, [inputText, matchId, sending, socketSendMessage]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				handleSend();
			}
		},
		[handleSend],
	);


	// Group consecutive messages by sender
	const shouldShowSender = (msg: ChatMessageData, index: number): boolean => {
		if (index === 0) return true;
		const prev = messages[index - 1];
		return getSenderId(prev.sender_id) !== getSenderId(msg.sender_id);
	};

	if (!matchId) {
		return (
			<div className="h-[calc(100vh-80px)] flex flex-col max-w-[720px] mx-auto overflow-hidden bg-[#030712]">
				<div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 animate-in fade-in slide-in-from-bottom-4">
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
		<div className="h-[calc(100vh-80px)] flex flex-col max-w-[720px] mx-auto overflow-hidden bg-[#030712]">
			{/* Header */}
			<div className="shrink-0 z-20 px-5 py-4 border-b border-slate-700/60 bg-slate-950/92 backdrop-blur-md">
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
				</div>
			</div>

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

			{/* Messages */}
			{!loading && (
				<>
					<div
						ref={messagesContainerRef}
						className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2 scroll-smooth overscroll-contain arena-scroll"
						onScroll={handleScroll}
					>
						{messages.length === 0 && (
							<div className="text-center text-xs text-slate-500 py-2 mt-8">
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
									className={`w-fit max-w-[78%] px-4 py-2.5 rounded-2xl break-words animate-in fade-in slide-in-from-bottom-2 duration-300 leading-relaxed ${isMine ? "self-end bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-md" : "self-start bg-slate-800/85 border border-slate-700/60 text-slate-200 rounded-bl-md"}`}
								>
									{showName && (
										<div className="text-[0.7rem] font-semibold text-blue-400 mb-0.5">{getSenderName(msg.sender_id)}</div>
									)}
									<div className="text-sm whitespace-pre-wrap">
										{(() => {
									// Detect deposit 50% message from opponent
									const isDepositMsg = msg.message.includes('đặt cọc 50%') && msg.message.includes('Đợi bạn thanh toán');
									
									if (isDepositMsg && !isMine) {
										const cleanedMsg = msg.message.replace(/\nĐợi bạn thanh toán 50% còn lại trong 30 phút\.?/, '');
										// Check subsequent messages to determine this deposit's status
										const subsequentMsgs = messages.slice(idx + 1);
										const wasCancelled = subsequentMsgs.some((m) => m.message.includes('huỷ đặt sân') || m.message.includes('hủy đặt sân'));
										const wasPaid = subsequentMsgs.some((m) => m.message.includes('đã thanh toán 50% còn lại'));
										const laterDepositMsgs = subsequentMsgs.filter((m) => {
											const sid = getSenderId(m.sender_id);
											return sid !== currentUserId && m.message.includes('đặt cọc 50%') && m.message.includes('Đợi bạn thanh toán');
										});
										const isLatestDeposit = laterDepositMsgs.length === 0;
										// OLD deposit that was cancelled
										if (wasCancelled && !isLatestDeposit) {
											return (<>{cleanedMsg}<div className="mt-2 pt-2 border-t border-red-600/30"><p className="text-xs text-red-400 font-semibold">❌ Đã huỷ</p></div></>);
										}
										// Already paid
										if (wasPaid || depositPaid) {
											return (<>{cleanedMsg}<div className="mt-2 pt-2 border-t border-emerald-600/40"><p className="text-xs text-emerald-400 font-semibold">✅ Đã thanh toán</p></div></>);
										}
										// Active deposit: show button only if latest AND depositInfo exists
										if (isLatestDeposit && depositInfo && !depositPaid) {
											const fmtMin = Math.floor(depositCountdown / 60).toString().padStart(2, '0');
											const fmtSec = (depositCountdown % 60).toString().padStart(2, '0');
											return (
												<>
													{cleanedMsg}
													<div className="mt-3 pt-3 border-t border-slate-600/40">
														{depositCountdown > 0 ? (<>
															<div className="flex items-center gap-1.5 mb-2">
																<Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
																<span className="text-xs text-amber-400 font-mono font-bold">{fmtMin}:{fmtSec}</span>
																<span className="text-xs text-slate-500">còn lại</span>
															</div>
															<button type="button" disabled={depositPayLoading} onClick={async (e) => { e.stopPropagation(); try { setDepositPayLoading(true); await opponentPayBooking(depositInfo.bookingId); setDepositPaid(true); } catch (err: any) { const errMsg = err.message || 'Thanh toán thất bại'; if (errMsg.includes('Số dư') || errMsg.includes('insufficient_balance')) { setMissingAmount(depositInfo.amount); setShowDeposit(true); } else { setError(errMsg); } } finally { setDepositPayLoading(false); } }} className="w-full flex items-center justify-center rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110 disabled:opacity-50">
																{depositPayLoading ? 'Đang xử lý...' : `Thanh toán 50% (${new Intl.NumberFormat('vi-VN').format(depositInfo.amount)} đ)`}
															</button>
														</>) : (<p className="text-xs text-red-400">⏰ Hết thời hạn thanh toán</p>)}
													</div>
												</>
											);
										}
										// Fallback: just show cleaned message
										return cleanedMsg;
									}
									// Normal message
									return msg.message;
								})()}
									</div>
									<div className={`text-[0.65rem] mt-1 opacity-60 ${isMine ? "text-right text-white/70" : "text-left text-slate-400"}`}>
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
							className="sticky bottom-[80px] self-center flex items-center justify-center w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700/50 text-slate-400 transition hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-400 z-10"
						>
							<ChevronDown className="w-4 h-4" />
						</button>
					)}

					{/* Input area */}
					<div className="shrink-0 px-5 py-3.5 border-t border-slate-700/60 bg-slate-950/95 backdrop-blur-md">
						<div className="flex items-center gap-2.5">
							<input
								ref={inputRef}
								type="text"
								value={inputText}
								onChange={(e) => setInputText(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Nhập tin nhắn..."
								className="flex-1 bg-slate-800/65 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none transition focus:border-blue-500/50 placeholder:text-slate-500"
								maxLength={1000}
								autoComplete="off"
							/>
							<button
								type="button"
								onClick={handleSend}
								disabled={!inputText.trim() || sending}
								className="flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 border-none text-white transition hover:brightness-110 hover:shadow-[0_0_16px_rgba(59,130,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<Send className="w-4 h-4" />
							</button>
							<button
								type="button"
								title="Đặt Sân"
								onClick={() => navigate(courtId ? `/courts/${courtId}` : '/tim-san', { state: { fromMatch: matchId } })}
								className="flex shrink-0 items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white shadow-lg transition hover:shadow-violet-500/40 hover:brightness-110"
							>
								<MapPin className="w-5 h-5" />
							</button>
						</div>
					</div>
				</>
			)}

			<DepositModal
				isOpen={showDeposit}
				onClose={() => setShowDeposit(false)}
				onSuccess={() => setShowDeposit(false)}
				initialAmount={missingAmount || undefined}
			/>
		</div>
	);
};
