import axios from 'axios';
import geoip from 'geoip-lite';

/**
 * 🌍 Geolocation & VPN Detection Service
 * 
 * Country-based access control and suspicious network detection
 */

// Blocked countries (ISO 3166-1 alpha-2)
const BLOCKED_COUNTRIES = process.env.BLOCKED_COUNTRIES?.split(',') || [];

// Allowed countries (if set, only these are allowed)
const ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES?.split(',') || [];

/**
 * Get IP geolocation
 */
export const getIPLocation = (ipAddress: string): any => {
  try {
    const geo = geoip.lookup(ipAddress);
    return geo;
  } catch (err) {
    console.error('Geolocation lookup error:', err);
    return null;
  }
};

/**
 * Check if country is blocked
 */
export const isCountryBlocked = (countryCode: string): boolean => {
  if (ALLOWED_COUNTRIES.length > 0) {
    return !ALLOWED_COUNTRIES.includes(countryCode.toUpperCase());
  }

  return BLOCKED_COUNTRIES.includes(countryCode.toUpperCase());
};

/**
 * Detect VPN/Proxy using IPHub API
 */
export const detectVPN = async (ipAddress: string): Promise<{
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  confidence: number;
}> => {
  try {
    const apiKey = process.env.IPHUB_API_KEY;
    if (!apiKey) {
      return { isVPN: false, isProxy: false, isTor: false, confidence: 0 };
    }

    const response = await axios.get(`http://v2.api.iphub.info/ip/${ipAddress}`, {
      headers: {
        'X-Key': apiKey,
      },
      timeout: 5000,
    });

    const data = response.data;

    // Block values: 0 = Residential, 1 = VPN/Proxy, 2 = Commercial
    const isVPN = data.block === 1;
    const isProxy = data.block === 1;

    return {
      isVPN,
      isProxy,
      isTor: false,
      confidence: isVPN ? 90 : 10,
    };
  } catch (err) {
    console.error('VPN detection error:', err);
    return { isVPN: false, isProxy: false, isTor: false, confidence: 0 };
  }
};

/**
 * Detect VPN using IPQualityScore
 */
export const detectVPNAdvanced = async (ipAddress: string): Promise<{
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  isBot: boolean;
  fraudScore: number;
}> => {
  try {
    const apiKey = process.env.IPQUALITYSCORE_API_KEY;
    if (!apiKey) {
      return {
        isVPN: false,
        isProxy: false,
        isTor: false,
        isBot: false,
        fraudScore: 0,
      };
    }

    const response = await axios.get(
      `https://ipqualityscore.com/api/json/ip/${apiKey}/${ipAddress}`,
      {
        params: {
          strictness: 1,
        },
        timeout: 5000,
      }
    );

    const data = response.data;

    return {
      isVPN: data.vpn,
      isProxy: data.proxy,
      isTor: data.tor,
      isBot: data.bot_status,
      fraudScore: data.fraud_score,
    };
  } catch (err) {
    console.error('Advanced VPN detection error:', err);
    return {
      isVPN: false,
      isProxy: false,
      isTor: false,
      isBot: false,
      fraudScore: 0,
    };
  }
};

/**
 * Middleware: Block access from specific countries
 */
export const geolocationFilter = (req: any, res: any, next: any) => {
  try {
    const ipAddress = req.ip;
    const geo = getIPLocation(ipAddress);

    if (!geo) {
      // Allow if geolocation fails
      return next();
    }

    if (isCountryBlocked(geo.country)) {
      console.warn(`🚫 Blocked access from ${geo.country}: ${ipAddress}`);
      return res.status(403).json({
        success: false,
        message: 'Access not allowed from your location',
      });
    }

    // Attach geolocation to request
    req.geolocation = {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      timezone: geo.timezone,
    };

    next();
  } catch (err) {
    console.error('Geolocation filter error:', err);
    next(); // Continue on error
  }
};

/**
 * Middleware: Block VPNs and proxies
 */
export const vpnFilter = async (req: any, res: any, next: any) => {
  try {
    const ipAddress = req.ip;

    // Skip localhost
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
      return next();
    }

    const vpnCheck = await detectVPNAdvanced(ipAddress);

    if (vpnCheck.isVPN || vpnCheck.isProxy) {
      console.warn(`🛡️  VPN/Proxy detected: ${ipAddress}`);
      return res.status(403).json({
        success: false,
        message: 'VPN and proxy connections are not allowed',
      });
    }

    if (vpnCheck.isTor) {
      console.warn(`🧅 Tor detected: ${ipAddress}`);
      return res.status(403).json({
        success: false,
        message: 'Tor connections are not allowed',
      });
    }

    next();
  } catch (err) {
    console.error('VPN filter error:', err);
    next(); // Continue on error
  }
};
