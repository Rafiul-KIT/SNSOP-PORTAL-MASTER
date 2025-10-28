export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://snsopmis.southsudansafetynet.info',
  globalApi: '',
  portals: {
    master: 'https://snsopmis.southsudansafetynet.info/v2/',
    beneficiary: 'https://snsopmis.southsudansafetynet.info/v2/beneficiary',
    payment: 'https://snsopmis.southsudansafetynet.info/v2/payment',
    grm: 'https://snsopmis.southsudansafetynet.info/v2/grm',
    report: 'https://snsopmis.southsudansafetynet.info/v2/report',
  },
  msalConfig: {
    auth: {
      clientId: 'ff3e857a-2a87-4b1c-9290-bdca74139ce6',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://snsopmis.southsudansafetynet.info/v2/',
      postLogoutRedirectUri: 'https://snsopmis.southsudansafetynet.info/v2/'
    },
    cache: {
      cacheLocation: 'cookie',
      storeAuthStateInCookie: true,
    }
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
