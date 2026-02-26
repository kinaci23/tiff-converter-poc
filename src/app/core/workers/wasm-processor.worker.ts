/// <reference lib="webworker" />
import { initializeImageMagick, ImageMagick, MagickFormat, MagickImageCollection, MagickImage } from '@imagemagick/magick-wasm';

let isMagickInitialized = false;

// Worker'a gelen mesajları işler
addEventListener('message', async ({ data }) => {
  try {
    if (!isMagickInitialized) {
      const wasmBytes = await fetch('/assets/magick.wasm').then(res => res.arrayBuffer());
      await initializeImageMagick(new Uint8Array(wasmBytes));
      isMagickInitialized = true;
    }

    const images = MagickImageCollection.create();
    const inputBuffers: ArrayBuffer[] = data.buffers;

    if (!inputBuffers || inputBuffers.length === 0) {
      throw new Error("İşlenecek sayfa verisi bulunamadı.");
    }

    // Gelen buffer verilerinden MagickImage nesneleri oluşturur
    inputBuffers.forEach((buffer) => {
      const img = MagickImage.create(new Uint8Array(buffer));
      images.push(img);
    });

    // Resimleri TIFF formatına çevirir ve gönderir
    images.write(MagickFormat.Tiff, (tiffData: Uint8Array) => {
      const copy = new Uint8Array(tiffData);
      postMessage({ status: 'success', data: copy.buffer }, [copy.buffer] as any);
    });

    images.dispose();

  } catch (error: any) {
    postMessage({ status: 'error', error: error.message });
  }
});