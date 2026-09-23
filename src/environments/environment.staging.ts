export const environment = {
  production: false,
  env: 'dev',
  useHash: true,
  globalApi: 'https://devgwapp.southsudansafetynet.info/mis_server/',
  modelApi: 'https://devmismodel.southsudansafetynet.info/',
  portals: {
    master: '/trial/master/',
    beneficiary: '/trial/beneficiary/',
    payment: '/trial/payment/',
    grm: '/trial/grm/',
    masterSettings: '/trial/master/#/user-management/users',
    surveyCTO: '/trial/master/#/cto-dashboard',
    mNe: '/trial/master/#/monitoring-evaluation/beneficiary-enrolment-summary',
    report: '/trial/master/#/home/metabase',
    economicOpportunities: '/trial/master/#/economic-opportunities/dashboard',
    UnderConstruction: '/trial/master/#/under-construction',
    helpDesk: '/trial/master/#/help-desk/dashboard',
    dms: '/trial/dms/',
    automatedTargeting: '/trial/master/#/automated-targeting/dashboard',
  },
  msalConfig: {
    auth: {
      clientId: 'f33243cb-5b62-4850-984b-96f75e9cdce4',
      authority: 'https://login.microsoftonline.com/4a9fe01e-5c9c-4cb8-b299-fb5211533420',
      redirectUri: '/trial/master/',
      postLogoutRedirectUri: '/trial/master/'
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    }
  },
  authBackend: 'https://devgwapp.southsudansafetynet.info/mis_auth',
  cookie_name:'mis_ta',
  metabaseSso: {
    endpoint: 'https://qa-gwapp.southsudansafetynet.info/metabase_middleware/sso/metabase',
    metabaseUrl: 'https://analytics.southsudansafetynet.info',
  },
};
