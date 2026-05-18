import { useState, useEffect, useRef, useCallback } from 'react';
import { getDepositStatus } from '../Axios/walletApi';

type DepositPollingStatus = 'pending' | 'completed' | 'expired' | 'failed';

type UseDepositPollingReturn = {
	status: DepositPollingStatus | null;
	isCompleted: boolean;
	isExpired: boolean;
	error: string | null;
};

export function useDepositPolling(
	transferCode: string | null,
	enabled: boolean
): UseDepositPollingReturn {
	const [status, setStatus] = useState<DepositPollingStatus | null>(null);
	const [error, setError] = useState<string | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!transferCode || !enabled) {
			stopPolling();
			return;
		}

		const poll = async () => {
			try {
				const data = await getDepositStatus(transferCode);
				const txStatus = data.transaction.status;
				setStatus(txStatus);

				// Stop polling if terminal state
				if (txStatus === 'completed' || txStatus === 'expired' || txStatus === 'failed') {
					stopPolling();
				}
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Polling failed';
				setError(message);
			}
		};

		// Initial poll
		void poll();

		// Poll every 5 seconds
		intervalRef.current = setInterval(poll, 5000);

		return () => {
			stopPolling();
		};
	}, [transferCode, enabled, stopPolling]);

	return {
		status,
		isCompleted: status === 'completed',
		isExpired: status === 'expired',
		error,
	};
}
