export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  domain: 'https://qa-mis.southsudansafetynet.info',
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  portals: {
    master: 'https://qa-mis.southsudansafetynet.info/v2/',
    beneficiary: 'https://qa-mis.southsudansafetynet.info/v2/beneficiary',
    payment: 'https://qa-mis.southsudansafetynet.info/v2/payment',
    grm: 'https://qa-mis.southsudansafetynet.info/v2/grm',
    masterSettings: 'https://qa-mis.southsudansafetynet.info/v2/#/user-management/users',
    surveyCTO: 'https://qa-mis.southsudansafetynet.info/v2/#/cto-dashboard',
    mNe: 'https://qa-mis.southsudansafetynet.info/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    report: 'https://qa-mis.southsudansafetynet.info/v2/#/home/metabase',
    economicOpportunities: 'https://qa-mis.southsudansafetynet.info/v2/#/economic-opportunities/dashboard',
    // UnderConstruction: 'https://qa-mis.southsudansafetynet.info/v2/#/under-construction',
    helpDesk: 'https://qa-mis.southsudansafetynet.info/v2/#/help-desk/dashboard',
  },
  msalConfig: {
    auth: {
      clientId: 'f77f207f-13f9-405d-8bf7-935fde3ce01c',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: 'https://qa-mis.southsudansafetynet.info/v2/',
      postLogoutRedirectUri: 'https://qa-mis.southsudansafetynet.info/v2/'
    },
    cache: {
      cacheLocation: 'cookie',
      storeAuthStateInCookie: true,
    }
  },
  authBackend: 'https://qa-gwapp.southsudansafetynet.info/mis_auth',

  cookie_name:'mis_ta'
};
