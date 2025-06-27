// setup.js - Quick setup script for FurBabies
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 FurBabies PetStore Setup');
console.log('==========================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  // Generate a random JWT secret
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  
  const envContent = `# Environment Variables for FurBabies PetStore
MONGODB_URI=mongodb://localhost:27017/furbabies
JWT_SECRET=${jwtSecret}
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with random JWT secret');
} else {
  console.log('✅ .env file already exists');
}

// Check for required directories
const requiredDirs = [
  'server',
  'server/scripts', 
  'server/services',
  'server/models',
  'server/controllers',
  'server/routes',
  'server/middleware'
];

console.log('\n📁 Checking directory structure...');
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created ${dir}/`);
  } else {
    console.log(`✅ ${dir}/ exists`);
  }
});

// Check for package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('\n✅ package.json found');
  
  // Check if dependencies are installed
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('⚠️  Dependencies not installed');
    console.log('Run: npm install');
  } else {
    console.log('✅ Dependencies installed');
  }
} else {
  console.log('\n❌ package.json not found');
  console.log('Make sure you\'re in the project root directory');
}

console.log('\n🎉 Setup Complete!');
console.log('================');
console.log('Next steps:');
console.log('1. Run: npm install');
console.log('2. Make sure MongoDB is running');
console.log('3. Test your setup: npm run test:all');
console.log('4. Start development: npm run dev');
console.log('\nFor help: npm run test:users');