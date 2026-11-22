// Pictures and wording for "add the app to your Home Screen".
// Used by the golfer app (one step per screen) and the admin's printed QR sheet.
(function () {
  const BLUE = '#0a7aff', GREEN = '#1f6b3a';
  const ring = 'box-shadow:0 0 0 4px #fff,0 0 0 8px #e0a100;border-radius:14px';

  const shareIcon = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${BLUE}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-label="Share button"><path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5"/><path d="M12 3v11"/><path d="M8.5 6.5 12 3l3.5 3.5"/></svg>`;
  const dotsIcon = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-label="More button"><circle cx="12" cy="12" r="10.5" fill="none" stroke="${BLUE}" stroke-width="1.6"/><circle cx="7.5" cy="12" r="1.5" fill="${BLUE}"/><circle cx="12" cy="12" r="1.5" fill="${BLUE}"/><circle cx="16.5" cy="12" r="1.5" fill="${BLUE}"/></svg>`;
  const addIcon = (s = 30) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="1.8" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
  const kebabIcon = (s = 40) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#333" aria-label="Menu button"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;
  const appIcon = (s = 64) => `<img src="icon-192.png" alt="" style="width:${s}px;height:${s}px;border-radius:${s * .22}px;display:block">`;
  const box = inner => `<div style="background:#eef1ef;border-radius:18px;padding:16px;display:flex;justify-content:center;align-items:center;min-height:120px">${inner}</div>`;
  const grey = '<span style="display:inline-block;width:26px;height:26px;border-radius:7px;background:#c9cfcb"></span>';

  // --- pictures ---
  const pics = {
    safariBar: () => box(`<div style="background:#fff;border-radius:22px;padding:10px 18px;display:flex;gap:22px;align-items:center;font-size:30px;color:${BLUE}">
        <span>‹</span><span style="opacity:.35">›</span><span style="${ring};padding:4px 6px;display:flex">${shareIcon(40)}</span><span style="opacity:.35">▢</span><span style="opacity:.35">⧉</span></div>`),
    newerSafari: () => `<div style="display:flex;align-items:center;justify-content:center;gap:10px;font-size:1.05rem;margin-top:10px">
        <span style="${ring};display:flex;padding:3px">${dotsIcon(34)}</span><span>then</span><span style="display:flex;align-items:center;gap:4px;font-weight:700">${shareIcon(28)} Share</span></div>`,
    newBar: () => box(`<div style="background:#fff;border-radius:24px;padding:8px 12px;display:flex;gap:10px;align-items:center;width:100%;max-width:320px;font-size:28px;color:${BLUE}">
        <span>‹</span><span style="flex:1;background:#eef1ef;border-radius:16px;padding:8px 10px;color:#666;font-size:.95rem;text-align:center">tonymeuse.github.io</span><span style="${ring};display:flex;padding:3px">${dotsIcon(38)}</span></div>`),
    shareRow: () => box(`<div style="background:#fff;border-radius:14px;width:100%;max-width:300px;overflow:hidden;font-size:1.05rem">
        <div style="padding:12px 14px;font-weight:700;display:flex;justify-content:space-between;align-items:center;${ring}">Share ${shareIcon(28)}</div>
        <div style="padding:12px 14px;border-top:1px solid #e5e5e5;color:#999">Add to Bookmarks</div>
        <div style="padding:12px 14px;border-top:1px solid #e5e5e5;color:#999">New Tab</div></div>`),
    chromeBar: () => box(`<div style="background:#fff;border-radius:14px;padding:10px 14px;display:flex;gap:12px;align-items:center;width:100%;max-width:300px">
        <span style="flex:1;background:#eef1ef;border-radius:10px;padding:8px 10px;color:#666;font-size:.95rem">tonymeuse.github.io</span><span style="${ring};padding:3px;display:flex">${shareIcon(32)}</span></div>`),
    addRow: () => box(`<div style="background:#fff;border-radius:14px;width:100%;max-width:300px;overflow:hidden;font-size:1.05rem">
        <div style="padding:12px 14px;border-bottom:1px solid #e5e5e5;color:#999">Copy</div>
        <div style="padding:12px 14px;border-bottom:1px solid #e5e5e5;color:#999">Add to Reading List</div>
        <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:700;${ring}">Add to Home Screen ${addIcon(28)}</div></div>`),
    addButton: () => box(`<div style="background:#fff;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;width:100%;max-width:300px;font-size:1.05rem">
        <span style="color:${BLUE}">Cancel</span><b style="font-size:.85rem;white-space:nowrap">Add to Home Screen</b><span style="color:${BLUE};font-weight:800;${ring};padding:4px 10px">Add</span></div>`),
    homeScreen: () => box(`<div style="display:grid;grid-template-columns:repeat(4,64px);gap:14px;justify-items:center">
        ${[0, 1, 2].map(() => `<div style="width:56px;height:56px;border-radius:13px;background:#c9cfcb"></div>`).join('')}
        <div style="text-align:center;${ring};padding:4px">${appIcon(56)}<div style="font-size:.8rem;margin-top:3px">League</div></div></div>`),
    androidMenu: () => box(`<div style="background:#fff;border-radius:14px;padding:10px 14px;display:flex;gap:12px;align-items:center;width:100%;max-width:300px">
        <span style="flex:1;background:#eef1ef;border-radius:10px;padding:8px 10px;color:#666;font-size:.95rem">tonymeuse.github.io</span><span style="${ring};display:flex">${kebabIcon(34)}</span></div>`),
    androidInstall: () => box(`<div style="background:#fff;border-radius:14px;width:100%;max-width:300px;overflow:hidden;font-size:1.05rem">
        <div style="padding:12px 14px;border-bottom:1px solid #e5e5e5;color:#999">New tab</div>
        <div style="padding:12px 14px;border-bottom:1px solid #e5e5e5;color:#999">Bookmarks</div>
        <div style="padding:12px 14px;font-weight:700;${ring}">📲 Install app / Add to Home screen</div></div>`),
    androidOk: () => box(`<div style="background:#fff;border-radius:14px;padding:16px;width:100%;max-width:300px;text-align:right;font-size:1.05rem">
        <div style="text-align:left;margin-bottom:14px">Install app?</div><span style="color:${GREEN};font-weight:800;${ring};padding:6px 12px">Install</span></div>`)
  };

  // --- the steps for each kind of phone ---
  function steps(kind) {
    if (kind === 'android') return [
      { title: 'Tap the menu button', text: 'At the top right of the screen, tap the <b>three dots</b>.', pic: pics.androidMenu() },
      { title: 'Tap “Install app”', text: 'In the list, tap <b>Install app</b> (on some phones it says <b>Add to Home screen</b>).', pic: pics.androidInstall() },
      { title: 'Tap “Install”', text: 'Tap <b>Install</b> (or <b>Add</b>) to confirm.', pic: pics.androidOk() },
      { title: 'Open it from your Home Screen', text: 'Go to your Home Screen and tap the <b>League</b> icon.', pic: pics.homeScreen() }];
    const chrome = kind === 'ios-chrome';
    const rest = [
      { title: 'Tap “Add to Home Screen”', text: 'A list slides up. <b>Scroll down</b> a little and tap <b>Add to Home Screen</b>.<br><span style="color:#5b665e;font-size:.9em">(Don\'t see it? Tap <b>View More</b> first.)</span>', pic: pics.addRow() },
      { title: 'Tap “Add”', text: 'At the <b>top right</b>, tap <b>Add</b>.', pic: pics.addButton() },
      { title: 'Open it from your Home Screen', text: 'Close ' + (chrome ? 'Chrome' : 'Safari') + '. On your Home Screen, tap the new <b>League</b> icon.', pic: pics.homeScreen() }];
    if (kind === 'ios-new' || kind === 'print') return [
      { title: 'Tap the three dots', text: 'At the <b>bottom right</b> of the screen, tap the <b>three dots</b>.', pic: pics.newBar(),
        extra: kind === 'print' ? `<p style="margin:10px 0 0;color:#5b665e">Older iPhone? Tap the Share button ${shareIcon(20)} at the bottom instead and skip to step 3.</p>` : '' },
      { title: 'Tap “Share”', text: 'In the menu that opens, tap <b>Share</b>.', pic: pics.shareRow() },
      ...rest];
    return [
      chrome
        ? { title: 'Tap the Share button', text: 'At the <b>top</b> of the screen, next to the web address, tap this button.', pic: pics.chromeBar() }
        : { title: 'Tap the Share button', text: 'At the <b>bottom</b> of the screen, tap this button.', pic: pics.safariBar(), extra: `<p style="text-align:center;margin:14px 0 0;color:#5b665e">Don't see it? Tap the <b>three dots</b> instead, then <b>Share</b>:</p>` + pics.newerSafari() },
      { title: 'Tap “Add to Home Screen”', text: 'A list slides up. <b>Scroll down</b> a little and tap <b>Add to Home Screen</b>.<br><span style="color:#5b665e;font-size:.9em">(Don\'t see it? Tap <b>View More</b> first.)</span>', pic: pics.addRow() },
      { title: 'Tap “Add”', text: 'At the <b>top right</b>, tap <b>Add</b>.', pic: pics.addButton() },
      { title: 'Open it from your Home Screen', text: 'Close ' + (chrome ? 'Chrome' : 'Safari') + '. On your Home Screen, tap the new <b>League</b> icon.', pic: pics.homeScreen() }];
  }
  function phoneKind() {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'android';
    if (/CriOS|FxiOS|EdgiOS/.test(ua)) return 'ios-chrome';
    // iPhone software 26 and newer moved Share into the ⋯ menu. Safari reports its version as "Version/26".
    const v = +((ua.match(/Version\/(\d+)/) || [])[1] || 0);
    return v >= 26 ? 'ios-new' : 'ios-safari';
  }
  window.INSTALL = { steps, phoneKind, pics, shareIcon, appIcon };
})();
