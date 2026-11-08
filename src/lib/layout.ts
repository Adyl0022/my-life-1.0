import { Platform } from 'react-native';

// Web version only (iPhone "Add to Home Screen"): the page is drawn under the status bar and Dynamic Island, so
// content is moved down by the real safe-area inset. Android and iOS apps are never affected (always 0).
function webTopInset(): number {
  try {
    if (typeof document === 'undefined' || !document.body) return 0;
    const d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px)';
    document.body.appendChild(d);
    const v = parseFloat(getComputedStyle(d).paddingTop) || 0;
    document.body.removeChild(d);
    return v;
  } catch (e) { return 0; }
}
// Height of the notch / Dynamic Island area on the web version (0 on Android and iOS apps).
export const INSET_TOP = Platform.OS === 'web' ? webTopInset() : 0;
// Space kept above page content on the web version: the real inset on an iPhone home-screen app, a little room otherwise.
export const TOP = Platform.OS === 'web' ? (INSET_TOP > 0 ? INSET_TOP : 22) : 0;
