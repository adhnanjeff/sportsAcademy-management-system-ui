import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AchievementFormComponent } from './achievement-form.component';
import { AchievementService, Achievement } from '../../core/services/achievement.service';

@Component({
  selector: 'app-achievement-management',
  standalone: true,
  imports: [CommonModule, AchievementFormComponent],
  template: `
    <div class="container">
      <!-- Header -->
      <div class="header">
        <h1>Achievement Management</h1>
        <button class="btn-create" (click)="showCreateForm = !showCreateForm">
          {{ showCreateForm ? 'Hide Form' : '+ New Achievement' }}
        </button>
      </div>

      <!-- Create Form (Collapsible) -->
      <div class="create-section" *ngIf="showCreateForm">
        <div class="card">
          <app-achievement-form
            [studentId]="studentId"
            [students]="students"
            (saved)="onAchievementCreated($event)"
            (cancelled)="showCreateForm = false"
          ></app-achievement-form>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select (change)="filterByType($event)" class="filter-select">
          <option value="">All Types</option>
          <option value="TOURNAMENT">Tournament</option>
          <option value="COMPETITION">Competition</option>
          <option value="TRAINING_MILESTONE">Training Milestone</option>
          <option value="SKILL_ACHIEVEMENT">Skill Achievement</option>
          <option value="OTHER">Other</option>
        </select>

        <select (change)="filterByVerification($event)" class="filter-select">
          <option value="all">All Status</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending Verification</option>
        </select>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading">
        Loading achievements...
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && filteredAchievements.length === 0" class="empty-state">
        <p>No achievements found. Create your first achievement!</p>
      </div>

      <!-- Achievements Grid -->
      <div class="achievements-grid" *ngIf="!loading && filteredAchievements.length > 0">
        <div *ngFor="let achievement of filteredAchievements" class="achievement-card">
          <!-- Card Header -->
          <div class="card-header">
            <div>
              <h3>{{ achievement.title }}</h3>
              <p class="student-name">{{ achievement.studentName }}</p>
            </div>
            <span class="badge" [ngClass]="'badge-' + achievement.type">
              {{ achievement.type }}
            </span>
          </div>

          <!-- Certificate Image -->
          <div *ngIf="achievement.certificateUrl" class="certificate-container">
            <img 
              [src]="achievement.certificateUrl" 
              [alt]="achievement.title"
              class="certificate-image"
              (click)="viewFullImage(achievement.certificateUrl!)"
            >
            <div class="image-overlay">
              <span>Click to view full size</span>
            </div>
          </div>

          <!-- Achievement Details -->
          <div class="details">
            <div class="detail-row" *ngIf="achievement.eventName">
              <strong>Event:</strong> {{ achievement.eventName }}
            </div>
            <div class="detail-row" *ngIf="achievement.position">
              <strong>Position:</strong> {{ achievement.position }}
            </div>
            <div class="detail-row">
              <strong>Date:</strong> {{ achievement.achievedDate | date:'mediumDate' }}
            </div>
            <div class="detail-row" *ngIf="achievement.awardedBy">
              <strong>Awarded By:</strong> {{ achievement.awardedBy }}
            </div>
            <div class="detail-row description" *ngIf="achievement.description">
              <p>{{ achievement.description }}</p>
            </div>
          </div>

          <!-- Verification Status -->
          <div class="verification-status">
            <span *ngIf="achievement.isVerified" class="status-verified">
              ✓ Verified by {{ achievement.verifiedByName }}
            </span>
            <span *ngIf="!achievement.isVerified" class="status-pending">
              ⏱ Pending Verification
            </span>
          </div>

          <!-- Actions -->
          <div class="card-actions">
            <button class="btn-edit" (click)="editAchievement(achievement)">
              Edit
            </button>
            <button 
              *ngIf="!achievement.isVerified" 
              class="btn-verify" 
              (click)="verifyAchievement(achievement.id!)"
            >
              Verify
            </button>
            <button 
              *ngIf="achievement.certificateUrl"
              class="btn-delete-cert" 
              (click)="deleteCertificate(achievement.id!)"
            >
              Delete Cert
            </button>
            <button class="btn-delete" (click)="deleteAchievement(achievement.id!)">
              Delete
            </button>
          </div>
        </div>
      </div>

      <!-- Edit Modal -->
      <div *ngIf="editingAchievement" class="modal" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeEditModal()">×</button>
          <app-achievement-form
            [achievementId]="editingAchievement.id"
            [studentId]="editingAchievement.studentId"
            (saved)="onAchievementUpdated($event)"
            (cancelled)="closeEditModal()"
          ></app-achievement-form>
        </div>
      </div>

      <!-- Full Image Viewer Modal -->
      <div *ngIf="viewingImage" class="modal image-modal" (click)="closeImageViewer()">
        <div class="image-modal-content" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeImageViewer()">×</button>
          <img [src]="viewingImage" alt="Certificate" class="full-image">
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .btn-create {
      padding: 0.75rem 1.5rem;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }

    .btn-create:hover {
      background: #218838;
    }

    .create-section {
      margin-bottom: 2rem;
    }

    .card {
      background: white;
      border-radius: 8px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }

    .loading {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      background: #f8f9fa;
      border-radius: 8px;
      color: #666;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .achievement-card {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .achievement-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .card-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }

    .card-header h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
    }

    .student-name {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      background: rgba(255,255,255,0.3);
      white-space: nowrap;
    }

    .certificate-container {
      position: relative;
      width: 100%;
      height: 200px;
      overflow: hidden;
      cursor: pointer;
    }

    .certificate-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    .certificate-container:hover .certificate-image {
      transform: scale(1.1);
    }

    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 0.5rem;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .certificate-container:hover .image-overlay {
      opacity: 1;
    }

    .details {
      padding: 1.5rem;
    }

    .detail-row {
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .detail-row strong {
      color: #555;
      margin-right: 0.5rem;
    }

    .description {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .description p {
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    .verification-status {
      padding: 0 1.5rem 1rem;
    }

    .status-verified {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #d4edda;
      color: #155724;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .status-pending {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #fff3cd;
      color: #856404;
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #eee;
    }

    .card-actions button {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.3s;
    }

    .btn-edit {
      background: #007bff;
      color: white;
    }

    .btn-edit:hover {
      background: #0056b3;
    }

    .btn-verify {
      background: #28a745;
      color: white;
    }

    .btn-verify:hover {
      background: #218838;
    }

    .btn-delete-cert {
      background: #ffc107;
      color: #000;
    }

    .btn-delete-cert:hover {
      background: #e0a800;
    }

    .btn-delete {
      background: #dc3545;
      color: white;
    }

    .btn-delete:hover {
      background: #c82333;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
    }

    .image-modal-content {
      max-width: 95%;
      max-height: 95vh;
      position: relative;
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      border: none;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 2rem;
      cursor: pointer;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      z-index: 1001;
    }

    .modal-close:hover {
      background: rgba(0,0,0,0.8);
    }

    .full-image {
      max-width: 100%;
      max-height: 90vh;
      display: block;
      margin: 0 auto;
    }
  `]
})
export class AchievementManagementComponent implements OnInit {
  achievements: Achievement[] = [];
  filteredAchievements: Achievement[] = [];
  students: any[] = []; // Load from student service
  studentId?: number; // If viewing for specific student
  loading = false;
  showCreateForm = false;
  editingAchievement?: Achievement;
  viewingImage?: string;

