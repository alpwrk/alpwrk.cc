
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
    if (src) {
      if (cover.getAttribute("src") !== src) cover.setAttribute("src", src);
      cover.classList.add("visible");
    } else {
      cover.removeAttribute("src");
      cover.classList.remove("visible");
    }
  };

  const render = (s) => {
    if (!s || s.status === "Offline") {
      setText("Now playing: Offline");
      return setCover(null);
    }
    setCover(s.cover);
    if (s.status === "Paused") return setText("Paused");
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

  connect();
});
