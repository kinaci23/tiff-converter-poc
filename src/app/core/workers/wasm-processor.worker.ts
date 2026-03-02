/// <reference lib="webworker" />
// YENİ: ColorSpace kütüphanesi eklendi
import { initializeImageMagick, MagickFormat, MagickImageCollection, Density, DensityUnit, CompressionMethod, ColorSpace } from '@imagemagick/magick-wasm';

let isMagickInitialized = false;

addEventListener('message', async ({ data }) => {
  try {
    if (!isMagickInitialized) {
      const wasmBytes = await fetch('/assets/magick.wasm').then(res => res.arrayBuffer());
      await initializeImageMagick(new Uint8Array(wasmBytes));
      isMagickInitialized = true;
    }

    const masterCollection = MagickImageCollection.create();
    const inputBuffers: ArrayBuffer[] = data.buffers;
    
    // Gelen Parametreler
    const targetDpi: number = data.dpi || 300;
    const compressionType: string = data.compression || 'lzw';
    const colorMode: string = data.colorMode || 'original';
    const tiffQuality: number = data.tiffQuality || 80;

    let magickCompression: any = CompressionMethod.LZW;
    if (compressionType === 'jpeg') magickCompression = CompressionMethod.JPEG;
    if (compressionType === 'none') magickCompression = CompressionMethod.NoCompression;

    if (!inputBuffers || inputBuffers.length === 0) {
      throw new Error("İşlenecek sayfa verisi bulunamadı.");
    }

    inputBuffers.forEach((buffer) => {
      const tempCol = MagickImageCollection.create();
      tempCol.read(new Uint8Array(buffer)); 
      
      for (let i = 0; i < tempCol.length; i++) {
        const img = tempCol[i];
        
        // 1. DPI Genetiği
        img.density = new Density(targetDpi, targetDpi, DensityUnit.PixelsPerInch);
        
        // 2. Renk Modu (Siyah-Beyaz / Grayscale Filtresi)
        if (colorMode === 'grayscale') {
          img.colorSpace = ColorSpace.Gray;
        }

        // 3. Özel TIFF Kalitesi (Sadece JPEG sıkıştırması aktifse uygulanır)
        if (compressionType === 'jpeg') {
          img.quality = tiffQuality;
        }
        
        // 4. Sıkıştırma Genetiği
        if (img.settings) {
            img.settings.compression = magickCompression;
        }
        
        masterCollection.push(img);
      }
    });

    masterCollection.write(MagickFormat.Tiff, (tiffData: Uint8Array) => {
      const copy = new Uint8Array(tiffData);
      postMessage({ status: 'success', data: copy.buffer }, [copy.buffer] as any);
    });

    masterCollection.dispose();

  } catch (error: any) {
    postMessage({ status: 'error', error: error.message });
  }
});