const KAKAO_AUTH_URL = 'https://kauth.kakao.com/oauth/authorize';
const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_USER_URL = 'https://kapi.kakao.com/v2/user/me';

function getKakaoConfig(siteUrl) {
  const restApiKey = process.env.KAKAO_REST_API_KEY || '';
  const base = siteUrl || 'http://localhost:3000';
  const redirectUri =
    process.env.KAKAO_REDIRECT_URI || `${base.replace(/\/$/, '')}/api/auth/kakao/callback`;
  return { restApiKey, redirectUri, enabled: !!restApiKey };
}

function buildAuthorizeUrl(config) {
  const url = new URL(KAKAO_AUTH_URL);
  url.searchParams.set('client_id', config.restApiKey);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'profile_nickname,account_email');
  return url.toString();
}

async function exchangeCodeForToken(code, config) {
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
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error_description || data.error || '카카오 토큰 발급 실패';
    throw new Error(msg);
  }
  return data.access_token;
}

async function fetchKakaoProfile(accessToken) {
  const res = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
  });
  const data = await res.json();
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

module.exports = {
  getKakaoConfig,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchKakaoProfile,
};
