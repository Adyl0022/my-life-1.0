// Lets the Google document scanner import photos from the gallery, so they get the same crop, straighten and filters as a camera scan.
// The scanner plugin does not pass that setting on, so one line is added to its Android code when the native project is made. Safe to run twice.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withScannerGallery(config) {
  return withDangerousMod(config, ['android', async (cfg) => {
    try {
      const f = path.join(cfg.modRequest.projectRoot, 'node_modules/react-native-document-scanner-plugin/android/src/main/java/com/documentscanner/DocumentScannerModule.kt');
      let s = fs.readFileSync(f, 'utf8');
      if (!s.includes('setGalleryImportAllowed')) {
        const anchor = '    if (options.hasKey("maxNumDocuments")) {';
        if (s.includes(anchor)) {
          s = s.replace(anchor, '    if (options.hasKey("galleryImport")) {\n      documentScannerOptionsBuilder.setGalleryImportAllowed(options.getBoolean("galleryImport"))\n    }\n\n' + anchor);
          fs.writeFileSync(f, s);
        }
      }
    } catch (e) { /* the scanner still works without gallery import */ }
    return cfg;
  }]);
};
