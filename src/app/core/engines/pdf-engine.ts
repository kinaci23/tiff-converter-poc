import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.mjs';

@Injectable({ providedIn: 'root' })
export class PdfEngineService {
  // ÇÖZÜM: 'options' parametresi eklendi
  async extractAllPages(pdfFile: File, options: { scale: number, quality: number }): Promise<Uint8Array[]> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pagesData: Uint8Array[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      // ÇÖZÜM: Hardcoded 1.5 yerine arayüzden gelen değer kullanılıyor
      const viewport = page.getViewport({ scale: options.scale });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: ctx, viewport: viewport, canvas: canvas } as any).promise;

      // ÇÖZÜM: Hardcoded 0.85 yerine arayüzden gelen kalite kullanılıyor
      const blob: any = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', options.quality));
      const buffer = await blob.arrayBuffer();
      pagesData.push(new Uint8Array(buffer));
    }
    return pagesData;
  }
}