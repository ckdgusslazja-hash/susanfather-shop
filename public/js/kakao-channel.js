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
    <a class="kakao-channel-fab" href="${chatUrl}" target="_blank" rel="noopener noreferrer" aria-label="빠른문의">
      <span class="kakao-channel-fab__circle" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.56 5.37 4 6.86L5 21l3.72-2.05c1.08.3 2.22.46 3.41.46 5.52 0 10-3.58 10-8.03C22 6.58 17.52 3 12 3z"/></svg>
      </span>
      <span class="kakao-channel-fab__label">빠른문의</span>
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
