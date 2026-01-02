/**
 * Database Seed Script
 * Seeds demo/test users for development and testing
 * Run with: npm run prisma:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Inline password hashing to avoid import issues in Docker
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Products to seed (must match PRODUCTS constant in types/index.ts)
const products = [
  {
    id: 'skill',
    name: 'Skill Interview',
    type: 'interview',
    price: 3000, // $30 in cents
    currency: 'usd',
    description: 'Complete skill verification with voice interview, MCQ test, and coding challenge',
    features: JSON.stringify(['Voice interview', 'MCQ test', 'Coding challenge', 'AI evaluation']),
    active: true,
  },
  {
    id: 'id-visa',
    name: 'ID + Visa Verification',
    type: 'verification',
    price: 2000, // $20 in cents
    currency: 'usd',
    description: 'Identity and visa document verification',
    features: JSON.stringify(['ID document check', 'Visa verification', 'Face matching']),
    active: true,
  },
  {
    id: 'reference',
    name: 'Reference Check',
    type: 'reference',
    price: 1500, // $15 in cents
    currency: 'usd',
    description: 'Professional reference verification',
    features: JSON.stringify(['Up to 5 references', 'Email verification', 'Automated outreach']),
    active: true,
  },
  {
    id: 'combo',
    name: 'Complete Verification Bundle',
    type: 'bundle',
    price: 6000, // $60 in cents
    currency: 'usd',
    description: 'All verifications bundled at a discount',
    features: JSON.stringify(['Skill interview', 'ID + Visa verification', 'Reference check', 'Priority support']),
    active: true,
  },
];

// Demo users matching the LoginPage mockUsers
const demoUsers = [
  {
    email: 'demo@simplehire.ai',
    password: 'demo',
    name: 'Demo User',
    purchasedProducts: ['skill', 'id-visa', 'reference'],
    interviewProgress: {
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    },
    idVerificationStatus: 'not-started',
    referenceCheckStatus: 'not-started',
  },
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Anderson',
    purchasedProducts: ['skill'],
    interviewProgress: {
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    },
    idVerificationStatus: 'not-started',
    referenceCheckStatus: 'not-started',
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Mitchell',
    purchasedProducts: ['skill', 'id-visa'],
    interviewProgress: {
      documentsUploaded: true,
      voiceInterview: true,
      mcqTest: false,
      codingChallenge: false,
    },
    idVerificationStatus: 'in-progress',
    referenceCheckStatus: 'not-started',
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Chen',
    purchasedProducts: ['skill', 'id-visa', 'reference'],
    interviewProgress: {
      documentsUploaded: true,
      voiceInterview: true,
      mcqTest: true,
      codingChallenge: false,
    },
    idVerificationStatus: 'pending',
    referenceCheckStatus: 'in-progress',
  },
  {
    email: 'emma@example.com',
    password: 'password123',
    name: 'Emma Thompson',
    purchasedProducts: ['skill'],
    interviewProgress: {
      documentsUploaded: true,
      voiceInterview: true,
      mcqTest: true,
      codingChallenge: true,
    },
    idVerificationStatus: 'not-started',
    referenceCheckStatus: 'not-started',
  },
  {
    email: 'alex@example.com',
    password: 'password123',
    name: 'Alex Rodriguez',
    purchasedProducts: [],
    interviewProgress: {
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    },
    idVerificationStatus: 'not-started',
    referenceCheckStatus: 'not-started',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed products first (required for payment foreign keys)
  console.log('\n📦 Seeding products...');
  for (const product of products) {
    try {
      const existingProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      if (existingProduct) {
        console.log(`⏭️  Product ${product.id} already exists, skipping...`);
        continue;
      }

      await prisma.product.create({
        data: product,
      });
      console.log(`✅ Created product: ${product.id} (${product.name})`);
    } catch (error) {
      console.error(`❌ Error creating product ${product.id}:`, error);
    }
  }

  // Then seed users
  console.log('\n👤 Seeding demo users...');
  for (const userData of demoUsers) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user with associated data
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          emailVerified: true, // Mark demo users as verified
          userData: {
            create: {
              purchasedProducts: userData.purchasedProducts,
              interviewProgress: userData.interviewProgress,
              idVerificationStatus: userData.idVerificationStatus,
              referenceCheckStatus: userData.referenceCheckStatus,
            },
          },
        },
      });

      console.log(`✅ Created user: ${user.email} (${user.name})`);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((error) => {
    console.error('💥 Seed script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
