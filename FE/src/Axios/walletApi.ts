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
	type: 'deposit' | 'payment' | 'refund';
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

