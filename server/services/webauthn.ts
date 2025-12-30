/**
 * 🔐 WebAuthn / FIDO2 Implementation
 * 
 * Security key and biometric authentication
 */

import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import WebAuthnCredential from '../models/WebAuthnCredential';
import User from '../models/User';

const RP_NAME = 'Wellibuy';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Generate registration options for new security key
 */
export const generateRegistration = async (
  userId: string,
  email: string
): Promise<any> => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Get existing credentials
    const credentials = await WebAuthnCredential.find({ userId });

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId,
      userName: email,
      attestationType: 'none',
      excludeCredentials: credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, 'base64'),
        type: 'public-key',
        transports: cred.transports as any,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'cross-platform',
      },
    });

    // Store challenge in session
    return {
      options,
      challenge: options.challenge,
    };
  } catch (err) {
    console.error('Generate registration error:', err);
    throw err;
  }
};

/**
 * Verify registration response and save credential
 */
export const verifyRegistration = async (
  userId: string,
  response: any,
  expectedChallenge: string
): Promise<{ verified: boolean; credentialId?: string }> => {
  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { verified: false };
    }

    const { credentialPublicKey, credentialID, counter } =
      verification.registrationInfo;

    // Save credential
    const credential = await WebAuthnCredential.create({
      userId,
      credentialId: Buffer.from(credentialID).toString('base64'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
      deviceType: response.response.authenticatorAttachment || 'cross-platform',
      transports: response.response.transports || [],
      isBackupEligible: false,
      isBackedUp: false,
    });

    return {
      verified: true,
      credentialId: credential.credentialId,
    };
  } catch (err) {
    console.error('Verify registration error:', err);
    return { verified: false };
  }
};

/**
 * Generate authentication options
 */
export const generateAuthentication = async (
  userId?: string
): Promise<any> => {
  try {
    let allowCredentials: any[] = [];

    if (userId) {
      const credentials = await WebAuthnCredential.find({ userId });
      allowCredentials = credentials.map((cred) => ({
        id: Buffer.from(cred.credentialId, 'base64'),
        type: 'public-key',
        transports: cred.transports as any,
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'preferred',
    });

    return {
      options,
      challenge: options.challenge,
    };
  } catch (err) {
    console.error('Generate authentication error:', err);
    throw err;
  }
};

/**
 * Verify authentication response
 */
export const verifyAuthentication = async (
  response: any,
  expectedChallenge: string
): Promise<{
  verified: boolean;
  userId?: string;
}> => {
  try {
    // Find credential
    const credentialId = Buffer.from(response.id, 'base64url').toString('base64');
    const credential = await WebAuthnCredential.findOne({ credentialId });

    if (!credential) {
      return { verified: false };
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: Buffer.from(credential.credentialId, 'base64'),
        credentialPublicKey: Buffer.from(credential.publicKey, 'base64'),
        counter: credential.counter,
      },
    });

    if (!verification.verified) {
      return { verified: false };
    }

    // Update counter
    credential.counter = verification.authenticationInfo.newCounter;
    credential.lastUsedAt = new Date();
    await credential.save();

    return {
      verified: true,
      userId: credential.userId.toString(),
    };
  } catch (err) {
    console.error('Verify authentication error:', err);
    return { verified: false };
  }
};
