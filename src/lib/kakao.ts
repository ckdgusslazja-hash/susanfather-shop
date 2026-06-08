const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

export interface KakaoConfig {
  restApiKey: string;
  redirectUri: string;
  enabled: boolean;
}

function stripEnv(value: string): string {
  return value.replace(/^\uFEFF+/, '').trim();
}

export function getKakaoConfig(siteUrl: string): KakaoConfig {
  const restApiKey = stripEnv(process.env.KAKAO_REST_API_KEY || '');
  const base = siteUrl || 'http://localhost:3000';
  const redirectUri = stripEnv(
    process.env.KAKAO_REDIRECT_URI || `${base.replace(/\/$/, '')}/api/auth/kakao/callback`
  );
  return { restApiKey, redirectUri, enabled: !!restApiKey };
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
  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: body.toString(),
  });
  const data = (await res.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!res.ok) {
    const msg = data.error_description || data.error || '카카오 토큰 발급 실패';
    throw new Error(msg);
  }
  if (!data.access_token) throw new Error('카카오 토큰 발급 실패');
  return data.access_token;
}

export interface KakaoProfile {
  kakaoId: string;
  nickname: string;
  email: string | null;
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
      profile?: { nickname?: string };
    };
  };
  if (!res.ok) {
    throw new Error(data.msg || '카카오 사용자 정보 조회 실패');
  }
  const kakaoId = String(data.id);
  const account = data.kakao_account || {};
  const profile = account.profile || {};
  const nickname = profile.nickname || '카카오회원';
  const email = account.email && account.is_email_valid ? account.email.toLowerCase() : null;
  return { kakaoId, nickname, email };
}
