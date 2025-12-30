# 🔐 DATABASE ENCRYPTION GUIDE

## Overview

This guide covers field-level encryption for the Wellibuy database to protect sensitive user information and maintain PCI-DSS compliance for credit card data.

**Encryption Standard:** AES-256-CBC

---

## Environment Setup

### 1. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This generates a 64-character hex string (32 bytes). Add to `.env`:

```env
ENCRYPTION_KEY=your-64-character-hex-string
```

### 2. Install Dependencies

```bash
npm install crypto
```

The `crypto` module is built-in to Node.js, no additional installation needed.

---

## Implementation

### Encryption Utility

Create `server/utils/encryption.ts`:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// Validate key length
if (ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypt plaintext
 */
export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV:Encrypted (IV needed for decryption)
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt ciphertext
 */
export const decrypt = (ciphertext: string): string => {
  const parts = ciphertext.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid ciphertext format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = Buffer.from(parts[1], 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Middleware: Add encryption context
 */
export const encryptionMiddleware = (req: any, res: any, next: any) => {
  req.encrypt = encrypt;
  req.decrypt = decrypt;
  next();
};
```

### Usage in Models

#### Option 1: Mongoose Pre-Hooks (Recommended)

```typescript
import { encrypt, decrypt } from '../utils/encryption';

const userSchema = new Schema({
  email: String,
  phone: String,
  ssn: String,
});

// Encrypt before saving
userSchema.pre('save', function(next) {
  if (this.isModified('phone')) {
    this.phone = encrypt(this.phone);
  }
  if (this.isModified('ssn')) {
    this.ssn = encrypt(this.ssn);
  }
  next();
});

// Decrypt after retrieving
userSchema.post('findOne', function(doc) {
  if (doc && doc.phone) doc.phone = decrypt(doc.phone);
  if (doc && doc.ssn) doc.ssn = decrypt(doc.ssn);
});

userSchema.post('find', function(docs) {
  docs.forEach((doc) => {
    if (doc.phone) doc.phone = decrypt(doc.phone);
    if (doc.ssn) doc.ssn = decrypt(doc.ssn);
  });
});
```

#### Option 2: Custom Getter/Setter

```typescript
const userSchema = new Schema({
  phone: {
    type: String,
    set: (value) => value ? encrypt(value) : value,
    get: (value) => value ? decrypt(value) : value,
  },
  ssn: {
    type: String,
    set: (value) => value ? encrypt(value) : value,
    get: (value) => value ? decrypt(value) : value,
  },
});

// Must enable getters
const User = mongoose.model('User', userSchema);
const user = await User.findById(id).lean(false); // lean(false) to apply getters
```

#### Option 3: Explicit Encryption/Decryption

```typescript
import { encrypt, decrypt } from '../utils/encryption';

// Before saving
user.phone = encrypt(user.phone);
user.ssn = encrypt(user.ssn);
await user.save();

// After retrieving
user.phone = decrypt(user.phone);
user.ssn = decrypt(user.ssn);
```

---

## Protected Fields

### User Model

```typescript
interface ProtectedFields {
  // Identity
  phone: string;              // Personal phone number
  socialSecurityNumber: string; // SSN or equivalent

  // Payment
  paymentMethods: [{
    cardNumber: string;       // Credit card number (store tokenized)
    cvv: string;              // CVV (never store)
    bankAccount: string;      // Bank account number
  }];

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Sensitive
  lastFourSSN: string;        // Last 4 digits only
  dateOfBirth: Date;          // Can be encrypted if needed
  emergencyContact: string;   // Contact info
}
```

### Product Model

```typescript
interface ProtectedProductFields {
  // Supplier information
  supplierContact: string;
  supplierPhone: string;
  supplierBankAccount: string;

  // Pricing (if sensitive)
  supplierCost: number;
  wholesalePrice: number;

  // Custom specifications
  internalNotes: string;
}
```

---

## PCI-DSS Compliance

### Credit Card Storage

**NEVER store full credit card numbers:**

```typescript
// ❌ WRONG - Don't do this
const cardNumber = "4532-1234-5678-9010";
const encrypted = encrypt(cardNumber);
user.paymentMethods.push({ cardNumber: encrypted });

// ✅ RIGHT - Use tokenization
const cardToken = await stripeAPI.createToken(cardNumber);
user.paymentMethods.push({ 
  cardToken: cardToken.id,
  lastFour: "9010",
  brand: "Visa"
});
```

### Search on Encrypted Fields

Encrypted data cannot be searched directly. Solutions:

**Option 1: Store Plaintext Search Field**

```typescript
const userSchema = new Schema({
  email: {
    type: String,
    index: true,
    required: true
  },
  phone: {
    type: String,
    set: (value) => encrypt(value),
    get: (value) => decrypt(value)
  },
  phoneHash: {
    type: String,
    index: true,
    set: (value) => crypto.createHash('sha256').update(value).digest('hex')
  }
});

// Search by hash
const user = await User.findOne({ 
  phoneHash: crypto.createHash('sha256').update(phone).digest('hex')
});
```

**Option 2: Deterministic Encryption**

For predictable encryption on same value:

```typescript
const deterministicEncrypt = (plaintext: string): string => {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

// Same plaintext always produces same ciphertext
const encrypted1 = deterministicEncrypt("John");
const encrypted2 = deterministicEncrypt("John");
assert(encrypted1 === encrypted2); // true

// Can be indexed and searched
const user = await User.findOne({ 
  encryptedName: deterministicEncrypt("John")
});
```

⚠️ **Warning:** Deterministic encryption is less secure (pattern analysis) but enables searching. Use only for non-sensitive fields.

---

## Performance Considerations

### 1. Encrypt Only Sensitive Data

```typescript
// ✅ Encrypt
- Phone numbers
- SSN/ID numbers
- Credit card tokens
- Bank account numbers
- Home addresses

// ❌ Don't encrypt
- Email (needed for login)
- Username
- Product names
- Public profile info
- Timestamps
```

### 2. Index Hashed Versions

```typescript
const userSchema = new Schema({
  phone: {
    type: String,
    set: (value) => encrypt(value),
    get: (value) => decrypt(value)
  },
  phoneHash: {
    type: String,
    index: true,
    unique: true,
    sparse: true,
    set: (value) => value ? 
      crypto.createHash('sha256').update(value).digest('hex') : null
  }
});
```

### 3. Cache Decrypted Values

For frequently accessed fields, cache in memory:

```typescript
class User {
  private _phone: string | null = null;

  get phone(): string | null {
    if (!this._phone && this.encryptedPhone) {
      this._phone = decrypt(this.encryptedPhone);
    }
    return this._phone;
  }

  set phone(value: string | null) {
    this._phone = value;
    this.encryptedPhone = value ? encrypt(value) : null;
  }
}
```

### 4. Batch Operations

```typescript
// ❌ Slow - Decrypts each record individually
const users = await User.find({});
users.forEach(user => {
  console.log(user.phone); // Decrypts on access
});

// ✅ Fast - Use lean() and decrypt in batch
const encrypted = await User.find({}).lean();
const batch = encrypted.map(doc => ({
  ...doc,
  phone: decrypt(doc.phone)
}));
```

---

## Key Rotation

### When to Rotate

- Quarterly (best practice)
- After employee departure
- After potential breach
- On version updates

### Rotation Process

```bash
# 1. Generate new key
NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Set in temporary env var
export NEW_ENCRYPTION_KEY=$NEW_KEY

# 3. Run migration script
node scripts/rotate-encryption-key.js

# 4. Update .env
echo "ENCRYPTION_KEY=$NEW_KEY" >> .env

# 5. Restart application
npm restart
```

### Migration Script

```typescript
// scripts/rotate-encryption-key.js
import User from '../models/User';
import { decrypt, encrypt } from '../utils/encryption';

const SENSITIVE_FIELDS = ['phone', 'ssn', 'address'];

const rotateKey = async () => {
  const users = await User.find({}).lean();
  const oldDecrypt = (encrypted) => {
    // Decrypt with old key
    const parts = encrypted.split(':');
    // ... use OLD_ENCRYPTION_KEY
  };

  for (const user of users) {
    const updated = {};
    
    for (const field of SENSITIVE_FIELDS) {
      if (user[field]) {
        const decrypted = oldDecrypt(user[field]);
        updated[field] = encrypt(decrypted); // Encrypt with new key
      }
    }

    await User.findByIdAndUpdate(user._id, updated);
  }

  console.log(`✅ Rotated ${users.length} records`);
};

rotateKey().then(() => process.exit(0));
```

---

## Backup & Recovery

### Encrypted Backups

```bash
# Backup MongoDB
mongodump --out ./backup

# Backup encryption key separately
echo $ENCRYPTION_KEY > ./backup/.encryption_key

# Encrypt backup with GPG
gpg --encrypt --recipient security@wellibuy.com ./backup
```

### Recovery

```bash
# Decrypt backup
gpg --decrypt ./backup.gpg > ./backup

# Restore MongoDB
mongorestore ./backup

# Ensure ENCRYPTION_KEY in .env matches backup key
```

### Secure Key Storage

**In Production:**

```
AWS Secrets Manager
├── ENCRYPTION_KEY (rotate quarterly)
├── JWT_SECRET (rotate quarterly)
└── DATABASE_PASSWORD (rotate quarterly)

HashiCorp Vault
├── Encryption keys
├── Database credentials
└── API keys

Azure Key Vault
├── Encryption keys
├── Secrets
└── Certificates
```

**In Development:**

```bash
# .env.local (never commit)
ENCRYPTION_KEY=your-test-key-64-chars
```

---

## Testing

### Unit Tests

```typescript
import { encrypt, decrypt } from '../utils/encryption';

describe('Encryption', () => {
  test('encrypt and decrypt', () => {
    const plaintext = 'sensitive-data';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  test('different encryption each time', () => {
    const plaintext = 'same-data';
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2); // Different IVs
  });

  test('invalid ciphertext throws error', () => {
    expect(() => decrypt('invalid')).toThrow();
  });
});
```

### Integration Tests

```typescript
test('user phone encrypted in database', async () => {
  const user = new User({ phone: '555-1234' });
  await user.save();

  const raw = await db.collection('users').findOne({ _id: user._id });
  expect(raw.phone).toContain(':'); // IV:Encrypted format
  expect(raw.phone).not.toBe('555-1234'); // Not plaintext
});
```

---

## Compliance Checklist

- [ ] Encryption key is 32 bytes (64 hex chars)
- [ ] Encryption key stored in environment variable
- [ ] Encryption key never committed to git
- [ ] AES-256-CBC algorithm used
- [ ] Random IVs generated for each encryption
- [ ] Credit card numbers tokenized, never stored
- [ ] CVV never stored
- [ ] Encrypted fields indexed with hashes
- [ ] Key rotation process documented
- [ ] Backups encrypted separately
- [ ] Decryption performance monitored
- [ ] Audit logging on sensitive field access
- [ ] PCI-DSS compliance verified

---

## References

- [OWASP Encryption Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Encryption_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [PCI-DSS Requirements](https://www.pcisecuritystandards.org/)
- [AES-256 Wikipedia](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)

---

**Last Updated:** January 2024
**Version:** 1.0
**Status:** Production Ready
