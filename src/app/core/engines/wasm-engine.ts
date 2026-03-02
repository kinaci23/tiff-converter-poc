import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WasmEngineService {
  // YENİ: colorMode ve tiffQuality parametreleri eklendi
  convertToTiff(pages: Uint8Array[], options: { dpi: number, compression: string, colorMode: string, tiffQuality: number }): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/wasm-processor.worker', import.meta.url), { type: 'module' });

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

      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };

      const buffers = pages.map(p => p.buffer);
      
      // YENİ: Bütün paket Worker'a fırlatılıyor
      worker.postMessage({ 
        buffers: buffers, 
        dpi: options.dpi, 
        compression: options.compression,
        colorMode: options.colorMode,
        tiffQuality: options.tiffQuality
      }, buffers);
    });
  }
}