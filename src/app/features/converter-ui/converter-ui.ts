import { Component, ChangeDetectorRef, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtifEngineService } from '../../core/engines/utif-engine';
import { WasmEngineService } from '../../core/engines/wasm-engine';
import { PdfEngineService } from '../../core/engines/pdf-engine';

interface SystemLog {
  time: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'param';
  category: string;
  message: string;
}

@Component({
  selector: 'app-converter-ui',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './converter-ui.html',
  styleUrls: ['./converter-ui.scss']
})
export class ConverterUiComponent implements OnInit, AfterViewChecked {
  @ViewChild('logContainer') private logContainer!: ElementRef;

  // --- 1. TEKİL DURUM DEĞİŞKENLERİ ---
  files: File[] = [];
  selectedEngine: string = 'wasm';
  isProcessing: boolean = false;

  // --- 2. KULLANICI PARAMETRELERİ (SAF STANDARTLAR) ---
  pdfScale: number = 1.0; 
  pdfQuality: number = 100; 
  tiffDpi: number = 72; 
  compressionType: string = 'lzw'; 
  colorMode: string = 'original'; 
  tiffQuality: number = 85; 

  // --- 3. QA LOG SİSTEMİ ---
  systemLogs: SystemLog[] = [];

  constructor(
    private utifEngine: UtifEngineService,
    private wasmEngine: WasmEngineService,
    private pdfEngine: PdfEngineService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.addLog('Sistem başlatıldı. Laboratuvar veri bekliyor.', 'info', 'SİSTEM');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  get isPdfFile(): boolean {
    return this.files.some(file => file.type === 'application/pdf');
  }

  private scrollToBottom(): void {
    try {
      if (this.logContainer) {
        this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  onFileSelected(event: any): void {
    this.files = event.target.files?.length > 0 ? Array.from(event.target.files) : [];
    
    if (this.files.length > 0) {
      const sizeMB = (this.files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2);
      this.addLog(`Kuyruğa ${this.files.length} dosya eklendi (${sizeMB} MB).`, 'info', 'GİRDİ');
      
      if (this.files.length > 1) {
        this.selectedEngine = 'wasm';
      }
    } else {
      this.addLog('Dosya seçimi temizlendi.', 'warning', 'SİSTEM');
    }
  }

  // --- ANA İŞLEM MOTORU VE DETAYLI LOGLAMA ---
  // --- ANA İŞLEM MOTORU (TEST VE KARŞILAŞTIRMA ODAKLI LOG) ---
  async startProcess(): Promise<void> {
    if (this.files.length === 0) return;

    this.isProcessing = true;
    const startTime = performance.now();

    // 1. AYARLARI BASTIR (Mantıksal Sırayla)
    const isWasm = this.selectedEngine === 'wasm' || this.files.length > 1;
    let paramLogs = [];
    
    // 1.1. Motor Bilgisi
    paramLogs.push(`Motor: ${isWasm ? 'WASM' : 'UTIF'}`);
    
    // 1.2. PDF Ayarları (Sadece kuyrukta PDF varsa)
    if (this.isPdfFile) {
      paramLogs.push(`PDF Scale: ${this.pdfScale}x`);
      paramLogs.push(`PDF Kalite: %${this.pdfQuality}`);
    }
    
    // 1.3. TIFF Çıktı Ayarları (Sadece WASM devredeyse)
    if (isWasm) {
      paramLogs.push(`Renk: ${this.colorMode.toUpperCase()}`);
      paramLogs.push(`DPI: ${this.tiffDpi}`);
      if (this.compressionType === 'jpeg') {
        paramLogs.push(`Sıkıştırma: JPEG (%${this.tiffQuality})`);
      } else {
        paramLogs.push(`Sıkıştırma: ${this.compressionType.toUpperCase()}`);
      }
    }

    // Ayarlar dizisini aralarına " | " koyarak tek satırda birleştir
    this.addLog(paramLogs.join(' | '), 'param', 'AYARLAR');

    try {
      const allPages: Uint8Array[] = [];

      // Arka planda sessizce PDF/Görüntü okuma (Ara loglar kaldırıldı)
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        if (file.type === 'application/pdf') {
          const pdfOptions = { scale: this.pdfScale, quality: (this.pdfQuality / 100) };
          const pages = await this.pdfEngine.extractAllPages(file, pdfOptions);
          allPages.push(...pages);
        } else {
          const buf = await file.arrayBuffer();
          allPages.push(new Uint8Array(buf));
        }
      }

      let resultBlob: Blob;

      // Arka planda sessizce Motoru çalıştırma
      if (isWasm) {
        const wasmOptions = { 
          dpi: this.tiffDpi, compression: this.compressionType, 
          colorMode: this.colorMode, tiffQuality: this.tiffQuality 
        };
        resultBlob = await this.wasmEngine.convertToTiff(allPages, wasmOptions);
      } else {
        const singlePageFile = new File([allPages[0].slice().buffer], 'temp.jpg', { type: 'image/jpeg' });
        resultBlob = await this.utifEngine.convertToTiff(singlePageFile);
      }

      // 2. SONUCU BASTIR (Milisanlye ve Boyut Karşılaştırması)
      const processTime = Math.round(performance.now() - startTime);
      const newSizeMB = (resultBlob.size / 1024 / 1024).toFixed(2);
      const oldSizeMB = (this.files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2);
      
      this.addLog(`⏱️ ${processTime} ms | 📦 Boyut: ${oldSizeMB} MB ➡️ ${newSizeMB} MB`, 'success', 'SONUÇ');
      
      this.downloadFile(resultBlob, `Laboratuvar_Cikti_${Date.now()}.tiff`);

    } catch (error: any) {
      console.error(error);
      this.addLog(`Hata: ${error.message || 'Bilinmeyen Hata'}`, 'error', 'HATA');
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  private addLog(message: string, type: 'info' | 'success' | 'warning' | 'error' | 'param', category: string): void {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    this.systemLogs.push({ time, type, category, message });
    this.cdr.detectChanges();
  }

  private downloadFile(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}