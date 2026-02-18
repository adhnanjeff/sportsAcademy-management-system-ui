import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import {
  AttendanceApiResponse,
  AttendanceBatch,
  AttendanceService,
  StudentAttendance
} from '../../services/attendance.service';
import { AttendanceStatus } from '../../../../core/models';
import { ToastService } from '../../../../core/services/toast.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

type ViewMode = 'WEEKLY' | 'MONTHLY';
type CellStatus = AttendanceStatus | 'NOT_MARKED';

interface DateColumn {
  date: string;
  weekdayLabel: string;
  dayNumber: string;
}

interface StudentMatrixRow {
  studentId: number;
  studentName: string;
  statuses: Record<string, CellStatus>;
}

@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [CommonModule, CardComponent, SkeletonLoaderComponent],
  template: `
    <div class="reports-page page-enter">
      <div class="page-header animate-fade-in-up">
        <div>
          <h1>Attendance Reports</h1>
          <p>Weekly and monthly student attendance matrix</p>
        </div>
      </div>

      <app-card class="animate-fade-in-up stagger-1" [allowOverflow]="true">
        <div class="view-toggle">
          <button
            class="toggle-btn"
            [class.active]="viewMode() === 'WEEKLY'"
            (click)="setViewMode('WEEKLY')"
          >
            Weekly
          </button>
          <button
            class="toggle-btn"
            [class.active]="viewMode() === 'MONTHLY'"
            (click)="setViewMode('MONTHLY')"
          >
            Monthly
          </button>
        </div>

        <div class="filters-grid">
          <div class="filter-item">
            <label>Batch</label>
            <select [value]="selectedBatchId()" (change)="onBatchChange($event)">
              <option value="">Select Batch</option>
              @for (batch of batches(); track batch.id) {
                <option [value]="batch.id">{{ batch.name }}</option>
              }
            </select>
          </div>

          @if (viewMode() === 'WEEKLY') {
            <div class="filter-item">
              <label>Week Reference Date</label>
              <input type="date" [value]="selectedDate()" (change)="onDateChange($event)" />
            </div>
          }

          @if (viewMode() === 'MONTHLY') {
            <div class="filter-item">
              <label>Month</label>
              <input type="month" [value]="selectedMonth()" (change)="onMonthChange($event)" />
            </div>
          }

          <div class="filter-item">
            <label>Student Search</label>
            <input
              type="text"
              placeholder="Search student name"
              [value]="searchQuery()"
              (input)="onSearchChange($event)"
            />
          </div>

          <div class="filter-item action">
            <label class="action-label">Actions</label>
            <div class="actions-row">
              <button class="apply-btn" (click)="applyFilters()" [disabled]="isLoading()">Apply</button>
              <button
                type="button"
                class="export-btn"
                [disabled]="isLoading() || !canExport()"
                (click)="exportAttendanceCsv()"
              >
                <i class="fa-solid fa-download"></i>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div class="range-note">
          @if (viewMode() === 'WEEKLY') {
            <span>Week Range: {{ activeRangeLabel() }} (Sunday to Saturday)</span>
          } @else {
            <span>Month Range: {{ activeRangeLabel() }} (1 to {{ totalColumns() }})</span>
          }
        </div>
      </app-card>

      <div class="summary-cards animate-fade-in-up stagger-2">
        <div class="summary-card">
          <span class="label">Students</span>
          <span class="value">{{ filteredRows().length }}</span>
        </div>
        <div class="summary-card present">
          <span class="label">Present Entries</span>
          <span class="value">{{ presentCount() }}</span>
        </div>
        <div class="summary-card absent">
          <span class="label">Absent Entries</span>
          <span class="value">{{ absentCount() }}</span>
        </div>
        <div class="summary-card percentage">
          <span class="label">Attendance %</span>
          <span class="value">{{ attendancePercentage() }}%</span>
        </div>
      </div>

      <app-card class="animate-fade-in-up stagger-3">
        @if (isLoading()) {
          <app-skeleton-loader type="table" [count]="8" [columns]="8" />
        } @else if (!selectedBatchId()) {
          <div class="empty-state">
            <h3>Select a batch</h3>
            <p>Choose a batch and apply filters to view weekly/monthly attendance.</p>
          </div>
        } @else if (filteredRows().length === 0) {
          <div class="empty-state">
            <h3>No students/attendance found</h3>
            <p>Try another batch or period.</p>
          </div>
        } @else {
          <div class="table-container">
            <div class="table-wrap">
              <table class="matrix-table">
                <thead>
                  <tr>
                    <th class="student-col">Student</th>
                    @for (column of dateColumns(); track column.date) {
                      <th>
                        <div class="th-content">
                          <span class="weekday">{{ column.weekdayLabel }}</span>
                          <span class="day">{{ column.dayNumber }}</span>
                        </div>
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of paginatedRows(); track row.studentId) {
                    <tr>
                      <td class="student-col">{{ row.studentName }}</td>
                      @for (column of dateColumns(); track column.date) {
                        <td>
                          <span class="status-badge" [class]="statusClass(row.statuses[column.date])">
                            {{ statusCode(row.statuses[column.date]) }}
                          </span>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="pagination-controls">
              <div class="page-size-selector">
                <label>Per page:</label>
                <select [value]="pageSize()" (change)="onPageSizeChange($event)">
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div class="page-info">
                Showing {{ paginationStartIndex() + 1 }} - {{ paginationEndIndex() }} of {{ filteredRows().length }}
              </div>

              <div class="page-nav">
                <button
                  class="page-btn"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(1)"
                  title="First"
                >
                  <i class="fa-solid fa-angles-left"></i>
                </button>
                <button
                  class="page-btn"
                  [disabled]="currentPage() === 1"
                  (click)="goToPage(currentPage() - 1)"
                  title="Previous"
                >
                  <i class="fa-solid fa-angle-left"></i>
                </button>
                <span class="page-number">{{ currentPage() }} / {{ totalPages() }}</span>
                <button
                  class="page-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(currentPage() + 1)"
                  title="Next"
                >
                  <i class="fa-solid fa-angle-right"></i>
                </button>
                <button
                  class="page-btn"
                  [disabled]="currentPage() === totalPages()"
                  (click)="goToPage(totalPages())"
                  title="Last"
                >
                  <i class="fa-solid fa-angles-right"></i>
                </button>
              </div>
            </div>
          </div>
        }
      </app-card>
    </div>
  `,
  styles: [`
    .reports-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: var(--text-primary);
    }

    .page-header p {
      margin: 4px 0 0;
      color: var(--text-muted);
    }

    .view-toggle {
      display: inline-flex;
      background: var(--gray-100);
      border-radius: 12px;
      padding: 4px;
      margin-bottom: 16px;
    }

    .toggle-btn {
      border: none;
      background: transparent;
      padding: 8px 14px;
      border-radius: 10px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .toggle-btn.active {
      background: var(--white);
      box-shadow: var(--shadow-sm);
      color: var(--text-primary);
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(160px, 1fr));
      gap: 12px;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-item label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .filter-item input,
    .filter-item select {
      height: 40px;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 0 12px;
      background: var(--white);
    }

    .filter-item.action {
      justify-content: flex-end;
    }

    .action-label {
      opacity: 0;
      user-select: none;
    }

    .actions-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .apply-btn {
      height: 40px;
      border-radius: 10px;
      border: none;
      background: var(--primary-color);
      color: white;
      font-weight: 600;
      padding: 0 16px;
      min-width: 110px;
    }

    .range-note {
      margin-top: 12px;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 600;
    }

    .export-btn {
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--primary-color);
      background: var(--white);
      color: var(--primary-color);
      font-weight: 700;
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .export-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .export-btn:hover:not(:disabled) {
      background: var(--primary-light);
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(160px, 1fr));
      gap: 12px;
    }

    .summary-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .summary-card .label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .summary-card .value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .summary-card.present .value { color: #16a34a; }
    .summary-card.absent .value { color: #dc2626; }
    .summary-card.percentage .value { color: #2563eb; }

    .table-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 420px);
      min-height: 400px;
    }

    .table-wrap {
      flex: 1;
      overflow: auto;
      border: 1px solid var(--border-color);
      border-radius: 12px 12px 0 0;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 16px;
      background: var(--gray-50);
      border: 1px solid var(--border-color);
      border-top: none;
      border-radius: 0 0 12px 12px;
      flex-wrap: wrap;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;

      label {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-secondary);
      }

      select {
        padding: 6px 10px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--white);
        font-size: 13px;
        cursor: pointer;
      }
    }

    .page-info {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .page-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-btn {
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--white);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;

      &:hover:not(:disabled) {
        background: var(--gray-100);
        color: var(--text-primary);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-number {
      padding: 0 12px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .matrix-table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
      background: var(--white);
    }

    .matrix-table th,
    .matrix-table td {
      padding: 10px;
      border-bottom: 1px solid var(--border-color);
      text-align: center;
      min-width: 64px;
    }

    .matrix-table th {
      position: sticky;
      top: 0;
      background: var(--gray-50);
      z-index: 2;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
    }

    .student-col {
      position: sticky;
      left: 0;
      z-index: 3;
      text-align: left !important;
      min-width: 200px !important;
      background: var(--white);
      font-weight: 600;
      color: var(--text-primary);
    }

    thead .student-col {
      background: var(--gray-50);
      z-index: 4;
    }

    .th-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      line-height: 1.1;
    }

    .th-content .weekday {
      font-size: 10px;
      color: var(--text-muted);
    }

    .th-content .day {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 700;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      width: 28px;
      height: 28px;
      font-size: 11px;
      font-weight: 700;
      color: white;
    }

    .status-badge.present { background: #16a34a; }
    .status-badge.absent { background: #dc2626; }
    .status-badge.late { background: #ea580c; }
    .status-badge.excused { background: #2563eb; }
    .status-badge.not-marked {
      background: var(--gray-300);
      color: var(--text-secondary);
    }

    .empty-state {
      text-align: center;
      padding: 48px 12px;
      color: var(--text-muted);
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0;
    }

    @media (max-width: 1100px) {
      .filters-grid {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }

      .summary-cards {
        grid-template-columns: repeat(2, minmax(160px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .filters-grid,
      .summary-cards {
        grid-template-columns: 1fr;
      }

      .actions-row {
        width: 100%;
      }

      .actions-row button {
        flex: 1;
      }

      .student-col {
        min-width: 160px !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttendanceHistoryComponent implements OnInit {
  private attendanceService = inject(AttendanceService);
  private toastService = inject(ToastService);

  readonly AttendanceStatus = AttendanceStatus;

  isLoading = signal(false);
  viewMode = signal<ViewMode>('MONTHLY');
  batches = signal<AttendanceBatch[]>([]);
  rows = signal<StudentMatrixRow[]>([]);
  dateColumns = signal<DateColumn[]>([]);

  selectedBatchId = signal('');
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  selectedMonth = signal(new Date().toISOString().slice(0, 7));
  searchQuery = signal('');
  activeRangeLabel = signal('');
  
  // Pagination state
  pageSize = signal<string>('10');
  currentPage = signal(1);

  filteredRows = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.rows();
    return this.rows().filter(row => row.studentName.toLowerCase().includes(query));
  });

  // Pagination computed properties
  numericPageSize = computed(() => {
    const size = this.pageSize();
    return size === 'all' ? this.filteredRows().length : parseInt(size, 10);
  });

  totalPages = computed(() => {
    const size = this.numericPageSize();
    if (size === 0 || this.filteredRows().length === 0) return 1;
    return Math.ceil(this.filteredRows().length / size);
  });

  paginationStartIndex = computed(() => {
    return (this.currentPage() - 1) * this.numericPageSize();
  });

  paginationEndIndex = computed(() => {
    const end = this.currentPage() * this.numericPageSize();
    return Math.min(end, this.filteredRows().length);
  });

  paginatedRows = computed(() => {
    const size = this.pageSize();
    if (size === 'all') return this.filteredRows();
    const start = this.paginationStartIndex();
    const end = this.paginationEndIndex();
    return this.filteredRows().slice(start, end);
  });

  totalColumns = computed(() => this.dateColumns().length);

  presentCount = computed(() => this.countByStatus(AttendanceStatus.PRESENT));
  absentCount = computed(() => this.countByStatus(AttendanceStatus.ABSENT));
  attendancePercentage = computed(() => {
    const allStatuses = this.filteredRows().flatMap(row => Object.values(row.statuses));
    const marked = allStatuses.filter(status => status !== 'NOT_MARKED').length;
    if (marked === 0) return 0;
    return Math.round((this.presentCount() * 100) / marked);
  });
  canExport = computed(() => !!this.selectedBatchId() && this.dateColumns().length > 0 && this.filteredRows().length > 0);

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.attendanceService.getBatchesForAttendance().subscribe({
      next: (batches) => {
        this.batches.set(batches);
      },
      error: () => this.toastService.error('Failed to load batches')
    });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.applyFilters();
  }

  onBatchChange(event: Event): void {
    const batchId = (event.target as HTMLSelectElement).value;
    this.selectedBatchId.set(batchId);
    this.searchQuery.set('');

    if (!batchId) {
      this.rows.set([]);
      this.dateColumns.set([]);
      this.activeRangeLabel.set('');
      return;
    }

    this.applyFilters();
  }

  onDateChange(event: Event): void {
    this.selectedDate.set((event.target as HTMLInputElement).value);
    if (this.selectedBatchId()) {
      this.applyFilters();
    }
  }

  onMonthChange(event: Event): void {
    this.selectedMonth.set((event.target as HTMLInputElement).value);
    if (this.selectedBatchId()) {
      this.applyFilters();
    }
  }

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  // Pagination methods
  onPageSizeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.pageSize.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  exportAttendanceCsv(): void {
    if (!this.canExport()) {
      this.toastService.info('No attendance data available to export');
      return;
    }

    const columns = this.dateColumns();
    const records = this.filteredRows();
    const header = ['Student', ...columns.map((column) => `${column.weekdayLabel} ${column.date}`)];
    const csvRows = records.map((row) => [
      row.studentName,
      ...columns.map((column) => this.statusExportLabel(row.statuses[column.date]))
    ]);

    const csvContent = [header, ...csvRows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(','))
      .join('\n');

    const batchName = this.selectedBatchName();
    const period = this.viewMode() === 'WEEKLY' ? 'weekly' : 'monthly';
    const generatedDate = new Date().toISOString().slice(0, 10);
    const fileName = `attendance-${this.slugify(batchName)}-${period}-${generatedDate}.csv`;

    this.downloadCsv(fileName, csvContent);
    this.toastService.success('Attendance report exported');
  }

  applyFilters(): void {
    const batchIdRaw = this.selectedBatchId();
    if (!batchIdRaw) {
      this.rows.set([]);
      this.dateColumns.set([]);
      this.activeRangeLabel.set('');
      return;
    }

    const batchId = Number(batchIdRaw);
    if (this.viewMode() === 'WEEKLY') {
      const { startDate, endDate } = this.getWeekRange(this.selectedDate());
      const columns = this.createDateColumns(startDate, endDate);
      this.dateColumns.set(columns);
      this.activeRangeLabel.set(`${startDate} to ${endDate}`);
      this.loadMatrix(batchId, startDate, endDate, columns);
      return;
    }

    const [yearRaw, monthRaw] = this.selectedMonth().split('-');
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const startDate = `${yearRaw}-${monthRaw}-01`;
    const endDate = this.formatDate(new Date(year, month, 0));
    const columns = this.createDateColumns(startDate, endDate);

    this.dateColumns.set(columns);
    this.activeRangeLabel.set(`${startDate} to ${endDate}`);
    this.loadMatrix(batchId, startDate, endDate, columns);
  }

  statusClass(status: CellStatus): string {
    if (status === AttendanceStatus.PRESENT) return 'present';
    if (status === AttendanceStatus.ABSENT) return 'absent';
    if (status === AttendanceStatus.LATE) return 'late';
    if (status === AttendanceStatus.EXCUSED) return 'excused';
    return 'not-marked';
  }

  statusCode(status: CellStatus): string {
    if (status === AttendanceStatus.PRESENT) return 'P';
    if (status === AttendanceStatus.ABSENT) return 'A';
    if (status === AttendanceStatus.LATE) return 'L';
    if (status === AttendanceStatus.EXCUSED) return 'E';
    return '-';
  }

  private statusExportLabel(status: CellStatus): string {
    if (status === AttendanceStatus.PRESENT) return 'Present';
    if (status === AttendanceStatus.ABSENT) return 'Absent';
    if (status === AttendanceStatus.LATE) return 'Late';
    if (status === AttendanceStatus.EXCUSED) return 'Excused';
    return 'Not Marked';
  }

  private selectedBatchName(): string {
    const selectedBatch = this.batches().find((batch) => String(batch.id) === this.selectedBatchId());
    return selectedBatch?.name || 'batch';
  }

  private slugify(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private escapeCsvValue(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private downloadCsv(fileName: string, content: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private loadMatrix(batchId: number, startDate: string, endDate: string, columns: DateColumn[]): void {
    this.isLoading.set(true);

    forkJoin({
      students: this.attendanceService.getStudentsForBatch(batchId),
      records: this.attendanceService.getAttendanceByBatchAndRange(batchId, startDate, endDate)
    }).subscribe({
      next: ({ students, records }) => {
        this.rows.set(this.toMatrixRows(students, records, columns));
        this.isLoading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.isLoading.set(false);
        this.toastService.error('Failed to load attendance matrix');
      }
    });
  }

  private toMatrixRows(students: StudentAttendance[], records: AttendanceApiResponse[], columns: DateColumn[]): StudentMatrixRow[] {
    const recordMap = new Map<string, CellStatus>();

    for (const record of records) {
      recordMap.set(`${record.studentId}-${record.date}`, record.status);
    }

    return students
      .map((student) => {
        const statuses: Record<string, CellStatus> = {};

        for (const column of columns) {
          const key = `${student.studentId}-${column.date}`;
          statuses[column.date] = recordMap.get(key) ?? 'NOT_MARKED';
        }

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          statuses
        };
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  }

  private countByStatus(status: AttendanceStatus): number {
    return this.filteredRows()
      .flatMap(row => Object.values(row.statuses))
      .filter(cellStatus => cellStatus === status)
      .length;
  }

  private createDateColumns(startDate: string, endDate: string): DateColumn[] {
    const columns: DateColumn[] = [];
    let cursor = this.parseDate(startDate);
    const end = this.parseDate(endDate);

    while (cursor <= end) {
      const iso = this.formatDate(cursor);
      columns.push({
        date: iso,
        weekdayLabel: cursor.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: String(cursor.getDate()).padStart(2, '0')
      });

      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }

    return columns;
  }

  private getWeekRange(referenceDate: string): { startDate: string; endDate: string } {
    const base = this.parseDate(referenceDate);
    const dayOfWeek = base.getDay();

    const start = new Date(base.getFullYear(), base.getMonth(), base.getDate() - dayOfWeek);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

    return {
      startDate: this.formatDate(start),
      endDate: this.formatDate(end)
    };
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
