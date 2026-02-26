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

    // ÇÖZÜM: 'new' yasak olduğu için 'create' callback yapısını kullanıyoruz
    MagickImageCollection.create((images) => {
      const inputBuffers: ArrayBuffer[] = data.buffers;
      
      inputBuffers.forEach((buffer) => {
        images.read(new Uint8Array(buffer));
      });

      images.write(MagickFormat.Tiff, (tiffData: Uint8Array) => {
        // SharedArrayBuffer hatası almamak için veriyi kopyalıyoruz
        const copy = new Uint8Array(tiffData);
        postMessage({ status: 'success', data: copy.buffer }, [copy.buffer] as any);
      });
    });

  } catch (error: any) {
    postMessage({ status: 'error', error: error.message });
  }
});