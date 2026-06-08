const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

export interface KakaoConfig {
  restApiKey: string;
  clientSecret: string;
  redirectUri: string;
  enabled: boolean;
}

function stripEnv(value: string): string {
  return value.replace(/^\uFEFF+/, '').trim();
}

export function getKakaoConfig(siteUrl: string): KakaoConfig {
  const restApiKey = stripEnv(process.env.KAKAO_REST_API_KEY || '');
  const clientSecret = stripEnv(process.env.KAKAO_CLIENT_SECRET || '');
  const base = siteUrl || 'http://localhost:3000';
  const redirectUri = stripEnv(
    process.env.KAKAO_REDIRECT_URI || `${base.replace(/\/$/, '')}/api/auth/kakao/callback`
  );
  return { restApiKey, clientSecret, redirectUri, enabled: !!restApiKey };
}

export function buildAuthorizeUrl(config: KakaoConfig): string {
  const url = new URL(KAKAO_AUTH_URL);
  url.searchParams.set('client_id', config.restApiKey);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  // scope 미지정 → 카카오 콘솔 [동의항목]에 활성화된 항목만 동의 화면에 표시 (KOE205 방지)
  return url.toString();
}

export async function exchangeCodeForToken(code: string, config: KakaoConfig): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    code,
  });
  if (config.clientSecret) {
    body.set('client_secret', config.clientSecret);
  }
  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: body.toString(),
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok) {
    let msg = data.error_description || data.error || '카카오 토큰 발급 실패';
    if (msg === 'Bad client credentials') {
      msg =
        '카카오 클라이언트 시크릿이 필요합니다. 카카오 콘솔 [플랫폼 키 > REST API 키 > 클라이언트 시크릿] 값을 확인해 주세요.';
    }
    throw new Error(msg);
  }
  if (!data.access_token) throw new Error('카카오 토큰 발급 실패');
  return data.access_token;
}

export interface KakaoProfile {
  kakaoId: string;
  nickname: string;
  email: string | null;
  phone: string | null;
}

function formatKoreanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('82') && digits.length >= 11) digits = `0${digits.slice(2)}`;
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw.trim();
}

export async function fetchKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch(KAKAO_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
  });
  const data = (await res.json()) as {
    id?: number;
    msg?: string;
    kakao_account?: {
      email?: string;
      is_email_valid?: boolean;
      name?: string;
      phone_number?: string;
      phone_number_needs_agreement?: boolean;
      profile?: { nickname?: string };
    };
  };
  if (!res.ok) {
    throw new Error(data.msg || '카카오 사용자 정보 조회 실패');
  }
  const kakaoId = String(data.id);
  const account = data.kakao_account || {};
  const profile = account.profile || {};
  const nickname = (profile.nickname || account.name || '').trim() || '카카오회원';
  const email = account.email && account.is_email_valid ? account.email.toLowerCase() : null;
  const phone =
    account.phone_number && account.phone_number_needs_agreement === false
      ? formatKoreanPhone(account.phone_number)
      : null;
  return { kakaoId, nickname, email, phone };
}
