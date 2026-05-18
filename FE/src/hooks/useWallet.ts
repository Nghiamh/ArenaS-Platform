import { useState, useEffect, useCallback } from 'react';
import {
	getMyWallet,
	type WalletInfo,
	type WalletTransactionInfo,
} from '../Axios/walletApi';

type UseWalletReturn = {
	wallet: WalletInfo | null;
	transactions: WalletTransactionInfo[];
	loading: boolean;
	error: string | null;
	fetchWallet: () => Promise<void>;
};

export function useWallet(): UseWalletReturn {
	const [wallet, setWallet] = useState<WalletInfo | null>(null);
	const [transactions, setTransactions] = useState<WalletTransactionInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchWallet = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getMyWallet();
			setWallet(data.wallet);
			setTransactions(data.transactions);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'Failed to load wallet';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchWallet();
	}, [fetchWallet]);

	return { wallet, transactions, loading, error, fetchWallet };
}
