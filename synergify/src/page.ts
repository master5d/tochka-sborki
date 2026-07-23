// Pre-launch page for synergify.com — self-contained, no external assets (CSP-clean).
export const PAGE_HTML = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Synergify</title>
<meta name="description" content="Synergify — экосистема S.A.S.H.A. и открытого курса «Точка Сборки». Скоро.">
<style>
  :root {
    --bg: #0b0d10;
    --surface: #12151a;
    --text: #e8eaed;
    --muted: #9aa3ad;
    --accent: #7aa2f7;
    --border: #232830;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    -webkit-font-smoothing: antialiased;
  }
  main { max-width: 26rem; width: 100%; text-align: center; }
  h1 {
    font-size: clamp(2.2rem, 8vw, 3rem);
    font-weight: 700;
    letter-spacing: 0.02em;
    background: linear-gradient(135deg, var(--text) 40%, var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .subtitle { margin-top: 0.9rem; color: var(--muted); line-height: 1.55; font-size: 1rem; }
  .subtitle strong { color: var(--text); font-weight: 600; }
  form { margin-top: 2rem; display: flex; flex-direction: column; gap: 0.6rem; }
  input[type="email"] {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border-radius: 0.6rem;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    font-size: 1rem;
  }
  input[type="email"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: transparent; }
  button {
    padding: 0.75rem 0.9rem;
    border-radius: 0.6rem;
    border: none;
    background: var(--accent);
    color: #0b0d10;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover { filter: brightness(1.08); }
  button:disabled { opacity: 0.6; cursor: default; }
  .hp { position: absolute; left: -9999px; top: -9999px; height: 1px; width: 1px; overflow: hidden; }
  #msg { margin-top: 0.9rem; min-height: 1.4em; font-size: 0.95rem; color: var(--muted); }
  #msg.ok { color: #9ece6a; }
  #msg.err { color: #f7768e; }
  .en { margin-top: 2.2rem; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <h1>Synergify</h1>
  <p class="subtitle">Экосистема <strong>S.A.S.H.A.</strong> и открытого курса <strong>«Точка Сборки»</strong>.<br>Скоро здесь появится больше. Оставьте почту — напишем, когда откроемся.</p>
  <form id="subscribe" method="post" action="/api/subscribe">
    <input type="email" name="email" placeholder="ваш@email" required autocomplete="email" aria-label="Email">
    <div class="hp" aria-hidden="true">
      <label>Не заполняйте это поле<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
    </div>
    <button type="submit">Подписаться</button>
  </form>
  <p id="msg" role="status" aria-live="polite"></p>
  <p class="en">Synergify — the home of S.A.S.H.A. and the Tochka Sborki ecosystem. Launching soon.</p>
</main>
<script>
(function () {
  var form = document.getElementById('subscribe');
  var msg = document.getElementById('msg');

  // Нативный no-JS фолбэк: после form-encoded сабмита воркер 303-редиректит
  // сюда с ?subscribed=… — показываем тот же статус, что и fetch-путь.
  var subscribed = new URLSearchParams(location.search).get('subscribed');
  if (subscribed) {
    if (subscribed === '1') { msg.className = 'ok'; msg.textContent = 'Готово! Проверьте почту.'; }
    else if (subscribed === 'already') { msg.className = 'ok'; msg.textContent = 'Вы уже подписаны — спасибо!'; }
    else if (subscribed === 'invalid') { msg.className = 'err'; msg.textContent = 'Проверьте адрес почты.'; }
    else { msg.className = 'err'; msg.textContent = 'Не получилось. Попробуйте позже.'; }
    history.replaceState(null, '', '/');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = form.querySelector('button');
    var email = form.querySelector('input[name="email"]').value.trim();
    var website = form.querySelector('input[name="website"]').value;
    btn.disabled = true;
    msg.className = '';
    msg.textContent = '…';
    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, website: website })
    }).then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
      .then(function (res) {
        if (res.data && res.data.ok) {
          msg.className = 'ok';
          msg.textContent = res.data.already ? 'Вы уже подписаны — спасибо!' : 'Готово! Проверьте почту.';
          form.reset();
        } else if (res.status === 400) {
          msg.className = 'err';
          msg.textContent = 'Проверьте адрес почты.';
        } else {
          msg.className = 'err';
          msg.textContent = 'Не получилось. Попробуйте позже.';
        }
      })
      .catch(function () {
        msg.className = 'err';
        msg.textContent = 'Не получилось. Попробуйте позже.';
      })
      .finally(function () { btn.disabled = false; });
  });
})();
</script>
</body>
</html>
`
