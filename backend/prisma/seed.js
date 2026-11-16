import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Ensuring default SharedSpace exists...');

  let space = await prisma.sharedSpace.findFirst();

  if (!space) {
    space = await prisma.sharedSpace.create({
      data: {
        name: 'TogetherSpace Archive'
      }
    });
    console.log('[Seed] Created default SharedSpace:', space.id);
  } else {
    console.log('[Seed] Existing SharedSpace found:', space.id);
  }

  const userCount = await prisma.user.count();
  console.log(`[Seed] Current registered users in space: ${userCount}/2`);
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
