import { useState, useEffect, useMemo } from 'react';
import { createDeposit, sendFakeWebhook } from '../../Axios/walletApi';
import { useDepositPolling } from '../../hooks/useDepositPolling';

type DepositModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
	initialAmount?: number;
	autoCreate?: boolean;
};

type DepositStep = 'amount' | 'qr' | 'success';

const PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

function formatVND(amount: number): string {
	return amount.toLocaleString('vi-VN') + 'đ';
}

export function DepositModal({ isOpen, onClose, onSuccess, initialAmount, autoCreate }: DepositModalProps) {
	const [step, setStep] = useState<DepositStep>('amount');
	const [amount, setAmount] = useState<number>(0);
	const [inputValue, setInputValue] = useState('');
	const [transferCode, setTransferCode] = useState<string | null>(null);
	const [qrUrl, setQrUrl] = useState<string | null>(null);
	const [expiredAt, setExpiredAt] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [countdown, setCountdown] = useState(0);

	const { status, isCompleted, isExpired } = useDepositPolling(
		transferCode,
		step === 'qr'
	);

	// Reset when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setStep('amount');
			const startingAmount = initialAmount || 0;
			setAmount(startingAmount);
			setInputValue(startingAmount > 0 ? startingAmount.toLocaleString('vi-VN') : '');
			setTransferCode(null);
			setQrUrl(null);
			setExpiredAt(null);
			setLoading(false);
			setError(null);
			setCountdown(0);
		}
	}, [isOpen, initialAmount]);

	// Handle completion
	useEffect(() => {
		if (isCompleted && step === 'qr') {
			setStep('success');
			const timer = setTimeout(() => {
				onSuccess();
				onClose();
			}, 2500);
			return () => clearTimeout(timer);
		}
	}, [isCompleted, step, onSuccess, onClose]);

	// Handle expiry
	useEffect(() => {
		if (isExpired && step === 'qr') {
			setError('Giao dịch đã hết hạn. Vui lòng tạo lệnh nạp mới.');
		}
	}, [isExpired, step]);

	// Countdown timer
	useEffect(() => {
		if (!expiredAt || step !== 'qr') return;

		const updateCountdown = () => {
			const remaining = Math.max(
				0,
				Math.floor((new Date(expiredAt).getTime() - Date.now()) / 1000)
			);
			setCountdown(remaining);
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [expiredAt, step]);

	const countdownDisplay = useMemo(() => {
		const minutes = Math.floor(countdown / 60);
		const seconds = countdown % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}, [countdown]);

	useEffect(() => {
		if (!isOpen || typeof document === 'undefined') {
			return;
		}

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	const handleSelectAmount = (value: number) => {
		setAmount(value);
		setInputValue(value.toLocaleString('vi-VN'));
		setError(null);
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value.replace(/\D/g, '');
		const num = parseInt(raw, 10) || 0;
		setAmount(num);
		setInputValue(num > 0 ? num.toLocaleString('vi-VN') : '');
		setError(null);
	};

	const handleCreateDeposit = async () => {
		if (amount < 10_000) {
			setError('Số tiền tối thiểu là 10,000đ');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const result = await createDeposit(amount);
			setTransferCode(result.transferCode);
			setQrUrl(result.qrUrl);
			setExpiredAt(result.expiredAt);
			setStep('qr');
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Tạo lệnh nạp thất bại');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (isOpen && autoCreate && amount >= 10_000 && step === 'amount') {
			handleCreateDeposit();
		}
	}, [isOpen, autoCreate, amount, step]);

	const handleFakePayment = async () => {
		if (!transferCode) return;
		try {
			setLoading(true);
			await sendFakeWebhook(transferCode);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Fake webhook thất bại');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className="relative w-full max-w-md rounded-2xl border border-slate-700/50 overflow-hidden"
				style={{
					background:
						'linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.85) 100%)',
					backdropFilter: 'blur(20px)',
					boxShadow:
						'0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px rgba(16, 185, 129, 0.06)',
				}}
			>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
					<h2 className="text-lg font-semibold text-white flex items-center gap-2">
						<span className="text-xl"></span>
						{step === 'amount' && 'Nạp tiền vào ví'}
						{step === 'qr' && 'Quét mã thanh toán'}
						{step === 'success' && 'Nạp tiền thành công!'}
					</h2>
					<button
						onClick={onClose}
						className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
					>
						✕
					</button>
				</div>

				{/* Content */}
				<div className="px-6 py-5">
					{/* Step 1: Amount */}
					{step === 'amount' && (
						<div className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									Nhập số tiền
								</label>
								<div className="relative">
									<input
										id="deposit-amount-input"
										type="text"
										value={inputValue}
										onChange={handleInputChange}
										placeholder="0"
										className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white text-lg font-semibold placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
									/>
									<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
										đ
									</span>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2">
								{PRESET_AMOUNTS.map((preset) => (
									<button
										key={preset}
										onClick={() => handleSelectAmount(preset)}
										className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${amount === preset
												? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
												: 'bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600/60'
											}`}
									>
										{formatVND(preset)}
									</button>
								))}
							</div>

							{error && (
								<div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
									{error}
								</div>
							)}

							<button
								id="deposit-submit-btn"
								onClick={handleCreateDeposit}
								disabled={loading || amount < 10_000}
								className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
								style={{
									background: amount >= 10_000
										? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
										: 'rgba(100, 116, 139, 0.3)',
									boxShadow: amount >= 10_000
										? '0 4px 14px rgba(16, 185, 129, 0.3)'
										: 'none',
								}}
							>
								{loading ? (
									<span className="flex items-center justify-center gap-2">
										<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Đang tạo lệnh...
									</span>
								) : (
									`Nạp ${amount > 0 ? formatVND(amount) : ''}`
								)}
							</button>
						</div>
					)}

					{/* Step 2: QR Code */}
					{step === 'qr' && (
						<div className="space-y-4 text-center">
							{/* Countdown */}
							<div className="flex items-center justify-center gap-2 text-sm">
								<span className="text-slate-400">Hết hạn sau</span>
								<span
									className={`font-mono font-bold px-2 py-0.5 rounded-md ${countdown < 60
											? 'text-red-400 bg-red-500/10'
											: 'text-amber-400 bg-amber-500/10'
										}`}
								>
									{countdownDisplay}
								</span>
							</div>

							{/* QR Image */}
							{qrUrl && (
								<div className="flex justify-center">
									<div className="bg-white rounded-xl p-3 shadow-lg shadow-black/20">
										<img
											src={qrUrl}
											alt="VietQR Payment"
											className="w-56 h-56 object-contain"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = 'none';
											}}
										/>
									</div>
								</div>
							)}

							{/* Transfer Code */}
							<div className="bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-700/50">
								<p className="text-xs text-slate-400 mb-1">Nội dung chuyển khoản</p>
								<p className="text-lg font-mono font-bold text-emerald-400 tracking-wide">
									{transferCode}
								</p>
							</div>

							{/* Amount */}
							<div className="bg-slate-800/80 rounded-xl px-4 py-3 border border-slate-700/50">
								<p className="text-xs text-slate-400 mb-1">Số tiền</p>
								<p className="text-xl font-bold text-white">{formatVND(amount)}</p>
							</div>

							{/* Polling status */}
							<div className="flex items-center justify-center gap-2 text-sm text-slate-400">
								{status === 'pending' && (
									<>
										<span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
										Đang chờ thanh toán...
									</>
								)}
							</div>

							{error && (
								<div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
									{error}
								</div>
							)}

							{/* Dev: Fake payment button */}
							<button
								id="fake-payment-btn"
								onClick={handleFakePayment}
								disabled={loading || isCompleted || isExpired}
								className="w-full py-2.5 rounded-xl text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
							>
								{loading ? '⏳ Đang xử lý...' : '🧪 Giả lập thanh toán (Dev)'}
							</button>
						</div>
					)}

					{/* Step 3: Success */}
					{step === 'success' && (
						<div className="text-center py-6 space-y-4">
							<div className="text-6xl animate-bounce">✅</div>
							<h3 className="text-xl font-bold text-emerald-400">
								Nạp tiền thành công!
							</h3>
							<p className="text-slate-400">
								Đã nạp <span className="text-white font-semibold">{formatVND(amount)}</span> vào ví
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
