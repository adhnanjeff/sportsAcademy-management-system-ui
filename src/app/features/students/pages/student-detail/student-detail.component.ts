import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../../attendance/services/attendance.service';
import { AchievementService } from '../../../achievements/services/achievement.service';
import { MatchService } from '../../../matches/services/match.service';
import { Student, Role, FeePaymentHistory, MonthlyFeeStatus, Achievement, Match, MatchResult, MatchType, MatchStatistics, PerformanceMetrics, PERFORMANCE_AXES } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { StudentSkillMetricsService } from '../../../performance/services/student-skill-metrics.service';

type TabType = 'profile' | 'achievements' | 'matches';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AvatarComponent,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="student-detail-page">
      @if (isLoading()) {
        <app-skeleton-loader type="profile" />
        <app-skeleton-loader type="stats" [count]="4" />
        <app-skeleton-loader type="card" [count]="4" />
      } @else if (student()) {
        <div class="page-header">
          <button class="back-btn" (click)="goBack()">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="header-content">
            <div class="student-header">
              <app-avatar 
                [name]="student()!.firstName + ' ' + student()!.lastName"
                size="lg"
              />
              <div class="student-info">
                <h1>{{ student()?.firstName }} {{ student()?.lastName }}</h1>
                <div class="student-badges">
                  <app-badge
                    [text]="student()!.status ?? 'INACTIVE'"
                    [variant]="(student()!.status ?? 'INACTIVE') === 'ACTIVE' ? 'success' : 'warning'"
                  />
                  @if (student()?.skillLevel) {
                    <app-badge
                      [text]="formatSkillLevel(student()!.skillLevel!)"
                      [variant]="getSkillBadgeVariant(student()!.skillLevel!)"
                    />
                  }
                </div>
              </div>
            </div>
          </div>
          <div class="header-actions">
            @if (canManageStudents()) {
              <app-button variant="outline" icon="fa-solid fa-pen" [routerLink]="['edit']">
                Edit
              </app-button>
            }
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tabs-container">
          <div class="tabs">
            <button
              class="tab"
              [class.active]="activeTab() === 'profile'"
              (click)="setActiveTab('profile')"
            >
              <i class="fa-solid fa-user"></i>
              Profile
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'achievements'"
              (click)="setActiveTab('achievements')"
            >
              <i class="fa-solid fa-trophy"></i>
              Achievements
              @if (achievements().length > 0) {
                <span class="tab-badge">{{ achievements().length }}</span>
              }
            </button>
            <button
              class="tab"
              [class.active]="activeTab() === 'matches'"
              (click)="setActiveTab('matches')"
            >
              <i class="fa-solid fa-flag-checkered"></i>
              Matches
              @if (matches().length > 0) {
                <span class="tab-badge">{{ matches().length }}</span>
              }
            </button>
          </div>
        </div>

        <!-- Profile Tab -->
        @if (activeTab() === 'profile') {
          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon attendance">
                <i class="fa-solid fa-check-circle"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ attendanceStats().percentage }}%</span>
                <span class="stat-label">Attendance Rate</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon present">
                <i class="fa-solid fa-user-check"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ attendanceStats().present }}</span>
                <span class="stat-label">Days Present</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon absent">
                <i class="fa-solid fa-user-xmark"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ attendanceStats().absent }}</span>
                <span class="stat-label">Days Absent</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon late">
                <i class="fa-solid fa-clock"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ attendanceStats().late }}</span>
                <span class="stat-label">Days Late</span>
              </div>
            </div>
          </div>

          <!-- Info Cards -->
          <div class="info-grid">
            <app-card title="Personal Details" icon="fa-solid fa-user" [fullHeight]="true">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Student ID</span>
                  <span class="info-value">{{ student()?.id || 'Not available' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">National ID Number</span>
                  <span class="info-value">{{ student()?.nationalIdNumber || 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Age</span>
                  <span class="info-value">{{ getAge(student()?.dateOfBirth) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Gender</span>
                  <span class="info-value">{{ student()?.gender || 'Not specified' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date of Birth</span>
                  <span class="info-value">{{ student()?.dateOfBirth ? (student()?.dateOfBirth | date:'MMM d, y') : 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Join Date</span>
                  <span class="info-value">{{ student()?.joinDate ? (student()?.joinDate | date:'MMM d, y') : 'Not provided' }}</span>
                </div>
              </div>
            </app-card>

            <app-card title="Contact Information" icon="fa-solid fa-address-book" [fullHeight]="true">
              <div class="contact-card-content">
                <div class="info-list">
                  <div class="info-item">
                    <span class="info-label">Phone</span>
                    <span class="info-value">{{ getPrimaryPhone(student()) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Address</span>
                    <span class="info-value">{{ student()?.address || 'Not provided' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Location</span>
                    <span class="info-value">{{ formatLocation(student()) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Emergency Contact</span>
                    <span class="info-value">{{ student()?.emergencyContactPhone || 'Not provided' }}</span>
                  </div>
                </div>

                <div class="contact-summary">
                  <div class="info-label">Match Snapshot</div>
                  <div class="mini-stats-grid">
                    <div class="mini-stat">
                      <span class="info-label">Wins</span>
                      <span class="info-value">{{ matchStats().wins }}</span>
                    </div>
                    <div class="mini-stat">
                      <span class="info-label">Losses</span>
                      <span class="info-value">{{ matchStats().losses }}</span>
                    </div>
                    <div class="mini-stat">
                      <span class="info-label">Win Rate</span>
                      <span class="info-value">{{ matchStats().winRate }}%</span>
                    </div>
                    <div class="mini-stat">
                      <span class="info-label">Total</span>
                      <span class="info-value">{{ matchStats().totalMatches }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </app-card>
          </div>

          <div class="training-skills-layout">
            <div class="training-column">
            <app-card title="Training Details" icon="fa-solid fa-dumbbell" [fullHeight]="true">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Batch</span>
                  @if (student()?.batchNames?.length) {
                    <span class="info-value">{{ student()?.batchNames?.join(', ') }}</span>
                  } @else {
                    <span class="info-value">Not assigned</span>
                  }
                </div>
                <div class="info-item">
                  <span class="info-label">Skill Level</span>
                  <span class="info-value">{{ formatSkillLevel(student()?.skillLevel || 'Not assessed') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Training Days</span>
                  <span class="info-value">{{ formatTrainingDays(student()?.daysOfWeek) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Fee Payable</span>
                  <span class="info-value">₹{{ student()?.feePayable ?? 0 }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Monthly Fee Status</span>
                  <span class="info-value">{{ student()?.monthlyFeeStatus || 'UNPAID' }}</span>
                </div>
              </div>
            </app-card>

            <app-card title="Emergency Contact" icon="fa-solid fa-phone">
              <div class="info-list emergency-grid">
                <div class="info-item">
                  <span class="info-label">Contact Name</span>
                  <span class="info-value">{{ student()?.emergencyContactName || 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Contact Phone</span>
                  <span class="info-value">{{ student()?.emergencyContactPhone || 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Medical Conditions</span>
                  <span class="info-value">{{ student()?.medicalConditions || 'None noted' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Parent / Guardian</span>
                  <span class="info-value">{{ student()?.parentName || 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Address</span>
                  <span class="info-value">{{ student()?.address || 'Not provided' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Location</span>
                  <span class="info-value">{{ formatLocation(student()) }}</span>
                </div>
              </div>
            </app-card>
            </div>

            <app-card title="Skill Metrics (0-10)" icon="fa-solid fa-chart-radar">
            <div class="skills-editor">
              <p class="skills-note">Used in the Performance page. Update anytime.</p>
              <div class="skills-grid">
                @for (axis of performanceAxes; track axis.key) {
                  <div class="skill-row">
                    <div class="skill-row-header">
                      <div class="skill-label">
                        <i [class]="axis.icon"></i>
                        <span>{{ axis.label }}</span>
                      </div>
                      <span class="skill-value">{{ skillMetrics()[axis.key] }}/10</span>
                    </div>
                    <input
                      class="skill-range"
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      [value]="skillMetrics()[axis.key]"
                      (input)="onSkillMetricChange(axis.key, $event)"
                    />
                  </div>
                }
              </div>
              <div class="skills-actions">
                <app-button variant="outline" size="sm" (clicked)="resetSkillMetrics()">
                  Reset
                </app-button>
                <app-button variant="primary" size="sm" [disabled]="!skillsDirty()" (clicked)="saveSkillMetrics()">
                  Save Skills
                </app-button>
              </div>
            </div>
            </app-card>
          </div>

          <!-- Fee Payment History -->
          @if (canManageStudents()) {
            <app-card title="Fee Payment History" icon="fa-solid fa-indian-rupee-sign">
              @if (isLoadingFeeHistory()) {
                <app-skeleton-loader type="list" [count]="4" />
              } @else if (feeHistory().length === 0) {
                <div class="empty-fee-history">
                  <i class="fa-solid fa-wallet"></i>
                  <p>No fee payment history available</p>
                </div>
              } @else {
                <div class="fee-history-list">
                  @for (fee of feeHistory(); track fee.month) {
                    <div class="fee-history-item">
                      <div class="fee-month">
                        <span class="month-name">{{ fee.month }}</span>
                      </div>
                      <div class="fee-status" [class]="getFeeStatusClass(fee.status)">
                        {{ formatFeeStatus(fee.status) }}
                      </div>
                      <div class="fee-amount">
                        ₹{{ fee.amountPaid }}
                      </div>
                    </div>
                  }
                </div>
              }
            </app-card>
          }
        }

        <!-- Achievements Tab -->
        @if (activeTab() === 'achievements') {
          <div class="achievements-section">
            @if (isLoadingAchievements()) {
              <app-skeleton-loader type="card" [count]="3" />
            } @else if (achievements().length === 0) {
              <div class="empty-state">
                <i class="fa-solid fa-trophy"></i>
                <h3>No Achievements Yet</h3>
                <p>This student hasn't earned any achievements yet.</p>
              </div>
            } @else {
              <div class="achievements-grid">
                @for (achievement of achievements(); track achievement.id) {
                  <div class="achievement-card" [class.verified]="achievement.isVerified">
                    @if (achievement.certificateUrl) {
                      <div class="achievement-image">
                        <img [src]="achievement.certificateUrl" [alt]="achievement.title" />
                      </div>
                    } @else {
                      <div class="achievement-image placeholder">
                        <i [class]="getAchievementIcon(achievement.type)"></i>
                      </div>
                    }
                    <div class="achievement-content">
                      <div class="achievement-header">
                        <app-badge
                          [text]="formatAchievementType(achievement.type)"
                          variant="primary"
                        />
                        @if (achievement.isVerified) {
                          <span class="verified-badge">
                            <i class="fa-solid fa-check-circle"></i> Verified
                          </span>
                        }
                      </div>
                      <h4>{{ achievement.title }}</h4>
                      @if (achievement.eventName) {
                        <p class="event-name">
                          <i class="fa-solid fa-flag"></i>
                          {{ achievement.eventName }}
                        </p>
                      }
                      @if (achievement.position) {
                        <p class="position">
                          <i class="fa-solid fa-medal"></i>
                          {{ achievement.position }}
                        </p>
                      }
                      <span class="achievement-date">
                        <i class="fa-regular fa-calendar"></i>
                        {{ achievement.achievedDate | date:'MMM d, y' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Matches Tab -->
        @if (activeTab() === 'matches') {
          <div class="matches-section">
            <!-- Match Stats Summary -->
            <div class="match-stats-grid">
              <div class="match-stat-card">
                <span class="stat-value">{{ matchStats().totalMatches }}</span>
                <span class="stat-label">Total Matches</span>
              </div>
              <div class="match-stat-card wins">
                <span class="stat-value">{{ matchStats().wins }}</span>
                <span class="stat-label">Wins</span>
              </div>
              <div class="match-stat-card losses">
                <span class="stat-value">{{ matchStats().losses }}</span>
                <span class="stat-label">Losses</span>
              </div>
              <div class="match-stat-card">
                <span class="stat-value">{{ matchStats().winRate }}%</span>
                <span class="stat-label">Win Rate</span>
              </div>
            </div>

            @if (isLoadingMatches()) {
              <app-skeleton-loader type="list" [count]="5" />
            } @else if (matches().length === 0) {
              <div class="empty-state">
                <i class="fa-solid fa-flag-checkered"></i>
                <h3>No Match History</h3>
                <p>No matches have been recorded for this student yet.</p>
              </div>
            } @else {
              <app-card title="Match History" icon="fa-solid fa-history">
                <div class="matches-list">
                  @for (match of matches(); track match.id) {
                    <div class="match-item" [class]="getMatchResultClass(match.result)">
                      <div class="match-result-indicator">
                        @if (match.result === 'WIN') {
                          <i class="fa-solid fa-trophy"></i>
                        } @else if (match.result === 'LOSS') {
                          <i class="fa-solid fa-times"></i>
                        } @else {
                          <i class="fa-solid fa-minus"></i>
                        }
                      </div>
                      <div class="match-details">
                        <div class="match-opponent">
                          <span class="vs-label">vs</span>
                          <span class="opponent-name">{{ match.opponentName }}</span>
                          @if (match.partnerName) {
                            <span class="partner-info">(with {{ match.partnerName }})</span>
                          }
                        </div>
                        <div class="match-meta">
                          <app-badge
                            [text]="formatMatchType(match.matchType)"
                            [variant]="getMatchTypeBadge(match.matchType)"
                          />
                          @if (match.eventName) {
                            <span class="event-name">{{ match.eventName }}</span>
                          }
                        </div>
                      </div>
                      <div class="match-score">
                        <span class="score">{{ match.score }}</span>
                        <span class="date">{{ match.matchDate | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                  }
                </div>
              </app-card>
            }
          </div>
        }
      } @else {
        <div class="not-found">
          <i class="fa-regular fa-user"></i>
          <h2>Student Not Found</h2>
          <p>The student you're looking for doesn't exist.</p>
          <app-button variant="primary" routerLink="/dashboard/students">Back to Students</app-button>
        </div>
      }
    </div>
  `,
  styles: [`
    .student-detail-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
      flex-shrink: 0;

      &:hover {
        background-color: var(--gray-100);
        color: var(--text-primary);
      }
    }

    .header-content {
      flex: 1;
      min-width: 200px;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .student-info {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }
    }

    .student-badges {
      display: flex;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    /* Tabs */
    .tabs-container {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 4px;
    }

    .tabs {
      display: flex;
      gap: 4px;
    }

    .tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      background: transparent;
      border: none;
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      font-weight: 500;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--gray-100);
        color: var(--text-primary);
      }

      &.active {
        background: var(--primary-color);
        color: white;
      }

      .tab-badge {
        background: rgba(255, 255, 255, 0.3);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: var(--font-size-xs);
      }
    }

    .tab.active .tab-badge {
      background: rgba(255, 255, 255, 0.3);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 18px;

      &.attendance {
        background-color: var(--primary-light);
        color: var(--primary-color);
      }

      &.present {
        background-color: var(--success-light);
        color: var(--success-color);
      }

      &.absent {
        background-color: var(--danger-light);
        color: var(--danger-color);
      }

      &.late {
        background-color: var(--warning-light);
        color: var(--warning-color);
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: var(--font-size-xl);
      font-weight: 600;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      align-items: stretch;
    }

    .info-grid > app-card {
      display: block;
      min-width: 0;
      height: 100%;
    }

    .training-skills-layout {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      align-items: start;
    }

    .training-column {
      display: grid;
      grid-template-rows: auto auto;
      gap: 20px;
      align-items: start;
      align-self: start;
    }

    .training-column > app-card,
    .training-skills-layout > app-card {
      display: block;
      min-width: 0;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .emergency-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: var(--font-size-sm);
      color: var(--text-muted);
    }

    .info-value {
      font-weight: 500;
      color: var(--text-primary);
    }

    .contact-card-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .contact-summary {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px dashed var(--border-color);
    }

    .mini-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }

    .mini-stat {
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--gray-50);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .skills-editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: auto;
    }

    .skills-note {
      margin: 0;
      font-size: var(--font-size-xs);
      color: var(--text-muted);
    }

    .skills-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .skill-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 10px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      background: var(--gray-50);
    }

    .skill-row-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .skill-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      font-weight: 600;

      i {
        color: var(--primary-color);
      }
    }

    .skill-value {
      font-size: var(--font-size-sm);
      font-weight: 700;
      color: var(--primary-color);
    }

    .skill-range {
      width: 100%;
      accent-color: var(--primary-color);
      cursor: pointer;
    }

    .skills-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 2px;
    }

    .not-found,
    .empty-state {
      padding: 80px 40px;
      text-align: center;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        font-size: 64px;
        color: var(--gray-300);
        margin-bottom: 20px;
      }

      h2, h3 {
        font-size: var(--font-size-xl);
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0 0 24px 0;
      }
    }

    .empty-fee-history {
      text-align: center;
      padding: 32px 20px;
      color: var(--text-muted);

      i {
        font-size: 40px;
        margin-bottom: 12px;
        color: var(--gray-300);
      }

      p {
        margin: 0;
      }
    }

    .fee-history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .fee-history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--gray-50);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .fee-month {
      flex: 1;
    }

    .month-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .fee-status {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: var(--font-size-xs);
      font-weight: 700;
      text-transform: uppercase;
    }

    .fee-status.full {
      background: var(--success-light);
      color: var(--success-color);
    }

    .fee-status.half {
      background: var(--warning-light);
      color: var(--warning-color);
    }

    .fee-status.unpaid {
      background: var(--danger-light);
      color: var(--danger-color);
    }

    .fee-amount {
      min-width: 80px;
      text-align: right;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Achievements Section */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .achievement-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-md);
      }

      &.verified {
        border-color: var(--success-color);
      }
    }

    .achievement-image {
      height: 150px;
      overflow: hidden;
      background: var(--gray-100);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.placeholder {
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 40px;
          color: var(--gray-300);
        }
      }
    }

    .achievement-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      h4 {
        margin: 0;
        font-size: var(--font-size-base);
        font-weight: 600;
        color: var(--text-primary);
      }

      .event-name,
      .position {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 6px;

        i {
          color: var(--text-muted);
        }
      }

      .achievement-date {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .achievement-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .verified-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: var(--font-size-xs);
      color: var(--success-color);
      font-weight: 600;
    }

    /* Matches Section */
    .match-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .match-stat-card {
      padding: 20px;
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      text-align: center;

      .stat-value {
        display: block;
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
      }

      &.wins {
        border-color: var(--success-color);
        background: var(--success-light);

        .stat-value {
          color: var(--success-color);
        }
      }

      &.losses {
        border-color: var(--danger-color);
        background: var(--danger-light);

        .stat-value {
          color: var(--danger-color);
        }
      }
    }

    .matches-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .match-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: var(--gray-50);
      border-radius: var(--border-radius-lg);
      border-left: 4px solid var(--gray-300);

      &.win {
        border-left-color: var(--success-color);
        background: linear-gradient(90deg, var(--success-light) 0%, var(--gray-50) 100%);
      }

      &.loss {
        border-left-color: var(--danger-color);
        background: linear-gradient(90deg, var(--danger-light) 0%, var(--gray-50) 100%);
      }

      &.draw {
        border-left-color: var(--warning-color);
        background: linear-gradient(90deg, var(--warning-light) 0%, var(--gray-50) 100%);
      }
    }

    .match-result-indicator {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 16px;
      background: var(--gray-100);
      color: var(--text-muted);

      .match-item.win & {
        background: var(--success-color);
        color: white;
      }

      .match-item.loss & {
        background: var(--danger-color);
        color: white;
      }

      .match-item.draw & {
        background: var(--warning-color);
        color: white;
      }
    }

    .match-details {
      flex: 1;
    }

    .match-opponent {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .vs-label {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .opponent-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .partner-info {
        font-size: var(--font-size-sm);
        color: var(--text-muted);
      }
    }

    .match-meta {
      display: flex;
      align-items: center;
      gap: 10px;

      .event-name {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
    }

    .match-score {
      text-align: right;

      .score {
        display: block;
        font-weight: 600;
        color: var(--text-primary);
        font-size: var(--font-size-base);
      }

      .date {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
      }
    }

    @media (max-width: 1024px) {
      .stats-grid,
      .match-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-grid,
      .training-skills-layout {
        grid-template-columns: 1fr;
      }

      .mini-stats-grid,
      .emergency-grid {
        grid-template-columns: 1fr 1fr;
      }

      .training-column {
        grid-template-rows: auto;
      }
    }

    @media (max-width: 640px) {
      .stats-grid,
      .match-stats-grid {
        grid-template-columns: 1fr;
      }

      .mini-stats-grid,
      .emergency-grid {
        grid-template-columns: 1fr;
      }

      .student-header {
        flex-direction: column;
        text-align: center;
      }

      .student-badges {
        justify-content: center;
      }

      .tabs {
        flex-direction: column;
      }

      .match-item {
        flex-direction: column;
        text-align: center;
      }

      .match-details,
      .match-score {
        text-align: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private studentService = inject(StudentService);
  private attendanceService = inject(AttendanceService);
  private achievementService = inject(AchievementService);
  private matchService = inject(MatchService);
  private authService = inject(AuthService);
  private skillMetricsService = inject(StudentSkillMetricsService);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  student = signal<Student | null>(null);
  attendanceStats = signal({ present: 0, absent: 0, late: 0, percentage: 0 });
  isLoadingFeeHistory = signal(false);
  feeHistory = signal<FeePaymentHistory[]>([]);
  
  // Tabs
  activeTab = signal<TabType>('profile');
  
  // Achievements
  isLoadingAchievements = signal(false);
  achievements = signal<Achievement[]>([]);
  
  // Matches
  isLoadingMatches = signal(false);
  matches = signal<Match[]>([]);
  performanceAxes = PERFORMANCE_AXES;
  skillMetrics = signal<PerformanceMetrics>(this.createZeroMetrics());
  skillsDirty = signal(false);
  matchStats = signal<MatchStatistics>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0,
    singlesWins: 0,
    singlesLosses: 0,
    doublesWins: 0,
    doublesLosses: 0
  });

  private readonly dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  private readonly dayLabels: Record<string, string> = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun'
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadStudent(parseInt(id));
    }
  }

  loadStudent(id: number): void {
    this.studentService.getStudentById(id).subscribe({
      next: (student) => {
        this.student.set(student || null);
        this.isLoading.set(false);
        if (student) {
          this.loadSkillMetrics(student.id);
          const isEnrolled = (student.batchIds?.length || 0) > 0;
          if (isEnrolled) {
            this.loadAttendanceStats(student.id);
          } else {
            this.attendanceStats.set({ present: 0, absent: 0, late: 0, percentage: 0 });
          }
          // Load fee history for coaches/admins
          if (this.canManageStudents()) {
            this.loadFeeHistory(student.id, student.feePayable || 0);
          }
          // Load achievements
          this.loadAchievements(student.id);
          // Load matches
          this.loadMatches(student.id);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadAttendanceStats(studentId: number): void {
    this.attendanceService.getStudentAttendanceStats(studentId).subscribe({
      next: (stats) => this.attendanceStats.set(stats)
    });
  }

  loadFeeHistory(studentId: number, feePayable: number): void {
    this.isLoadingFeeHistory.set(true);
    this.studentService.getFeePaymentHistory(studentId).subscribe({
      next: (history) => {
        this.feeHistory.set(history);
        this.isLoadingFeeHistory.set(false);
      },
      error: () => {
        // If API fails, generate mock data for demonstration
        this.feeHistory.set(this.generateMockFeeHistory(feePayable));
        this.isLoadingFeeHistory.set(false);
      }
    });
  }

  loadAchievements(studentId: number): void {
    this.isLoadingAchievements.set(true);
    this.achievementService.getAchievementsByStudent(studentId).subscribe({
      next: (achievements) => {
        this.achievements.set(achievements);
        this.isLoadingAchievements.set(false);
      },
      error: () => {
        this.isLoadingAchievements.set(false);
      }
    });
  }

  loadMatches(studentId: number): void {
    this.isLoadingMatches.set(true);
    this.matchService.getMatchesByStudent(studentId).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.isLoadingMatches.set(false);
      },
      error: () => {
        this.isLoadingMatches.set(false);
      }
    });

    this.matchService.getMatchStatsByStudent(studentId).subscribe({
      next: (stats) => this.matchStats.set(stats)
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  loadSkillMetrics(studentId: number): void {
    this.skillMetrics.set(this.skillMetricsService.getStudentMetrics(studentId));
    this.skillsDirty.set(false);
  }

  onSkillMetricChange(key: keyof PerformanceMetrics, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const normalizedValue = Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : 0;
    this.skillMetrics.update((metrics) => ({
      ...metrics,
      [key]: normalizedValue
    }));
    this.skillsDirty.set(true);
  }

  saveSkillMetrics(): void {
    const currentStudent = this.student();
    if (!currentStudent) {
      return;
    }
    this.skillMetricsService.saveStudentMetrics(currentStudent.id, this.skillMetrics());
    this.skillsDirty.set(false);
    this.toastService.success('Skill values updated');
  }

  resetSkillMetrics(): void {
    const currentStudent = this.student();
    if (!currentStudent) {
      this.skillMetrics.set(this.createZeroMetrics());
      this.skillsDirty.set(false);
      return;
    }
    this.loadSkillMetrics(currentStudent.id);
  }

  private generateMockFeeHistory(feePayable: number): FeePaymentHistory[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const history: FeePaymentHistory[] = [];
    
    // Generate last 6 months of history
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      
      // Randomly assign status for demo
      const statuses: MonthlyFeeStatus[] = [MonthlyFeeStatus.FULL, MonthlyFeeStatus.HALF, MonthlyFeeStatus.UNPAID];
      const status = i === 0 ? MonthlyFeeStatus.UNPAID : statuses[Math.floor(Math.random() * 2)];
      
      const amountPaid = status === MonthlyFeeStatus.FULL ? feePayable : 
                         status === MonthlyFeeStatus.HALF ? Math.floor(feePayable / 2) : 0;

      history.push({
        month: `${months[monthIndex]} ${year}`,
        year,
        monthNumber: monthIndex + 1,
        status,
        amountPaid,
        feePayable
      });
    }
    
    return history;
  }

  canManageStudents(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === Role.ADMIN || role === Role.COACH;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

  formatSkillLevel(level: string): string {
    if (!level || level === 'Not assessed') return level;
    return level.charAt(0) + level.slice(1).toLowerCase();
  }

  formatTrainingDays(days: string[] | undefined): string {
    if (!days || days.length === 0) {
      return 'Not set';
    }

    const sortedDays = [...days].sort(
      (a, b) => this.dayOrder.indexOf(a) - this.dayOrder.indexOf(b)
    );

    return sortedDays
      .map((day) => this.dayLabels[day] || day)
      .join(', ');
  }

  getPrimaryPhone(student: Student | null): string {
    if (!student) {
      return 'Not provided';
    }
    return student.phoneNumber || student.phone || 'Not provided';
  }

  formatLocation(student: Student | null): string {
    if (!student) {
      return 'Not provided';
    }
    const parts = [student.city, student.state, student.country]
      .map((part) => (part || '').trim())
      .filter((part) => part.length > 0);
    return parts.length ? parts.join(', ') : 'Not provided';
  }

  getAge(dateOfBirth?: string): string {
    if (!dateOfBirth) {
      return 'Not provided';
    }
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      return 'Not provided';
    }
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const birthdayPassed =
      now.getMonth() > dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
    if (!birthdayPassed) {
      age -= 1;
    }
    return age >= 0 ? `${age} years` : 'Not provided';
  }

  formatFeeStatus(status: MonthlyFeeStatus): string {
    if (status === MonthlyFeeStatus.FULL) return 'Full Paid';
    if (status === MonthlyFeeStatus.HALF) return 'Half Paid';
    return 'Unpaid';
  }

  getFeeStatusClass(status: MonthlyFeeStatus): string {
    if (status === MonthlyFeeStatus.FULL) return 'full';
    if (status === MonthlyFeeStatus.HALF) return 'half';
    return 'unpaid';
  }

  getSkillBadgeVariant(skillLevel: string): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'BEGINNER': 'success',
      'INTERMEDIATE': 'primary',
      'ADVANCED': 'warning',
      'PROFESSIONAL': 'danger'
    };
    return variants[skillLevel] || 'primary';
  }

  formatAchievementType(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getAchievementIcon(type: string): string {
    const icons: Record<string, string> = {
      'TOURNAMENT': 'fa-solid fa-trophy',
      'COMPETITION': 'fa-solid fa-medal',
      'CERTIFICATION': 'fa-solid fa-certificate',
      'MILESTONE': 'fa-solid fa-star',
      'OTHER': 'fa-solid fa-award'
    };
    return icons[type] || 'fa-solid fa-award';
  }

  formatMatchType(type: MatchType): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  getMatchTypeBadge(type: MatchType): 'primary' | 'success' | 'warning' | 'danger' {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
      'SINGLES': 'primary',
      'DOUBLES': 'success',
      'PRACTICE': 'warning',
      'TOURNAMENT': 'danger',
      'FRIENDLY': 'primary'
    };
    return variants[type] || 'primary';
  }

  getMatchResultClass(result: MatchResult): string {
    if (result === MatchResult.WIN) return 'win';
    if (result === MatchResult.LOSS) return 'loss';
    return 'draw';
  }

  private createZeroMetrics(): PerformanceMetrics {
    return {
      smashPower: 0,
      netControl: 0,
      backhand: 0,
      footwork: 0,
      agility: 0,
      stamina: 0,
      tacticalAwareness: 0,
      mentalStrength: 0
    };
  }
}
