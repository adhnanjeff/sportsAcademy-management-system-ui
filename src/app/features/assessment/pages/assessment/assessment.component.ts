import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assessment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="assessment-page">
      <div class="page-header">
        <h1>Assessment</h1>
        <p>Track player assessment records and evaluations</p>
      </div>
      <div class="coming-soon">
        <i class="fa-solid fa-clipboard-list"></i>
        <h2>Coming Soon</h2>
        <p>The assessment page is currently under development.</p>
      </div>
    </div>
  `,
  styles: [`
    .assessment-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      h1 {
        font-size: var(--font-size-2xl);
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    .coming-soon {
      padding: 80px 40px;
      text-align: center;
      background-color: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);

      i {
        font-size: 64px;
        color: var(--secondary-color);
        margin-bottom: 20px;
        animation: float 3s ease-in-out infinite;
      }

      h2 {
        font-size: var(--font-size-xl);
        color: var(--text-primary);
        margin: 0 0 8px 0;
      }

      p {
        color: var(--text-muted);
        margin: 0;
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    @media (prefers-reduced-motion: reduce) {
      .coming-soon i {
        animation: none;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentComponent {}
