import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../hooks/useWallet';
import { DepositModal } from './DepositModal';

function formatVND(amount: number): string {
	return amount.toLocaleString('vi-VN') + 'đ';
}

function formatDate(isoString?: string): string {
	if (!isoString) return '—';
	const d = new Date(isoString);
	return d.toLocaleDateString('vi-VN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getTypeBadge(type: string) {
	switch (type) {
		case 'deposit':
			return { label: 'Nạp tiền', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '↓' };
		case 'payment':
			return { label: 'Thanh toán', color: 'text-rose-400', bg: 'bg-rose-500/10', icon: '↑' };
		case 'refund':
			return { label: 'Hoàn tiền', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: '↩' };
		default:
			return { label: type, color: 'text-slate-400', bg: 'bg-slate-500/10', icon: '•' };
	}
}

function getStatusBadge(status: string) {
	switch (status) {
		case 'completed':
			return { label: 'Hoàn thành', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
		case 'pending':
			return { label: 'Đang chờ', color: 'text-amber-400', bg: 'bg-amber-500/15' };
		case 'expired':
			return { label: 'Hết hạn', color: 'text-slate-400', bg: 'bg-slate-500/15' };
		case 'failed':
			return { label: 'Thất bại', color: 'text-red-400', bg: 'bg-red-500/15' };
		default:
			return { label: status, color: 'text-slate-400', bg: 'bg-slate-500/15' };
	}
}

export function WalletPage() {
	const navigate = useNavigate();
	const { wallet, transactions, loading, error, fetchWallet } = useWallet();
	const [showDeposit, setShowDeposit] = useState(false);

	const handleDepositSuccess = () => {
		setShowDeposit(false);
		void fetchWallet();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
					<p className="text-slate-400 font-medium">Đang tải ví...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="text-5xl">⚠️</div>
					<p className="text-red-400">{error}</p>
					<button
						onClick={() => navigate('/login')}
						className="px-6 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
					>
						Đăng nhập
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen pb-20">
			{/* Hero Section */}
			<div className="relative overflow-hidden">
				<div
					className="absolute inset-0 opacity-30"
					style={{
						background:
							'radial-gradient(ellipse at 30% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 100%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
					}}
				/>
				<div className="relative max-w-3xl mx-auto px-4 pt-10 pb-8">
					{/* Balance Card */}
					<div
						className="rounded-2xl p-6 border border-slate-700/40"
						style={{
							background:
								'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.9) 40%, rgba(15, 23, 42, 0.85) 100%)',
							backdropFilter: 'blur(16px)',
							boxShadow:
								'0 20px 40px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
						}}
					>
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div
									className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
									style={{
										background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
										boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
									}}
								>
									💎
								</div>
								<div>
									<h1 className="text-lg font-bold text-white">Ví ArenaS</h1>
									<p className="text-xs text-slate-400">
										{wallet?.status === 'active' ? '🟢 Đang hoạt động' : '🔴 Đã đóng băng'}
									</p>
								</div>
							</div>
							<button
								id="deposit-open-btn"
								onClick={() => setShowDeposit(true)}
								className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
								style={{
									background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
									boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
								}}
							>
								+ Nạp tiền
							</button>
						</div>

						<div>
							<p className="text-sm text-slate-400 mb-1">Số dư hiện tại</p>
							<p
								className="text-4xl font-extrabold tracking-tight"
								style={{
									background: 'linear-gradient(135deg, #ffffff 0%, #a7f3d0 100%)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
								}}
							>
								{formatVND(wallet?.balance ?? 0)}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Transactions */}
			<div className="max-w-3xl mx-auto px-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-bold text-white flex items-center gap-2">
						<span className="text-base">📋</span>
						Lịch sử giao dịch
					</h2>
					<button
						onClick={() => void fetchWallet()}
						className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
					>
						🔄 Làm mới
					</button>
				</div>

				{transactions.length === 0 ? (
					<div
						className="rounded-2xl border border-slate-700/30 p-10 text-center"
						style={{
							background:
								'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.6) 100%)',
						}}
					>
						<div className="text-4xl mb-3 opacity-50">📭</div>
						<p className="text-slate-400">Chưa có giao dịch nào</p>
						<p className="text-sm text-slate-500 mt-1">Nạp tiền để bắt đầu sử dụng ví</p>
					</div>
				) : (
					<div className="space-y-2">
						{transactions.map((tx) => {
							const typeBadge = getTypeBadge(tx.type);
							const statusBadge = getStatusBadge(tx.status);
							const isPositive = tx.type === 'deposit' || tx.type === 'refund';

							return (
								<div
									key={tx.id}
									className="rounded-xl border border-slate-700/30 px-4 py-3.5 flex items-center gap-4 transition-all hover:border-slate-600/50"
									style={{
										background:
											'linear-gradient(145deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.5) 100%)',
									}}
								>
									{/* Icon */}
									<div
										className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${typeBadge.bg} ${typeBadge.color}`}
									>
										{typeBadge.icon}
									</div>

									{/* Info */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-0.5">
											<span className={`text-sm font-semibold ${typeBadge.color}`}>
												{typeBadge.label}
											</span>
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge.bg} ${statusBadge.color}`}
											>
												{statusBadge.label}
											</span>
										</div>
										<div className="flex items-center gap-2 text-xs text-slate-500">
											<span>{formatDate(tx.createdAt)}</span>
											{tx.transferCode && (
												<>
													<span>•</span>
													<span className="font-mono">{tx.transferCode}</span>
												</>
											)}
										</div>
									</div>

									{/* Amount */}
									<div className="text-right shrink-0">
										<span
											className={`text-base font-bold ${
												isPositive ? 'text-emerald-400' : 'text-rose-400'
											}`}
										>
											{isPositive ? '+' : '-'}
											{formatVND(tx.amount)}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Deposit Modal */}
			<DepositModal
				isOpen={showDeposit}
				onClose={() => setShowDeposit(false)}
				onSuccess={handleDepositSuccess}
			/>
		</div>
	);
}
