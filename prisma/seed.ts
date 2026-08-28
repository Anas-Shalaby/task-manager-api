// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Users
  const usersData = [
    { name: 'أحمد محمد', email: 'ahmed@system.local', password: hashedPassword, role: 'manager', rank: 'BRIGADIER' },
    { name: 'محمود حسن', email: 'mahmoud@system.local', password: hashedPassword, role: 'supervisor', rank: 'MAJOR' },
    { name: 'محمد علي', email: 'mohamed@system.local', password: hashedPassword, role: 'employee', rank: 'SERGEANT' },
    { name: 'كريم أحمد', email: 'karim@system.local', password: hashedPassword, role: 'employee', rank: 'CIVILIAN' },
    { name: 'يوسف خالد', email: 'youssef@system.local', password: hashedPassword, role: 'employee', rank: 'MILITARY_FOLLOW_UP' }
  ];

  const createdUsers = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { password: u.password, rank: u.rank },
      create: u
    });
    createdUsers.push(user);
  }

  // Tasks
  const tasksData = [
    { title: 'تحديث أجهزة الشبكة', priority: 'high', status: 'in_progress', progress: 40 },
    { title: 'مراجعة صلاحيات المستخدمين', priority: 'medium', status: 'pending', progress: 0 },
    { title: 'إعداد الخادم الاحتياطي', priority: 'critical', status: 'overdue', progress: 80, deadline: new Date(Date.now() - 86400000) },
    { title: 'تحديث قاعدة البيانات', priority: 'high', status: 'completed', progress: 100 },
    { title: 'فحص أجهزة الحماية', priority: 'medium', status: 'blocked', progress: 20 },
    { title: 'تجهيز تقرير البنية التحتية', priority: 'low', status: 'in_progress', progress: 60 }
  ];

  for (let i = 0; i < tasksData.length; i++) {
    const t = tasksData[i];
    const task = await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority,
        status: t.status,
        progress: t.progress,
        deadline: t.deadline
      }
    });

    // Assign to a random user (skip manager)
    const assignee = createdUsers[(i % 4) + 1];
    
    await prisma.taskAssignee.create({
      data: {
        taskId: task.id,
        userId: assignee.id,
        isOwner: true
      }
    });

    // Add an operational update
    await prisma.taskUpdate.create({
      data: {
        taskId: task.id,
        userId: assignee.id,
        message: 'تم البدء في التنفيذ والمتابعة.',
        progress: t.progress,
        status: t.status
      }
    });
    
    // Add a comment
    await prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: assignee.id,
        message: 'أرجو مراجعة المرفقات عند الانتهاء.'
      }
    });

    if (t.status === 'blocked') {
      await prisma.taskBlocker.create({
        data: {
          taskId: task.id,
          userId: assignee.id,
          reason: 'بانتظار وصول المعدات من المستودع المركزي.'
        }
      });
    }
    
    // Create activity log for seed
    await prisma.activityLog.create({
      data: {
        actorId: assignee.id,
        action: 'TASK_ASSIGNED',
        entityType: 'TASK',
        entityId: task.id,
        metadata: { title: task.title }
      }
    });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
