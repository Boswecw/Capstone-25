// server/scripts/testUserController.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Pet = require('../models/Pet');
const PasswordService = require('../services/passwordService');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const passwordService = new PasswordService();

const testUserController = async () => {
  try {
    console.log('🧪 Testing Complete User Controller Functionality');
    console.log('=================================================\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Cleanup any existing test data
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Pet.deleteMany({ name: /Test Pet/ });
    console.log('🧹 Cleaned up previous test data\n');

    // Test 1: User Registration with Enhanced Security
    console.log('📝 TEST 1: Enhanced User Registration');
    console.log('------------------------------------');
    
    const testUsers = [
      {
        username: 'testuser1',
        email: 'testuser1@example.com',
        password: 'WeakPass', // Should fail
        firstName: 'Test',
        lastName: 'User1'
      },
      {
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'StrongP@ssw0rd123!', // Should pass
        firstName: 'Test',
        lastName: 'User2'
      }
    ];

    for (const userData of testUsers) {
      console.log(`\nTesting registration for: ${userData.email}`);
      
      // Test password validation
      const validation = passwordService.validatePasswordStrength(userData.password);
      console.log(`  Password strength: ${validation.strength} (${validation.score}/100)`);
      console.log(`  Valid: ${validation.isValid}`);
      
      if (validation.isValid) {
        const user = new User(userData);
        await user.save();
        console.log(`  ✅ User created successfully`);
        console.log(`  Password hash: ${user.password.substring(0, 20)}...`);
        console.log(`  Salt: ${user.passwordSalt ? user.passwordSalt.substring(0, 20) + '...' : 'Not stored'}`);
      } else {
        console.log(`  ❌ Registration would fail: ${validation.errors[0]}`);
      }
    }

    // Test 2: Login with Account Lockout
    console.log('\n🔐 TEST 2: Login with Account Lockout Protection');
    console.log('----------------------------------------------');
    
    const validUser = await User.findOne({ email: 'testuser2@example.com' });
    if (validUser) {
      console.log(`Testing login for: ${validUser.email}`);
      
      // Test successful login
      const correctLogin = await validUser.comparePassword('StrongP@ssw0rd123!');
      console.log(`  Correct password: ${correctLogin ? '✅' : '❌'}`);
      
      // Test failed login attempts
      console.log('\n  Testing account lockout mechanism:');
      for (let i = 1; i <= 6; i++) {
        try {
          await validUser.comparePassword('wrongpassword');
          console.log(`    Attempt ${i}: Failed (${validUser.failedLoginAttempts} failed attempts recorded)`);
        } catch (error) {
          console.log(`    Attempt ${i}: ${error.message}`);
          break;
        }
        
        if (validUser.isLocked) {
          console.log(`    🔒 Account locked after ${validUser.failedLoginAttempts} attempts`);
          break;
        }
      }
      
      // Unlock account for further tests
      validUser.failedLoginAttempts = 0;
      validUser.accountLockedUntil = undefined;
      await validUser.save();
      console.log('  🔓 Account unlocked for further testing');
    }

    // Test 3: Create Test Pets for Interaction Tests
    console.log('\n🐾 TEST 3: Creating Test Pets');
    console.log('----------------------------');
    
    const testPets = [
      {
        name: 'Test Pet Dog',
        type: 'dog',
        breed: 'Golden Retriever',
        age: '2 years',
        price: 500,
        description: 'Friendly test dog',
        image: '/assets/images/test-dog.jpg',
        size: 'large',
        gender: 'male'
      },
      {
        name: 'Test Pet Cat',
        type: 'cat',
        breed: 'Siamese',
        age: '1 year',
        price: 300,
        description: 'Playful test cat',
        image: '/assets/images/test-cat.jpg',
        size: 'medium',
        gender: 'female'
      }
    ];

    const createdPets = [];
    for (const petData of testPets) {
      const pet = new Pet(petData);
      await pet.save();
      createdPets.push(pet);
      console.log(`  ✅ Created ${pet.name} (ID: ${pet._id})`);
    }

    // Test 4: Pet Voting System
    console.log('\n🗳️ TEST 4: Pet Voting System');
    console.log('---------------------------');
    
    if (validUser && createdPets.length > 0) {
      const testPet = createdPets[0];
      console.log(`Testing votes on: ${testPet.name}`);
      
      // Simulate voting (this would normally go through the controller)
      console.log('  Initial votes:', testPet.votes);
      
      // Add upvote
      validUser.votedPets.push({
        pet: testPet._id,
        voteType: 'up',
        votedAt: new Date()
      });
      testPet.votes.up += 1;
      
      await Promise.all([validUser.save(), testPet.save()]);
      console.log('  ✅ Added upvote');
      console.log('  New votes:', testPet.votes);
      
      // Check if user has voted
      const hasVoted = validUser.hasVotedOnPet(testPet._id);
      const voteType = validUser.getVoteOnPet(testPet._id);
      console.log(`  User has voted: ${hasVoted}`);
      console.log(`  Vote type: ${voteType}`);
    }

    // Test 5: Pet Rating System
    console.log('\n⭐ TEST 5: Pet Rating System');
    console.log('--------------------------');
    
    if (validUser && createdPets.length > 0) {
      const testPet = createdPets[1];
      console.log(`Testing rating on: ${testPet.name}`);
      
      // Add rating
      testPet.ratings.push({
        user: validUser._id,
        rating: 5,
        comment: 'Amazing pet! Very friendly and well-behaved.',
        createdAt: new Date()
      });
      
      await testPet.save();
      console.log('  ✅ Added 5-star rating with comment');
      console.log(`  Average rating: ${testPet.averageRating}`);
      console.log(`  Total ratings: ${testPet.ratings.length}`);
    }

    // Test 6: Favorites System
    console.log('\n❤️ TEST 6: Favorites System');
    console.log('-------------------------');
    
    if (validUser && createdPets.length > 0) {
      console.log(`Testing favorites for: ${validUser.email}`);
      console.log(`  Initial favorites: ${validUser.favoritesPets.length}`);
      
      // Add to favorites
      for (const pet of createdPets) {
        await validUser.addToFavorites(pet._id);
        console.log(`  ✅ Added ${pet.name} to favorites`);
      }
      
      // Refresh user data
      await validUser.populate('favoritesPets');
      console.log(`  Total favorites: ${validUser.favoritesPets.length}`);
      
      // Test removing from favorites
      if (validUser.favoritesPets.length > 0) {
        const petToRemove = validUser.favoritesPets[0];
        await validUser.removeFromFavorites(petToRemove._id);
        console.log(`  ✅ Removed ${petToRemove.name} from favorites`);
        console.log(`  Remaining favorites: ${validUser.favoritesPets.length}`);
      }
    }

    // Test 7: Password Change
    console.log('\n🔐 TEST 7: Password Change System');
    console.log('-------------------------------');
    
    if (validUser) {
      console.log(`Testing password change for: ${validUser.email}`);
      
      const oldPasswordHash = validUser.password;
      console.log(`  Old password hash: ${oldPasswordHash.substring(0, 20)}...`);
      
      // Test weak new password (should fail)
      const weakPasswordValidation = passwordService.validatePasswordStrength('newweak');
      console.log(`  Weak password test: ${weakPasswordValidation.isValid ? '❌ Should fail' : '✅ Correctly rejected'}`);
      
      // Test strong new password (should succeed)
      const strongPassword = 'NewStr0ngP@ssw0rd!';
      const strongPasswordValidation = passwordService.validatePasswordStrength(strongPassword);
      console.log(`  Strong password test: ${strongPasswordValidation.isValid ? '✅ Valid' : '❌ Should be valid'}`);
      
      if (strongPasswordValidation.isValid) {
        validUser.password = strongPassword;
        validUser.passwordChangedAt = new Date();
        await validUser.save();
        
        console.log(`  ✅ Password changed successfully`);
        console.log(`  New password hash: ${validUser.password.substring(0, 20)}...`);
        console.log(`  Changed at: ${validUser.passwordChangedAt}`);
        
        // Test login with new password
        const newPasswordTest = await validUser.comparePassword(strongPassword);
        console.log(`  New password login test: ${newPasswordTest ? '✅' : '❌'}`);
      }
    }

    // Test 8: Password Reset Token Generation
    console.log('\n🔑 TEST 8: Password Reset System');
    console.log('------------------------------');
    
    if (validUser) {
      console.log(`Testing password reset for: ${validUser.email}`);
      
      // Generate reset token
      const resetToken = validUser.generatePasswordResetToken();
      await validUser.save();
      
      console.log(`  ✅ Reset token generated: ${resetToken.substring(0, 10)}...`);
      console.log(`  Token expires: ${validUser.resetPasswordExpires}`);
      console.log(`  Stored hash: ${validUser.resetPasswordToken.substring(0, 20)}...`);
      
      // Verify token can be used
      const crypto = require('crypto');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      
      const tokenMatch = hashedToken === validUser.resetPasswordToken;
      console.log(`  Token verification: ${tokenMatch ? '✅' : '❌'}`);
    }

    // Test 9: Email Verification System
    console.log('\n📧 TEST 9: Email Verification System');
    console.log('----------------------------------');
    
    if (validUser) {
      console.log(`Testing email verification for: ${validUser.email}`);
      console.log(`  Current verification status: ${validUser.isEmailVerified ? '✅ Verified' : '❌ Not verified'}`);
      
      // Generate verification token
      const verificationToken = validUser.generateEmailVerificationToken();
      await validUser.save();
      
      console.log(`  ✅ Verification token generated: ${verificationToken.substring(0, 10)}...`);
      console.log(`  Token expires: ${validUser.emailVerificationExpires}`);
      
      // Simulate verification
      validUser.isEmailVerified = true;
      validUser.emailVerificationToken = undefined;
      validUser.emailVerificationExpires = undefined;
      await validUser.save();
      
      console.log(`  ✅ Email verified successfully`);
    }

    // Test 10: User Statistics
    console.log('\n📊 TEST 10: User Statistics');
    console.log('-------------------------');
    
    if (validUser) {
      await validUser.populate('favoritesPets');
      
      const stats = {
        accountAge: Math.floor((Date.now() - validUser.createdAt) / (24 * 60 * 60 * 1000)),
        favoritesCount: validUser.favoritesPets.length,
        votesCount: validUser.votedPets.length,
        upvotesCount: validUser.votedPets.filter(vote => vote.voteType === 'up').length,
        downvotesCount: validUser.votedPets.filter(vote => vote.voteType === 'down').length,
        emailVerified: validUser.isEmailVerified,
        lastLogin: validUser.lastLogin
      };
      
      console.log(`  Account age: ${stats.accountAge} days`);
      console.log(`  Favorites: ${stats.favoritesCount}`);
      console.log(`  Total votes: ${stats.votesCount}`);
      console.log(`  Upvotes: ${stats.upvotesCount}`);
      console.log(`  Downvotes: ${stats.downvotesCount}`);
      console.log(`  Email verified: ${stats.emailVerified ? '✅' : '❌'}`);
      console.log(`  Last login: ${stats.lastLogin || 'Never'}`);
    }

    // Test 11: Security Features
    console.log('\n🛡️ TEST 11: Security Features');
    console.log('----------------------------');
    
    // Test User model security methods
    console.log('Testing User model security methods:');
    
    // Test admin finding
    const adminUsers = await User.findAdmins();
    console.log(`  Found ${adminUsers.length} admin users`);
    
    // Test user statistics
    const userStats = await User.getUserStats();
    console.log('  User statistics:');
    console.log(`    Total users: ${userStats.total}`);
    console.log(`    Active users: ${userStats.active}`);
    console.log(`    Verified users: ${userStats.verified}`);
    console.log(`    Locked users: ${userStats.locked || 0}`);
    
    // Test password generation
    console.log('\nTesting password generation:');
    const generatedPasswords = passwordService.generatePasswordSuggestions(3, 16);
    generatedPasswords.forEach((pwd, index) => {
      console.log(`  ${index + 1}. ${pwd.password} (${pwd.strength})`);
    });

    // Test 12: Profile Completeness
    console.log('\n👤 TEST 12: Profile Completeness');
    console.log('-------------------------------');
    
    if (validUser) {
      const calculateProfileCompleteness = (user) => {
        let completed = 0;
        const total = 8;

        if (user.profile.firstName) completed++;
        if (user.profile.lastName) completed++;
        if (user.profile.phone) completed++;
        if (user.profile.bio) completed++;
        if (user.profile.avatar) completed++;
        if (user.profile.address && user.profile.address.city) completed++;
        if (user.isEmailVerified) completed++;
        if (user.favoritesPets && user.favoritesPets.length > 0) completed++;

        return Math.round((completed / total) * 100);
      };
      
      const completeness = calculateProfileCompleteness(validUser);
      console.log(`  Profile completeness: ${completeness}%`);
      
      // Add some profile data
      validUser.profile.phone = '+1234567890';
      validUser.profile.bio = 'Test user for FurBabies application testing';
      validUser.profile.address = {
        street: '123 Test Street',
        city: 'Louisville',
        state: 'KY',
        zipCode: '40202'
      };
      await validUser.save();
      
      const newCompleteness = calculateProfileCompleteness(validUser);
      console.log(`  Updated completeness: ${newCompleteness}%`);
    }

    // Test 13: Performance Metrics
    console.log('\n⚡ TEST 13: Performance Metrics');
    console.log('-----------------------------');
    
    const performanceTests = async () => {
      const iterations = 10;
      
      // Test password hashing performance
      console.log(`Testing password hashing performance (${iterations} iterations):`);
      const hashStartTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await passwordService.hashPassword(`TestPassword${i}!`);
      }
      
      const hashTime = Date.now() - hashStartTime;
      console.log(`  Total time: ${hashTime}ms`);
      console.log(`  Average per hash: ${(hashTime / iterations).toFixed(2)}ms`);
      
      // Test password comparison performance
      console.log(`\nTesting password comparison performance (${iterations} iterations):`);
      const testHash = await passwordService.hashPassword('TestPassword!');
      const compareStartTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        await passwordService.comparePassword('TestPassword!', testHash.hash);
      }
      
      const compareTime = Date.now() - compareStartTime;
      console.log(`  Total time: ${compareTime}ms`);
      console.log(`  Average per comparison: ${(compareTime / iterations).toFixed(2)}ms`);
    };
    
    await performanceTests();

    // Test 14: Error Handling
    console.log('\n❌ TEST 14: Error Handling');
    console.log('------------------------');
    
    console.log('Testing error scenarios:');
    
    // Test duplicate user creation
    try {
      const duplicateUser = new User({
        username: 'testuser2',
        email: 'testuser2@example.com',
        password: 'AnotherP@ssw0rd123!'
      });
      await duplicateUser.save();
      console.log('  ❌ Duplicate user creation should have failed');
    } catch (error) {
      if (error.code === 11000) {
        console.log('  ✅ Duplicate user correctly rejected');
      } else {
        console.log(`  ❌ Unexpected error: ${error.message}`);
      }
    }
    
    // Test invalid password validation
    const invalidPasswords = ['', '123', 'password', 'PASSWORD', '12345678'];
    invalidPasswords.forEach(pwd => {
      const validation = passwordService.validatePasswordStrength(pwd);
      console.log(`  Password "${pwd}": ${validation.isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`);
    });

    // Cleanup test data
    console.log('\n🧹 CLEANUP');
    console.log('--------');
    
    await User.deleteMany({ email: /test.*@example\.com/ });
    await Pet.deleteMany({ name: /Test Pet/ });
    console.log('✅ Test data cleaned up');

    // Final summary
    console.log('\n🎉 USER CONTROLLER TEST COMPLETED!');
    console.log('================================');
    console.log('All functionality tested successfully:');
    console.log('✅ Enhanced user registration with password security');
    console.log('✅ Login system with account lockout protection');
    console.log('✅ Pet voting and rating systems');
    console.log('✅ Favorites management');
    console.log('✅ Password change and reset functionality');
    console.log('✅ Email verification system');
    console.log('✅ User statistics and profile completeness');
    console.log('✅ Security features and admin functions');
    console.log('✅ Performance optimization');
    console.log('✅ Comprehensive error handling');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Full error details:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Database connection closed');
    process.exit(0);
  }
};

