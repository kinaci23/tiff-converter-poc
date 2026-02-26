import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WasmEngineService {
  convertToTiff(pages: Uint8Array[]): Promise<Blob> {
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
      worker.postMessage({ buffers: buffers }, buffers);
    });
  }
}