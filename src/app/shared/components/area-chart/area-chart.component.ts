import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  LineController,
  ChartConfiguration
} from 'chart.js';

let areaChartRegistered = false;

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="area-chart-container">
      <canvas #areaCanvas></canvas>
    </div>
  `,
  styles: [`
    .area-chart-container {
      position: relative;
      width: 100%;
      height: clamp(260px, 35vw, 360px);
      min-height: 240px;
    }

    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AreaChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('areaCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() labels: string[] = [];
  @Input() values: Array<number | null> = [];
  @Input() datasetLabel = 'Trend';
  @Input() maxY = 100;
  @Input() minY = 0;

  private readonly platformId = inject(PLATFORM_ID);
  private chart: Chart<'line', Array<number | null>, string> | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.registerChart();
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chart || !isPlatformBrowser(this.platformId)) {
      return;
    }
    if (changes['labels'] || changes['values'] || changes['datasetLabel'] || changes['maxY'] || changes['minY']) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private registerChart(): void {
    if (areaChartRegistered) {
      return;
    }
    Chart.register(
      CategoryScale,
      LinearScale,
      PointElement,
      LineElement,
      Filler,
      Tooltip,
      Legend,
      LineController
    );
    areaChartRegistered = true;
  }

  private renderChart(): void {
    if (!this.canvasRef) {
      return;
    }

    const labels = [...this.labels];
    const data = this.normalizeValues(this.values, labels.length);
    const canvas = this.canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, canvas.height || 320);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.40)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0.03)');

    const config: ChartConfiguration<'line', Array<number | null>, string> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: this.datasetLabel,
            data,
            borderColor: '#2563eb',
            backgroundColor: gradient,
            fill: true,
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#2563eb',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        layout: {
          padding: {
            top: 10,
            right: 8,
            bottom: 4,
            left: 4
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b',
              maxRotation: 0,
              autoSkip: true
            }
          },
          y: {
            min: this.minY,
            max: this.maxY,
            ticks: {
              color: '#64748b',
              stepSize: 20
            },
            grid: {
              color: '#e2e8f0'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${this.datasetLabel}: ${ctx.parsed.y}%`
            }
          }
        }
      }
    };

    if (!this.chart) {
      this.chart = new Chart<'line', Array<number | null>, string>(canvas, config);
      return;
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.data.datasets[0].label = this.datasetLabel;
    this.chart.options.scales = {
      ...this.chart.options.scales,
      y: {
        ...this.chart.options.scales?.['y'],
        min: this.minY,
        max: this.maxY
      }
    };
    this.chart.update();
  }

  private normalizeValues(values: Array<number | null>, expectedLength: number): Array<number | null> {
    return Array.from({ length: expectedLength }, (_, index) => {
      const value = values[index];
      if (value === null || value === undefined) {
        return null;
      }
      if (!Number.isFinite(value)) {
        return null;
      }
      return Math.max(this.minY, Math.min(value, this.maxY));
    });
  }
}
