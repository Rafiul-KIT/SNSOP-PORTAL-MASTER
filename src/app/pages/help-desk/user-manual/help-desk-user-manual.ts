import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

type ManualRoleId = 'ip' | 'qa' | 'superadmin' | 'grm' | 'env' | 'tst' | 'reviewer' | 'financial' | 'authorizer' | 'fsp';

interface ManualSection {
  id: string;
  title: string;
  overview: string;
  steps: string[];
  tips?: string[];
  keywords: string[];
}

interface ManualRole {
  id: ManualRoleId;
  name: string;
  iconClass: string;
  color: string;
  shortDescription: string;
  popularTopics: string[];
  sections: ManualSection[];
}

@Component({
  selector: 'app-help-desk-user-manual',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule],
  templateUrl: './help-desk-user-manual.html',
  styleUrls: ['./help-desk-user-manual.scss']
})
export class HelpDeskUserManual {
  breadcrumbHome = { icon: 'fas fa-home', routerLink: '/' };
  breadcrumbItems = [{ label: 'Help Desk' }, { label: 'User Manual' }];

  readonly approvalPath = [
    'Implementing Partner (IP)',
    'Quality Engineer (QA)',
    'Environment Specialist',
    'Technical Support Team',
    'Initial Reviewer',
    'Financial Approver',
    'Final Payment Authorizer',
    'FSP'
  ];

  readonly roles: ManualRole[] = this.buildRoles();

  selectedRoleId: ManualRoleId = 'ip';
  searchTerm = '';
  expandedSectionIds = new Set<string>();

  constructor() {
    this.resetExpansionForSelectedRole();
  }

  get selectedRole(): ManualRole {
    return this.roles.find((role) => role.id === this.selectedRoleId) ?? this.roles[0]!;
  }

  get hasSearchQuery(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  get filteredSections(): ManualSection[] {
    const normalizedQuery = this.searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return this.selectedRole.sections;
    }

    return this.selectedRole.sections.filter((section) => this.matchesSection(section, normalizedQuery));
  }

  get totalStepCount(): number {
    return this.filteredSections.reduce((sum, section) => sum + section.steps.length, 0);
  }

