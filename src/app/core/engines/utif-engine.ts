import { Injectable } from '@angular/core';
import * as UTIF from 'utif';

@Injectable({
  providedIn: 'root'
})
export class UtifEngineService {

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
          reject(new Error('Piksel okuyucu (Canvas Context) oluşturulamadı.'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        try {
          const tiffBuffer = UTIF.encodeImage(imageData.data, img.width, img.height);

          const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
          URL.revokeObjectURL(objectUrl);

          resolve(blob);
        } catch (error) {
          reject(new Error('UTIF TIFF kodlama hatası: ' + error));
        }
      };

      // Yükleme sırasında hata olursa çalışır
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Resim UTIF motoruna yüklenirken hata oluştu.'));
      };

      img.src = objectUrl;
    });
  }
}