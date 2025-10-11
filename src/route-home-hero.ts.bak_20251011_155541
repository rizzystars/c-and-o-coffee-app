function isHome(): boolean {
  return location.hash === '' || location.hash === '#/' || location.hash === '#';
}

function ensureFixedLayer() {
  if (!document.getElementById('home-fixed-bg')) {
    const div = document.createElement('div');
    div.id = 'home-fixed-bg';
    div.setAttribute('aria-hidden', 'true');
    document.body.prepend(div);
  }
}

// Kill any competing body background on home
function clearBodyBg() {
  const props = ['background', 'background-image'];
  for (const p of props) document.body.style.setProperty(p, 'none', 'important');
}
function restoreBodyBg() {
  document.body.style.removeProperty('background');
  document.body.style.removeProperty('background-image');
}

const DESIRED_BG = "url('/cappuccino-crew_2560.webp') center 20% / cover no-repeat";

function styleFixedBg() {
  const el = document.getElementById('home-fixed-bg') as HTMLElement | null;
  if (!el) return;
  const set = (prop: string, value: string) => el.style.setProperty(prop, value, 'important');

  // geometry
  set('position', 'fixed');
  set('top', '0'); set('right', '0'); set('bottom', '0'); set('left', '0');
  set('z-index', '-1'); set('pointer-events', 'none');

  // set the WHOLE background in one go so later partial changes can't reset position
  set('background', DESIRED_BG);

  // stability
  set('transform', 'translateZ(0)');
  set('will-change', 'opacity');
}

function guardFixedBg() {
  const el = document.getElementById('home-fixed-bg');
  if (!el) return;
  const applyIfDrifted = () => {
    const cs = getComputedStyle(el);
    const pos = cs.backgroundPosition;
    const size = cs.backgroundSize;
    const rep  = cs.backgroundRepeat;
    if (pos !== 'center 20%' || size !== 'cover' || rep !== 'no-repeat') {
      styleFixedBg();
    }
  };
  // Re-assert on mutations to style or class
  const mo = new MutationObserver(applyIfDrifted);
  mo.observe(el, { attributes: true, attributeFilter: ['style','class'] });
  // Also on resize/orientation
  window.addEventListener('resize', applyIfDrifted);
  window.addEventListener('orientationchange', applyIfDrifted);
  // Initial check
  applyIfDrifted();
}

function apply() {
  if (isHome()) {
    document.body.classList.add('home-hero');
    clearBodyBg();
  } else {
    document.body.classList.remove('home-hero');
    restoreBodyBg();
  }
}

export function initHomeHeroRouteListener() {
  ensureFixedLayer();
  styleFixedBg();
  guardFixedBg();
  apply();
  window.addEventListener('hashchange', () => { apply(); styleFixedBg(); });
  window.addEventListener('popstate',  () => { apply(); styleFixedBg(); });
}
