import { Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  /**
   * Uploads a file to Cloudinary with an optional filename.
   * @param file The file to be uploaded.
   * @param filename The custom name for the file (optional).
   */
  async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      if (!file || !file.buffer) {
        reject(new Error('File is missing.'));
        return;
      }
      const uploadStream = v2.uploader.upload_stream((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result as UploadApiResponse);
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public_id.
   * @param fileKey The public_id of the file to be deleted.
   */
  async deleteFile(
    fileKey: string,
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve, reject) => {
      v2.uploader.destroy(fileKey, (error, result) => {
        if (error) {
          reject({ success: false, message: error.message });
          return;
        }
        resolve({ success: true, message: 'File deleted successfully' });
      });
    });
  }
}
