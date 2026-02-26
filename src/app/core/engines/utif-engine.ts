import { Injectable } from '@angular/core';
import * as UTIF from 'utif';

@Injectable({
  providedIn: 'root'
})
export class UtifEngineService {
  
  convertToTiff(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

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
        // Resmin bütün renk genetiğini (RGBA array) tuvalden emiyoruz
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        // 2. TERCÜMAN AŞAMASI: UTIF.js devreye giriyor!
        try {
          // imageData.data içindeki ham pikselleri UTIF'e verip gerçek TIFF dizilimine çeviriyoruz
          const tiffBuffer = UTIF.encodeImage(imageData.data, img.width, img.height);
          
          // 3. Oluşan %100 orijinal TIFF verisini bilgisayara indirmek için Blob'a çeviriyoruz
          const blob = new Blob([tiffBuffer], { type: 'image/tiff' });
          URL.revokeObjectURL(objectUrl);
          
          resolve(blob);
        } catch (error) {
          reject(new Error('UTIF TIFF kodlama hatası: ' + error));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Resim UTIF motoruna yüklenirken hata oluştu.'));
      };

      img.src = objectUrl;
    });
  }
}