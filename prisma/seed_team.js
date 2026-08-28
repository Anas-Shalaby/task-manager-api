import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  let defaultTeam = await prisma.team.findUnique({ where: { code: 'GENERAL' } });
  if (!defaultTeam) {
    defaultTeam = await prisma.team.create({
      data: {
        name: 'الفريق العام',
        code: 'GENERAL',
        description: 'الفريق الافتراضي لجميع المهام والمستخدمين',
      }
    });
    console.log('Created default team:', defaultTeam.name);
  }

  const users = await prisma.user.updateMany({
    where: { teamId: null },
    data: { teamId: defaultTeam.id }
  });
  console.log('Updated users:', users.count);

  const tasks = await prisma.task.updateMany({
    where: { teamId: null },
    data: { teamId: defaultTeam.id }
  });
  console.log('Updated tasks:', tasks.count);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
