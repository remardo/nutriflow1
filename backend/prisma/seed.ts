import { PrismaClient, ClientStatus, LabStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NutriFlow demo data...');

  // 1. Admin / нутриолог
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // ВАЖНО: Prisma Client должен быть сгенерирован после обновления schema.prisma (npx prisma generate)
  // Ошибка "Unknown argument `hashedPassword`" означает, что используется старый client без этого поля.
  // Здесь задаём только поддерживаемые поля; если hashedPassword ещё не применён миграцией — используем fallback.
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'Demo Nutriolog',
    },
    create: {
      email: adminEmail,
      name: 'Demo Nutriolog',
    },
  });

  // Установим роль и tenantId для демо-пользователя, если поля уже есть в схеме/клиенте.
  // Оборачиваем в try/catch, чтобы сид оставался совместимым при несинхронизированном Prisma Client.
  try {
    await (prisma as any).user.update({
      where: { id: admin.id },
      data: {
        role: 'OWNER',
        tenantId: 'demo-tenant',
      },
    });
  } catch {
    console.warn('Skip role/tenantId update: prisma client/schema not in sync with role/tenantId fields');
  }

  // Пробуем установить пароль, если схема и Prisma Client синхронизированы.
  try {
    await (prisma as any).user.update({
      where: { id: admin.id },
      data: { hashedPassword },
    });
  } catch {
    console.warn('Skip hashedPassword update: prisma client/schema not in sync with hashedPassword field');
  }

  console.log(`User: ${admin.email} (password: ${adminPassword})`);

  // 2. Справочник лабораторных маркеров
  // Используем any-каст, чтобы не падать, если Prisma Client ещё не знает о LabMarkerRef.
  const labMarkerRefClient = (prisma as any).labMarkerRef;
  if (labMarkerRefClient) {
    await labMarkerRefClient.upsert({
      where: { code: 'FERRITIN' },
      update: {},
      create: {
        code: 'FERRITIN',
        name: 'Ферритин',
        unit: 'нг/мл',
        low: 15,
        high: 150,
        comment: 'Запасы железа, дефицит при низких значениях',
      },
    });

    await labMarkerRefClient.upsert({
      where: { code: 'VITD25OH' },
      update: {},
      create: {
        code: 'VITD25OH',
        name: 'Витамин D (25(OH)D)',
        unit: 'нг/мл',
        low: 30,
        high: 100,
        comment: 'Оптимальный уровень для иммунитета и обмена веществ',
      },
    });

    await labMarkerRefClient.upsert({
      where: { code: 'HB' },
      update: {},
      create: {
        code: 'HB',
        name: 'Гемоглобин',
        unit: 'г/л',
        low: 120,
        high: 160,
        comment: 'Кислородная ёмкость крови',
      },
    });
  } else {
    console.warn('labMarkerRef model is not available on PrismaClient (skip seeding lab markers)');
  }

  // Helper to create client with relations
  async function createClient(index: number, data: {
    fullName: string;
    status: ClientStatus;
    goal: string;
    kcalCoverage: number;
    proteinCoverage: number;
    fiberCoverage: number;
    ferritinLow?: boolean;
    hasMenu?: boolean;
  }) {
    const client = await prisma.client.create({
      data: {
        userId: admin.id,
        fullName: data.fullName,
        status: data.status,
        goal: data.goal,
        // tenantId наследуется от демо-юзера, если поле доступно в схеме
        ...(admin as any).tenantId
          ? { tenantId: (admin as any).tenantId }
          : {},
      },
    });

    // Norms
    await prisma.clientNutrientNorms.create({
      data: {
        clientId: client.id,
        kcalMin: 1800,
        kcalMax: 2200,
        proteinGrams: 120,
        fatGramsMin: 50,
        fatGramsMax: 80,
        carbsGramsMin: 200,
        carbsGramsMax: 260,
        fiberGrams: 25,
      },
    });

    // Day stats
    await prisma.clientDayStats.create({
      data: {
        clientId: client.id,
        date: new Date(),
        kcal: Math.round(data.kcalCoverage * 2000),
        protein: Math.round(data.proteinCoverage * 120),
        fiber: Math.round(data.fiberCoverage * 25),
        kcalCoverage: data.kcalCoverage,
        proteinCoverage: data.proteinCoverage,
        fiberCoverage: data.fiberCoverage,
        riskFlags: buildRiskFlags(data),
      },
    });

    // Meals (simple examples)
    await prisma.meal.createMany({
      data: [
        {
          clientId: client.id,
          occurredAt: new Date(),
          description: 'Овсянка, банан, орехи',
          kcal: 430,
          protein: 16,
          fat: 14,
          carbs: 56,
          fiber: 7,
        },
        {
          clientId: client.id,
          occurredAt: new Date(),
          description: 'Гречка, куриная грудка, салат',
          kcal: 520,
          protein: 42,
          fat: 11,
          carbs: 63,
          fiber: 6,
        },
      ],
    });

    // Labs demo data:
    // Серия по FERRITIN: 12 → 18 → 25 нг/мл
    await prisma.labTest.createMany({
      data: [
        {
          clientId: client.id,
          takenAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          type: 'Blood',
          marker: 'FERRITIN',
          value: data.ferritinLow ? 12 : 30,
          unit: 'нг/мл',
          status: data.ferritinLow ? LabStatus.LOW : LabStatus.NORMAL,
        },
        {
          clientId: client.id,
          takenAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          type: 'Blood',
          marker: 'FERRITIN',
          value: data.ferritinLow ? 18 : 40,
          unit: 'нг/мл',
          status: LabStatus.NORMAL,
        },
        {
          clientId: client.id,
          takenAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          type: 'Blood',
          marker: 'FERRITIN',
          value: data.ferritinLow ? 25 : 50,
          unit: 'нг/мл',
          status: LabStatus.NORMAL,
        },
      ],
    });

    // VITD25OH
    await prisma.labTest.create({
      data: {
        clientId: client.id,
        takenAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        type: 'Blood',
        marker: 'VITD25OH',
        value: 36,
        unit: 'нг/мл',
        status: LabStatus.NORMAL,
      },
    });

    // HB
    await prisma.labTest.create({
      data: {
        clientId: client.id,
        takenAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        type: 'Blood',
        marker: 'HB',
        value: 132,
        unit: 'г/л',
        status: LabStatus.NORMAL,
      },
    });

    // Menu templates (created once below), assignments here if needed
    if (data.hasMenu) {
      const template = await ensureMenuTemplate('Базовое меню баланса', 'Фокус на клетчатке и белке');
      await prisma.menuAssignment.create({
        data: {
          clientId: client.id,
          menuTemplateId: template.id,
          startDate: new Date(),
          isActive: true,
        },
      });
    }

    // Events
    await prisma.event.createMany({
      data: [
        {
          clientId: client.id,
          title: 'Онлайн-разбор дневника',
          description: null,
          type: 'checkup',
          scheduledAt: addDays(new Date(), index === 0 ? 1 : 3),
          channel: 'Zoom',
        },
        {
          clientId: client.id,
          title: 'Контрольный анализ ферритина',
          description: data.ferritinLow ? 'Проверить динамику после корректировки рациона' : null,
          type: 'lab-reminder',
          scheduledAt: addDays(new Date(), 7 + index),
          channel: 'Clinic',
        },
      ],
    });

    return client;
  }

  // Ensure default menu templates
  async function ensureMenuTemplate(name: string, description?: string) {
    const existing = await prisma.menuTemplate.findFirst({ where: { name } });
    if (existing) return existing;
    return prisma.menuTemplate.create({
      data: {
        name,
        description,
        focus: description,
      },
    });
  }

  function buildRiskFlags(d: {
    kcalCoverage: number;
    proteinCoverage: number;
    fiberCoverage: number;
  }): string[] {
    const flags: string[] = [];
    if (d.proteinCoverage < 0.85) flags.push('proteinLow');
    if (d.fiberCoverage < 0.85) flags.push('fiberLow');
    if (d.kcalCoverage > 1.2 || d.kcalCoverage < 0.8) flags.push('overKcal');
    if (flags.length === 0) flags.push('ok');
    return flags;
  }

  function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  // 2. Demo clients

  await createClient(0, {
    fullName: 'Анна Петрова',
    status: ClientStatus.ACTIVE,
    goal: 'Похудение · -6 кг',
    kcalCoverage: 0.9,
    proteinCoverage: 0.93,
    fiberCoverage: 0.7,
    ferritinLow: true,
    hasMenu: true,
  });

  await createClient(1, {
    fullName: 'Игорь Смирнов',
    status: ClientStatus.ACTIVE,
    goal: 'Набор мышц · +4 кг',
    kcalCoverage: 0.78,
    proteinCoverage: 0.64,
    fiberCoverage: 0.94,
    ferritinLow: false,
    hasMenu: true,
  });

  await createClient(2, {
    fullName: 'Мария Лебедева',
    status: ClientStatus.PAUSED,
    goal: 'Поддержание · ЖКТ',
    kcalCoverage: 1.01,
    proteinCoverage: 1.02,
    fiberCoverage: 1.1,
    ferritinLow: false,
    hasMenu: false,
  });

  // 3. Billing plan (demo)
  await prisma.billingPlan.upsert({
    where: { id: 'demo-plan' },
    update: {},
    create: {
      id: 'demo-plan',
      name: 'Demo Pro',
      maxClients: 20,
      features: [
        'clients',
        'dashboard',
        'labs',
        'menu',
        'events',
        'billing',
      ],
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error('Seed error', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });