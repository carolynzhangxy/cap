'use strict';
let toastTimer;
async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('Clipboard unavailable');
    }
    announce('Copied to clipboard');
  } catch {
    announce('Copy unavailable. Select the citation or use the download link.');
  }
}
function announce(message) {
  const status = document.getElementById('copy-status');
  status.textContent = message;
  status.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => status.classList.remove('visible'), 4000);
}
document.getElementById('copy-bib').addEventListener('click', () => copyText(document.getElementById('bibtex').textContent));
document.querySelectorAll('[data-copy-link]').forEach(button => {
  button.addEventListener('click', () => {
    const url = new URL(location.href);
    url.hash = button.dataset.copyLink;
    url.search = '';
    copyText(url.href);
  });
});
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => {
    document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
  });
});
const controllerTabs = [...document.querySelectorAll('.controller-tabs [role="tab"]')];
function selectController(tab) {
  controllerTabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
controllerTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectController(tab));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? controllerTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controllerTabs.length) % controllerTabs.length;
    selectController(controllerTabs[next]);controllerTabs[next].focus();
  });
});

const nhVideo = document.querySelector('#paper-nonholonomic video');
document.querySelectorAll('[data-nh-seek]').forEach(button => {
  button.addEventListener('click', async () => {
    nhVideo.currentTime = Number(button.dataset.nhSeek);
    try { await nhVideo.play(); } catch { nhVideo.focus(); }
  });
});
document.getElementById('nh-fullscreen').addEventListener('click', async () => {
  try {
    if (nhVideo.requestFullscreen) await nhVideo.requestFullscreen();
    else if (nhVideo.webkitEnterFullscreen) nhVideo.webkitEnterFullscreen();
    else window.open(nhVideo.currentSrc, '_blank', 'noopener');
  } catch { nhVideo.focus(); }
});

// Open the relevant mathematical formulation when a replay cites its controller.
document.querySelectorAll("[data-show-controller]").forEach(link => link.addEventListener("click", () => document.getElementById("tab-" + link.dataset.showController)?.click()));

// S0 uses a synchronized slow-motion chapter without altering the archived data.
const s0Video = document.querySelector('#s0-scene video');
document.querySelectorAll('[data-s0-seek]').forEach(button => {
  button.addEventListener('click', async () => {
    s0Video.currentTime = Number(button.dataset.s0Seek);
    try { await s0Video.play(); } catch { s0Video.focus(); }
  });
});
document.getElementById('s0-fullscreen').addEventListener('click', async () => {
  try {
    if (s0Video.requestFullscreen) await s0Video.requestFullscreen();
    else if (s0Video.webkitEnterFullscreen) s0Video.webkitEnterFullscreen();
    else window.open(s0Video.currentSrc, '_blank', 'noopener');
  } catch { s0Video.focus(); }
});
