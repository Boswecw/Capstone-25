// server/services/passwordService.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class PasswordService {
  constructor() {
    // Configuration
    this.saltRounds = process.env.NODE_ENV === 'production' ? 14 : 12;
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 30 * 60 * 1000; // 30 minutes
    this.minPasswordLength = 8;
  }

  /**
   * Hash a password with salt
   * @param {string} password - Plain text password
   * @returns {Promise<{hash: string, salt: string}>}
   */
  async hashPassword(password) {
    try {
      console.log('🔐 Generating salt and hashing password...');
      
      // Generate salt
      const salt = await bcrypt.genSalt(this.saltRounds);
      
      // Hash password
      const hash = await bcrypt.hash(password, salt);
      
      console.log('✅ Password hashed successfully');
      console.log(`   Salt rounds: ${this.saltRounds}`);
      console.log(`   Salt: ${salt.substring(0, 10)}...`);
      console.log(`   Hash: ${hash.substring(0, 10)}...`);
      
      return {
        hash,
        salt,
        saltRounds: this.saltRounds
      };
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare password with hash
   * @param {string} password - Plain text password
   * @param {string} hash - Stored password hash
   * @returns {Promise<boolean>}
   */
  async comparePassword(password, hash) {
    try {
      console.log('🔍 Comparing password with stored hash...');
      const isMatch = await bcrypt.compare(password, hash);
      console.log(`${isMatch ? '✅' : '❌'} Password comparison result: ${isMatch}`);
      return isMatch;
    } catch (error) {
      console.error('❌ Password comparison failed:', error);
      throw new Error('Password comparison failed');
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePasswordStrength(password) {
    const validations = {
      minLength: password.length >= this.minPasswordLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      noSpaces: !/\s/.test(password),
      noCommonPatterns: !this.hasCommonPatterns(password)
    };

    const errors = [];
    const suggestions = [];

    if (!validations.minLength) {
      errors.push(`Password must be at least ${this.minPasswordLength} characters long`);
      suggestions.push('Add more characters to increase length');
    }

    if (!validations.hasUppercase) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
      suggestions.push('Add uppercase letters like A, B, C');
    }

    if (!validations.hasLowercase) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
      suggestions.push('Add lowercase letters like a, b, c');
    }

    if (!validations.hasNumber) {
      errors.push('Password must contain at least one number (0-9)');
      suggestions.push('Add numbers like 1, 2, 3');
    }

    if (!validations.hasSpecialChar) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
      suggestions.push('Add special characters like !, @, #, $');
    }

    if (!validations.noSpaces) {
      errors.push('Password cannot contain spaces');
      suggestions.push('Remove any spaces from your password');
    }

    if (!validations.noCommonPatterns) {
      errors.push('Password contains common patterns that are easy to guess');
      suggestions.push('Avoid common patterns like "123", "abc", or "password"');
    }

    const strength = this.calculatePasswordStrength(password, validations);
    const isValid = errors.length === 0;

    return {
      isValid,
      strength,
      score: this.getStrengthScore(password),
      errors,
      suggestions,
      validations,
      recommendations: this.getPasswordRecommendations(password)
    };
  }

  /**
   * Calculate password strength
   * @param {string} password 
   * @param {Object} validations 
   * @returns {string}
   */
  calculatePasswordStrength(password, validations) {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (password.length >= 20) score += 1;

    // Character variety scoring
    if (validations.hasLowercase) score += 1;
    if (validations.hasUppercase) score += 1;
    if (validations.hasNumber) score += 1;
    if (validations.hasSpecialChar) score += 1;

    // Complexity bonus
    if (validations.noCommonPatterns) score += 1;
    if (this.hasGoodEntropy(password)) score += 1;

    // Determine strength
    if (score <= 2) return 'very_weak';
    if (score <= 4) return 'weak';
    if (score <= 6) return 'medium';
    if (score <= 8) return 'strong';
    return 'very_strong';
  }

  /**
   * Get numerical strength score (0-100)
   * @param {string} password 
   * @returns {number}
   */
  getStrengthScore(password) {
    let score = 0;

    // Length (up to 30 points)
    score += Math.min(password.length * 2, 30);

    // Character variety (40 points total)
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

    // Complexity bonuses (30 points total)
    if (password.length >= 12) score += 10;
    if (!this.hasCommonPatterns(password)) score += 10;
    if (this.hasGoodEntropy(password)) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Check for common password patterns
   * @param {string} password 
   * @returns {boolean}
   */
  hasCommonPatterns(password) {
    const commonPatterns = [
      /123/,
      /abc/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /login/i,
      /user/i,
      /test/i,
      /demo/i,
      /guest/i,
      /welcome/i,
      /123456/,
      /111111/,
      /000000/,
      /aaaaaa/,
      /(.)\1{2,}/ // Repeated characters (3+ times)
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Check if password has good entropy (randomness)
   * @param {string} password 
   * @returns {boolean}
   */
  hasGoodEntropy(password) {
    // Check for good character distribution
    const charCounts = {};
    for (let char of password) {
      charCounts[char] = (charCounts[char] || 0) + 1;
    }

    // Calculate entropy
    const length = password.length;
    let entropy = 0;

    for (let count of Object.values(charCounts)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    // Good entropy threshold (adjust as needed)
    return entropy > 3.5;
  }

  /**
   * Get password recommendations
   * @param {string} password 
   * @returns {Array}
   */
  getPasswordRecommendations(password) {
    const recommendations = [];

    if (password.length < 12) {
      recommendations.push('Consider using at least 12 characters for better security');
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      recommendations.push('Mix uppercase and lowercase letters');
    }

    if (!/\d.*\d/.test(password)) {
      recommendations.push('Use multiple numbers for added complexity');
    }

    if (!/[!@#$%^&*(),.?":{}|<>].*[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      recommendations.push('Include multiple special characters');
    }

    if (this.hasCommonPatterns(password)) {
      recommendations.push('Avoid common patterns and dictionary words');
    }

    if (!this.hasGoodEntropy(password)) {
      recommendations.push('Make your password more random and unpredictable');
    }

    return recommendations;
  }

  /**
   * Generate a secure random password
   * @param {number} length - Password length (default: 16)
   * @param {Object} options - Generation options
   * @returns {string}
   */
  generateSecurePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true,
      excludeAmbiguous = true
    } = options;

    let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let lowercase = 'abcdefghijklmnopqrstuvwxyz';
    let numbers = '0123456789';
    let specialChars = '!@#$%^&*(),.?":{}|<>';

    // Exclude similar looking characters if requested
    if (excludeSimilar) {
      uppercase = uppercase.replace(/[O]/g, '');
      lowercase = lowercase.replace(/[ol]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      specialChars = specialChars.replace(/[|]/g, '');
    }

    // Exclude ambiguous characters if requested
    if (excludeAmbiguous) {
      uppercase = uppercase.replace(/[IO]/g, '');
      lowercase = lowercase.replace(/[l]/g, '');
      numbers = numbers.replace(/[01]/g, '');
      specialChars = specialChars.replace(/["'`]/g, '');
    }

    let allChars = '';
    const required = [];

    if (includeUppercase) {
      allChars += uppercase;
      required.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    }

    if (includeLowercase) {
      allChars += lowercase;
      required.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    }

    if (includeNumbers) {
      allChars += numbers;
      required.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }

    if (includeSpecialChars) {
      allChars += specialChars;
      required.push(specialChars[Math.floor(Math.random() * specialChars.length)]);
    }

    // Fill remaining length with random characters
    const remaining = length - required.length;
    for (let i = 0; i < remaining; i++) {
      required.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Shuffle the password to randomize position of required characters
    return required.sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate multiple password suggestions
   * @param {number} count - Number of passwords to generate
   * @param {number} length - Password length
   * @returns {Array}
   */
  generatePasswordSuggestions(count = 3, length = 16) {
    const suggestions = [];
    for (let i = 0; i < count; i++) {
      suggestions.push({
        password: this.generateSecurePassword(length),
        strength: 'very_strong',
        score: 100
      });
    }
    return suggestions;
  }

  /**
   * Create a password hash for storage (static method for direct use)
   * @param {string} password 
   * @returns {Promise<string>}
   */
  static async createHash(password) {
    const service = new PasswordService();
    const result = await service.hashPassword(password);
    return result.hash;
  }

  /**
   * Verify a password against a hash (static method for direct use)
   * @param {string} password 
   * @param {string} hash 
   * @returns {Promise<boolean>}
   */
  static async verifyPassword(password, hash) {
    const service = new PasswordService();
    return await service.comparePassword(password, hash);
  }
}

module.exports = PasswordService;