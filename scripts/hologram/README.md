# Hologram frames

The turning body hologram in Time Machine is 36 pre-drawn pictures (`assets/holo/f00.png` to `f35.png`), one every 10 degrees. The app only swaps pictures, so it needs no 3D engine on the phone.

To draw them again: `npm i three`, copy `node_modules/three/build/three.module.js` here, serve this folder (`python3 -m http.server 8098`), run `node r.js 36`, then turn each picture's brightness into transparency and reduce it to 192 colours.
The body mesh is simplified from the three.js sample "Xbot" (Mixamo).