  constructor(
    private achievementService: AchievementService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get student ID from route if exists
    this.route.params.subscribe(params => {
      this.studentId = params['studentId'] ? +params['studentId'] : undefined;
      this.loadAchievements();
    });
  }

  loadAchievements(): void {
    this.loading = true;
    
    const observable = this.studentId
      ? this.achievementService.getAchievementsByStudent(this.studentId)
      : this.achievementService.getAllAchievements();

    observable.subscribe({
      next: (data) => {
        this.achievements = data;
        this.filteredAchievements = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.loading = false;
      }
    });
  }

  filterByType(event: any): void {
    const type = event.target.value;
    if (type) {
      this.filteredAchievements = this.achievements.filter(a => a.type === type);
    } else {
      this.filteredAchievements = [...this.achievements];
    }
  }

  filterByVerification(event: any): void {
    const status = event.target.value;
    if (status === 'verified') {
      this.filteredAchievements = this.achievements.filter(a => a.isVerified);
    } else if (status === 'pending') {
      this.filteredAchievements = this.achievements.filter(a => !a.isVerified);
    } else {
      this.filteredAchievements = [...this.achievements];
    }
  }

  onAchievementCreated(achievement: Achievement): void {
    console.log('Achievement created:', achievement);
    this.showCreateForm = false;
    this.loadAchievements();
  }

  editAchievement(achievement: Achievement): void {
    this.editingAchievement = achievement;
  }

  closeEditModal(): void {
    this.editingAchievement = undefined;
  }

  onAchievementUpdated(achievement: Achievement): void {
    console.log('Achievement updated:', achievement);
    this.closeEditModal();
    this.loadAchievements();
  }

  verifyAchievement(id: number): void {
    if (confirm('Verify this achievement?')) {
      this.achievementService.verifyAchievement(id).subscribe({
        next: () => {
          console.log('Achievement verified');
          this.loadAchievements();
        },
        error: (error) => console.error('Error verifying:', error)
      });
    }
  }

  deleteCertificate(id: number): void {
    if (confirm('Delete certificate only? The achievement will be kept.')) {
      this.achievementService.deleteCertificate(id).subscribe({
        next: () => {
          console.log('Certificate deleted');
          this.loadAchievements();
        },
        error: (error) => console.error('Error deleting certificate:', error)
      });
    }
  }

  deleteAchievement(id: number): void {
    if (confirm('Delete this achievement and its certificate? This cannot be undone.')) {
      this.achievementService.deleteAchievement(id).subscribe({
        next: () => {
          console.log('Achievement deleted');
          this.loadAchievements();
        },
        error: (error) => console.error('Error deleting achievement:', error)
      });
    }
  }

  viewFullImage(url: string): void {
    this.viewingImage = url;
  }

  closeImageViewer(): void {
    this.viewingImage = undefined;
  }
}
