export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  domain: 'https://newmis.southsudansafetynet.info',
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://newmis.southsudansafetynet.info/trial/master/',
    beneficiary: 'https://newmis.southsudansafetynet.info/trial/beneficiary/',
    payment: 'https://newmis.southsudansafetynet.info/trial/payment/',
    grm: 'https://newmis.southsudansafetynet.info/trial/grm/',
    report: 'https://newmis.southsudansafetynet.info/trial/report/',
  },
  msalConfig: {
    auth: {
      clientId: 'f33243cb-5b62-4850-984b-96f75e9cdce4',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://newmis.southsudansafetynet.info/trial/master/',
      postLogoutRedirectUri: ' https://newmis.southsudansafetynet.info/trial/master/'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta'
};
