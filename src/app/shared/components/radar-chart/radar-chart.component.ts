import { Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Chart,
  RadarController,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartDataset,
  ChartConfiguration
} from 'chart.js';
import { PerformanceMetrics, PERFORMANCE_AXES } from '../../../core/models';

export interface RadarDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  pointBackgroundColor: string;
}

let chartRegistered = false;

@Component({
  selector: 'app-radar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="radar-chart-container">
      <canvas #radarCanvas></canvas>
    </div>
  `,
  styles: [`
    .radar-chart-container {
      position: relative;
      width: 100%;
      max-width: 760px;
      margin: 0 auto;
      height: clamp(320px, 50vw, 520px);
      min-height: 320px;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RadarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('radarCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  @Input() datasets: RadarDataset[] = [];
  @Input() title?: string;
  @Input() showLegend = true;

  private platformId = inject(PLATFORM_ID);
  private chart: Chart<'radar', number[], string> | null = null;
  
  private readonly labels = PERFORMANCE_AXES.map((a: { key: keyof PerformanceMetrics; label: string; icon: string }) => a.label);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeChartJs();
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['datasets'] || changes['showLegend'] || changes['title']) &&
      this.chart &&
      isPlatformBrowser(this.platformId)
    ) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private initializeChartJs(): void {
    if (!chartRegistered) {
      Chart.register(
        RadarController,
        RadialLinearScale,
        PointElement,
        LineElement,
        Filler,
        Tooltip,
        Legend
      );
      chartRegistered = true;
    }
  }

  private renderChart(): void {
    if (!isPlatformBrowser(this.platformId) || !this.canvasRef) {
      return;
    }

    const canvas = this.canvasRef.nativeElement;
    const datasets: ChartDataset<'radar', number[]>[] = this.datasets.map(dataset => ({
      label: dataset.label,
      data: this.normalizeDataset(dataset.data),
      backgroundColor: dataset.backgroundColor,
      borderColor: dataset.borderColor,
      pointBackgroundColor: dataset.pointBackgroundColor,
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: dataset.borderColor,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2.5,
      fill: true
    }));

    if (!this.chart) {
      const config: ChartConfiguration<'radar', number[], string> = {
        type: 'radar',
        data: {
          labels: this.labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            intersect: false
          },
          layout: {
            padding: {
              top: 22,
              right: 24,
              bottom: this.showLegend ? 8 : 20,
              left: 24
            }
          },
          elements: {
            line: {
              tension: 0.15
            }
          },
          scales: {
            r: {
              min: 0,
              max: 10,
              beginAtZero: true,
              angleLines: {
                color: '#dbe4f0'
              },
              grid: {
                color: '#dbe4f0'
              },
              pointLabels: {
                color: '#64748b',
                font: {
                  size: 13,
                  weight: 500
                },
                padding: 6
              },
              ticks: {
                display: true,
                stepSize: 2,
                color: '#94a3b8',
                backdropColor: 'transparent',
                z: 1
              }
            }
          },
          plugins: {
            title: {
              display: !!this.title,
              text: this.title ?? '',
              color: '#1e293b',
              font: {
                size: 14,
                weight: 600
              },
              padding: {
                bottom: 12
              }
            },
            legend: {
              display: this.showLegend && datasets.length > 0,
              position: 'bottom',
              labels: {
                color: '#334155',
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 10,
                boxHeight: 10,
                padding: 16
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${context.parsed.r}/10`
              }
            }
          }
        }
      };
      this.chart = new Chart<'radar', number[], string>(canvas, config);
      return;
    }

    this.chart.data.labels = this.labels;
    this.chart.data.datasets = datasets;
    this.chart.options.layout = {
      padding: {
        top: 22,
        right: 24,
        bottom: this.showLegend ? 8 : 20,
        left: 24
      }
    };

    if (this.chart.options.plugins?.legend) {
      this.chart.options.plugins.legend.display = this.showLegend && datasets.length > 0;
    }

    if (this.chart.options.plugins?.title) {
      this.chart.options.plugins.title.display = !!this.title;
      this.chart.options.plugins.title.text = this.title ?? '';
    }

    this.chart.update();
  }

  private normalizeDataset(data: number[]): number[] {
    const normalized = Array.from({ length: this.labels.length }, (_, index) => {
      const value = data[index] ?? 0;
      return Math.min(Math.max(value, 0), 10);
    });
    return normalized;
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}

// Helper function to convert PerformanceMetrics to array
export function metricsToArray(metrics: PerformanceMetrics): number[] {
  return [
    metrics.smashPower,
    metrics.netControl,
    metrics.backhand,
    metrics.footwork,
    metrics.agility,
    metrics.stamina,
    metrics.tacticalAwareness,
    metrics.mentalStrength
  ];
}

// Helper function to create a dataset from metrics
export function createRadarDataset(
  label: string, 
  metrics: PerformanceMetrics, 
  color: string
): RadarDataset {
  const alpha = '40';
  return {
    label,
    data: metricsToArray(metrics),
    backgroundColor: color + alpha,
    borderColor: color,
    pointBackgroundColor: color
  };
}
