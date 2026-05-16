const BANK_ID = process.env.VIETQR_BANK_ID || "";
const ACCOUNT_NO = process.env.VIETQR_ACCOUNT_NO || "";
const ACCOUNT_NAME = process.env.VIETQR_ACCOUNT_NAME || "";

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomAlphanumeric(length: number): string {
	let result = "";

	for (let i = 0; i < length; i++) {
		result += ALPHANUMERIC.charAt(
			Math.floor(Math.random() * ALPHANUMERIC.length)
		);
	}

	return result;
}

function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${month}${day}`;
}

/**
 * Generate a unique transfer code in the format DEP-YYYYMMDD-XXXXX
 */
export function generateTransferCode(): string {
	const datePart = formatDate(new Date());
	const randomPart = randomAlphanumeric(5);
	return `DEP${datePart}${randomPart}`;
}

/**
 * Build VietQR image URL for a bank transfer
 */
export function buildVietQRUrl(amount: number, memo: string): string {
	const encodedMemo = encodeURIComponent(memo);
	const encodedName = encodeURIComponent(ACCOUNT_NAME);
	return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${amount}&addInfo=${encodedMemo}&accountName=${encodedName}`;
}

export { BANK_ID, ACCOUNT_NO, ACCOUNT_NAME };
