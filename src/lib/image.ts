import { MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION } from '@/lib/constants';

const FALLBACK_TYPES: Record<string, { contentType: string; extension: string }> = {
  'image/jpeg': { contentType: 'image/jpeg', extension: 'jpg' },
  'image/png': { contentType: 'image/png', extension: 'png' },
  'image/webp': { contentType: 'image/webp', extension: 'webp' },
};

export interface PreparedImage {
  blob: Blob;
  contentType: string;
  extension: string;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

/**
 * Comprime e redimensiona a foto no dispositivo antes do upload.
 * Reduz consumo de dados do cidadão e o custo de Storage/egress.
 *
 * - Máximo de 1600px no maior lado
 * - JPEG com qualidade 0.82
 * - Corrige a orientação EXIF (fotos de celular)
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem (JPG, PNG ou WebP).');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('A foto deve ter no máximo 8 MB.');
  }

  if (typeof createImageBitmap === 'function' && typeof document !== 'undefined') {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });

      const largestSide = Math.max(bitmap.width, bitmap.height);
      const scale = Math.min(1, MAX_IMAGE_DIMENSION / largestSide);
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (context) {
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        // Fundo branco evita áreas pretas ao converter PNG transparente em JPEG.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(bitmap, 0, 0, width, height);

        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
        bitmap.close();

        if (blob) {
          return {
            blob,
            contentType: 'image/jpeg',
            extension: 'jpg',
          };
        }
      } else {
        bitmap.close();
      }
    } catch {
      // Se o navegador não conseguir decodificar (ex.: HEIC), tentamos o
      // arquivo original caso o MIME seja aceito pelo bucket.
    }
  }

  const fallback = FALLBACK_TYPES[file.type];
  if (fallback) {
    return {
      blob: file,
      contentType: fallback.contentType,
      extension: fallback.extension,
    };
  }

  throw new Error(
    'Formato de imagem não suportado. Envie uma foto em JPG, PNG ou WebP.',
  );
}
