
if (window.innerWidth <= 768 && !new URLSearchParams(window.location.search).has("proceed")) {
  window.location.href = "/mobile.html";
}

addEventListener("DOMContentLoaded", () => {
  const box = document.getElementById("nowplaying");
  if (!box) return;
  const text = document.getElementById("np-text");
  const cover = document.getElementById("np-cover");

  const setText = (t) => { if (text.textContent !== t) text.textContent = t; };
  const setCover = (src) => {
    const target = src || "images/silence.jpg";
    if (cover.getAttribute("src") !== target) cover.setAttribute("src", target);
    cover.classList.add("visible");
  };

  let dots = 0;
  let dotsTimer = null;

  const startDots = () => {
    setCover(null);
    if (dotsTimer) return;
    setText("NOTHING_PLAYING");
    dotsTimer = setInterval(() => {
      dots = (dots + 1) % 4;
      setText("NOTHING_PLAYING" + ".".repeat(dots));
    }, 400);
  };

  const stopDots = () => {
    if (!dotsTimer) return;
    clearInterval(dotsTimer);
    dotsTimer = null;
  };

  const render = (s) => {
    if (!s || s.status === "Offline" || s.status === "Paused") return startDots();
    stopDots();
    setCover(s.cover);
    const track = [s.title, s.artist].filter(Boolean).join(" – ") || "Unknown";
    setText(`${track}${s.album ? ` (${s.album})` : ""}`);
  };

  let delay = 1000;

  const connect = () => {
    const ws = new WebSocket("wss://sonstream.alpwrk.cc");

    const heartbeat = setTimeout(() => ws.close(), 10000);

    ws.onopen = () => { delay = 1000; };

    ws.onmessage = (e) => {
      clearTimeout(heartbeat);
      try { render(JSON.parse(e.data)); } catch (_) {}
    };

    ws.onclose = () => {
      clearTimeout(heartbeat);
      render(null);
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, 30000);
    };

    ws.onerror = () => ws.close();
  };

  render(null);
  connect();
});
