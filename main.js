
if (window.innerWidth <= 768 && !new URLSearchParams(window.location.search).has("proceed")) {
  window.location.href = "/mobile.html";
}