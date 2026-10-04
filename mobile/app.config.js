// Statik ayarlar app.json'da. Burada yalnızca derleme ortamına bağlı farklar var.
module.exports = ({ config }) => {
  const plugins = [...(config.plugins ?? [])];

  // Yerel sunucuya (http) bağlanan emülatör testleri için ALLOW_CLEARTEXT=1 ile derleyin.
  // Dağıtım sürümü yalnızca https kullanır.
  if (process.env.ALLOW_CLEARTEXT === "1") {
    plugins.push(["expo-build-properties", { android: { usesCleartextTraffic: true } }]);
  }

  // Dağıtılacak APK'yı sabit anahtarla imzala (MARGIN_KEYSTORE_* ortam değişkenleri).
  if (process.env.MARGIN_KEYSTORE_FILE) {
    plugins.push("./plugins/with-release-signing");
  }

  return { ...config, plugins };
};
