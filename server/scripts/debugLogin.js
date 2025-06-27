// server/scripts/debugLogin.js - Enhanced Debug Login System
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔐 Enhanced Debug Login System...\n');

async function debugLogin() {
  try {
    console.log('📋 Environment Check:');
    console.log(`   MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`   JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);

    console.log('\n📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    let User;
    try {
      const userModule = await import('../models/User.js');
      User = userModule.default;
      console.log('✅ User model imported successfully');
    } catch (error) {
      console.log('❌ Could not import User model:', error.message);
      return;
    }

    console.log('\n📊 Database Statistics:');
    const userCount = await User.countDocuments();
    console.log(`   Total users: ${userCount}`);
    if (userCount === 0) {
      console.log('⚠️  No users found in database');
      return;
    }

    console.log('\n👥 User List:');
    const users = await User.find({}).select('username email role createdAt lastLogin favoritesPets').sort({ createdAt: -1 });
    users.forEach((user, index) => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
      const favCount = user.favoritesPets ? user.favoritesPets.length : 0;
      console.log(`   ${index + 1}. ${user.username}`);
      console.log(`      📧 Email: ${user.email}`);
      console.log(`      👤 Role: ${user.role}`);
      console.log(`      📅 Created: ${new Date(user.createdAt).toLocaleDateString()}`);
      console.log(`      🕒 Last Login: ${lastLogin}`);
      console.log(`      ❤️  Favorites: ${favCount} pets`);
      console.log('');
    });

    console.log('🔑 Testing JWT Token Generation:');
    if (users.length > 0) {
      const testUser = users[0];
      try {
        const token = jwt.sign(
          { id: testUser._id },
          process.env.JWT_SECRET,
          { expiresIn: '30d' }
        );
        console.log(`   ✅ JWT token generated for ${testUser.username}`);
        console.log(`   📄 Token preview: ${token.substring(0, 50)}...`);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`   ✅ Token verification successful`);
        console.log(`   🆔 User ID from token: ${decoded.id}`);
      } catch (error) {
        console.log(`   ❌ JWT error: ${error.message}`);
      }
    }

    console.log('\n🔐 Testing Password Functions:');
    const testPassword = 'TestPassword123!';
    try {
      const hashedPassword = await bcryptjs.hash(testPassword, 12);
      console.log('   ✅ Password hashing successful');
      console.log(`   📄 Hash preview: ${hashedPassword.substring(0, 30)}...`);
      const isMatch = await bcryptjs.compare(testPassword, hashedPassword);
      console.log(`   ✅ Password comparison: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
      const wrongMatch = await bcryptjs.compare('WrongPassword', hashedPassword);
      console.log(`   ✅ Wrong password test: ${wrongMatch ? 'MATCH (ERROR!)' : 'NO MATCH (CORRECT)'}`);
    } catch (error) {
      console.log(`   ❌ Password test error: ${error.message}`);
    }

    console.log('\n🧪 Interactive Login Test:');
    if (users.length > 0) {
      console.log(`   {\n     "email": "${users[0].email}",\n     "password": "your-actual-password"\n   }`);
    }

    console.log('\n👑 Admin Users:');
    const adminUsers = await User.find({ role: 'admin' }).select('username email');
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`   👑 ${admin.username} (${admin.email})`);
      });
    } else {
      console.log('   ⚠️  No admin users found');
    }

    console.log('\n🕒 Recent Activity:');
    const recentUsers = await User.find({ lastLogin: { $exists: true } })
      .sort({ lastLogin: -1 })
      .limit(3)
      .select('username lastLogin');
    if (recentUsers.length > 0) {
      recentUsers.forEach(user => {
        const loginDate = new Date(user.lastLogin).toLocaleString();
        console.log(`   🔄 ${user.username} - ${loginDate}`);
      });
    } else {
      console.log('   📝 No recent login activity');
    }

    console.log('\n📊 Database Connection Info:');
    console.log(`   📂 Database: ${mongoose.connection.name}`);
    console.log(`   🌐 Host: ${mongoose.connection.host}`);
    console.log(`   📊 Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    console.log('\n✅ Debug login analysis complete!');
  } catch (error) {
    console.error('\n💥 Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Database connection closed');
  }
}

const args = process.argv.slice(2);
switch (args[0]) {
  case 'create-test-user':
    createTestUser();
    break;
  case 'reset-password':
    resetUserPassword(args[1], args[2]);
    break;
  case 'make-admin':
    makeUserAdmin(args[1]);
    break;
  default:
    debugLogin();
}

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { default: User } = await import('../models/User.js');
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'user',
      profile: { firstName: 'Test', lastName: 'User' }
    });
    await testUser.save();
    console.log('✅ Test user created: testuser / test@example.com');
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function resetUserPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.log('Usage: npm run debug:login reset-password email@example.com newpassword');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { default: User } = await import('../models/User.js');
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    user.password = newPassword;
    await user.save();
    console.log(`✅ Password reset for ${user.username} (${email})`);
  } catch (error) {
    console.error('❌ Failed to reset password:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function makeUserAdmin(email) {
  if (!email) {
    console.log('Usage: npm run debug:login make-admin email@example.com');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const { default: User } = await import('../models/User.js');
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    console.log(`✅ ${user.username} (${email}) is now an admin`);
  } catch (error) {
    console.error('❌ Failed to make user admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

export { debugLogin, createTestUser, resetUserPassword, makeUserAdmin };