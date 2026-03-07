import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  /**
   * Upload a student profile image
   */
  uploadStudentProfile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/upload/student-profile`,
      formData
    );
  }

  /**
   * Upload an achievement certificate image
   */
  uploadAchievementCertificate(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/upload/achievement-certificate`,
      formData
    );
  }

  /**
   * Upload a coach profile image
   */
  uploadCoachProfile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/upload/coach-profile`,
      formData
    );
  }

  /**
   * Upload a parent profile image
   */
  uploadParentProfile(file: File): Observable<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<FileUploadResponse>(
      `${this.apiUrl}/upload/parent-profile`,
      formData
    );
  }

  /**
   * Delete a file from S3
   */
  deleteFile(fileUrl: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/delete?fileUrl=${encodeURIComponent(fileUrl)}`
    );
  }

  /**
   * Get a presigned URL for file access
   */
  getPresignedUrl(key: string, durationSeconds: number = 3600): Observable<string> {
    return this.http.get(
      `${this.apiUrl}/presigned-url?key=${encodeURIComponent(key)}&durationSeconds=${durationSeconds}`,
      { responseType: 'text' }
    );
  }

  /**
   * Replace an existing file with a new one
   * This will delete the old file and upload the new one
   */
  async replaceFile(
    oldFileUrl: string | null,
    newFile: File,
    uploadType: 'student' | 'achievement' | 'coach' | 'parent'
  ): Promise<string> {
    // Upload new file
    let uploadResponse: FileUploadResponse;
    
    switch (uploadType) {
      case 'student':
        uploadResponse = await this.uploadStudentProfile(newFile).toPromise() as FileUploadResponse;
        break;
      case 'achievement':
        uploadResponse = await this.uploadAchievementCertificate(newFile).toPromise() as FileUploadResponse;
        break;
      case 'coach':
        uploadResponse = await this.uploadCoachProfile(newFile).toPromise() as FileUploadResponse;
        break;
      case 'parent':
        uploadResponse = await this.uploadParentProfile(newFile).toPromise() as FileUploadResponse;
        break;
    }
    
    // Delete old file if it exists
    if (oldFileUrl) {
      try {
        await this.deleteFile(oldFileUrl).toPromise();
      } catch (error) {
        console.warn('Failed to delete old file:', error);
        // Continue even if deletion fails
      }
    }
    
    return uploadResponse.fileUrl;
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 10MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' };
    }

    return { valid: true };
  }

  /**
   * Generate a preview URL for a file
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URL
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
