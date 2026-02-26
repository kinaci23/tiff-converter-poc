import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CanvasEngineService {
  
  convertToTiff(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        // 1. Resmi çizeceğimiz görünmez bir Canvas oluşturuyoruz
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context oluşturulamadı.'));
          return;
        }

        // 2. Kullanıcının yüklediği resmi Canvas'a (RAM'e) piksel piksel çizdiriyoruz
        ctx.drawImage(img, 0, 0);

        // 3. Canvas'tan dosyayı dışarı aktarıyoruz.
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl); // Bellek sızıntısını (Memory Leak) önlemek için URL'i temizliyoruz
          
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas, resmi Blob formatına çeviremedi.'));
          }
        }, 'image/tiff'); 
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Resim Canvas motoruna yüklenirken hata oluştu.'));
      };

      img.src = objectUrl;
    });
  }
}