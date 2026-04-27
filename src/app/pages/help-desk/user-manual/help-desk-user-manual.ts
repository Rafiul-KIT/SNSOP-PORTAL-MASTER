import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

interface ManualSection {
  id: string;
  index: number | null;
  title: string;
  bodyHtml: string;
  searchText: string;
}

interface ManualNavEntry {
  index: number;
  title: string;
}

interface ManualRole {
  id: string;
  name: string;
  icon: string;
  color: string;
  shortDescription: string;
  nav: ManualNavEntry[];
  sections: ManualSection[];
  imageCount: number;
}

interface ManualPayloadSection {
  index: number | null;
  title: string;
  bodyHtml: string;
  searchText: string;
}

interface ManualPayloadRole {
  id: string;
  name: string;
  icon: string;
  color: string;
  nav: ManualNavEntry[];
  sections: ManualPayloadSection[];
}

interface ManualPayload {
  generatedAt: string;
  source: string;
  roles: ManualPayloadRole[];
}

@Component({
  selector: 'app-help-desk-user-manual',
  standalone: true,
  imports: [CommonModule, HttpClientModule, BreadcrumbModule, ButtonModule],
  templateUrl: './help-desk-user-manual.html',
  styleUrls: ['./help-desk-user-manual.scss']
})
export class HelpDeskUserManual implements OnInit {
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

  roles: ManualRole[] = [];
  selectedRoleId = '';
  searchTerm = '';
  expandedSectionIds = new Set<string>();

  isLoading = true;
  loadError = '';
  lightboxImageSrc = '';

  constructor(private readonly http: HttpClient) {}

  async ngOnInit(): Promise<void> {
    await this.loadManualContent();
  }

  get selectedRole(): ManualRole | null {
    return this.roles.find((role) => role.id === this.selectedRoleId) ?? null;
  }

  get hasSearchQuery(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  get filteredSections(): ManualSection[] {
    const role = this.selectedRole;
    if (!role) {
      return [];
    }

    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return role.sections;
    }

    return role.sections.filter((section) => section.searchText.includes(query));
  }

  get visibleNavEntries(): Array<{ sectionId: string; title: string }> {
    const role = this.selectedRole;
    if (!role) {
      return [];
    }

    const sectionByIndex = new Map<number, ManualSection>();
    for (const section of role.sections) {
      if (typeof section.index === 'number') {
        sectionByIndex.set(section.index, section);
      }
    }

    const fromNav = role.nav
      .map((entry) => ({
        title: entry.title,
        sectionId: sectionByIndex.get(entry.index)?.id ?? ''
      }))
      .filter((entry) => entry.sectionId);

    if (!this.hasSearchQuery) {
      if (fromNav.length > 0) {
        return fromNav;
      }

      return role.sections.map((section) => ({ sectionId: section.id, title: section.title }));
    }

    const visibleSectionIds = new Set(this.filteredSections.map((section) => section.id));
    const filteredNav = fromNav.filter((entry) => visibleSectionIds.has(entry.sectionId));

    if (filteredNav.length > 0) {
      return filteredNav;
    }

    return this.filteredSections.map((section) => ({ sectionId: section.id, title: section.title }));
  }

