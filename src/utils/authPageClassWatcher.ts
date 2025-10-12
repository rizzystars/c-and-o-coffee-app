export function initAuthPageClassWatcher() {
  function update() {
    const loc = (location.pathname || "") + (location.hash || "");
    const isAuth = /(^|\/)(login|signup|forgot)\b/i.test(loc);
    document.body.classList.toggle("auth-page", !!isAuth);
  }
  window.addEventListener("hashchange", update);
  window.addEventListener("popstate", update);
  const _pushState = history.pushState;
  history.pushState = function() {
    // @ts-ignore
    const r = _pushState.apply(this, arguments as any);
    update();
    return r;
  };
  update();
}
