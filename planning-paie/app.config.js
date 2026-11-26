// Configuration dynamique : reprend app.json et n'ajoute AdMob que si les publicités sont
// activées au build. Voir PUBLISH.md, section « Publicité vidéo (facultatif) ».
module.exports = ({ config }) => {
  if (process.env.EXPO_PUBLIC_ADS_ENABLED !== '1') return config;

  const androidAppId = process.env.ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.ADMOB_IOS_APP_ID;
  if (!androidAppId || !iosAppId) {
    throw new Error(
      'Publicités activées mais ADMOB_ANDROID_APP_ID / ADMOB_IOS_APP_ID manquants (voir PUBLISH.md).',
    );
  }
  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-google-mobile-ads',
        {
          androidAppId,
          iosAppId,
          // Rien n'est envoyé à Google avant le consentement et l'initialisation explicite.
          delayAppMeasurementInit: true,
        },
      ],
    ],
  };
};