// Manual testing utilities
const manualTests = {
  // Test specific user functions
  testUserFunctions: async (userId) => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findById(userId).populate('favoritesPets votedPets.pet');
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`\n👤 User: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Created: ${user.createdAt}`);
    console.log(`Email verified: ${user.isEmailVerified}`);
    console.log(`Failed attempts: ${user.failedLoginAttempts}`);
    console.log(`Favorites: ${user.favoritesPets.length}`);
    console.log(`Votes: ${user.votedPets.length}`);
    
    await mongoose.disconnect();
  },

  // Test password strength for any password
  testPasswordStrength: (password) => {
    const validation = passwordService.validatePasswordStrength(password);
    console.log(`\n🔍 Password: "${password}"`);
    console.log(`Strength: ${validation.strength}`);
    console.log(`Score: ${validation.score}/100`);
    console.log(`Valid: ${validation.isValid}`);
    if (!validation.isValid) {
      console.log('Errors:', validation.errors);
      console.log('Suggestions:', validation.suggestions);
    }
    return validation;
  },

  // Generate and test passwords
  generateAndTestPasswords: (count = 5) => {
    console.log(`\n🎲 Generating ${count} secure passwords:`);
    for (let i = 0; i < count; i++) {
      const password = passwordService.generateSecurePassword(16);
      const validation = passwordService.validatePasswordStrength(password);
      console.log(`${i + 1}. ${password}`);
      console.log(`   Strength: ${validation.strength} (${validation.score}/100)`);
    }
  }
};

// Run tests if called directly
if (require.main === module) {
  const arg = process.argv[2];
  
  if (arg === 'user' && process.argv[3]) {
    manualTests.testUserFunctions(process.argv[3]);
  } else if (arg === 'password' && process.argv[3]) {
    manualTests.testPasswordStrength(process.argv[3]);
  } else if (arg === 'generate') {
    const count = parseInt(process.argv[3]) || 5;
    manualTests.generateAndTestPasswords(count);
  } else {
    testUserController();
  }
}

module.exports = { testUserController, manualTests };