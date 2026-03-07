import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadService } from '../../core/services/file-upload.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-upload-container">
      <!-- Preview Area -->
      <div class="preview-area" [class.has-image]="previewUrl || currentImageUrl">
        <img 
          *ngIf="previewUrl || currentImageUrl" 
          [src]="previewUrl || currentImageUrl" 
          [alt]="label"
          class="preview-image"
        />
        <div *ngIf="!previewUrl && !currentImageUrl" class="placeholder">
          <span class="placeholder-icon">📷</span>
          <p>{{ placeholder }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <label class="upload-button" [class.disabled]="uploading">
          <input 
            type="file" 
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            (change)="onFileSelected($event)"
            [disabled]="uploading"
            #fileInput
          />
          {{ uploading ? 'Uploading...' : 'Choose Image' }}
        </label>
        
        <button 
          *ngIf="previewUrl || currentImageUrl" 
          class="remove-button"
          (click)="removeImage()"
          [disabled]="uploading"
        >
          Remove
        </button>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- File Info -->
      <div *ngIf="selectedFile" class="file-info">
        <small>{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})</small>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .preview-area {
      width: 100%;
      max-width: 300px;
      height: 300px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #f9f9f9;
    }

    .preview-area.has-image {
      border-style: solid;
      border-color: #4CAF50;
    }

    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder {
      text-align: center;
      color: #999;
    }

    .placeholder-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .upload-button {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .upload-button:hover:not(.disabled) {
      background: #0056b3;
    }

    .upload-button.disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .upload-button input[type="file"] {
      display: none;
    }

    .remove-button {
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;
    }

    .remove-button:hover:not(:disabled) {
      background: #c82333;
    }

    .remove-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      padding: 0.5rem;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
    }

    .file-info {
      color: #666;
      font-size: 0.875rem;
    }
  `]
})
export class ImageUploadComponent {
  @Input() label: string = 'Upload Image';
  @Input() placeholder: string = 'No image selected';
  @Input() currentImageUrl: string | null = null;
  @Input() uploadType: 'student' | 'achievement' | 'coach' | 'parent' = 'student';
  @Input() autoUpload: boolean = false;
  
  @Output() fileSelected = new EventEmitter<File>();
  @Output() imageUploaded = new EventEmitter<string>();
  @Output() imageRemoved = new EventEmitter<void>();

  previewUrl: string | null = null;
  selectedFile: File | null = null;
  uploading: boolean = false;
  errorMessage: string | null = null;

  constructor(private fileUploadService: FileUploadService) {}

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = this.fileUploadService.validateFile(file);
    if (!validation.valid) {
      this.errorMessage = validation.error || 'Invalid file';
      return;
    }

    this.errorMessage = null;
    this.selectedFile = file;

    // Create preview
    this.previewUrl = this.fileUploadService.createPreviewUrl(file);

    // Emit file selection
    this.fileSelected.emit(file);

    // Auto upload if enabled
    if (this.autoUpload) {
      this.uploadImage();
    }
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.errorMessage = null;

    try {
      const newImageUrl = await this.fileUploadService.replaceFile(
        this.currentImageUrl,
        this.selectedFile,
        this.uploadType
      );

      this.currentImageUrl = newImageUrl;
      this.imageUploaded.emit(newImageUrl);
      
      // Clean up preview
      if (this.previewUrl) {
        this.fileUploadService.revokePreviewUrl(this.previewUrl);
        this.previewUrl = null;
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Failed to upload image';
      console.error('Upload error:', error);
    } finally {
      this.uploading = false;
    }
  }

  removeImage(): void {
    // Clean up preview
    if (this.previewUrl) {
      this.fileUploadService.revokePreviewUrl(this.previewUrl);
    }

    this.previewUrl = null;
    this.selectedFile = null;
    this.errorMessage = null;
    this.imageRemoved.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