  selectRole(roleId: string): void {
    if (roleId === this.selectedRoleId) {
      return;
    }

    this.selectedRoleId = roleId;
    this.searchTerm = '';
    this.lightboxImageSrc = '';
    this.resetExpansionForSelectedRole();
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value ?? '';

    const firstVisibleId = this.filteredSections[0]?.id;
    if (firstVisibleId && this.expandedSectionIds.size === 0) {
      this.expandedSectionIds.add(firstVisibleId);
      this.expandedSectionIds = new Set(this.expandedSectionIds);
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.resetExpansionForSelectedRole();
  }

  openGuide(): void {
    const first = this.filteredSections[0];
    if (!first) {
      return;
    }

    this.expandedSectionIds.add(first.id);
    this.expandedSectionIds = new Set(this.expandedSectionIds);
    this.scrollToSection(first.id);
  }

  expandAllSections(): void {
    this.expandedSectionIds = new Set(this.filteredSections.map((section) => section.id));
  }

  collapseAllSections(): void {
    this.expandedSectionIds = new Set<string>();
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

    this.expandedSectionIds = new Set(this.expandedSectionIds);
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onSectionBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const imageElement = target.closest('.img-wrap img') as HTMLImageElement | null;
    if (imageElement) {
      const src = imageElement.getAttribute('src') ?? '';
      if (src) {
        this.lightboxImageSrc = src;
      }
      return;
    }

    const subHeader = target.closest('.sub-hd') as HTMLElement | null;
    if (!subHeader) {
      return;
    }

    const subBody = subHeader.nextElementSibling as HTMLElement | null;
    if (!subBody || !subBody.classList.contains('sub-bd')) {
      return;
    }

    subHeader.classList.toggle('open');
    subBody.classList.toggle('show');
  }

  closeLightbox(): void {
    this.lightboxImageSrc = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeLightbox();
  }

  private async loadManualContent(): Promise<void> {
    this.isLoading = true;
    this.loadError = '';

    try {
      const payload = await firstValueFrom(this.http.get<ManualPayload>('/help-desk/manual-content.json'));
      this.roles = this.normalizeRoles(payload.roles);
      this.selectedRoleId = this.roles[0]?.id ?? '';
      this.resetExpansionForSelectedRole();
    } catch (error) {
      this.loadError = 'Unable to load the user manual content. Please refresh and try again.';
      this.roles = [];
      this.selectedRoleId = '';
      this.expandedSectionIds = new Set<string>();
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  private normalizeRoles(payloadRoles: ManualPayloadRole[]): ManualRole[] {
    return payloadRoles.map((role) => {
      const sections = role.sections.map((section, index) => {
        const normalizedIndex = typeof section.index === 'number' ? section.index : index;
        const normalizedBodyHtml = this.normalizeBodyHtml(section.bodyHtml);

        return {
          id: `${role.id}-gs${normalizedIndex}`,
          index: section.index,
          title: section.title,
          bodyHtml: normalizedBodyHtml,
          searchText: section.searchText
        };
      });

      const imageCount = sections.reduce((count, section) => {
        const matches = section.bodyHtml.match(/<img\b/gi);
        return count + (matches?.length ?? 0);
      }, 0);

      return {
        id: role.id,
        name: role.name,
        icon: role.icon,
        color: role.color,
        shortDescription: this.getRoleDescription(role.id),
        nav: role.nav,
        sections,
        imageCount
      };
    });
  }

  private resetExpansionForSelectedRole(): void {
    const role = this.selectedRole;
    if (!role) {
      this.expandedSectionIds = new Set<string>();
      return;
    }

    this.expandedSectionIds = new Set(role.sections.slice(0, 2).map((section) => section.id));
  }

  private normalizeBodyHtml(html: string): string {
    return html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?(iframe|object|embed|link|meta)\b[^>]*>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .replace(/\s+loading\s*=\s*("[^"]*"|'[^']*')/gi, '')
      .trim();
  }

  private getRoleDescription(roleId: string): string {
    const map: Record<string, string> = {
      'all-user': 'Full end-to-end SNSOP MIS manual across all operational roles.',
      ip: 'Registration, attendance, wage requests, payroll and invoice workflow.',
      qa: 'Sub-project approval review and payment report quality validation.',
      superadmin: 'System-wide dashboard and user management controls.',
      grm: 'GRM intake and grievance case monitoring workflow.',
      env: 'Environmental sub-project approval and compliance checks.',
      tst: 'Technical support review and troubleshooting guidance.',
      reviewer: 'Initial reviewer checks before financial processing.',
      financial: 'Financial approval and payment readiness verification.',
      authorizer: 'Final payment authorization controls and sign-off.',
      fsp: 'FSP-side payroll, payment report and invoice operations.'
    };

    return map[roleId] ?? 'Role-specific SNSOP MIS operating manual.';
  }
}
