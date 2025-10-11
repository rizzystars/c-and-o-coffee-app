function isHome(): boolean {
  return location.hash === '' || location.hash === '#/' || location.hash === '#';
}

function clearBodyBg() {
  const props = ["background","background-image"];
  for (const p of props) document.body.style.setProperty(p, "none", "important");
}
function restoreBodyBg() {
  document.body.style.removeProperty("background");
  document.body.style.removeProperty("background-image");
}
function apply() {
  if (isHome()) document.body.classList.add('home-hero');
  else document.body.classList.remove('home-hero');
}

function ensureFixedLayer() {
  if (!document.getElementById('home-fixed-bg')) {
    const div = document.createElement('div');
    div.id = 'home-fixed-bg';
    div.setAttribute('aria-hidden', 'true');
    document.body.prepend(div);
  }
}

export function initHomeHeroRouteListener() {
  ensureFixedLayer();
  apply();
  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', apply);
}

