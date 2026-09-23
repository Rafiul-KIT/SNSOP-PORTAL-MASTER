export const environment = {
  production: true,
  env: 'qa',
  useHash: true,
  globalApi: 'https://qa-gwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: '/v2/',
    beneficiary: '/v2/beneficiary',
    payment: '/v2/payment',
    grm: '/v2/grm',
    masterSettings: '/v2/#/user-management/users',
    surveyCTO: '/v2/#/cto-dashboard',
    mNe: '/v2/#/monitoring-evaluation/beneficiary-enrolment-summary',
    report: '/v2/#/home/metabase',
    economicOpportunities: '/v2/#/economic-opportunities/dashboard',
    UnderConstruction: '/v2/#/under-construction',
    helpDesk: '/v2/#/help-desk/dashboard',
    dms: '/v2/dms/',
    automatedTargeting: '/v2/#/automated-targeting/dashboard',
  },
  msalConfig: {
    auth: {
      clientId: 'f77f207f-13f9-405d-8bf7-935fde3ce01c',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: '/v2/',
      postLogoutRedirectUri: '/v2/'
    },
    cache: {
      cacheLocation: 'cookie',
      storeAuthStateInCookie: true,
    }
  },
  authBackend: 'https://qa-gwapp.southsudansafetynet.info/mis_auth',

  cookie_name:'mis_ta',
  metabaseSso: {
    endpoint: 'https://qa-gwapp.southsudansafetynet.info/metabase_middleware/sso/metabase',
    metabaseUrl: 'https://analytics.southsudansafetynet.info',
  },
};
