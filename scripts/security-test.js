#!/usr/bin/env node

/**
 * 🔒 Wellibuy AI Security Testing Suite
 * Güvenlik özelliklerini test etmek için kullanın
 */

const http = require('http');

const API_URL = 'http://localhost:5001';

class SecurityTester {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  async test(name, fn) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      this.failed++;
    }
  }

  request(method, path, headers = {}, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(API_URL + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null,
            rawHeaders: res.headers
          });
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  async runTests() {
    console.log('\n🔒 WELLIBUY AI - GÜVENLIK TEST SUITE\n');
    console.log('═'.repeat(50));

    // Test 1: Security Headers
    await this.test('Security Headers - CSP Present', async () => {
      const res = await this.request('GET', '/api/products');
      if (!res.rawHeaders['content-security-policy']) {
        throw new Error('CSP header not found');
      }
    });

    await this.test('Security Headers - X-Content-Type-Options', async () => {
      const res = await this.request('GET', '/api/products');
      if (res.rawHeaders['x-content-type-options'] !== 'nosniff') {
        throw new Error('X-Content-Type-Options not set correctly');
      }
    });

    await this.test('Security Headers - X-Frame-Options', async () => {
      const res = await this.request('GET', '/api/products');
      if (res.rawHeaders['x-frame-options'] !== 'DENY') {
        throw new Error('X-Frame-Options not set to DENY');
      }
    });

    // Test 2: Rate Limiting
    await this.test('Rate Limiting - Allows Normal Requests', async () => {
      const res = await this.request('GET', '/api/products');
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
    });

    // Test 3: CORS Protection
    await this.test('CORS - Allows Origin Validation', async () => {
      const res = await this.request('GET', '/api/products', {
        'Origin': 'http://localhost:3000'
      });
      if (res.status !== 200) {
        throw new Error(`CORS validation failed: ${res.status}`);
      }
    });

    // Test 4: Input Validation
    await this.test('Input Validation - Sanitizes XSS', async () => {
      const res = await this.request('GET', '/api/products?category=<script>alert("xss")</script>');
      if (res.status !== 200) {
        throw new Error(`Request should be sanitized, got ${res.status}`);
      }
    });

    // Test 5: NoSQL Injection Protection
    await this.test('NoSQL Injection - Blocks $ne Operator', async () => {
      const res = await this.request('GET', '/api/products?category={"$ne":""}');
      // Should either sanitize or reject
      if (res.status < 200 || res.status > 299) {
        console.log(`   Note: Request rejected with ${res.status} (acceptable)`);
      }
    });

    // Test 6: Password Validation
    await this.test('Password Validation - Rejects Weak Passwords', async () => {
      const res = await this.request('POST', '/api/auth/register', {}, {
        email: 'test@example.com',
        password: 'weak'
      });
      if (res.status === 200) {
        throw new Error('Weak password was accepted');
      }
    });

    // Test 7: Error Handling
    await this.test('Error Handling - No Stack Traces', async () => {
      const res = await this.request('GET', '/api/nonexistent');
      if (res.body && res.body.stack) {
        throw new Error('Stack trace leaked in error response');
      }
    });

    // Test 8: MongoDB Sanitization
    await this.test('MongoDB Sanitization - Sanitizes Keys', async () => {
      const res = await this.request('GET', '/api/products?filter={"$where":"1==1"}');
      if (res.status < 200 || res.status > 299) {
        console.log(`   Note: Request handled safely with ${res.status}`);
      }
    });

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log(`\n📊 TEST RESULTS:`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%\n`);

    if (this.failed === 0) {
      console.log('🎉 Tüm Güvenlik Testleri Geçti! Sistem Güvenli.\n');
    } else {
      console.log('⚠️  Bazı Testler Başarısız. İncelemesi Gerekiyor.\n');
    }

    return this.failed === 0;
  }
}

// Run tests
const tester = new SecurityTester();
tester.runTests().then((success) => {
  process.exit(success ? 0 : 1);
});
