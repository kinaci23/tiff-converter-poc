/// <reference lib="webworker" />
import { initializeImageMagick, ImageMagick, MagickFormat, MagickImageCollection } from '@imagemagick/magick-wasm';

let isMagickInitialized = false;

addEventListener('message', async ({ data }) => {
  try {
    if (!isMagickInitialized) {
      const wasmBytes = await fetch('/assets/magick.wasm').then(res => res.arrayBuffer());
      await initializeImageMagick(new Uint8Array(wasmBytes));
      isMagickInitialized = true;
    }

    // ÇÖZÜM: create() içine fonksiyon yazmıyoruz! Doğrudan değişkene atıyoruz.
    const images = MagickImageCollection.create();
    
    const inputBuffers: ArrayBuffer[] = data.buffers;
    
    if (!inputBuffers || inputBuffers.length === 0) {
      throw new Error("İşlenecek sayfa verisi bulunamadı.");
    }

    inputBuffers.forEach((buffer) => {
      images.read(new Uint8Array(buffer));
    });

    images.write(MagickFormat.Tiff, (tiffData: Uint8Array) => {
      const copy = new Uint8Array(tiffData);
      postMessage({ status: 'success', data: copy.buffer }, [copy.buffer] as any);
    });

    // İşimiz bitince belleği serbest bırakıyoruz (Çok önemli!)
    images.dispose();

  } catch (error: any) {
    postMessage({ status: 'error', error: error.message });
  }
});