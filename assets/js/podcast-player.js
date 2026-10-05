(() => {
  const format = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  document.querySelectorAll('[data-podcast-player]').forEach(player => {
    if (player.dataset.ready) return;
    player.dataset.ready = 'true';
    const audio = player.querySelector('audio');
    const play = player.querySelector('.podcast-player__play');
    const seek = player.querySelector('input');
    const speed = player.querySelector('.podcast-player__speed');
    const status = player.querySelector('[role="status"]');
    const message = text => { status.textContent = text; status.hidden = !text; };
    const session = navigator.mediaSession;
    let ownsSession = false;
    const updateSession = () => {
      if (!session || !ownsSession) return;
      session.playbackState = audio.paused || audio.ended ? 'paused' : 'playing';
      if (session.setPositionState && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          session.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: Math.min(audio.duration, Math.max(0, audio.currentTime)),
          });
        } catch { /* Older browsers may expose only part of Media Session. */ }
      }
    };
    const resume = async () => {
      message('');
      try { await audio.play(); } catch { message('Unable to play. Please try again.'); }
    };
    const jump = position => {
      if (!Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.min(audio.duration, Math.max(0, position));
      sync();
    };
    audio.addEventListener('play', () => {
      if (!session) return;
      ownsSession = true;
      if ('MediaMetadata' in window) {
        session.metadata = new MediaMetadata({
          title: player.querySelector('.podcast-player__title').textContent,
          artist: player.dataset.show,
          album: player.dataset.show,
          artwork: [{ src: player.dataset.artwork, sizes: '1254x1254', type: 'image/png' }],
        });
      }
      const actions = {
        play: resume,
        pause: () => audio.pause(),
        seekbackward: details => jump(audio.currentTime - (details.seekOffset || 15)),
        seekforward: details => jump(audio.currentTime + (details.seekOffset || 15)),
        seekto: details => jump(details.seekTime),
        stop: () => { audio.pause(); jump(0); },
      };
      for (const [action, handler] of Object.entries(actions)) {
        try { session.setActionHandler(action, handler); } catch { /* Unsupported action. */ }
      }
      updateSession();
    });
    const sync = () => {
      updateSession();
      const playing = !audio.paused && !audio.ended;
      play.setAttribute('aria-label', playing ? 'Pause episode' : 'Play episode');
      player.querySelector('.podcast-player__play-icon').hidden = playing;
      player.querySelector('.podcast-player__pause-icon').hidden = !playing;
      if (Number.isFinite(audio.duration)) {
        seek.disabled = false;
        seek.max = audio.duration;
        player.querySelector('[data-duration]').textContent = format(Math.ceil(audio.duration));
      }
      seek.value = audio.currentTime;
      seek.setAttribute('aria-valuetext', `${format(audio.currentTime)} elapsed`);
      player.querySelector('[data-elapsed]').textContent = format(audio.currentTime);
    };
    play.addEventListener('click', () => {
      if (!audio.paused) audio.pause();
      else resume();
    });
    seek.addEventListener('input', () => { audio.currentTime = Number(seek.value); sync(); });
    const rates = [1, 1.25, 1.5, 1.75, 2, 0.75];
    speed.addEventListener('click', () => {
      audio.playbackRate = rates[(rates.indexOf(audio.playbackRate) + 1) % rates.length];
      speed.textContent = `${audio.playbackRate}×`;
      speed.setAttribute('aria-label', `Playback speed: ${audio.playbackRate} times`);
    });
    ['loadedmetadata', 'durationchange', 'timeupdate', 'ratechange', 'seeked', 'play', 'pause', 'ended'].forEach(event => audio.addEventListener(event, sync));
    audio.addEventListener('waiting', () => message('Loading audio…'));
    audio.addEventListener('playing', () => message(''));
    audio.addEventListener('error', () => message('Audio could not load. Please try again.'));
    audio.hidden = true;
    audio.controls = false;
    player.querySelector('.podcast-player__controls').hidden = false;
  });
})();
