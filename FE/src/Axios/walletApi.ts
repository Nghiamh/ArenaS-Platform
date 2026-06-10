import { axiosClient } from './Axios';

// ─── Types ──────────────────────────────────────────────────────────────────

export type WalletInfo = {
	id: string;
	userId: string;
	balance: number;
	status: 'active' | 'frozen';
	createdAt?: string;
	updatedAt?: string;
};

export type WalletTransactionInfo = {
	id: string;
	walletId: string;
	bookingId?: string;
	amount: number;
	type: 'deposit' | 'payment' | 'refund' | 'withdraw';
	status: 'pending' | 'completed' | 'expired' | 'failed';
	transferCode?: string;
	expiredAt?: string;
	createdAt?: string;
	updatedAt?: string;
};

type WalletResponse = {
	message: string;
	wallet: WalletInfo;
	transactions: WalletTransactionInfo[];
};

type CreateDepositResponse = {
	message: string;
	transferCode: string;
	qrUrl: string;
	amount: number;
	expiredAt: string;
};

type DepositStatusResponse = {
	message: string;
	transaction: {
		id: string;
		amount: number;
		status: 'pending' | 'completed' | 'expired' | 'failed';
		transferCode: string;
		expiredAt?: string;
		createdAt?: string;
	};
};

type DeductResponse = {
	message: string;
	wallet: WalletInfo | null;
};

export type WithdrawalRequestInfo = {
	_id: string;
	ownerId: string | { _id: string; name: string; userName: string; email: string; phone: string };
	amount: number;
	bankName: string;
	bankAccountName: string;
	bankAccountNumber: string;
	status: 'pending' | 'approved' | 'rejected';
	adminNote?: string;
	isReported?: boolean;
	reportMessage?: string;
	isReportResolved?: boolean;
	reportResolutionMessage?: string;
	isReceiptConfirmed?: boolean;
	createdAt: string;
	updatedAt: string;
};

type WithdrawalRequestsResponse = {
	message: string;
	requests: WithdrawalRequestInfo[];
};

type RequestWithdrawalResponse = {
	message: string;
	request: WithdrawalRequestInfo;
};


// ─── API Functions ──────────────────────────────────────────────────────────

export async function getMyWallet(): Promise<WalletResponse> {
	try {
		const { data } = await axiosClient.get<WalletResponse>('/wallet');
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to load wallet'
		);
	}
}

export async function createDeposit(amount: number): Promise<CreateDepositResponse> {
	try {
		const { data } = await axiosClient.post<CreateDepositResponse>(
			'/payment/deposit',
			{ amount }
		);
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to create deposit'
		);
	}
}

export async function getDepositStatus(
	transferCode: string
): Promise<DepositStatusResponse> {
	try {
		const { data } = await axiosClient.get<DepositStatusResponse>(
			`/payment/deposit/${transferCode}`
		);
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to get deposit status'
		);
	}
}

export async function deductBalance(
	amount: number,
	bookingId?: string
): Promise<DeductResponse> {
	try {
		const { data } = await axiosClient.post<DeductResponse>('/wallet/deduct', {
			amount,
			bookingId,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to deduct balance'
		);
	}
}

export async function requestWithdrawal(
	amount: number,
	bankName: string,
	bankAccountName: string,
	bankAccountNumber: string
): Promise<RequestWithdrawalResponse> {
	try {
		const { data } = await axiosClient.post<RequestWithdrawalResponse>('/wallet/withdraw', {
			amount,
			bankName,
			bankAccountName,
			bankAccountNumber,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to request withdrawal'
		);
	}
}

export async function getWithdrawalRequests(): Promise<WithdrawalRequestsResponse> {
	try {
		const { data } = await axiosClient.get<WithdrawalRequestsResponse>('/wallet/withdrawals');
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to get withdrawal requests'
		);
	}
}

export async function processWithdrawal(
	id: string,
	status: 'approved' | 'rejected',
	adminNote?: string
): Promise<RequestWithdrawalResponse> {
	try {
		const { data } = await axiosClient.put<RequestWithdrawalResponse>(`/wallet/withdrawals/${id}`, {
			status,
			adminNote,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to process withdrawal'
		);
	}
}

export async function reportWithdrawal(
	id: string,
	message?: string
): Promise<RequestWithdrawalResponse> {
	try {
		const { data } = await axiosClient.post<RequestWithdrawalResponse>(`/wallet/withdrawals/${id}/report`, {
			message,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to report withdrawal'
		);
	}
}

export async function resolveReport(
	id: string,
	message: string
): Promise<RequestWithdrawalResponse> {
	try {
		const { data } = await axiosClient.post<RequestWithdrawalResponse>(`/wallet/withdrawals/${id}/resolve`, {
			message,
		});
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to resolve report'
		);
	}
}

export async function confirmReceipt(
	id: string
): Promise<RequestWithdrawalResponse> {
	try {
		const { data } = await axiosClient.post<RequestWithdrawalResponse>(`/wallet/withdrawals/${id}/confirm-receipt`);
		return data;
	} catch (error: unknown) {
		throw new Error(
			error instanceof Error ? error.message : 'Failed to confirm receipt'
		);
	}
}

