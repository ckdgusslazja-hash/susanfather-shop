/**
 * 카카오톡 채널 1:1 채팅 위젯 (메인 화면)
 */
let kakaoChannelMountedId = null;

function getKakaoChannelPublicId() {
  const raw = String((typeof API !== 'undefined' && API.shopSettings?.kakaoChannelId) || '').trim();
  if (!raw) return '';
  return raw.startsWith('_') ? raw : `_${raw.replace(/^_+/, '')}`;
}

function shouldShowKakaoChannelWidget() {
  return typeof state !== 'undefined' && state.page === 'home' && !!getKakaoChannelPublicId();
}

function renderKakaoChannelButton(channelId) {
  const container = document.getElementById('kakao-channel-chat-button');
  if (!container) return;
  const chatUrl = `https://pf.kakao.com/${encodeURIComponent(channelId)}/chat`;
  container.innerHTML = `
    <a class="kakao-channel-fab" href="${chatUrl}" target="_blank" rel="noopener noreferrer" aria-label="카카오톡 문의하기">
      <span class="kakao-channel-fab__bubble" aria-hidden="true">
        <span class="kakao-channel-fab__text">카카오톡<br>문의하기</span>
      </span>
    </a>`;
}

function mountKakaoChannelButton(channelId) {
  const container = document.getElementById('kakao-channel-chat-button');
  if (!container) return;
  if (kakaoChannelMountedId === channelId && container.childElementCount) return;

  kakaoChannelMountedId = channelId;
  renderKakaoChannelButton(channelId);
}

function updateKakaoChannelWidget() {
  const wrap = document.getElementById('kakao-channel-widget');
  if (!wrap) return;

  const show = shouldShowKakaoChannelWidget();
  wrap.hidden = !show;
  document.body.classList.toggle('has-kakao-channel', show);

  if (!show) return;

  const channelId = getKakaoChannelPublicId();
  mountKakaoChannelButton(channelId);
}
