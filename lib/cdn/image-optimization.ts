import { EventEmitter } from 'events';

export interface ImageOptimizationOptions {
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  width?: number;
  height?: number;
  quality?: number;
}

export interface OptimizedImage {
  buffer: Buffer;
  format: string;
  width: number;
  height: number;
  size: number;
  quality: number;
}

export interface ResponsiveImageSet {
  original: OptimizedImage;
  variants: Map<number, OptimizedImage>;
}

export class ImageOptimization extends EventEmitter {
  private imageCache: Map<string, OptimizedImage> = new Map();
  private optimizationStats: {
    totalOptimizations: number;
    totalBytesReduced: number;
    averageQuality: number;
  } = {
    totalOptimizations: 0,
    totalBytesReduced: 0,
    averageQuality: 0,
  };

  constructor() {
    super();
  }

  async optimizeImage(
    imagePath: string,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    try {
      const cacheKey = `${imagePath}:${JSON.stringify(options)}`;

      if (this.imageCache.has(cacheKey)) {
        const cached = this.imageCache.get(cacheKey)!;
        this.emit('cache-hit', { path: imagePath });
        return cached.buffer;
      }

      const format = options.format || 'webp';
      const quality = options.quality || 80;
      const width = options.width || 800;
      const height = options.height || 600;

      // Simulate image optimization
      const optimizedBuffer = this.simulateImageOptimization(
        Buffer.alloc(1024),
        format,
        quality,
        width,
        height
      );

      const optimized: OptimizedImage = {
        buffer: optimizedBuffer,
        format,
        width,
        height,
        size: optimizedBuffer.length,
        quality,
      };

      this.imageCache.set(cacheKey, optimized);
      this.updateStats(1024, optimizedBuffer.length);

      this.emit('image-optimized', {
        path: imagePath,
        originalSize: 1024,
        optimizedSize: optimizedBuffer.length,
        format,
      });

      return optimizedBuffer;
    } catch (error) {
      this.emit('error', { type: 'optimization-failed', path: imagePath, error });
      throw new Error(`Failed to optimize image: ${imagePath}`);
    }
  }

  async generateResponsiveImages(
    imagePath: string,
    sizes: number[]
  ): Promise<Map<number, Buffer>> {
    try {
      const variants = new Map<number, Buffer>();

      for (const size of sizes) {
        const options: ImageOptimizationOptions = {
          format: 'webp',
          width: size,
          height: Math.round(size * 0.75), // 4:3 aspect ratio
          quality: 80,
        };

        const optimized = await this.optimizeImage(imagePath, options);
        variants.set(size, optimized);
      }

      this.emit('responsive-images-generated', {
        path: imagePath,
        sizes,
        variantCount: variants.size,
      });

      return variants;
    } catch (error) {
      this.emit('error', { type: 'responsive-generation-failed', path: imagePath, error });
      throw error;
    }
  }

  async convertFormat(image: Buffer, targetFormat: string): Promise<Buffer> {
    try {
      if (!['webp', 'avif', 'jpg', 'png'].includes(targetFormat)) {
        throw new Error(`Unsupported format: ${targetFormat}`);
      }

      const converted = this.simulateFormatConversion(image, targetFormat);

      this.emit('format-converted', {
        targetFormat,
        originalSize: image.length,
        convertedSize: converted.length,
      });

      return converted;
    } catch (error) {
      this.emit('error', { type: 'format-conversion-failed', targetFormat, error });
      throw error;
    }
  }

  async resizeImage(image: Buffer, width: number, height: number): Promise<Buffer> {
    try {
      if (width <= 0 || height <= 0) {
        throw new Error('Width and height must be positive');
      }

      const resized = this.simulateImageResize(image, width, height);

      this.emit('image-resized', {
        width,
        height,
        originalSize: image.length,
        resizedSize: resized.length,
      });

      return resized;
    } catch (error) {
      this.emit('error', { type: 'resize-failed', width, height, error });
      throw error;
    }
  }

  private simulateImageOptimization(
    imageBuffer: Buffer,
    format: string,
    quality: number,
    width: number,
    height: number
  ): Buffer {
    // Simulate compression based on quality
    const compressionFactor = quality / 100;
    const optimizedSize = Math.ceil(imageBuffer.length * compressionFactor);

    return Buffer.alloc(Math.max(optimizedSize, 100));
  }

  private simulateFormatConversion(imageBuffer: Buffer, targetFormat: string): Buffer {
    // Simulate format conversion with typical compression ratios
    const compressionRatios: Record<string, number> = {
      webp: 0.7,
      avif: 0.6,
      jpg: 0.8,
      png: 0.9,
    };

    const ratio = compressionRatios[targetFormat] || 0.8;
    const convertedSize = Math.ceil(imageBuffer.length * ratio);

    return Buffer.alloc(convertedSize);
  }

  private simulateImageResize(imageBuffer: Buffer, width: number, height: number): Buffer {
    // Simulate resizing based on new dimensions
    const pixelCount = width * height;
    const originalPixels = Math.sqrt(imageBuffer.length);
    const resizeFactor = pixelCount / (originalPixels * originalPixels);

    const resizedSize = Math.ceil(imageBuffer.length * Math.min(resizeFactor, 1));

    return Buffer.alloc(resizedSize);
  }

  private updateStats(originalSize: number, optimizedSize: number): void {
    this.optimizationStats.totalOptimizations++;
    this.optimizationStats.totalBytesReduced += originalSize - optimizedSize;
    this.optimizationStats.averageQuality =
      (this.optimizationStats.averageQuality * (this.optimizationStats.totalOptimizations - 1) +
        80) /
      this.optimizationStats.totalOptimizations;
  }

  getOptimizationStats(): typeof this.optimizationStats {
    return { ...this.optimizationStats };
  }

  clearCache(): void {
    this.imageCache.clear();
    this.emit('cache-cleared');
  }

  getCacheSize(): number {
    return this.imageCache.size;
  }

  async getSupportedFormats(): Promise<string[]> {
    return ['webp', 'avif', 'jpg', 'png'];
  }
}
