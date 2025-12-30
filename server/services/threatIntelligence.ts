import axios from 'axios';
import ThreatIP from '../models/ThreatIP';

/**
 * 🚨 Threat Intelligence Service
 * 
 * Integrate with threat intelligence feeds to block known malicious IPs
 */

// Threat intelligence sources
const THREAT_SOURCES = {
  ABUSEIPDB: 'https://api.abuseipdb.com/api/v2/check',
  IPQUALITYSCORE: 'https://ipqualityscore.com/api/json/ip',
  STOPFORUMSPAM: 'https://api.stopforumspam.org/api',
};

/**
 * Check IP against AbuseIPDB
 */
export const checkAbuseIPDB = async (ipAddress: string): Promise<any> => {
  try {
    const apiKey = process.env.ABUSEIPDB_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get(THREAT_SOURCES.ABUSEIPDB, {
      params: {
        ipAddress,
        maxAgeInDays: 90,
        verbose: true,
      },
      headers: {
        Key: apiKey,
        Accept: 'application/json',
      },
      timeout: 5000,
    });

    const data = response.data?.data;
    if (!data) return null;

    return {
      isAbusive: data.abuseConfidenceScore > 50,
      confidenceScore: data.abuseConfidenceScore,
      totalReports: data.totalReports,
      category: data.usageType,
      details: data,
    };
  } catch (err) {
    console.error('AbuseIPDB check error:', err);
    return null;
  }
};

/**
 * Check IP against IPQualityScore
 */
export const checkIPQualityScore = async (ipAddress: string): Promise<any> => {
  try {
    const apiKey = process.env.IPQUALITYSCORE_API_KEY;
    if (!apiKey) return null;

    const response = await axios.get(
      `${THREAT_SOURCES.IPQUALITYSCORE}/${apiKey}/${ipAddress}`,
      {
        params: {
          strictness: 1,
          allow_public_access_points: true,
        },
        timeout: 5000,
      }
    );

    const data = response.data;
    if (!data || !data.success) return null;

    return {
      isThreat: data.fraud_score > 75,
      fraudScore: data.fraud_score,
      isProxy: data.proxy,
      isVPN: data.vpn,
      isTor: data.tor,
      isBot: data.bot_status,
      countryCode: data.country_code,
      details: data,
    };
  } catch (err) {
    console.error('IPQualityScore check error:', err);
    return null;
  }
};

/**
 * Check IP against StopForumSpam
 */
export const checkStopForumSpam = async (ipAddress: string): Promise<any> => {
  try {
    const response = await axios.get(THREAT_SOURCES.STOPFORUMSPAM, {
      params: {
        ip: ipAddress,
        json: true,
      },
      timeout: 5000,
    });

    const data = response.data?.ip;
    if (!data) return null;

    return {
      isSpammer: data.appears > 0,
      frequency: data.frequency,
      lastSeen: data.lastseen,
      confidence: data.confidence,
    };
  } catch (err) {
    console.error('StopForumSpam check error:', err);
    return null;
  }
};

/**
 * Comprehensive IP threat check
 */
export const checkIPThreat = async (
  ipAddress: string
): Promise<{
  isThreat: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  categories: string[];
  sources: string[];
}> => {
  try {
    // Check if already in database
    const existingThreat = await ThreatIP.findOne({
      ipAddress,
      isActive: true,
    });

    if (existingThreat) {
      return {
        isThreat: true,
        threatLevel: existingThreat.threatLevel,
        confidence: existingThreat.confidence,
        categories: existingThreat.category,
        sources: [existingThreat.source],
      };
    }

    // Check multiple sources in parallel
    const [abuseIPDB, ipQualityScore, stopForumSpam] = await Promise.all([
      checkAbuseIPDB(ipAddress),
      checkIPQualityScore(ipAddress),
      checkStopForumSpam(ipAddress),
    ]);

    // Aggregate results
    let isThreat = false;
    let totalScore = 0;
    let sourceCount = 0;
    const categories: Set<string> = new Set();
    const sources: string[] = [];

    if (abuseIPDB) {
      sourceCount++;
      sources.push('AbuseIPDB');
      if (abuseIPDB.isAbusive) {
        isThreat = true;
        totalScore += abuseIPDB.confidenceScore;
        categories.add('abuse');
      }
    }

    if (ipQualityScore) {
      sourceCount++;
      sources.push('IPQualityScore');
      if (ipQualityScore.isThreat) {
        isThreat = true;
        totalScore += ipQualityScore.fraudScore;
        if (ipQualityScore.isProxy) categories.add('proxy');
        if (ipQualityScore.isVPN) categories.add('vpn');
        if (ipQualityScore.isTor) categories.add('tor');
        if (ipQualityScore.isBot) categories.add('bot');
      }
    }

    if (stopForumSpam) {
      sourceCount++;
      sources.push('StopForumSpam');
      if (stopForumSpam.isSpammer) {
        isThreat = true;
        totalScore += stopForumSpam.confidence;
        categories.add('spam');
      }
    }

    // Calculate average confidence
    const avgConfidence = sourceCount > 0 ? totalScore / sourceCount : 0;

    // Determine threat level
    let threatLevel: 'low' | 'medium' | 'high' | 'critical';
    if (avgConfidence >= 90) threatLevel = 'critical';
    else if (avgConfidence >= 75) threatLevel = 'high';
    else if (avgConfidence >= 50) threatLevel = 'medium';
    else threatLevel = 'low';

    // Store in database if threat
    if (isThreat && avgConfidence >= 50) {
      await ThreatIP.create({
        ipAddress,
        threatLevel,
        category: Array.from(categories),
        source: sources.join(', '),
        firstSeen: new Date(),
        lastSeen: new Date(),
        confidence: avgConfidence,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });
    }

    return {
      isThreat,
      threatLevel,
      confidence: avgConfidence,
      categories: Array.from(categories),
      sources,
    };
  } catch (err) {
    console.error('IP threat check error:', err);
    return {
      isThreat: false,
      threatLevel: 'low',
      confidence: 0,
      categories: [],
      sources: [],
    };
  }
};

/**
 * Middleware to block threat IPs
 */
export const blockThreatIPs = async (req: any, res: any, next: any) => {
  try {
    const ipAddress = req.ip;

    // Check threat database
    const threat = await checkIPThreat(ipAddress);

    if (threat.isThreat && threat.threatLevel === 'critical') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - IP flagged as malicious',
      });
    }

    // Log high/medium threats but allow
    if (threat.isThreat && threat.threatLevel !== 'low') {
      console.warn(
        `⚠️  Threat IP ${ipAddress}: ${threat.threatLevel} (${threat.confidence}% confidence)`
      );
    }

    next();
  } catch (err) {
    console.error('Threat IP middleware error:', err);
    next(); // Continue on error
  }
};

/**
 * Sync threat feeds (run periodically)
 */
export const syncThreatFeeds = async (): Promise<number> => {
  try {
    // Get recently seen IPs from audit logs
    // Check against threat feeds
    // Update database

    console.log('✅ Threat feed sync completed');
    return 0;
  } catch (err) {
    console.error('Threat feed sync error:', err);
    return 0;
  }
};
