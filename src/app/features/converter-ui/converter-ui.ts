import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasEngineService } from '../../core/engines/canvas-engine';
import { UtifEngineService } from '../../core/engines/utif-engine';
import { WasmEngineService } from '../../core/engines/wasm-engine';
import { PdfEngineService } from '../../core/engines/pdf-engine';

@Component({
  selector: 'app-converter-ui',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './converter-ui.html',
  styleUrls: ['./converter-ui.scss']
})
export class ConverterUiComponent {
  selectedFile: File | null = null;
  selectedEngine: string = 'wasm';
  isConverting: boolean = false;
  conversionTime: number | null = null;

  constructor(
    private canvasEngine: CanvasEngineService,
    private utifEngine: UtifEngineService,
    private wasmEngine: WasmEngineService,
    private pdfEngine: PdfEngineService,
    private cdr: ChangeDetectorRef
  ) { }

  // Dosya seçildiğinde tetiklenir
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  // Dönüştürme işlemini başlatır
  async startConversion() {
    if (!this.selectedFile) return;
    this.isConverting = true;
    const startTime = performance.now();

    try {
      let pages: Uint8Array[] = [];

      // Dosya PDF ise tüm sayfaları çıkarır, değilse tek sayfa olarak okur
      if (this.selectedFile.type === 'application/pdf') {
        pages = await this.pdfEngine.extractAllPages(this.selectedFile);
      } else {
        const buf = await this.selectedFile.arrayBuffer();
        pages = [new Uint8Array(buf)];
      }

      let result: Blob;

      // Seçilen dönüştürücü motoruna göre işlemi gerçekleştirir
      if (this.selectedEngine === 'wasm') {
        result = await this.wasmEngine.convertToTiff(pages);
      } else {
        const bufferCopy = pages[0].slice().buffer;
        const singlePageFile = new File([bufferCopy], 'temp.jpg', { type: 'image/jpeg' });

        result = this.selectedEngine === 'utif'
          ? await this.utifEngine.convertToTiff(singlePageFile)
          : await this.canvasEngine.convertToTiff(singlePageFile);
      }

      this.conversionTime = Math.round(performance.now() - startTime);
      this.downloadFile(result, 'converted.tiff');
    } catch (e) {
      console.error("Dönüşüm hatası:", e);
    } finally {
      this.isConverting = false;
      this.cdr.detectChanges();
    }
  }

  // Oluşturulan dosyayı indirmeyi sağlar
  private downloadFile(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}