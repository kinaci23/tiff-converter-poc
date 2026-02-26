import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CanvasEngineService {

  // Dosyayı TIFF formatına dönüştürür
  convertToTiff(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      // Resim başarıyla yüklendiğinde çalışır
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context oluşturulamadı.'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);

          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas, resmi Blob formatına çeviremedi.'));
          }
        }, 'image/tiff');
      };

      // Yükleme sırasında hata olursa çalışır
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Resim Canvas motoruna yüklenirken hata oluştu.'));
      };

      img.src = objectUrl;
    });
  }
}