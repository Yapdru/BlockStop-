import { query } from '@/lib/db';

export interface VPNProvider {
  id: number;
  name: string;
  logoUrl: string;
  serverCount: number;
  tier: 'free' | 'pro';
  isActive: boolean;
}

export class VPNManager {
  // Free tier VPNs (5 options)
  private freeVPNs: Omit<VPNProvider, 'id' | 'isActive'>[] = [
    { name: 'ProtonVPN', serverCount: 4500, logoUrl: '/vpn/protonvpn.png', tier: 'free' },
    { name: 'Windscribe', serverCount: 110, logoUrl: '/vpn/windscribe.png', tier: 'free' },
    { name: 'TunnelBear', serverCount: 3000, logoUrl: '/vpn/tunnelbear.png', tier: 'free' },
    { name: 'Hide.me', serverCount: 2700, logoUrl: '/vpn/hideme.png', tier: 'free' },
    { name: 'Hotspot Shield', serverCount: 3200, logoUrl: '/vpn/hotspotshield.png', tier: 'free' },
  ];

  // Pro tier VPNs (100+ options)
  private proVPNs: Omit<VPNProvider, 'id' | 'isActive'>[] = [
    { name: 'ExpressVPN', serverCount: 3000, logoUrl: '/vpn/expressvpn.png', tier: 'pro' },
    { name: 'NordVPN', serverCount: 6000, logoUrl: '/vpn/nordvpn.png', tier: 'pro' },
    { name: 'Surfshark', serverCount: 3200, logoUrl: '/vpn/surfshark.png', tier: 'pro' },
    { name: 'ProtonVPN', serverCount: 4500, logoUrl: '/vpn/protonvpn.png', tier: 'pro' },
    { name: 'Windscribe', serverCount: 110, logoUrl: '/vpn/windscribe.png', tier: 'pro' },
    { name: 'TunnelBear', serverCount: 3000, logoUrl: '/vpn/tunnelbear.png', tier: 'pro' },
    { name: 'Hide.me', serverCount: 2700, logoUrl: '/vpn/hideme.png', tier: 'pro' },
    { name: 'Hotspot Shield', serverCount: 3200, logoUrl: '/vpn/hotspotshield.png', tier: 'pro' },
    { name: 'CyberGhost', serverCount: 11500, logoUrl: '/vpn/cyberghost.png', tier: 'pro' },
    { name: 'Private Internet Access', serverCount: 37000, logoUrl: '/vpn/pia.png', tier: 'pro' },
    { name: 'Mullvad', serverCount: 940, logoUrl: '/vpn/mullvad.png', tier: 'pro' },
    { name: 'IVPN', serverCount: 300, logoUrl: '/vpn/ivpn.png', tier: 'pro' },
    { name: 'Proton VPN Plus', serverCount: 9000, logoUrl: '/vpn/protonvpnplus.png', tier: 'pro' },
    { name: 'Bitdefender Premium VPN', serverCount: 2500, logoUrl: '/vpn/bitdefender.png', tier: 'pro' },
    { name: 'Norton Secure VPN', serverCount: 4000, logoUrl: '/vpn/norton.png', tier: 'pro' },
  ];

  async getAvailableVPNs(userTier: 'free' | 'pro'): Promise<VPNProvider[]> {
    const vpns = userTier === 'pro' ? this.proVPNs : this.freeVPNs;

    // Check if VPNs are cached in database
    const cachedVpns = await query(
      `SELECT * FROM vpn_providers WHERE tier = $1 AND is_active = true`,
      [userTier]
    );

    if (cachedVpns.rows.length > 0) {
      return cachedVpns.rows;
    }

    // Initialize VPNs in database if not exists
    for (const vpn of vpns) {
      await query(
        `INSERT INTO vpn_providers (name, logo_url, server_count, tier, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (name) DO NOTHING`,
        [vpn.name, vpn.logoUrl, vpn.serverCount, userTier]
      );
    }

    return vpns.map((vpn, idx) => ({
      id: idx + 1,
      ...vpn,
      isActive: true,
    }));
  }

  async setUserVPNPreference(userId: number, vpnId: number): Promise<void> {
    // Check if VPN exists
    const vpnCheck = await query(
      'SELECT id FROM vpn_providers WHERE id = $1',
      [vpnId]
    );

    if (vpnCheck.rows.length === 0) {
      throw new Error('VPN provider not found');
    }

    // Check if preference exists
    const existingPref = await query(
      'SELECT id FROM user_vpn_preferences WHERE user_id = $1 AND vpn_id = $2',
      [userId, vpnId]
    );

    if (existingPref.rows.length > 0) {
      return; // Already set
    }

    // Add preference
    await query(
      `INSERT INTO user_vpn_preferences (user_id, vpn_id, is_enabled)
       VALUES ($1, $2, true)`,
      [userId, vpnId]
    );
  }

  async getUserVPNPreferences(userId: number): Promise<VPNProvider[]> {
    const result = await query(
      `SELECT vp.* FROM vpn_providers vp
       JOIN user_vpn_preferences uvp ON vp.id = uvp.vpn_id
       WHERE uvp.user_id = $1 AND uvp.is_enabled = true`,
      [userId]
    );

    return result.rows;
  }

  async getVPNStatus(_vpnId: number): Promise<{
    status: string;
    latency: number;
    isSecure: boolean;
  }> {
    // In real implementation, this would check actual VPN status
    return {
      status: 'online',
      latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
      isSecure: true,
    };
  }

  async checkVPNSecurity(_vpnId: number): Promise<{
    isSecure: boolean;
    leakRisk: number;
    encryptionLevel: string;
    recommendations: string[];
  }> {
    // In real implementation, this would check VPN security details
    return {
      isSecure: true,
      leakRisk: 0.5, // percentage
      encryptionLevel: 'AES-256',
      recommendations: [
        'Enable kill switch',
        'Disable IPv6 leak protection',
      ],
    };
  }

  async recommendVPN(userTier: 'free' | 'pro'): Promise<VPNProvider> {
    const vpns = await this.getAvailableVPNs(userTier);
    return vpns[Math.floor(Math.random() * vpns.length)];
  }
}

export const vpnManager = new VPNManager();
