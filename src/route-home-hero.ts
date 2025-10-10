function applyHomeHero() {
  // HashRouter home is '#/' (treat '' and '#' as home too just in case)
  const h = window.location.hash || '#/';
  const onHome = h === '#/' || h === '' || h === '#';
  document.body.classList.toggle('home-hero', onHome);
}
// Run once on load
applyHomeHero();
// Keep it in sync as the hash changes
window.addEventListener('hashchange', applyHomeHero);
window.addEventListener('popstate', applyHomeHero);