  selectRole(roleId: ManualRoleId): void {
    this.selectedRoleId = roleId;
    this.searchTerm = '';
    this.resetExpansionForSelectedRole();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value ?? '';

    const firstVisibleId = this.getFirstVisibleSectionId();
    if (firstVisibleId && this.expandedSectionIds.size === 0) {
      this.expandedSectionIds.add(firstVisibleId);
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.resetExpansionForSelectedRole();
  }

  applyTopicFilter(topic: string): void {
    this.searchTerm = topic;
    const firstVisibleId = this.getFirstVisibleSectionId();
    if (firstVisibleId) {
      this.expandedSectionIds = new Set<string>([firstVisibleId]);
      this.scrollToSection(firstVisibleId);
    }
  }

  openGuide(): void {
    const firstVisibleId = this.getFirstVisibleSectionId();
    if (!firstVisibleId) {
      return;
    }

    this.expandedSectionIds.add(firstVisibleId);
    this.scrollToSection(firstVisibleId);
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.expandedSectionIds.has(sectionId);
  }

  toggleSection(sectionId: string): void {
    if (this.expandedSectionIds.has(sectionId)) {
      this.expandedSectionIds.delete(sectionId);
    } else {
      this.expandedSectionIds.add(sectionId);
    }

    this.expandedSectionIds = new Set<string>(this.expandedSectionIds);
  }

  expandAllSections(): void {
    this.expandedSectionIds = new Set<string>(this.filteredSections.map((section) => section.id));
  }

  collapseAllSections(): void {
    this.expandedSectionIds = new Set<string>();
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  trackByRoleId(_: number, role: ManualRole): ManualRoleId {
    return role.id;
  }

  trackBySectionId(_: number, section: ManualSection): string {
    return section.id;
  }

  trackByTopic(_: number, topic: string): string {
    return topic;
  }

  private getFirstVisibleSectionId(): string | null {
    const first = this.filteredSections[0];
    return first ? first.id : null;
  }

  private matchesSection(section: ManualSection, normalizedQuery: string): boolean {
    const searchableContent = [
      section.title,
      section.overview,
      ...section.steps,
      ...(section.tips ?? []),
      ...section.keywords
    ]
      .join(' ')
      .toLowerCase();

    return searchableContent.includes(normalizedQuery);
  }

  private resetExpansionForSelectedRole(): void {
    const defaultOpen = this.selectedRole.sections.slice(0, 2).map((section) => section.id);
    this.expandedSectionIds = new Set<string>(defaultOpen);
  }

  private createSection(
    id: string,
    title: string,
    overview: string,
    steps: string[],
    keywords: string[],
    tips?: string[]
  ): ManualSection {
    return {
      id,
      title,
      overview,
      steps,
      tips,
      keywords
    };
  }

  private createAccessSection(roleName: string): ManualSection {
    return this.createSection(
      'accessing-snsop-mis',
      'Accessing the SNSOP MIS',
      'Standard login and environment checks for all user roles.',
      [
        'Open the portal URL: https://newmis.southsudansafetynet.info/trial/payment/#/dashboard.',
        'Sign in with your registered Microsoft account and verify the selected role dashboard after login.',
        'Confirm the active project period, location scope, and assigned permissions before processing records.'
      ],
      ['login', 'portal', 'dashboard', roleName, 'credentials'],
      ['If the dashboard widgets are blank, refresh once and re-check your role assignment with the administrator.']
    );
  }

  private buildRoles(): ManualRole[] {
    return [
      {
        id: 'ip',
        name: 'Implementing Partner (IP)',
        iconClass: 'fas fa-user-tie',
        color: '#00796b',
        shortDescription: 'End-to-end beneficiary and payment operations at field implementation level.',
        popularTopics: ['Beneficiary Registration', 'Mobile Wallet Update', 'Wage Request', 'Payroll', 'Invoice'],
        sections: [
          this.createAccessSection('Implementing Partner'),
          this.createSection(
            'beneficiary-dashboard',
            'Beneficiary Dashboard',
            'Monitor registration and target coverage from summary cards and county breakdowns.',
            [
              'Open Beneficiary Module to load summary cards for total beneficiaries, female count, and LIPW count.',
              'Use Summary ALL, Summary PP, and Summary AF tabs to compare program segments.',
              'Review county-wise chart to identify gaps between target and registered households.'
            ],
            ['beneficiary dashboard', 'summary cards', 'county chart']
          ),
          this.createSection(
            'beneficiary-registration',
            'Beneficiary Registration',
            'Capture and validate new beneficiary profiles before submission.',
            [
              'Go to Beneficiary Registration and choose the correct project and sub-project.',
              'Enter household and individual details, then complete mandatory identity and location fields.',
              'Run duplicate checks and submit for pending verification queue review.'
            ],
            ['registration', 'new beneficiary', 'pending verification'],
            ['Always validate phone and wallet fields before save to reduce downstream payment failures.']
          ),
          this.createSection(
            'beneficiary-manage',
            'Beneficiary Manage',
            'Handle updates, approvals, audits, restore operations, and status corrections.',
            [
              'Use Beneficiary Manage to open list filters for status, county, project, and submission date.',
              'Perform Beneficiary Update, Update Approval, Beneficiary Audit, or Restore Beneficiary actions as needed.',
              'Track approval state after each action and document remarks for audit traceability.'
            ],
            ['beneficiary manage', 'audit', 'restore beneficiary', 'update approval']
          ),
          this.createSection(
            'beneficiary-id-cards',
            'Beneficiary ID Cards',
            'Generate single or bulk ID card outputs for verified records.',
            [
              'Open Beneficiary ID Cards from Beneficiary Module and apply filters or application ID search.',
              'Select one or many beneficiaries from the result table.',
              'Download individual card or bulk ZIP package depending on field distribution need.'
            ],
            ['id cards', 'bulk download', 'application id']
          ),
          this.createSection(
            'adjudication',
            'Adjudication',
            'Resolve duplicate or conflict records before final beneficiary approval.',
            [
              'Open Adjudication queue and review duplicate pairs flagged by matching rules.',
              'Compare core identity fields, household links, and source records.',
              'Approve merge or reject with clear reason so the final status is traceable.'
            ],
            ['adjudication', 'duplicate records', 'merge']
          ),
          this.createSection(
            'beneficiary-report',
            'Beneficiary Report',
            'Generate filtered beneficiary extracts for monitoring and partner reporting.',
            [
              'Select report type such as Boma-wise list, registration status, or update status.',
              'Apply location and date filters for focused output.',
              'Export report and verify totals against dashboard cards before circulation.'
            ],
            ['beneficiary report', 'boma wise', 'export']
          ),
          this.createSection(
            'payment-module-dashboard',
            'Payment Module Dashboard',
            'Track the full payment pipeline from project setup to invoice readiness.',
            [
              'Open Payment Module dashboard to view current pipeline stage counts.',
              'Check unresolved blockers in attendance, wage request, and approval queues.',
              'Use quick links from dashboard cards to jump directly to pending actions.'
            ],
            ['payment dashboard', 'pipeline', 'pending actions']
          ),
          this.createSection(
            'project',
            'Project',
            'Create and maintain project-level metadata and working windows.',
            [
              'Open Project menu and create project with approved program metadata.',
              'Define implementation timeline, target parameters, and ownership attributes.',
              'Save and confirm the project appears in downstream sub-project selectors.'
            ],
            ['project setup', 'metadata', 'timeline']
          ),
          this.createSection(
            'sub-project',
            'Sub-Project',
            'Create implementation units and route them through approval stages.',
            [
              'Create New Sub-Project and link it to the correct project and target area.',
              'Complete required meeting type, batch, and technical details.',
              'Submit and monitor progression through QA, EnvSpec, and TST approvals.'
            ],
            ['sub-project', 'approval stages', 'qa', 'env', 'tst']
          ),
          this.createSection(
            'beneficiary-assignment',
            'Beneficiary Assignment',
            'Assign verified beneficiaries to approved sub-project activities.',
            [
              'Open Beneficiary Assignment and select target sub-project.',
              'Filter eligible beneficiaries and assign in controlled batches.',
              'Validate assignment totals against approved targets before final save.'
            ],
            ['assignment', 'sub-project allocation', 'target validation']
          ),
          this.createSection(
            'beneficiary-attendance',
            'Beneficiary Attendance',
            'Capture attendance and ensure readiness for wage request generation.',
            [
              'Open attendance entry for the selected cycle and assigned beneficiary group.',
              'Upload or enter attendance details according to approved format.',
              'Resolve missing or invalid rows, then submit for payroll workflow.'
            ],
            ['attendance', 'upload', 'cycle']
          ),
          this.createSection(
            'wage-request',
            'Wage Request',
            'Prepare wage request package from validated attendance records.',
            [
              'Generate wage request from approved attendance cycle.',
              'Review calculated totals, beneficiary counts, and exchange assumptions.',
              'Submit request to approval chain with required supporting documents.'
            ],
            ['wage request', 'attendance to wage', 'supporting documents']
          ),
          this.createSection(
            'wage-request-approval-ip',
            'Wage Request Approval (IP Approver)',
            'Perform IP-side review before external approval chain progression.',
            [
              'Open Wage Request Approval queue and inspect pending records.',
              'Validate amount calculations, scope, and document completeness.',
              'Approve or return with remarks so downstream reviewers receive clean packets.'
            ],
            ['ip approver', 'pending approval', 'remarks']
          ),
          this.createSection(
            'payroll',
            'Payroll',
            'Generate payroll outputs and monitor cash or mobile money channels.',
            [
              'Open Payroll and generate cycle output after approvals are complete.',
              'Choose payment channel (cash or mobile money) and verify beneficiary mapping.',
              'Download payroll files and track reconciliation status.'
            ],
            ['payroll generate', 'cash payroll', 'mobile money', 'reconciliation monitoring']
          ),
          this.createSection(
            'payment-report',
            'Payment Report',
            'Produce payment analytics and reconciliation views for audit and review.',
            [
              'Run reports such as reconciliation detail, summary, and total payment details.',
              'Filter by paid date, sub-project, and payment channel.',
              'Use exceptions in report output to trigger correction workflows.'
            ],
            ['reconciliation detail', 'summary report', 'payment details', 'multiple attendance report']
          ),
          this.createSection(
            'invoice',
            'Invoice',
            'Generate invoice outputs linked to approved wage and payment data.',
            [
              'Open Invoice menu and select approved wage request abstract.',
              'Validate invoice line totals against payment report values.',
              'Export invoice and submit through financial approval workflow.'
            ],
            ['invoice', 'wage paid request abstract', 'paid date wise payment invoice']
          )
        ]
      },
      {
        id: 'qa',
        name: 'Quality Engineer (QA)',
        iconClass: 'fas fa-tools',
        color: '#1565c0',
        shortDescription: 'Quality controls for sub-project and payment reporting flows.',
        popularTopics: ['Sub-Project Approval', 'Reconciliation Detail Report', 'Wage Request Abstract Report'],
        sections: [
          this.createAccessSection('Quality Engineer'),
          this.createSection(
            'qa-sub-project-approval',
            'Sub-Project Approval',
            'First approval gate after IP submission.',
            [
              'Open Payment Module > Sub-Project Approval as QA user.',
              'Review project context, target scope, and uploaded documents.',
              'Approve with mandatory comment so Environment Specialist receives notification.'
            ],
            ['quality engineer', 'sub-project approval', 'ip submitted']
          ),
          this.createSection(
            'qa-payment-report',
            'Payment Report',
            'Review reconciliation and attendance consistency using report tools.',
            [
              'Run Reconciliation Detail Report and verify variances by cycle.',
              'Cross-check Total Beneficiary Payment Details and Wage Request Abstract values.',
              'Escalate unresolved mismatches to IP before final financial processing.'
            ],
            ['reconciliation detail report', 'multiple attendance report', 'payment details']
          )
        ]
      },
      {
        id: 'superadmin',
        name: 'SuperAdmin',
        iconClass: 'fas fa-user-shield',
        color: '#6a1b9a',
        shortDescription: 'System governance, dashboard oversight, and user access administration.',
        popularTopics: ['User List', 'Register User', 'Role List', 'Beneficiary Dashboard'],
        sections: [
          this.createAccessSection('SuperAdmin'),
          this.createSection(
            'superadmin-beneficiary-dashboard',
            'Beneficiary Dashboard Oversight',
            'High-level beneficiary metrics and county coverage review.',
            [
              'Use Beneficiary Dashboard for portfolio-level monitoring.',
              'Compare summary tabs and county target versus actual values.',
              'Use findings to guide role assignments and data quality interventions.'
            ],
            ['beneficiary dashboard', 'county target', 'portfolio monitoring']
          ),
          this.createSection(
            'superadmin-user-management',
            'User Management',
            'Control user lifecycle and role permissions safely.',
            [
              'Open User Management > User List to search and audit active accounts.',
              'Use Register User flow to onboard approved staff with least-privilege role.',
              'Maintain Role List mappings and disable inactive users promptly.'
            ],
            ['user list', 'register user', 'role list', 'permissions']
          )
        ]
      },
      {
        id: 'grm',
        name: 'Entry GRM Role',
        iconClass: 'fas fa-bullhorn',
        color: '#e65100',
        shortDescription: 'GRM intake, dashboard management, and GBV case handling.',
        popularTopics: ['GRM Dashboard', 'GBV Management Issue Entry', 'Case Status Tracking'],
        sections: [
          this.createAccessSection('GRM'),
          this.createSection(
            'grm-dashboard',
            'GRM Dashboard',
            'Track grievance totals, pending items, and resolution progress.',
            [
              'Open GRM Module to view total, pending, and resolved grievance cards.',
              'Use GBV and Non-GBV split to route cases to correct handling process.',
              'Filter by location and date to identify unresolved clusters.'
            ],
            ['grievance dashboard', 'gbv', 'non-gbv', 'pending grievances']
          ),
          this.createSection(
            'grm-gbv-grievance',
            'GBV Grievance',
            'Secure and structured entry process for GBV-sensitive cases.',
            [
              'Open GBV Management Issue Entry from GRM menu.',
              'Capture mandatory case fields with strict confidentiality controls.',
              'Submit and follow approved referral and resolution protocol.'
            ],
            ['gbv grievance', 'confidential', 'issue entry']
          )
        ]
      },
      {
        id: 'env',
        name: 'Environment Specialist',
        iconClass: 'fas fa-leaf',
        color: '#2e7d32',
        shortDescription: 'Environmental compliance approval for sub-project progression.',
        popularTopics: ['Sub-Project Approval', 'Comment Tracking', 'Escalation to TST'],
        sections: [
          this.createAccessSection('Environment Specialist'),
          this.createSection(
            'env-sub-project-approval',
            'Sub-Project Approval',
            'Second approval gate in the sub-project chain after QA.',
            [
              'Open Payment Module > Sub-Project Approval using EnvSpec credentials.',
              'Review environmental criteria and attached evidence for compliance.',
              'Approve with comment so the case moves to Technical Support Team.'
            ],
            ['environment specialist', 'sub-project approval', 'comment']
          )
        ]
      },
      {
        id: 'tst',
        name: 'Technical Support Team',
        iconClass: 'fas fa-screwdriver-wrench',
        color: '#37474f',
        shortDescription: 'Technical validation and attachment controls before wage flow starts.',
        popularTopics: ['Sub-Project Approval', 'PDC Approved Date', 'Attachment Validation'],
        sections: [
          this.createAccessSection('Technical Support Team'),
          this.createSection(
            'tst-sub-project-approval',
            'Technical Support Team Approval',
            'Final sub-project approval gate before downstream operational use.',
            [
              'Open Sub-Project Approval and inspect records routed from EnvSpec.',
              'Fill required PDC approved date and upload technical attachment.',
              'Submit approval with required comment and confirm success notification.'
            ],
            ['tst approval', 'pdc approved date', 'technical attachment']
          )
        ]
      },
      {
        id: 'reviewer',
        name: 'Initial Reviewer',
        iconClass: 'fas fa-clipboard-check',
        color: '#ad1457',
        shortDescription: 'Initial review of pending wage request approvals.',
        popularTopics: ['Pending Approval', 'Remarks Entry', 'Approve or Reject'],
        sections: [
          this.createAccessSection('Initial Reviewer'),
          this.createSection(
            'reviewer-initial-approval',
            'Initial Reviewer Approval',
            'First wage request approval checkpoint in payment authorization flow.',
            [
              'Open Payment Module > Wage Request Approval > Pending Approval.',
              'Review request details and choose Approve or Reject from dropdown.',
              'Enter remarks and submit after validating request completeness.'
            ],
            ['initial reviewer', 'pending approval', 'remarks', 'approve reject']
          )
        ]
      },
      {
        id: 'financial',
        name: 'Financial Approver',
        iconClass: 'fas fa-sack-dollar',
        color: '#c62828',
        shortDescription: 'Financial validation, exchange rate checks, and approval attachments.',
        popularTopics: ['Exchange Rate', 'Attachment Upload', 'Pending Approval'],
        sections: [
          this.createAccessSection('Financial Approver'),
          this.createSection(
            'financial-approval',
            'Financial Approver Workflow',
            'Financial control gate before final payment authorization.',
            [
              'Open Wage Request Approval pending list from Payment Module.',
              'Enter exchange rate and upload required financial attachment.',
              'Approve or reject with remarks, then submit and confirm status update.'
            ],
            ['financial approver', 'exchange rate', 'attachment', 'pending approval']
          )
        ]
      },
      {
        id: 'authorizer',
        name: 'Final Payment Authorizer',
        iconClass: 'fas fa-building-columns',
        color: '#4527a0',
        shortDescription: 'Final authorization control before payment release.',
        popularTopics: ['Pending Approval', 'Final Authorization', 'Remarks'],
        sections: [
          this.createAccessSection('Final Payment Authorizer'),
          this.createSection(
            'final-authorizer-workflow',
            'Final Payment Authorization',
            'Last approval gate to lock request for payment execution.',
            [
              'Open Wage Request Approval pending queue with manager credentials.',
              'Review full approval history and ensure no unresolved remarks remain.',
              'Approve or reject with final remarks and submit to complete authorization.'
            ],
            ['final payment authorizer', 'manager approval', 'final remarks']
          )
        ]
      },
      {
        id: 'fsp',
        name: 'Financial Service Provider (FSP)',
        iconClass: 'fas fa-credit-card',
        color: '#00695c',
        shortDescription: 'Execution role for beneficiary cards, payroll handling, reporting, and invoice output.',
        popularTopics: ['Beneficiary ID Cards', 'Payroll Generate', 'Reconciliation Summary', 'Invoice'],
        sections: [
          this.createAccessSection('FSP'),
          this.createSection(
            'fsp-beneficiary-dashboard',
            'Beneficiary Dashboard',
            'Access operational beneficiary summary for payment planning.',
            [
              'Open Beneficiary Module and review assigned beneficiary summaries.',
              'Validate counts before payroll generation windows open.',
              'Flag unresolved discrepancies before payment run.'
            ],
            ['fsp dashboard', 'beneficiary summary', 'payment planning']
          ),
          this.createSection(
            'fsp-beneficiary-id-cards',
            'Beneficiary ID Cards',
            'Search and download beneficiary card outputs for field payment support.',
            [
              'Open Beneficiary ID Cards and search by Application ID or profile filters.',
              'Use advanced search when high-volume batches are required.',
              'Download selected card files in ZIP format for controlled distribution.'
            ],
            ['fsp id cards', 'bulk id card download', 'advanced search']
          ),
          this.createSection(
            'fsp-payroll',
            'Payroll',
            'Generate payroll outputs and channel-specific payment files.',
            [
              'Open Payroll and choose Generate for the approved cycle.',
              'Download Cash Payroll when cash channel is selected.',
              'Use Mobile Money and Reconciliation Monitoring views for digital disbursement oversight.'
            ],
            ['payroll generate', 'cash payroll download', 'mobile money', 'reconciliation monitoring']
          ),
          this.createSection(
            'fsp-payment-report',
            'Payment Report',
            'Produce detailed payment and attendance-backed reconciliation reports.',
            [
              'Run Reconciliation Detail or Reconciliation Summary reports per cycle.',
              'Generate Total Beneficiary Payment Details and Wage Request Abstract outputs.',
              'Use Multiple Attendance Report to detect attendance-payment inconsistencies.'
            ],
            ['reconciliation detail', 'reconciliation summary', 'total beneficiary payment details', 'multiple attendance']
          ),
          this.createSection(
            'fsp-invoice',
            'Invoice',
            'Generate invoice outputs from paid and approved payroll records.',
            [
              'Open Invoice and select Wage Paid Request Abstract with invoice option.',
              'Review paid-date-wise invoice values against payment report totals.',
              'Export invoice package for submission to financial approvers.'
            ],
            ['wage paid request abstract with invoice', 'paid date wise payment invoice']
          )
        ]
      }
    ];
  }
}
