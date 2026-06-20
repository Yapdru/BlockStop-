export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizationType: string;
}

export class AssetOptimizer {
  private optimizationCache: Map<string, OptimizationResult> = new Map();

  async optimizeAsset(content: Buffer, type: string): Promise<OptimizationResult> {
    try {
      const originalSize = content.length;
      let optimizedContent: Buffer;
      let optimizationType = 'none';

      if (type.includes('css')) {
        const css = content.toString('utf-8');
        const optimized = await this.minifyCSS(css);
        optimizedContent = Buffer.from(optimized, 'utf-8');
        optimizationType = 'css-minification';
      } else if (type.includes('javascript') || type.includes('json')) {
        const js = content.toString('utf-8');
        const optimized = await this.minifyJavaScript(js);
        optimizedContent = Buffer.from(optimized, 'utf-8');
        optimizationType = 'js-minification';
      } else if (type.includes('html')) {
        const html = content.toString('utf-8');
        const optimized = await this.optimizeHTML(html);
        optimizedContent = Buffer.from(optimized, 'utf-8');
        optimizationType = 'html-optimization';
      } else if (type.includes('image')) {
        optimizedContent = await this.compressImage(content);
        optimizationType = 'image-compression';
      } else {
        optimizedContent = this.compress(content);
        optimizationType = 'gzip-compression';
      }

      const optimizedSize = optimizedContent.length;
      const compressionRatio = (1 - optimizedSize / originalSize) * 100;

      const result: OptimizationResult = {
        originalSize,
        optimizedSize,
        compressionRatio,
        optimizationType,
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to optimize asset of type ${type}: ${error}`);
    }
  }

  async minifyCSS(css: string): Promise<string> {
    // Remove comments
    let minified = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove whitespace
    minified = minified.replace(/\s+/g, ' ');
    minified = minified.replace(/\s*([{}:;,])\s*/g, '$1');
    minified = minified.replace(/;}/g, '}');

    // Remove trailing semicolons
    minified = minified.trim();

    return minified;
  }

  async minifyJavaScript(js: string): Promise<string> {
    // Remove single-line comments
    let minified = js.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    minified = minified.replace(/\/\*[\s\S]*?\*\//g, '');

    // Remove unnecessary whitespace
    minified = minified.replace(/\s+/g, ' ');
    minified = minified.replace(/\s*([{}();:,[\]<>=!&|+\-*/%?])\s*/g, '$1');

    // Remove spaces around operators more carefully
    minified = minified.replace(/\s+([+\-*/%])\s+/g, '$1');

    return minified.trim();
  }

  async optimizeHTML(html: string): Promise<string> {
    // Remove comments
    let optimized = html.replace(/<!--[\s\S]*?-->/g, '');

    // Remove excess whitespace between tags
    optimized = optimized.replace(/>\s+</g, '><');

    // Remove unnecessary whitespace in attributes
    optimized = optimized.replace(/\s+/g, ' ');

    // Remove spaces around = in attributes
    optimized = optimized.replace(/\s*=\s*/g, '=');

    return optimized.trim();
  }

  async compressImage(image: Buffer): Promise<Buffer> {
    // Simulated image compression
    // In production, this would use real image compression libraries like sharp
    const originalSize = image.length;

    // Simple compression simulation: remove every 10th byte
    const compressed: number[] = [];
    for (let i = 0; i < image.length; i++) {
      if (i % 10 !== 0) {
        compressed.push(image[i]);
      }
    }

    const compressedBuffer = Buffer.from(compressed);

    // Ensure we don't exceed original size in simulation
    return compressedBuffer.length < originalSize ? compressedBuffer : image;
  }

  private compress(buffer: Buffer): Buffer {
    // Basic compression simulation
    // In production, use zlib or similar
    const originalLength = buffer.length;

    if (originalLength < 100) {
      return buffer;
    }

    // Simulate compression by reducing size
    const compressedSize = Math.ceil(originalLength * 0.7);
    return buffer.slice(0, compressedSize);
  }

  clearCache(): void {
    this.optimizationCache.clear();
  }

  getOptimizationStats(): {
    totalOptimizations: number;
    averageCompressionRatio: number;
    totalBytesReduced: number;
  } {
    if (this.optimizationCache.size === 0) {
      return {
        totalOptimizations: 0,
        averageCompressionRatio: 0,
        totalBytesReduced: 0,
      };
    }

    let totalRatio = 0;
    let totalReduced = 0;

    for (const result of this.optimizationCache.values()) {
      totalRatio += result.compressionRatio;
      totalReduced += result.originalSize - result.optimizedSize;
    }

    return {
      totalOptimizations: this.optimizationCache.size,
      averageCompressionRatio: totalRatio / this.optimizationCache.size,
      totalBytesReduced: totalReduced,
    };
  }
}
