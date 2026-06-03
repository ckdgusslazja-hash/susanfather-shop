export interface TossKeys {
  clientKey: string;
  secretKey: string;
}

export interface PaymentSetting {
  provider?: string;
  testMode?: boolean;
  notice?: string;
  enabledMethods?: string[];
  bankAccount?: {
    bank?: string;
    number?: string;
    holder?: string;
  };
}

export function getTossKeys(testMode: boolean): TossKeys | null {
  const clientKey = testMode
    ? process.env.TOSS_TEST_CLIENT_KEY || process.env.TOSS_CLIENT_KEY
    : process.env.TOSS_LIVE_CLIENT_KEY || process.env.TOSS_CLIENT_KEY;
  const secretKey = testMode
    ? process.env.TOSS_TEST_SECRET_KEY || process.env.TOSS_SECRET_KEY
    : process.env.TOSS_LIVE_SECRET_KEY || process.env.TOSS_SECRET_KEY;
  if (!clientKey || !secretKey) return null;
  return { clientKey, secretKey };
}

export function isPaymentEnabled(setting: PaymentSetting | null): boolean {
  if (!setting || setting.provider === 'demo') return false;
  const testMode = setting.testMode ?? true;
  return !!getTossKeys(testMode);
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number,
  secretKey: string
) {
  const auth = Buffer.from(`${secretKey}:`).toString('base64');
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const data = (await res.json()) as { message?: string; code?: string };
  if (!res.ok) {
    throw new Error(data.message || '결제 승인에 실패했습니다.');
  }
  return data;
}
