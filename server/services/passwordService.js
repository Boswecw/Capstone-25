import bcrypt from 'bcryptjs';
import crypto from 'crypto';

class PasswordService {
  constructor() {
    this.saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.minPasswordLength = 8;
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(this.saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return { hash, salt, saltRounds: this.saltRounds };
  }

  async comparePasswords(inputPassword, storedHash) {
    return await bcrypt.compare(inputPassword, storedHash);
  }

  generateResetToken() {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return {
      token: rawToken,
      hashedToken,
      expiresIn: Date.now() + 10 * 60 * 1000
    };
  }
}

// ✅ Assign before export to satisfy ESLint
const passwordService = new PasswordService();
export default passwordService;
