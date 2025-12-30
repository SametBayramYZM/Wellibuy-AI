import crypto from 'crypto';

/**
 * 🔐 Webhook Signature Verification
 * 
 * Verify webhooks from Stripe, PayPal, etc.
 */

/**
 * Verify Stripe webhook signature
 */
export const verifyStripeWebhook = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    // Stripe uses their own signature verification
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return !!event;
  } catch (err) {
    console.error('Stripe webhook verification failed:', err);
    return false;
  }
};

/**
 * Verify PayPal webhook signature
 */
export const verifyPayPalWebhook = async (
  headers: any,
  body: any
): Promise<boolean> => {
  try {
    const axios = require('axios');
    
    const verifyUrl = process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com/v1/notifications/verify-webhook-signature'
      : 'https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature';

    const response = await axios.post(
      verifyUrl,
      {
        transmission_id: headers['paypal-transmission-id'],
        transmission_time: headers['paypal-transmission-time'],
        cert_url: headers['paypal-cert-url'],
        auth_algo: headers['paypal-auth-algo'],
        transmission_sig: headers['paypal-transmission-sig'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: body,
      },
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID || '',
          password: process.env.PAYPAL_SECRET || '',
        },
      }
    );

    return response.data.verification_status === 'SUCCESS';
  } catch (err) {
    console.error('PayPal webhook verification failed:', err);
    return false;
  }
};

/**
 * Verify generic HMAC webhook
 */
export const verifyHMACWebhook = (
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload)
      .digest('hex');

    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('HMAC webhook verification failed:', err);
    return false;
  }
};

/**
 * Middleware: Verify Stripe webhooks
 */
export const stripeWebhookMiddleware = (req: any, res: any, next: any) => {
  try {
    const signature = req.headers['stripe-signature'];
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Stripe signature',
      });
    }

    const isValid = verifyStripeWebhook(
      req.body,
      signature,
      secret
    );

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Stripe signature',
      });
    }

    next();
  } catch (err) {
    console.error('Stripe webhook middleware error:', err);
    res.status(500).json({
      success: false,
      message: 'Webhook verification failed',
    });
  }
};

/**
 * Middleware: Verify generic HMAC webhooks
 */
export const hmacWebhookMiddleware = (secret: string, headerName: string = 'x-signature') => {
  return (req: any, res: any, next: any) => {
    try {
      const signature = req.headers[headerName];
      
      if (!signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing webhook signature',
        });
      }

      const payload = JSON.stringify(req.body);
      const isValid = verifyHMACWebhook(payload, signature, secret);

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature',
        });
      }

      next();
    } catch (err) {
      console.error('HMAC webhook middleware error:', err);
      res.status(500).json({
        success: false,
        message: 'Webhook verification failed',
      });
    }
  };
};
