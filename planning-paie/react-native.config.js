// Le SDK Google Mobile Ads n'est intégré à l'application que si les publicités sont activées
// au moment du build (EXPO_PUBLIC_ADS_ENABLED=1). Sinon il est exclu de l'édition de liens
// native : aucun code publicitaire dans l'application, aucun risque de plantage sans compte AdMob.
const adsEnabled = process.env.EXPO_PUBLIC_ADS_ENABLED === '1';

module.exports = {
  dependencies: adsEnabled
    ? {}
    : { 'react-native-google-mobile-ads': { platforms: { ios: null, android: null } } },
};
