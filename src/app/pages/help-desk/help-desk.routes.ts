import { Routes } from '@angular/router';
import { HelpDeskDashboard } from './dashboard/help-desk-dashboard';
import { HelpDeskSubmitRequest } from './submit-request/help-desk-submit-request';
import { HelpDeskMyRequests } from './my-requests/help-desk-my-requests';
import { HelpDeskSupportManagement } from './support-management/help-desk-support-management';
import { HelpDeskStatusTracker } from './status-tracker/help-desk-status-tracker';
import { HelpDeskReports } from './reports/help-desk-reports';
import { HelpDeskUserManual } from './user-manual/help-desk-user-manual';
import { HelpDeskRequestDetails } from './request-details/help-desk-request-details';
import { routeGuard } from '../../route.guard';
import { HelpDeskRequestDetail } from './request-detail/help-desk-request-detail';
import { HelpDeskSetup } from './setup/help-desk-setup';

export const HELP_DESK_ROUTES: Routes = [
  { path: 'dashboard', component: HelpDeskDashboard, canActivate: [routeGuard] },
  { path: 'submit-request', component: HelpDeskSubmitRequest, canActivate: [routeGuard] },
  { path: 'my-requests', component: HelpDeskMyRequests, canActivate: [routeGuard] },
  { path: 'support-management', component: HelpDeskSupportManagement, canActivate: [routeGuard] },
  { path: 'setup', component: HelpDeskSetup, canActivate: [routeGuard] },
  { path: 'status-tracker', component: HelpDeskStatusTracker, canActivate: [routeGuard] },
  { path: 'reports', component: HelpDeskReports, canActivate: [routeGuard] },
  { path: 'user-manual', component: HelpDeskUserManual, canActivate: [routeGuard] },
  { path: 'request-details/:id', component: HelpDeskRequestDetails, canActivate: [routeGuard] },
  { path: 'request-detail/:id', component: HelpDeskRequestDetail, canActivate: [routeGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
