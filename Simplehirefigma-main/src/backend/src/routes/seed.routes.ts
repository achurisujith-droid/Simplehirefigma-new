import express from 'express';
import prisma from '../config/database';
import { hashPassword } from '../utils/password';

const seedRouter = express.Router();

const demoUsers = [
  {
    email: 'john@example.com',
    password: 'password123',
    name: 'John Anderson',
  },
  {
    email: 'sarah@example.com',
    password: 'password123',
    name: 'Sarah Mitchell',
  },
  {
    email: 'mike@example.com',
    password: 'password123',
    name: 'Mike Chen',
  },
  {
    email: 'emma@example.com',
    password: 'password123',
    name: 'Emma Thompson',
  },
  {
    email: 'alex@example.com',
    password: 'password123',
    name: 'Alex Rodriguez',
  },
  {
    email: 'demo@simplehire.ai',
    password: 'demo',
    name: 'Demo User',
  },
];

seedRouter.all('/seed-database', async (req, res) => {
  try {
    let createdCount = 0;

    for (const userData of demoUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!existing) {
        const passwordHash = await hashPassword(userData.password);
        await prisma.user.create({
          data: {
            email: userData.email,
            passwordHash,
            name: userData.name,
            emailVerified: true,
          },
        });
        createdCount++;
      }
    }

    res.json({
      success: true,
      message: `Seeding completed. Created ${createdCount} new users.`,
      createdCount,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default seedRouter;
