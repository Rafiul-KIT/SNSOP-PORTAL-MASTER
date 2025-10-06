export const environment = {
  production: true,
  env: 'prod',
  useHash: true,
  domain: 'https://devportalmaster.southsudansafetynet.info',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://devportalmaster.southsudansafetynet.info/master/',
    beneficiary: 'https://devportalmaster.southsudansafetynet.info/beneficiary',
    payment: 'https://devportalmaster.southsudansafetynet.info/payment',
    grm: 'https://devportalmaster.southsudansafetynet.info/grm',
    report: 'https://devportalmaster.southsudansafetynet.info/report',
  },
  msalConfig: {
    auth: {
      clientId: 'f33243cb-5b62-4850-984b-96f75e9cdce4',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://devportalmaster.southsudansafetynet.info/master/',
      postLogoutRedirectUri: 'https://devportalmaster.southsudansafetynet.info/master/'
    },
    cache: {
      cacheLocation: 'cookie',
      storeAuthStateInCookie: true,
    }
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
