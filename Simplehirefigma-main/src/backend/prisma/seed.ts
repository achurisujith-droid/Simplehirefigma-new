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
