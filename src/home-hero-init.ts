function setHomeHero() {
  const h = window.location.hash || '';
  const isHome = h === '' || h === '#' || h === '#/';
  document.body.classList.toggle('home-hero', isHome);
}
// Run on load + on hash changes
window.addEventListener('hashchange', setHomeHero);
window.addEventListener('load', setHomeHero);
setHomeHero();
