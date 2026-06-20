import { EventEmitter } from 'events';

export interface VideoSegment {
  duration: number;
  bitrate: number;
  url: string;
  resolution?: string;
}

export interface HLSPlaylist {
  url: string;
  segments: VideoSegment[];
  targetDuration: number;
  mediaSequence: number;
  isLive: boolean;
}

export interface DASHRepresentation {
  id: string;
  bitrate: number;
  resolution: string;
  codecs: string;
  mimeType: string;
}

export interface DASHManifest {
  url: string;
  representations: DASHRepresentation[];
  duration: number;
  minBufferTime: number;
}

export interface StreamingMetrics {
  viewers: number;
  avgBitrate: number;
  buffering: number;
  dropouts: number;
  totalViewingMinutes: number;
}

export class VideoDelivery extends EventEmitter {
  private activeStreams: Map<string, { startTime: Date; bitrate: number; viewers: number }> =
    new Map();
  private streamingMetrics: Map<string, StreamingMetrics> = new Map();
  private availableBitrates: number[] = [500, 1000, 2500, 5000, 8000];

  constructor() {
    super();
  }

  async createHLSPlaylist(videoPath: string): Promise<HLSPlaylist> {
    try {
      const videoId = this.extractVideoId(videoPath);
      const segments: VideoSegment[] = [];

      // Create HLS segments for different bitrates
      for (let i = 0; i < 10; i++) {
        for (const bitrate of this.availableBitrates) {
          segments.push({
            duration: 10, // 10 second segments
            bitrate,
            url: `https://cdn.example.com/video/${videoId}/segment-${i}-${bitrate}k.ts`,
            resolution: this.bitrateToResolution(bitrate),
          });
        }
      }

      const playlist: HLSPlaylist = {
        url: `https://cdn.example.com/video/${videoId}/playlist.m3u8`,
        segments,
        targetDuration: 10,
        mediaSequence: 0,
        isLive: false,
      };

      this.activeStreams.set(videoId, {
        startTime: new Date(),
        bitrate: this.availableBitrates[2],
        viewers: 0,
      });

      this.emit('hls-playlist-created', { videoId, segmentCount: segments.length });

      return playlist;
    } catch (error) {
      this.emit('error', { type: 'hls-creation-failed', videoPath, error });
      throw new Error(`Failed to create HLS playlist for: ${videoPath}`);
    }
  }

  async createDASHManifest(videoPath: string): Promise<DASHManifest> {
    try {
      const videoId = this.extractVideoId(videoPath);
      const representations: DASHRepresentation[] = [];

      // Create DASH representations for different bitrates
      for (const bitrate of this.availableBitrates) {
        const resolution = this.bitrateToResolution(bitrate);
        representations.push({
          id: `representation-${bitrate}k`,
          bitrate: bitrate * 1000, // Convert to bps
          resolution,
          codecs: 'avc1.42c01e,mp4a.40.2',
          mimeType: 'video/mp4',
        });
      }

      const manifest: DASHManifest = {
        url: `https://cdn.example.com/video/${videoId}/manifest.mpd`,
        representations,
        duration: 600, // 10 minutes
        minBufferTime: 2,
      };

      this.emit('dash-manifest-created', { videoId, representationCount: representations.length });

      return manifest;
    } catch (error) {
      this.emit('error', { type: 'dash-creation-failed', videoPath, error });
      throw new Error(`Failed to create DASH manifest for: ${videoPath}`);
    }
  }

  async getStreamingMetrics(videoId: string): Promise<StreamingMetrics> {
    const cached = this.streamingMetrics.get(videoId);

    if (cached) {
      return cached;
    }

    const metrics: StreamingMetrics = {
      viewers: Math.floor(Math.random() * 1000),
      avgBitrate: this.availableBitrates[2],
      buffering: Math.random() * 2, // 0-2% buffering
      dropouts: Math.floor(Math.random() * 5),
      totalViewingMinutes: Math.floor(Math.random() * 10000),
    };

    this.streamingMetrics.set(videoId, metrics);
    return metrics;
  }

  async adaptiveBitrate(clientBandwidth: number, availableBitrates: number[]): Promise<number> {
    try {
      if (availableBitrates.length === 0) {
        throw new Error('No bitrates available');
      }

      // Sort bitrates in ascending order
      const sorted = [...availableBitrates].sort((a, b) => a - b);

      // Select bitrate based on client bandwidth with 80% utilization
      const maxBitrate = Math.floor(clientBandwidth * 0.8);

      let selectedBitrate = sorted[0];
      for (const bitrate of sorted) {
        if (bitrate <= maxBitrate) {
          selectedBitrate = bitrate;
        } else {
          break;
        }
      }

      this.emit('bitrate-selected', {
        clientBandwidth,
        selectedBitrate,
      });

      return selectedBitrate;
    } catch (error) {
      this.emit('error', { type: 'bitrate-selection-failed', clientBandwidth, error });
      throw error;
    }
  }

  private extractVideoId(videoPath: string): string {
    return videoPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'unknown';
  }

  private bitrateToResolution(bitrate: number): string {
    const resolutions: Record<number, string> = {
      500: '480p',
      1000: '720p',
      2500: '1080p',
      5000: '2K',
      8000: '4K',
    };

    return resolutions[bitrate] || '480p';
  }

  async recordViewer(videoId: string): Promise<void> {
    const stream = this.activeStreams.get(videoId);
    if (stream) {
      stream.viewers++;
    }
    this.emit('viewer-added', { videoId });
  }

  async removeViewer(videoId: string): Promise<void> {
    const stream = this.activeStreams.get(videoId);
    if (stream && stream.viewers > 0) {
      stream.viewers--;
    }
    this.emit('viewer-removed', { videoId });
  }

  async updateStreamBitrate(videoId: string, bitrate: number): Promise<void> {
    const stream = this.activeStreams.get(videoId);
    if (stream) {
      stream.bitrate = bitrate;
      this.emit('bitrate-updated', { videoId, bitrate });
    }
  }

  async getActiveStreams(): Promise<Array<{ videoId: string; viewers: number; bitrate: number }>> {
    const active: Array<{ videoId: string; viewers: number; bitrate: number }> = [];

    for (const [videoId, stream] of this.activeStreams) {
      active.push({
        videoId,
        viewers: stream.viewers,
        bitrate: stream.bitrate,
      });
    }

    return active;
  }

  async closeStream(videoId: string): Promise<void> {
    this.activeStreams.delete(videoId);
    this.emit('stream-closed', { videoId });
  }

  getAvailableBitrates(): number[] {
    return [...this.availableBitrates];
  }

  setAvailableBitrates(bitrates: number[]): void {
    this.availableBitrates = bitrates.sort((a, b) => a - b);
    this.emit('bitrates-updated', { bitrates: this.availableBitrates });
  }
}
