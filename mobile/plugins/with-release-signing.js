// Yayın (release) APK'sını sabit bir anahtarla imzalar. Anahtar bilgileri koda
// yazılmaz; derleme sırasında MARGIN_KEYSTORE_* ortam değişkenlerinden okunur.
const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes("signingConfigs.release")) return cfg;

    gradle = gradle.replace(
      "signingConfigs {\n        debug {",
      `signingConfigs {
        release {
            storeFile file(System.getenv('MARGIN_KEYSTORE_FILE'))
            storePassword System.getenv('MARGIN_KEYSTORE_PASSWORD')
            keyAlias System.getenv('MARGIN_KEY_ALIAS')
            keyPassword System.getenv('MARGIN_KEY_PASSWORD')
        }
        debug {`,
    );
    gradle = gradle.replace(
      "signingConfig signingConfigs.debug\n            def enableShrinkResources",
      "signingConfig signingConfigs.release\n            def enableShrinkResources",
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
