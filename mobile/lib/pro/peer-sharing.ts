/**
 * Peer-to-Peer Threat Sharing for Mobile Pro
 * Allows users to share threat information over local network
 */

import crypto from 'crypto';

export interface ThreatShare {
  id: string;
  threatHash: string;
  threatType: string;
  severity: string;
  sharedBy: string;
  sharedAt: Date;
  receivedBy: string[];
  verified: boolean;
}

export interface PeerConnection {
  peerId: string;
  deviceName: string;
  ipAddress: string;
  port: number;
  status: 'connected' | 'connecting' | 'disconnected';
  lastSeen: Date;
  trustedLevel: 'trusted' | 'unknown' | 'blocked';
}

export class PeerSharingService {
  private peers: Map<string, PeerConnection> = new Map();
  private sharedThreats: Map<string, ThreatShare> = new Map();
  private localPort = 9876;
  private maxPeerConnections = 10;

  async discoverPeers(): Promise<PeerConnection[]> {
    // Scan local network for BlockStop peers
    // In production, use mDNS/Bonjour discovery
    const discoveredPeers: PeerConnection[] = [
      {
        peerId: 'peer-001',
        deviceName: 'Alice-iPhone',
        ipAddress: '192.168.1.100',
        port: 9876,
        status: 'connected',
        lastSeen: new Date(),
        trustedLevel: 'trusted',
      },
      {
        peerId: 'peer-002',
        deviceName: 'Bob-Android',
        ipAddress: '192.168.1.101',
        port: 9876,
        status: 'connected',
        lastSeen: new Date(),
        trustedLevel: 'unknown',
      },
    ];

    for (const peer of discoveredPeers) {
      this.peers.set(peer.peerId, peer);
    }

    return discoveredPeers;
  }

  async shareThreat(
    threatHash: string,
    threatType: string,
    severity: string,
    targetPeerIds: string[] = []
  ): Promise<ThreatShare> {
    const shareId = this.generateShareId();
    const myDeviceId = this.getDeviceIdentifier();

    const threatShare: ThreatShare = {
      id: shareId,
      threatHash,
      threatType,
      severity,
      sharedBy: myDeviceId,
      sharedAt: new Date(),
      receivedBy: [],
      verified: false,
    };

    // Send to specified peers or all trusted peers
    const recipientPeers = targetPeerIds.length > 0
      ? targetPeerIds.map((id) => this.peers.get(id)).filter((p) => p !== undefined)
      : Array.from(this.peers.values()).filter((p) => p.trustedLevel === 'trusted' && p.status === 'connected');

    for (const peer of recipientPeers) {
      if (peer) {
        try {
          await this.sendToPeer(peer, threatShare);
          threatShare.receivedBy.push(peer.peerId);
        } catch (error) {
          console.error(`Failed to send to peer ${peer.peerId}:`, error);
        }
      }
    }

    this.sharedThreats.set(shareId, threatShare);
    return threatShare;
  }

  async receiveThreatShare(threatShare: ThreatShare): Promise<boolean> {
    // Verify signature and add to local threat database
    const isValid = await this.verifyThreatShare(threatShare);

    if (!isValid) {
      console.warn('Invalid threat share signature');
      return false;
    }

    // Store threat from peer
    this.sharedThreats.set(threatShare.id, threatShare);

    // In production, add to threat database and trigger local scan
    return true;
  }

  async trustPeer(peerId: string): Promise<boolean> {
    const peer = this.peers.get(peerId);
    if (!peer) return false;

    peer.trustedLevel = 'trusted';
    return true;
  }

  async blockPeer(peerId: string): Promise<boolean> {
    const peer = this.peers.get(peerId);
    if (!peer) return false;

    peer.trustedLevel = 'blocked';
    peer.status = 'disconnected';
    return true;
  }

  async getConnectedPeers(): Promise<PeerConnection[]> {
    return Array.from(this.peers.values()).filter((p) => p.status === 'connected');
  }

  async getTrustedPeers(): Promise<PeerConnection[]> {
    return Array.from(this.peers.values()).filter((p) => p.trustedLevel === 'trusted');
  }

  async getReceivedThreats(): Promise<ThreatShare[]> {
    return Array.from(this.sharedThreats.values());
  }

  async getStatistics(): Promise<{
    totalPeers: number;
    connectedPeers: number;
    trustedPeers: number;
    threatsShared: number;
    threatsReceived: number;
  }> {
    const connected = Array.from(this.peers.values()).filter((p) => p.status === 'connected');
    const trusted = Array.from(this.peers.values()).filter((p) => p.trustedLevel === 'trusted');
    const shared = Array.from(this.sharedThreats.values()).filter((t) => t.sharedBy === this.getDeviceIdentifier());
    const received = Array.from(this.sharedThreats.values()).filter((t) => t.sharedBy !== this.getDeviceIdentifier());

    return {
      totalPeers: this.peers.size,
      connectedPeers: connected.length,
      trustedPeers: trusted.length,
      threatsShared: shared.length,
      threatsReceived: received.length,
    };
  }

  private async sendToPeer(peer: PeerConnection, threatShare: ThreatShare): Promise<void> {
    // In production, establish encrypted connection and send data
    console.log(`Sending threat share to ${peer.deviceName}`);
    // Would use TLS socket connection here
  }

  private async verifyThreatShare(threatShare: ThreatShare): Promise<boolean> {
    // Verify threat share signature using peer's public key
    // In production, use proper PKI
    const peer = this.peers.get(threatShare.sharedBy);
    if (!peer || peer.trustedLevel === 'blocked') {
      return false;
    }

    return true;
  }

  private getDeviceIdentifier(): string {
    // In production, get device's unique identifier
    return 'device-' + crypto.randomBytes(16).toString('hex').substr(0, 12);
  }

  private generateShareId(): string {
    return `share-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }
}

export const peerSharing = new PeerSharingService();
