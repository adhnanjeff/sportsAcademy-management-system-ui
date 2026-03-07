# Frontend S3 Integration Guide

## Overview
This guide explains how to use the S3 file upload functionality in the Angular frontend.

## Components

### 1. FileUploadService
Located at: `src/app/core/services/file-upload.service.ts`

This service handles all file upload operations:
- Upload images for students, coaches, parents, and achievements
- Delete files from S3
- Generate presigned URLs
- Validate files before upload
- Replace existing files

### 2. ImageUploadComponent
Located at: `src/app/shared/components/image-upload.component.ts`

A reusable component for image upload with preview functionality.

## Usage Examples

### Example 1: Using ImageUploadComponent in a Student Form

```typescript
// student-form.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageUploadComponent } from '../../shared/components/image-upload.component';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [ImageUploadComponent, ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="studentForm" (ngSubmit)="onSubmit()">
      <!-- Other form fields -->
      <div class="form-group">
        <label>First Name</label>
        <input formControlName="firstName" />
      </div>

      <!-- Image Upload Component -->
      <div class="form-group">
        <label>Profile Photo</label>
        <app-image-upload
          [currentImageUrl]="studentForm.get('photoUrl')?.value"
          [uploadType]="'student'"
          [autoUpload]="true"
          (imageUploaded)="onImageUploaded($event)"
          (imageRemoved)="onImageRemoved()"
        ></app-image-upload>
      </div>

      <button type="submit" [disabled]="!studentForm.valid">
        Save Student
      </button>
    </form>
  `
})
export class StudentFormComponent {
  studentForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.studentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      photoUrl: ['']
    });
  }

  onImageUploaded(imageUrl: string): void {
    this.studentForm.patchValue({ photoUrl: imageUrl });
  }

  onImageRemoved(): void {
    this.studentForm.patchValue({ photoUrl: null });
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      const studentData = this.studentForm.value;
      // Call your student service to save
      console.log('Saving student:', studentData);
    }
  }
}
```

### Example 2: Manual Upload with Service

```typescript
// achievement-form.component.ts
import { Component } from '@angular/core';
import { FileUploadService } from '../../core/services/file-upload.service';

@Component({
  selector: 'app-achievement-form',
  template: `
    <div>
      <input 
        type="file" 
        accept="image/*"
        (change)="onFileChange($event)"
        #fileInput
      />
      <button (click)="uploadCertificate()" [disabled]="!selectedFile">
        Upload Certificate
      </button>
      
      <img *ngIf="certificateUrl" [src]="certificateUrl" alt="Certificate" />
    </div>
  `
})
export class AchievementFormComponent {
  selectedFile: File | null = null;
  certificateUrl: string = '';

  constructor(private fileUploadService: FileUploadService) {}

  onFileChange(event: any): void {
    this.selectedFile = event.target.files[0];
    
    // Validate file
    const validation = this.fileUploadService.validateFile(this.selectedFile!);
    if (!validation.valid) {
      alert(validation.error);
      this.selectedFile = null;
    }
  }

  async uploadCertificate(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      const response = await this.fileUploadService
        .uploadAchievementCertificate(this.selectedFile)
        .toPromise();
      
      this.certificateUrl = response!.fileUrl;
      console.log('Upload successful:', response);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload certificate');
    }
  }
}
```

### Example 3: Update with Image Replacement

```typescript
// edit-student.component.ts
import { Component, OnInit } from '@angular/core';
import { FileUploadService } from '../../core/services/file-upload.service';
import { StudentService } from '../../core/services/student.service';

@Component({
  selector: 'app-edit-student',
  template: `
    <form (ngSubmit)="updateStudent()">
      <app-image-upload
        [currentImageUrl]="student.photoUrl"
        [uploadType]="'student'"
        [autoUpload]="false"
        (fileSelected)="onFileSelected($event)"
      ></app-image-upload>

      <button type="submit">Update Student</button>
    </form>
  `
})
export class EditStudentComponent implements OnInit {
  student: any = {};
  newImageFile: File | null = null;

