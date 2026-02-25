import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-converter-ui',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './converter-ui.html',   // .component kısmını sildik
  styleUrls: ['./converter-ui.scss']    // .component kısmını sildik
})
export class ConverterUiComponent {
  selectedFile: File | null = null;
  selectedEngine: string = 'canvas';
  isConverting: boolean = false;
  conversionTime: number | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      this.selectedFile = file;
      this.conversionTime = null;
    } else {
      alert('Lütfen sadece JPEG veya PNG seçin.');
    }
  }

  async startConversion() {
    if (!this.selectedFile) return;
    this.isConverting = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isConverting = false;
    this.conversionTime = 1000;
  }
}