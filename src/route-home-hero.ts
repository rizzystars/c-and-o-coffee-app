function isHome(): boolean {
  return location.hash === '' || location.hash === '#/' || location.hash === '#';
}
function apply() {
  if (isHome()) {
    document.body.classList.add('home-hero');
  } else {
    document.body.classList.remove('home-hero');
  }
}
export function initHomeHeroRouteListener() {
  apply();
  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', apply);
}
