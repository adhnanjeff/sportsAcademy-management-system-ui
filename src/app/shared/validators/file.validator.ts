/**
 * File validation utility for secure file uploads
 * Validates file size, MIME type, extension, and performs security checks
 */
export class FileValidator {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  private static readonly ALLOWED_DOC_TYPES = ['application/pdf'];
  private static readonly ALLOWED_TYPES = [...FileValidator.ALLOWED_IMAGE_TYPES, ...FileValidator.ALLOWED_DOC_TYPES];
  private static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];

  /**
   * Validates file against security criteria
   * @param file File to validate
   * @returns Validation result with error message if invalid
   */
  static validate(file: File): { valid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit` };
    }

    // Check if file is empty
    if (file.size === 0) {
      return { valid: false, error: 'File is empty' };
    }

    // Check MIME type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPG, PNG, and PDF allowed' };
    }

    // Check file extension
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
      return { valid: false, error: 'Invalid file extension' };
    }

    // Check for double extensions (security risk: file.php.jpg)
    const dotCount = (file.name.match(/\./g) || []).length;
    if (dotCount > 1) {
      return { valid: false, error: 'Multiple file extensions not allowed' };
    }

    // Check for null bytes in filename (security risk)
    if (file.name.includes('\0')) {
      return { valid: false, error: 'Invalid filename characters detected' };
    }

    // Check filename length
    if (file.name.length > 255) {
      return { valid: false, error: 'Filename is too long' };
    }

    return { valid: true };
  }

  /**
   * Validates that the file is actually an image by attempting to load it
   * @param file File to validate as image
   * @returns Promise resolving to true if valid image
   */
  static validateImage(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        resolve(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sanitizes filename by removing special characters
   * @param filename Original filename
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove path separators and special characters
    return filename
      .replace(/[\/\\]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 255);
  }
}
