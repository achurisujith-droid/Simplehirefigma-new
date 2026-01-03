/**
 * Database Reset Script
 * Resets the database to a clean state with only the 6 demo users
 * 
 * This script:
 * 1. Deletes all users except the 6 demo accounts
 * 2. Deletes all related data (assessments, interviews, sessions, etc.)
 * 3. Re-seeds products to ensure consistency
 * 
 * Run with: npm run prisma:reset-demo
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Demo user emails that should be preserved
const DEMO_EMAILS = [
  'demo@simplehire.ai',
  'john@example.com',
  'sarah@example.com',
  'mike@example.com',
  'emma@example.com',
  'alex@example.com',
];

// Inline password hashing to avoid import issues
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Products to seed (must match seed.ts)
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

// Demo users (matching seed.ts)
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
      documentsUploaded: false,
      voiceInterview: false,
      mcqTest: false,
      codingChallenge: false,
    },
    idVerificationStatus: 'not-started',
    referenceCheckStatus: 'not-started',
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Chen',
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
    email: 'emma@example.com',
    password: 'password123',
    name: 'Emma Thompson',
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
  console.log('🔄 Starting database reset to demo state...\n');

  try {
    // Step 1: Get demo user IDs
    console.log('📋 Step 1: Identifying demo users...');
    const demoUserRecords = await prisma.user.findMany({
      where: {
        email: {
          in: DEMO_EMAILS,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const demoUserIds = demoUserRecords.map((u) => u.id);
    console.log(`✅ Found ${demoUserRecords.length} demo users:`, demoUserRecords.map(u => u.email));

    // Step 2: Delete all related data for ALL users (including demo users)
    console.log('\n🗑️  Step 2: Deleting all user-related data...');
    
    // Delete in correct order to respect foreign key constraints
    await prisma.proctoringEvent.deleteMany({});
    console.log('  ✅ Deleted all proctoring events');
    
    await prisma.interview.deleteMany({});
    console.log('  ✅ Deleted all interviews');
    
    await prisma.assessmentPlan.deleteMany({});
    console.log('  ✅ Deleted all assessment plans');
    
    await prisma.session.deleteMany({});
    console.log('  ✅ Deleted all sessions');
    
    await prisma.interviewSession.deleteMany({});
    console.log('  ✅ Deleted all interview sessions');
    
    await prisma.payment.deleteMany({});
    console.log('  ✅ Deleted all payments');
    
    await prisma.certificate.deleteMany({});
    console.log('  ✅ Deleted all certificates');
    
    await prisma.reference.deleteMany({});
    console.log('  ✅ Deleted all references');
    
    await prisma.iDVerification.deleteMany({});
    console.log('  ✅ Deleted all ID verifications');
    
    await prisma.refreshToken.deleteMany({});
    console.log('  ✅ Deleted all refresh tokens');
    
    await prisma.userData.deleteMany({});
    console.log('  ✅ Deleted all user data');

    // Step 3: Delete non-demo users
    console.log('\n🗑️  Step 3: Deleting non-demo users...');
    const deleteResult = await prisma.user.deleteMany({
      where: {
        email: {
          notIn: DEMO_EMAILS,
        },
      },
    });
    console.log(`  ✅ Deleted ${deleteResult.count} non-demo users`);

    // Step 4: Reset demo users to clean state
    console.log('\n🔄 Step 4: Resetting demo users to clean state...');
    
    // Delete existing demo users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: DEMO_EMAILS,
        },
      },
    });
    console.log('  ✅ Removed existing demo user records');

    // Step 5: Re-seed products
    console.log('\n📦 Step 5: Re-seeding products...');
    
    // Delete all existing products
    await prisma.product.deleteMany({});
    console.log('  ✅ Cleared existing products');
    
    // Create products
    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
      console.log(`  ✅ Created product: ${product.id} (${product.name})`);
    }

    // Step 6: Re-create demo users with clean state
    console.log('\n👤 Step 6: Creating demo users with clean state...');
    for (const userData of demoUsers) {
      const passwordHash = await hashPassword(userData.password);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          emailVerified: true,
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

      console.log(`  ✅ Created user: ${user.email} (${user.name})`);
    }

    // Step 7: Verify final state
    console.log('\n✅ Step 7: Verifying final state...');
    const totalUsers = await prisma.user.count();
    const totalProducts = await prisma.product.count();
    const totalAssessments = await prisma.assessmentPlan.count();
    const totalInterviews = await prisma.interview.count();
    const totalPayments = await prisma.payment.count();

    console.log(`
📊 Final Database State:
   - Users: ${totalUsers} (should be 6)
   - Products: ${totalProducts} (should be 4)
   - Assessment Plans: ${totalAssessments} (should be 0)
   - Interviews: ${totalInterviews} (should be 0)
   - Payments: ${totalPayments} (should be 0)
`);

    if (totalUsers === 6 && totalProducts === 4) {
      console.log('🎉 Database successfully reset to demo state!\n');
      console.log('📝 Demo Login Credentials:');
      console.log('   - demo@simplehire.ai / demo');
      console.log('   - john@example.com / password123');
      console.log('   - sarah@example.com / password123');
      console.log('   - mike@example.com / password123');
      console.log('   - emma@example.com / password123');
      console.log('   - alex@example.com / password123\n');
    } else {
      console.error('⚠️  Warning: Database state may not be correct!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Reset script failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
