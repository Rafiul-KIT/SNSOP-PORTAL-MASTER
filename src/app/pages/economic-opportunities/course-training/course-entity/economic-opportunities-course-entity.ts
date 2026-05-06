import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Loader } from '../../../../components/loader/loader';
import { ApiService } from '../../../../../services/api.service';

interface CourseFormModel {
  courseName: string;
  courseCode: string;
}

interface CourseRecord {
  id: number;
  courseName: string;
  courseCode: string;
}

interface CourseListResponse {
  code?: number | string | null;
  message?: string | null;
  content?: CourseRecord[] | null;
  pageNumber?: number | null;
  pageSize?: number | null;
  totalElements?: number | null;
}

@Component({
  selector: 'app-economic-opportunities-course-entity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    BreadcrumbModule,
    ButtonModule,
    FloatLabel,
    InputText,
    Loader,
    Paginator,
    TableModule,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './economic-opportunities-course-entity.html',
  styleUrl: './economic-opportunities-course-entity.scss',
})
export class EconomicOpportunitiesCourseEntity implements OnInit {
  private readonly saveEndpoint = '/api/econ-op/course/save';
  private readonly getEndpoint = '/api/econ-op/course/get';

  isLoading = false;
  isSaving = false;
  isSearching = false;

  courses: CourseRecord[] = [];
  totalRecords = 0;
  currentPage = 0;
  pageSize = 10;

  form: CourseFormModel = this.createDefaultForm();

  home: MenuItem = { icon: 'fas fa-home', routerLink: ['/home/portals'] };
  items: MenuItem[] = [
    { label: 'Economic Opportunities' },
    { label: 'Course Training' },
    { label: 'Course Entity', icon: 'fas fa-graduation-cap' },
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private msg: MessageService
  ) {}

  ngOnInit(): void {
    this.searchCourses();
  }

  async saveCourse(): Promise<void> {
    if (!this.form.courseName.trim()) {
      this.msg.add({
        severity: 'warn',
        summary: 'Course Name Required',
        detail: 'Please provide a course name before saving.',
      });
      return;
    }

    if (!this.form.courseCode.trim()) {
      this.msg.add({
        severity: 'warn',
        summary: 'Course Code Required',
        detail: 'Please provide a course code before saving.',
      });
      return;
    }

    const payload = {
      courseName: this.form.courseName.trim(),
      courseCode: this.form.courseCode.trim(),
    };

    try {
      this.isSaving = true;
      this.cdr.detectChanges();

      const res = await this.api.POST(this.saveEndpoint, payload);
      const data = res?.data;

      if (!this.isApiSuccess(data)) {
        throw new Error(data?.message || 'Unable to save course');
      }

      this.msg.add({
        severity: 'success',
        summary: 'Saved',
        detail: 'Course information saved successfully.',
      });

      this.form = this.createDefaultForm();
      await this.searchCourses();
    } catch (err) {
      console.error('Failed to save course', err);
      this.showError('Unable to save course data.');
    } finally {
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  }

  async searchCourses(): Promise<void> {
    this.currentPage = 0;
    await this.loadCourses();
  }

  async onPageChange(event: PaginatorState): Promise<void> {
    this.currentPage = event.page ?? 0;
    this.pageSize = event.rows ?? this.pageSize;
    await this.loadCourses();
  }

  resetForm(): void {
    this.form = this.createDefaultForm();
  }

  private async loadCourses(): Promise<void> {
    try {
      this.isLoading = true;
      this.isSearching = true;
      this.cdr.detectChanges();

      const params = {
        pageNumber: this.currentPage,
        pageSize: this.pageSize,
      };

      const res = await this.api.GET<CourseListResponse>(this.getEndpoint, params);
      const data = res?.data;

      const hasEmptyPayload =
        data?.code == null &&
        data?.message == null &&
        data?.content == null;

      if (!this.isApiSuccess(data, Array.isArray(data?.content) || hasEmptyPayload)) {
        throw new Error(data?.message || 'Unable to load courses');
      }

      const content = Array.isArray(data?.content) ? data.content : [];
      this.courses = content.map((item) => ({
        id: Number(item.id) || 0,
        courseName: item.courseName ?? '',
        courseCode: item.courseCode ?? '',
      }));
      this.totalRecords = Number(data?.totalElements ?? content.length ?? 0);
      this.currentPage = Number(data?.pageNumber ?? this.currentPage ?? 0);
      this.pageSize = Number(data?.pageSize ?? this.pageSize ?? 10);
    } catch (err) {
      console.error('Failed to load courses', err);
      this.courses = [];
      this.totalRecords = 0;
      this.showError('Unable to load course data.');
    } finally {
      this.isLoading = false;
      this.isSearching = false;
      this.cdr.detectChanges();
    }
  }

  private createDefaultForm(): CourseFormModel {
    return {
      courseName: '',
      courseCode: '',
    };
  }

  private isApiSuccess(data: { code?: number | string | null } | null | undefined, fallback = false): boolean {
    if (!data) return fallback;
    if (data.code === undefined || data.code === null || data.code === '') return fallback;
    const code = Number(data.code);
    return code === 0 || code === 200;
  }

  private showError(detail: string): void {
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }
}