  constructor(
    private fileUploadService: FileUploadService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    // Load student data
    this.loadStudent();
  }

  loadStudent(): void {
    // Load student from service
    this.studentService.getStudent(1).subscribe(student => {
      this.student = student;
    });
  }

  onFileSelected(file: File): void {
    this.newImageFile = file;
  }

  async updateStudent(): Promise<void> {
    try {
      // If new image selected, upload it first
      if (this.newImageFile) {
        const newImageUrl = await this.fileUploadService.replaceFile(
          this.student.photoUrl,
          this.newImageFile,
          'student'
        );
        this.student.photoUrl = newImageUrl;
      }

      // Update student record
      await this.studentService.updateStudent(this.student.id, this.student).toPromise();
      alert('Student updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update student');
    }
  }
}
```

### Example 4: Delete Image

```typescript
async deleteStudentImage(studentId: number, imageUrl: string): Promise<void> {
  try {
    // Delete from S3
    await this.fileUploadService.deleteFile(imageUrl).toPromise();
    
    // Update student record to remove photoUrl
    await this.studentService.updateStudent(studentId, { photoUrl: null }).toPromise();
    
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
```

## Component Properties

### ImageUploadComponent Inputs

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | string | 'Upload Image' | Label text for the upload button |
| `placeholder` | string | 'No image selected' | Placeholder text when no image |
| `currentImageUrl` | string \| null | null | Current image URL to display |
| `uploadType` | 'student' \| 'achievement' \| 'coach' \| 'parent' | 'student' | Type of upload for API routing |
| `autoUpload` | boolean | false | Whether to upload immediately after selection |

### ImageUploadComponent Outputs

| Event | Payload | Description |
|-------|---------|-------------|
| `fileSelected` | File | Emitted when a file is selected |
| `imageUploaded` | string | Emitted after successful upload with URL |
| `imageRemoved` | void | Emitted when image is removed |

## File Validation

The service automatically validates:
- **File size**: Maximum 10MB
- **File type**: JPEG, PNG, GIF, WebP only
- **File presence**: Ensures file is not null/empty

## Error Handling

```typescript
try {
  const response = await this.fileUploadService
    .uploadStudentProfile(file)
    .toPromise();
  // Success
} catch (error: any) {
  if (error.status === 400) {
    // Validation error (file too large, wrong type, etc.)
    console.error('Validation error:', error.error.message);
  } else if (error.status === 401) {
    // Authentication error
    console.error('Not authenticated');
  } else if (error.status === 500) {
    // Server error (S3 issues, etc.)
    console.error('Server error:', error.error.message);
  }
}
```

## Best Practices

1. **Always validate files** before upload using `validateFile()`
2. **Clean up preview URLs** when component is destroyed
3. **Handle errors gracefully** with user-friendly messages
4. **Use autoUpload** for better UX in forms
5. **Delete old images** when replacing with new ones
6. **Show upload progress** for large files (add interceptor)
7. **Optimize images** before upload (consider image compression)

## Image Optimization (Optional)

For better performance, consider compressing images before upload:

```typescript
import imageCompression from 'browser-image-compression';

async compressAndUpload(file: File): Promise<void> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    const response = await this.fileUploadService
      .uploadStudentProfile(compressedFile)
      .toPromise();
    console.log('Compressed upload successful:', response);
  } catch (error) {
    console.error('Compression failed:', error);
  }
}
```

## Security Notes

1. All endpoints require authentication (JWT token)
2. File validation is done both client-side and server-side
3. S3 bucket should be private with proper IAM policies
4. Use presigned URLs for temporary public access
5. Implement rate limiting for upload endpoints

## Testing

### Unit Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FileUploadService]
    });
    service = TestBed.inject(FileUploadService);
  });

  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    });
    const result = service.validateFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds');
  });

  it('should validate file type', () => {
    const pdfFile = new File(['content'], 'doc.pdf', {
      type: 'application/pdf'
    });
    const result = service.validateFile(pdfFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid file type');
  });
});
```
