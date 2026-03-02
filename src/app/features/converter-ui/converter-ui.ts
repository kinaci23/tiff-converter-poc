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
  pdfScale: number = 1.5;
  pdfQuality: number = 85; 
  tiffDpi: number = 300;
  tiffCompression: string = 'lzw';
  colorMode: string = 'original'; 
  tiffQuality: number = 80;

  convertFile: File | null = null;
  convertEngine: string = 'wasm';
  isConverting: boolean = false;
  convertTime: number | null = null;

  mergeFiles: File[] = [];
  isMerging: boolean = false;
  mergeTime: number | null = null;

  constructor(
    private canvasEngine: CanvasEngineService,
    private utifEngine: UtifEngineService,
    private wasmEngine: WasmEngineService,
    private pdfEngine: PdfEngineService,
    private cdr: ChangeDetectorRef
  ) { }

  // --- AKILLI ARAYÜZ KONTROLLERİ (GETTERS) ---
  get hasConvertPdf(): boolean {
    return this.convertFile?.type === 'application/pdf';
  }

  get showConvertParamsBox(): boolean {
    return this.hasConvertPdf || this.convertEngine === 'wasm';
  }

  get hasMergePdf(): boolean {
    return this.mergeFiles.some(file => file.type === 'application/pdf');
  }
  // -------------------------------------------

  onConvertFileSelected(event: any) {
    this.convertFile = event.target.files[0] || null;
    this.convertTime = null;
  }

  onMergeFilesSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.mergeFiles = Array.from(event.target.files);
    } else {
      this.mergeFiles = [];
    }
    this.mergeTime = null;
  }

  async startConversion() {
    if (!this.convertFile) return;
    this.isConverting = true;
    this.convertTime = null;
    const startTime = performance.now();

    const pdfOptions = { scale: this.pdfScale, quality: (this.pdfQuality / 100) };
    const wasmOptions = { 
      dpi: this.tiffDpi, 
      compression: this.tiffCompression,
      colorMode: this.colorMode,
      tiffQuality: this.tiffQuality
    };

    try {
      let pages: Uint8Array[] = [];
      if (this.convertFile.type === 'application/pdf') {
        pages = await this.pdfEngine.extractAllPages(this.convertFile, pdfOptions);
      } else {
        const buf = await this.convertFile.arrayBuffer();
        pages = [new Uint8Array(buf)];
      }

      let result: Blob;
      if (this.convertEngine === 'wasm') {
        result = await this.wasmEngine.convertToTiff(pages, wasmOptions);
      } else {
        const bufferCopy = pages[0].slice().buffer;
        const singlePageFile = new File([bufferCopy], 'temp.jpg', { type: 'image/jpeg' });
        result = this.convertEngine === 'utif'
          ? await this.utifEngine.convertToTiff(singlePageFile)
          : await this.canvasEngine.convertToTiff(singlePageFile);
      }

      this.convertTime = Math.round(performance.now() - startTime);
      this.downloadFile(result, `converted_${this.convertFile.name.split('.')[0]}.tiff`);
    } catch (e) {
      console.error("Dönüşüm hatası:", e);
      alert("Dönüşüm sırasında hata oluştu!");
    } finally {
      this.isConverting = false;
      this.cdr.detectChanges();
    }
  }

  async startMerge() {
    if (this.mergeFiles.length === 0) return;
    this.isMerging = true;
    this.mergeTime = null;
    const startTime = performance.now();

    const pdfOptions = { scale: this.pdfScale, quality: (this.pdfQuality / 100) };
    const wasmOptions = { 
      dpi: this.tiffDpi, 
      compression: this.tiffCompression,
      colorMode: this.colorMode,
      tiffQuality: this.tiffQuality
    };

    try {
      let allPages: Uint8Array[] = [];
      for (const file of this.mergeFiles) {
        if (file.type === 'application/pdf') {
          const pdfPages = await this.pdfEngine.extractAllPages(file, pdfOptions);
          allPages.push(...pdfPages);
        } else {
          const buf = await file.arrayBuffer();
          allPages.push(new Uint8Array(buf));
        }
      }

      const result = await this.wasmEngine.convertToTiff(allPages, wasmOptions);
      
      this.mergeTime = Math.round(performance.now() - startTime);
      this.downloadFile(result, 'merged_document.tiff');
    } catch (e) {
      console.error("Birleştirme hatası:", e);
      alert("Birleştirme sırasında hata oluştu!");
    } finally {
      this.isMerging = false;
      this.cdr.detectChanges();
    }
  }

  private downloadFile(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}