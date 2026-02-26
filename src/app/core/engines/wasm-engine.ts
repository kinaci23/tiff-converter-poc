import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WasmEngineService {
  // Sayfaları alarak TIFF formatına dönüştürür
  convertToTiff(pages: Uint8Array[]): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/wasm-processor.worker', import.meta.url), { type: 'module' });

      // Worker'dan başarılı veya hatalı mesaj alındığında çalışır
      worker.onmessage = ({ data }) => {
        if (data.status === 'success') {
          const blob = new Blob([data.data], { type: 'image/tiff' });
          worker.terminate();
          resolve(blob);
        } else {
          worker.terminate();
          reject(new Error(data.error));
        }
      };

      // Worker'da hata oluştuğunda çalışır
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };

      const buffers = pages.map(p => p.buffer);
      worker.postMessage({ buffers: buffers }, buffers);
    });
  }
}