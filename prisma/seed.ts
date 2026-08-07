import {
  PrismaClient,
  ItemType,
  SQStatus,
  JOStatus,
  ProjectRole,
  PRStatus,
  POStatus,
  SIStatus,
  OpexStatus,
  ServiceInvoiceStatus,
} from '@prisma/client';
import { hashPassword } from '@better-auth/utils/password';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'demo12345';

const demoUsers: Array<{ email: string; name: string; role: ProjectRole }> = [
  { email: 'admin@lemans.ph', name: 'Demo Admin', role: 'ROLE_ADMIN' },
  { email: 'gm@lemans.ph', name: 'Demo General Manager', role: 'ROLE_GM' },
  { email: 'sales@lemans.ph', name: 'Demo Sales', role: 'ROLE_SALES' },
  { email: 'svc@lemans.ph', name: 'Demo Service Advisor', role: 'ROLE_SVC' },
  { email: 'purch@lemans.ph', name: 'Demo Purchasing', role: 'ROLE_PURCH' },
  { email: 'dcs@lemans.ph', name: 'Demo DCS', role: 'ROLE_DCS' },
];

async function upsertDemoUser(user: { email: string; name: string; role: ProjectRole }) {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: user.role, name: user.name },
    });
    return existing;
  }

  const id = crypto.randomUUID();
  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  await prisma.user.create({
    data: {
      id,
      name: user.name,
      email: user.email,
      emailVerified: false,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      providerId: 'credential',
      accountId: id,
      userId: id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return prisma.user.findUniqueOrThrow({ where: { id } });
}

async function main() {
  console.log('Seeding Le Mans database with authentic reference data...');

  for (const user of demoUsers) {
    await upsertDemoUser(user);
  }

  // ---- 6 Customers (corporate + individual) ----
  const customerInputs = [
    {
      customerNo: '006500',
      name: 'ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.',
      tin: '009-881-234-000',
      address: 'EL DECARO BLDG. B2L2 ST. JUDE SUB. SAN AGUSTIN CITY OF SAN FERNANDO PAMPANGA',
      phone: '0917-136-6569',
      email: 'contact@accustandard.ph',
    },
    {
      customerNo: '006501',
      name: 'Angeles Logistics & Freight Inc.',
      tin: '210-443-199-000',
      address: 'Highway Pampang, Angeles City, Pampanga',
      phone: '0918-224-7712',
      email: 'operations@angeleslogistics.ph',
    },
    {
      customerNo: '006502',
      name: 'Juan Dela Cruz',
      tin: null,
      address: 'Balibago, Angeles City, Pampanga',
      phone: '0919-335-8823',
      email: 'juan.delacruz@email.ph',
    },
    {
      customerNo: '006503',
      name: 'Maria Santos',
      tin: null,
      address: 'Cutcut, Angeles City, Pampanga',
      phone: '0920-446-9934',
      email: 'maria.santos@email.ph',
    },
    {
      customerNo: '006504',
      name: 'Pampanga Express Transport OPC',
      tin: '401-992-108-000',
      address: 'San Fernando, Pampanga',
      phone: '0921-557-0045',
      email: 'dispatch@pampangaexpress.ph',
    },
    {
      customerNo: '006505',
      name: 'Engr. Robert Tan',
      tin: null,
      address: 'Telebastagan, Pampanga',
      phone: '0922-668-1156',
      email: 'robert.tan@email.ph',
    },
  ];

  const seededCustomers: Record<string, Awaited<ReturnType<typeof prisma.customer.upsert>>> = {};
  for (const c of customerInputs) {
    seededCustomers[c.customerNo] = await prisma.customer.upsert({
      where: { customerNo: c.customerNo },
      update: {},
      create: c,
    });
  }

  // ---- 10 Vehicles ----
  const vehicleInputs = [
    {
      plateNo: 'CBE7864',
      customerNo: '006500',
      vinChassis: 'MHKB3FE10NK001080',
      engineNo: '2NRG909564',
      makeModel: '2023 TOYOTA LITEACE',
      year: '2023',
      color: 'WHITE',
      odometer: 125000,
    },
    {
      plateNo: 'NBF4912',
      customerNo: '006500',
      vinChassis: 'MHKB3FE10NK001081',
      engineNo: '2NRG909565',
      makeModel: '2022 ISUZU TRAVIZ',
      year: '2022',
      color: 'WHITE',
      odometer: 98000,
    },
    {
      plateNo: 'NDR8821',
      customerNo: '006501',
      vinChassis: 'MMBJNKB40LH123456',
      engineNo: '4D56U909566',
      makeModel: '2021 MITSUBISHI L300 FB',
      year: '2021',
      color: 'SILVER',
      odometer: 87000,
    },
    {
      plateNo: 'CAK3091',
      customerNo: '006501',
      vinChassis: 'JHFBL5J10LX123457',
      engineNo: 'N04C909567',
      makeModel: '2020 HINO 300 LIGHT TRUCK',
      year: '2020',
      color: 'BLUE',
      odometer: 110000,
    },
    {
      plateNo: 'NCN5520',
      customerNo: '006502',
      vinChassis: 'MAFAGBJK0MJX12345',
      engineNo: 'BSN909568',
      makeModel: '2022 FORD RANGER 2.0 BI-TURBO',
      year: '2022',
      color: 'BLACK',
      odometer: 45000,
    },
    {
      plateNo: 'CBA9901',
      customerNo: '006503',
      vinChassis: 'MR0HA8FS0M1234567',
      engineNo: '1GD909569',
      makeModel: '2021 TOYOTA FORTUNER 2.8 V',
      year: '2021',
      color: 'PEARL WHITE',
      odometer: 62000,
    },
    {
      plateNo: 'CBB1204',
      customerNo: '006504',
      vinChassis: 'MHKG3FE10NK123458',
      engineNo: '1GD909570',
      makeModel: '2023 TOYOTA COMMUTER VAN',
      year: '2023',
      color: 'SILVER',
      odometer: 54000,
    },
    {
      plateNo: 'NDO7743',
      customerNo: '006504',
      vinChassis: 'MNTCB5J10LX123459',
      engineNo: 'YD25909571',
      makeModel: '2022 NISSAN URVAN NV350',
      year: '2022',
      color: 'WHITE',
      odometer: 76000,
    },
    {
      plateNo: 'CAJ8810',
      customerNo: '006505',
      vinChassis: 'MNAJL5J10LX123460',
      engineNo: '4JJ1909572',
      makeModel: '2020 ISUZU D-MAX 3.0 LS-A',
      year: '2020',
      color: 'SILVER',
      odometer: 81000,
    },
    {
      plateNo: 'NDN3302',
      customerNo: '006505',
      vinChassis: 'MR0GK8FS0M1234568',
      engineNo: '1GD909573',
      makeModel: '2021 TOYOTA HILUX CONQUEST',
      year: '2021',
      color: 'RED',
      odometer: 58000,
    },
  ];

  const seededVehicles: Record<string, Awaited<ReturnType<typeof prisma.vehicle.upsert>>> = {};
  for (const v of vehicleInputs) {
    seededVehicles[v.plateNo] = await prisma.vehicle.upsert({
      where: { plateNo: v.plateNo },
      update: {},
      create: {
        customerId: seededCustomers[v.customerNo].id,
        plateNo: v.plateNo,
        vinChassis: v.vinChassis,
        engineNo: v.engineNo,
        makeModel: v.makeModel,
        year: v.year,
        color: v.color,
        odometer: v.odometer,
      },
    });
  }

  const customer = seededCustomers['006500'];
  const vehicle = seededVehicles['CBE7864'];

  const quoteInputs = [
    {
      quoteNo: 'SQ-2026-0042',
      customerNo: '006500',
      plateNo: 'CBE7864',
      advisor: 'JEFFREY P. PERIN',
      status: SQStatus.CONVERTED,
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Perform 125,000 kilometers Check up Service Labor',
          quantity: 1,
          unitPrice: 2000.0,
          discount: 200.0,
          netAmount: 1800.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'MINERAL ENG OIL 15W-40 (WURTH)',
          quantity: 4,
          unitPrice: 363.52,
          discount: 0,
          netAmount: 1454.08,
        },
        {
          itemType: ItemType.PARTS,
          description: 'OIL FILTER VIC C-110',
          quantity: 1,
          unitPrice: 345.0,
          discount: 34.5,
          netAmount: 310.5,
        },
        {
          itemType: ItemType.PARTS,
          description: 'BRAKE PARTS CLEANER (WURTH)',
          quantity: 1,
          unitPrice: 345.92,
          discount: 0,
          netAmount: 345.92,
        },
        {
          itemType: ItemType.PARTS,
          description: 'AIR CLEANER',
          quantity: 1,
          unitPrice: 1111.5,
          discount: 0,
          netAmount: 1111.5,
        },
        {
          itemType: ItemType.PARTS,
          description: 'FRT BRAKE PADS SET',
          quantity: 1,
          unitPrice: 2925.0,
          discount: 0,
          netAmount: 2925.0,
        },
        {
          itemType: ItemType.LABOR,
          description: 'Cleaning of Throttle Valve and Replace Spark Plugs Labor',
          quantity: 2,
          unitPrice: 600.0,
          discount: 120.0,
          netAmount: 1080.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'SPARK PLUG (IRIDIUM)',
          quantity: 4,
          unitPrice: 1560.0,
          discount: 624.0,
          netAmount: 5616.0,
        },
      ],
    },
    {
      quoteNo: 'SQ-2026-0043',
      customerNo: '006501',
      plateNo: 'NDR8821',
      advisor: 'RICHARD P. REYES',
      status: SQStatus.APPROVED,
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Transmission Overhaul Labor',
          quantity: 1,
          unitPrice: 12000.0,
          discount: 1200.0,
          netAmount: 10800.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Clutch Lining Kit',
          quantity: 1,
          unitPrice: 9500.0,
          discount: 0,
          netAmount: 9500.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Transmission Oil 75W-90',
          quantity: 5,
          unitPrice: 650.0,
          discount: 0,
          netAmount: 3250.0,
        },
      ],
    },
    {
      quoteNo: 'SQ-2026-0044',
      customerNo: '006502',
      plateNo: 'NCN5520',
      advisor: 'JEROME P. JIMENEZ',
      status: SQStatus.APPROVED,
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Aircon General Cleaning Labor',
          quantity: 1,
          unitPrice: 2500.0,
          discount: 300.0,
          netAmount: 2200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Replacement Evaporator Assembly',
          quantity: 1,
          unitPrice: 12000.0,
          discount: 0,
          netAmount: 12000.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Freon Top-up R134a',
          quantity: 2,
          unitPrice: 1500.0,
          discount: 0,
          netAmount: 3000.0,
        },
      ],
    },
  ];

  const seededQuotes: Record<string, Awaited<ReturnType<typeof prisma.salesQuotation.upsert>>> = {};
  for (const q of quoteInputs) {
    const totalLabor = q.items
      .filter((i) => i.itemType === ItemType.LABOR)
      .reduce((sum, i) => sum + i.netAmount, 0);
    const totalParts = q.items
      .filter((i) => i.itemType === ItemType.PARTS)
      .reduce((sum, i) => sum + i.netAmount, 0);
    const netTotal = q.items.reduce((sum, i) => sum + i.netAmount, 0);
    seededQuotes[q.quoteNo] = await prisma.salesQuotation.upsert({
      where: { quoteNo: q.quoteNo },
      update: {},
      create: {
        quoteNo: q.quoteNo,
        customerId: seededCustomers[q.customerNo].id,
        vehicleId: seededVehicles[q.plateNo].id,
        advisor: q.advisor,
        totalLabor,
        totalParts,
        netTotal,
        status: q.status,
        items: { create: q.items },
      },
    });
  }

  const quote = seededQuotes['SQ-2026-0042'];

  const jobOrderInputs = [
    {
      joNo: 'RA0003973',
      quoteNo: 'SQ-2026-0042',
      customerNo: '006500',
      plateNo: 'CBE7864',
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '08',
      status: JOStatus.BILLED,
      technician: 'MARIO PANGANIBAN',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Perform 125,000 kilometers Check up Service Labor',
          quantity: 1,
          unitPrice: 2000.0,
          discount: 200.0,
          netAmount: 1800.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'MINERAL ENG OIL 15W-40 (WURTH)',
          quantity: 4,
          unitPrice: 363.52,
          discount: 0,
          netAmount: 1454.08,
        },
        {
          itemType: ItemType.PARTS,
          description: 'OIL FILTER VIC C-110',
          quantity: 1,
          unitPrice: 345.0,
          discount: 34.5,
          netAmount: 310.5,
        },
        {
          itemType: ItemType.LABOR,
          description: 'Cleaning of Throttle Valve and Replace Spark Plugs Labor',
          quantity: 2,
          unitPrice: 600.0,
          discount: 120.0,
          netAmount: 1080.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'SPARK PLUG (IRIDIUM)',
          quantity: 4,
          unitPrice: 1560.0,
          discount: 624.0,
          netAmount: 5616.0,
        },
      ],
      actualLaborCost: 2100.0,
      actualPartsCost: 9850.0,
      billedAmount: 15931.49,
    },
    {
      joNo: 'RA0003974',
      quoteNo: 'SQ-2026-0043',
      customerNo: '006501',
      plateNo: 'NDR8821',
      advisor: 'RICHARD P. REYES',
      cubeTopperNo: '12',
      status: JOStatus.IN_PROGRESS,
      technician: 'ALBERTO MANALO',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Transmission Overhaul Labor',
          quantity: 1,
          unitPrice: 12000.0,
          discount: 1200.0,
          netAmount: 10800.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Clutch Lining Kit',
          quantity: 1,
          unitPrice: 9500.0,
          discount: 0,
          netAmount: 9500.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Transmission Oil 75W-90',
          quantity: 5,
          unitPrice: 650.0,
          discount: 0,
          netAmount: 3250.0,
        },
      ],
      actualLaborCost: 9000.0,
      actualPartsCost: 16000.0,
      billedAmount: 28450.0,
    },
    {
      joNo: 'RA0003975',
      quoteNo: 'SQ-2026-0044',
      customerNo: '006502',
      plateNo: 'NCN5520',
      advisor: 'JEROME P. JIMENEZ',
      cubeTopperNo: '04',
      status: JOStatus.PARTS_PENDING,
      technician: 'REYNALDO DIZON',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Aircon General Cleaning Labor',
          quantity: 1,
          unitPrice: 2500.0,
          discount: 300.0,
          netAmount: 2200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Replacement Evaporator Assembly',
          quantity: 1,
          unitPrice: 12000.0,
          discount: 0,
          netAmount: 12000.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Freon Top-up R134a',
          quantity: 2,
          unitPrice: 1500.0,
          discount: 0,
          netAmount: 3000.0,
        },
      ],
      actualLaborCost: 2200.0,
      actualPartsCost: 14000.0,
      billedAmount: 18200.0,
    },
    {
      joNo: 'RA0003976',
      quoteNo: null,
      customerNo: '006503',
      plateNo: 'CBA9901',
      advisor: 'JEROME P. JIMENEZ',
      cubeTopperNo: '06',
      status: JOStatus.APPROVED,
      technician: null,
      items: [
        {
          itemType: ItemType.LABOR,
          description: '4-Wheel Brake Cleaning Labor',
          quantity: 4,
          unitPrice: 600.0,
          discount: 0,
          netAmount: 2400.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Brake Rotor Refacing Service',
          quantity: 4,
          unitPrice: 1100.0,
          discount: 400.0,
          netAmount: 4000.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Brake Fluid DOT4',
          quantity: 2,
          unitPrice: 450.0,
          discount: 0,
          netAmount: 900.0,
        },
      ],
      actualLaborCost: 2400.0,
      actualPartsCost: 4900.0,
      billedAmount: 12500.0,
    },
    {
      joNo: 'RA0003977',
      quoteNo: null,
      customerNo: '006504',
      plateNo: 'CBB1204',
      advisor: 'RICHARD P. REYES',
      cubeTopperNo: '09',
      status: JOStatus.COMPLETED,
      technician: 'MARIO PANGANIBAN',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Radiator & Coolant Replacement Labor',
          quantity: 1,
          unitPrice: 3500.0,
          discount: 0,
          netAmount: 3500.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Radiator Assembly Toyota Commuter',
          quantity: 1,
          unitPrice: 14500.0,
          discount: 0,
          netAmount: 14500.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Coolant Concentrate 4L',
          quantity: 2,
          unitPrice: 650.0,
          discount: 0,
          netAmount: 1300.0,
        },
      ],
      actualLaborCost: 3500.0,
      actualPartsCost: 15800.0,
      billedAmount: 24800.0,
    },
    {
      joNo: 'RA0003978',
      quoteNo: null,
      customerNo: '006505',
      plateNo: 'CAJ8810',
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '02',
      status: JOStatus.CLOSED,
      technician: 'ALBERTO MANALO',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Suspension Overhaul Labor',
          quantity: 1,
          unitPrice: 6500.0,
          discount: 500.0,
          netAmount: 6000.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Shock Absorbers Front Pair',
          quantity: 1,
          unitPrice: 8500.0,
          discount: 0,
          netAmount: 8500.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Shock Absorbers Rear Pair',
          quantity: 1,
          unitPrice: 8200.0,
          discount: 0,
          netAmount: 8200.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Wheel Alignment',
          quantity: 1,
          unitPrice: 1200.0,
          discount: 300.0,
          netAmount: 900.0,
        },
      ],
      actualLaborCost: 6000.0,
      actualPartsCost: 16700.0,
      billedAmount: 34100.0,
    },
    {
      joNo: 'RA0003979',
      quoteNo: null,
      customerNo: '006500',
      plateNo: 'NBF4912',
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '11',
      status: JOStatus.DRAFT,
      technician: null,
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Battery Replacement & Starter Inspection Labor',
          quantity: 1,
          unitPrice: 1200.0,
          discount: 0,
          netAmount: 1200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Maintenance-Free Battery 2SMF',
          quantity: 1,
          unitPrice: 4800.0,
          discount: 0,
          netAmount: 4800.0,
        },
      ],
      actualLaborCost: 0,
      actualPartsCost: 0,
      billedAmount: 0,
    },
    {
      joNo: 'RA0003980',
      quoteNo: null,
      customerNo: '006501',
      plateNo: 'CAK3091',
      advisor: 'RICHARD P. REYES',
      cubeTopperNo: '15',
      status: JOStatus.BILLED,
      technician: 'REYNALDO DIZON',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Heavy PMS Labor Hino 300',
          quantity: 1,
          unitPrice: 8500.0,
          discount: 500.0,
          netAmount: 8000.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Fuel Filters Primary + Secondary',
          quantity: 2,
          unitPrice: 1450.0,
          discount: 0,
          netAmount: 2900.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Engine Oil 15W-40 Pail 20L',
          quantity: 1,
          unitPrice: 5200.0,
          discount: 0,
          netAmount: 5200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Air Cleaner Element',
          quantity: 1,
          unitPrice: 2800.0,
          discount: 0,
          netAmount: 2800.0,
        },
      ],
      actualLaborCost: 8000.0,
      actualPartsCost: 10900.0,
      billedAmount: 42000.0,
    },
    {
      joNo: 'RA0003981',
      quoteNo: null,
      customerNo: '006504',
      plateNo: 'NDO7743',
      advisor: 'RICHARD P. REYES',
      cubeTopperNo: '07',
      status: JOStatus.COMPLETED,
      technician: 'MARIO PANGANIBAN',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'Wheel Alignment & Tire Balancing Labor',
          quantity: 1,
          unitPrice: 1800.0,
          discount: 0,
          netAmount: 1800.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Tire Balancing Weights',
          quantity: 1,
          unitPrice: 200.0,
          discount: 0,
          netAmount: 200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Tire Valve Replacement Set',
          quantity: 1,
          unitPrice: 400.0,
          discount: 0,
          netAmount: 400.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Front Brake Pads',
          quantity: 1,
          unitPrice: 2200.0,
          discount: 0,
          netAmount: 2200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'Rear Brake Shoes',
          quantity: 1,
          unitPrice: 2000.0,
          discount: 0,
          netAmount: 2000.0,
        },
      ],
      actualLaborCost: 1800.0,
      actualPartsCost: 6600.0,
      billedAmount: 8600.0,
    },
    {
      joNo: 'RA0003982',
      quoteNo: null,
      customerNo: '006505',
      plateNo: 'NDN3302',
      advisor: 'JEROME P. JIMENEZ',
      cubeTopperNo: '03',
      status: JOStatus.IN_PROGRESS,
      technician: 'ALBERTO MANALO',
      items: [
        {
          itemType: ItemType.LABOR,
          description: 'EGR Cleaning & Fuel Injector Calibration Labor',
          quantity: 1,
          unitPrice: 4500.0,
          discount: 300.0,
          netAmount: 4200.0,
        },
        {
          itemType: ItemType.PARTS,
          description: 'EGR Valve Gasket Set',
          quantity: 1,
          unitPrice: 1800.0,
          discount: 0,
          netAmount: 1800.0,
        },
        {
          itemType: ItemType.MISC,
          description: 'Fuel Injector Cleaner Additive',
          quantity: 2,
          unitPrice: 650.0,
          discount: 0,
          netAmount: 1300.0,
        },
      ],
      actualLaborCost: 4200.0,
      actualPartsCost: 3100.0,
      billedAmount: 19500.0,
    },
  ];

  const seededJOs: Record<string, Awaited<ReturnType<typeof prisma.jobOrder.upsert>>> = {};
  for (const joInput of jobOrderInputs) {
    const totalEstimatedLabor = joInput.items
      .filter((i) => i.itemType === ItemType.LABOR)
      .reduce((sum, i) => sum + i.netAmount, 0);
    const totalEstimatedParts = joInput.items
      .filter((i) => i.itemType === ItemType.PARTS)
      .reduce((sum, i) => sum + i.netAmount, 0);
    const netProfit = joInput.billedAmount - joInput.actualLaborCost - joInput.actualPartsCost;

    const upsertedJo = await prisma.jobOrder.upsert({
      where: { joNo: joInput.joNo },
      update: {
        sqId: joInput.quoteNo ? seededQuotes[joInput.quoteNo]?.id : null,
        customerId: seededCustomers[joInput.customerNo].id,
        vehicleId: seededVehicles[joInput.plateNo].id,
        advisor: joInput.advisor,
        technician: joInput.technician,
        cubeTopperNo: joInput.cubeTopperNo,
        status: joInput.status,
        totalEstimatedLabor,
        totalEstimatedParts,
        actualLaborCost: joInput.actualLaborCost,
        actualPartsCost: joInput.actualPartsCost,
        billedAmount: joInput.billedAmount,
        netProfit,
      },
      create: {
        joNo: joInput.joNo,
        sqId: joInput.quoteNo ? seededQuotes[joInput.quoteNo]?.id : null,
        customerId: seededCustomers[joInput.customerNo].id,
        vehicleId: seededVehicles[joInput.plateNo].id,
        advisor: joInput.advisor,
        technician: joInput.technician,
        cubeTopperNo: joInput.cubeTopperNo,
        status: joInput.status,
        totalEstimatedLabor,
        totalEstimatedParts,
        actualLaborCost: joInput.actualLaborCost,
        actualPartsCost: joInput.actualPartsCost,
        billedAmount: joInput.billedAmount,
        netProfit,
        items: { create: joInput.items },
      },
    });
    seededJOs[joInput.joNo] = upsertedJo;

    await prisma.jobOrderEvent.deleteMany({ where: { joId: upsertedJo.id } });
    await prisma.jobOrderEvent.createMany({
      data: [
        {
          joId: upsertedJo.id,
          eventType: 'CREATED',
          description: `Job Order ${joInput.joNo} created`,
        },
        {
          joId: upsertedJo.id,
          eventType: 'STATUS_CHANGE',
          description: `Status set to ${joInput.status}`,
        },
      ],
    });
  }

  const jo = seededJOs['RA0003973'];

  const usersByEmail: Record<
    string,
    Awaited<ReturnType<typeof prisma.user.findUniqueOrThrow>>
  > = {};
  for (const email of [
    'admin@lemans.ph',
    'gm@lemans.ph',
    'sales@lemans.ph',
    'svc@lemans.ph',
    'purch@lemans.ph',
    'dcs@lemans.ph',
  ]) {
    usersByEmail[email] = await prisma.user.findUniqueOrThrow({ where: { email } });
  }
  const adminUser = usersByEmail['admin@lemans.ph'];
  const gmUser = usersByEmail['gm@lemans.ph'];
  const salesUser = usersByEmail['sales@lemans.ph'];
  const svcUser = usersByEmail['svc@lemans.ph'];
  const purchUser = usersByEmail['purch@lemans.ph'];
  const dcsUser = usersByEmail['dcs@lemans.ph'];

  const prInputs = [
    {
      prNo: 'PR-2026-0042',
      joNo: 'RA0003973',
      status: PRStatus.APPROVED,
      requestedById: purchUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-02'),
      notes: 'Urgent parts for RA0003973',
      items: [
        {
          description: 'MINERAL ENG OIL 15W-40 (WURTH)',
          quantity: 4,
          unitCost: 300.0,
          total: 1200.0,
        },
        { description: 'OIL FILTER VIC C-110', quantity: 1, unitCost: 300.0, total: 300.0 },
      ],
    },
    {
      prNo: 'PR-2026-0043',
      joNo: 'RA0003974',
      status: PRStatus.APPROVED,
      requestedById: purchUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-03'),
      notes: 'Transmission overhaul parts',
      items: [
        { description: 'Clutch Lining Kit', quantity: 1, unitCost: 9000.0, total: 9000.0 },
        { description: 'Transmission Oil 75W-90', quantity: 5, unitCost: 600.0, total: 3000.0 },
      ],
    },
    {
      prNo: 'PR-2026-0044',
      joNo: 'RA0003977',
      status: PRStatus.APPROVED,
      requestedById: purchUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-04'),
      notes: 'Radiator replacement parts',
      items: [
        {
          description: 'Radiator Assembly Toyota Commuter',
          quantity: 1,
          unitCost: 14000.0,
          total: 14000.0,
        },
        { description: 'Coolant Concentrate 4L', quantity: 2, unitCost: 600.0, total: 1200.0 },
      ],
    },
    {
      prNo: 'PR-2026-0045',
      joNo: 'RA0003975',
      status: PRStatus.PENDING_APPROVAL,
      requestedById: purchUser.id,
      approvedById: null,
      approvedAt: null,
      notes: 'Aircon evaporator and freon',
      items: [
        {
          description: 'Replacement Evaporator Assembly',
          quantity: 1,
          unitCost: 11500.0,
          total: 11500.0,
        },
        { description: 'Freon Top-up R134a', quantity: 2, unitCost: 1400.0, total: 2800.0 },
      ],
    },
    {
      prNo: 'PR-2026-0046',
      joNo: null,
      status: PRStatus.APPROVED,
      requestedById: purchUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-05'),
      notes: 'General shop replenishment',
      items: [
        { description: 'Shop Supplies Bundle', quantity: 1, unitCost: 5000.0, total: 5000.0 },
      ],
    },
  ];

  const seededPRs: Record<
    string,
    Awaited<ReturnType<typeof prisma.purchaseRequest.create>> & {
      items: { description: string; quantity: number; unitCost: number; total: number }[];
    }
  > = {};
  for (const p of prInputs) {
    const existing = await prisma.purchaseRequest.findUnique({
      where: { prNo: p.prNo },
      include: { items: true },
    });
    if (existing) {
      await prisma.purchaseRequest.update({
        where: { id: existing.id },
        data: {
          joId: p.joNo ? seededJOs[p.joNo].id : null,
          status: p.status,
          requestedById: p.requestedById,
          approvedById: p.approvedById,
          approvedAt: p.approvedAt,
          notes: p.notes,
        },
      });
      seededPRs[p.prNo] = await prisma.purchaseRequest.findUniqueOrThrow({
        where: { id: existing.id },
        include: { items: true },
      });
      continue;
    }

    seededPRs[p.prNo] = await prisma.purchaseRequest.create({
      data: {
        prNo: p.prNo,
        joId: p.joNo ? seededJOs[p.joNo].id : null,
        status: p.status,
        requestedById: p.requestedById,
        approvedById: p.approvedById,
        approvedAt: p.approvedAt,
        notes: p.notes,
        items: { create: p.items },
      },
      include: { items: true },
    });
  }

  const poInputs = [
    {
      poNo: 'PO-2026-0042',
      prNo: 'PR-2026-0042',
      status: POStatus.RECEIVED,
      supplier: 'WURTH Philippines',
      total: 1500.0,
      orderedAt: new Date('2026-08-01'),
      receivedAt: new Date('2026-08-03'),
      notes: 'Delivered complete',
    },
    {
      poNo: 'PO-2026-0043',
      prNo: 'PR-2026-0043',
      status: POStatus.RECEIVED,
      supplier: 'Tri-Star Auto Parts Angeles',
      total: 12000.0,
      orderedAt: new Date('2026-08-03'),
      receivedAt: new Date('2026-08-05'),
      notes: 'Delivered complete',
    },
    {
      poNo: 'PO-2026-0044',
      prNo: 'PR-2026-0044',
      status: POStatus.RECEIVED,
      supplier: 'Pampanga Automotive Supply',
      total: 15200.0,
      orderedAt: new Date('2026-08-04'),
      receivedAt: new Date('2026-08-06'),
      notes: 'Delivered complete',
    },
    {
      poNo: 'PO-2026-0045',
      prNo: 'PR-2026-0046',
      status: POStatus.SENT,
      supplier: 'Central Luzon Hardware',
      total: 5000.0,
      orderedAt: new Date('2026-08-06'),
      receivedAt: null,
      notes: 'In transit',
    },
    {
      poNo: 'PO-2026-0046',
      prNo: 'PR-2026-0045',
      status: POStatus.DRAFT,
      supplier: 'Pampanga Automotive Supply',
      total: 14300.0,
      orderedAt: null,
      receivedAt: null,
      notes: 'Pending GM approval',
    },
  ];

  const seededPOs: Record<string, Awaited<ReturnType<typeof prisma.purchaseOrder.upsert>>> = {};
  for (const poInput of poInputs) {
    const pr = seededPRs[poInput.prNo];
    seededPOs[poInput.poNo] = await prisma.purchaseOrder.upsert({
      where: { poNo: poInput.poNo },
      update: {
        prId: pr.id,
        status: poInput.status,
        supplier: poInput.supplier,
        total: poInput.total,
        orderedAt: poInput.orderedAt,
        receivedAt: poInput.receivedAt,
        notes: poInput.notes,
      },
      create: {
        poNo: poInput.poNo,
        prId: pr.id,
        status: poInput.status,
        supplier: poInput.supplier,
        total: poInput.total,
        orderedAt: poInput.orderedAt,
        receivedAt: poInput.receivedAt,
        notes: poInput.notes,
        items: {
          create: pr.items.map(
            (item: { description: string; quantity: number; unitCost: number; total: number }) => ({
              description: item.description,
              quantity: item.quantity,
              unitCost: item.unitCost,
              total: item.total,
              receivedQty: item.quantity,
            })
          ),
        },
      },
    });
  }

  const siInputs = [
    {
      siNo: 'SI-2026-0042',
      poNo: 'PO-2026-0042',
      supplier: 'WURTH Philippines',
      invoiceDate: new Date('2026-08-03'),
      totalAmount: 1500.0,
      status: SIStatus.PAID,
      notes: 'Paid via BDO cheque',
      allocations: [
        { joNo: 'RA0003973', amount: 1500.0, description: 'Parts allocated to RA0003973' },
      ],
      disbursement: {
        amount: 1500.0,
        paymentMethod: 'CHEQUE',
        referenceNo: 'BDO-123456',
        paidAt: new Date('2026-08-04'),
      },
    },
    {
      siNo: 'INV-TS-9910',
      poNo: 'PO-2026-0043',
      supplier: 'Tri-Star Auto Parts Angeles',
      invoiceDate: new Date('2026-08-05'),
      totalAmount: 45000.0,
      status: SIStatus.PAID,
      notes: 'Multi-JO allocation invoice',
      allocations: [
        { joNo: 'RA0003974', amount: 20000.0, description: 'Transmission parts RA0003974' },
        { joNo: 'RA0003975', amount: 15000.0, description: 'Aircon parts RA0003975' },
        { joNo: 'RA0003979', amount: 10000.0, description: 'Shop stock' },
      ],
      disbursement: {
        amount: 45000.0,
        paymentMethod: 'CHEQUE',
        referenceNo: 'BDO-0089201',
        paidAt: new Date('2026-08-06'),
      },
    },
    {
      siNo: 'INV-PAS-4011',
      poNo: 'PO-2026-0044',
      supplier: 'Pampanga Automotive Supply',
      invoiceDate: new Date('2026-08-06'),
      totalAmount: 28000.0,
      status: SIStatus.PAID,
      notes: 'Radiator and suspension parts',
      allocations: [
        { joNo: 'RA0003977', amount: 18000.0, description: 'Radiator assembly RA0003977' },
        { joNo: 'RA0003978', amount: 10000.0, description: 'Suspension parts RA0003978' },
      ],
      disbursement: {
        amount: 28000.0,
        paymentMethod: 'CHEQUE',
        referenceNo: 'BPI-441092',
        paidAt: new Date('2026-08-07'),
      },
    },
  ];

  const seededSIs: Record<string, Awaited<ReturnType<typeof prisma.supplierInvoice.upsert>>> = {};
  for (const siInput of siInputs) {
    const po = seededPOs[siInput.poNo];
    seededSIs[siInput.siNo] = await prisma.supplierInvoice.upsert({
      where: { siNo: siInput.siNo },
      update: {
        poId: po.id,
        supplier: siInput.supplier,
        invoiceDate: siInput.invoiceDate,
        totalAmount: siInput.totalAmount,
        status: siInput.status,
        notes: siInput.notes,
      },
      create: {
        siNo: siInput.siNo,
        poId: po.id,
        supplier: siInput.supplier,
        invoiceDate: siInput.invoiceDate,
        totalAmount: siInput.totalAmount,
        status: siInput.status,
        notes: siInput.notes,
      },
    });

    await prisma.supplierInvoiceAllocation.deleteMany({
      where: { siId: seededSIs[siInput.siNo].id },
    });
    await prisma.supplierInvoiceAllocation.createMany({
      data: siInput.allocations.map((a) => ({
        siId: seededSIs[siInput.siNo].id,
        joId: seededJOs[a.joNo].id,
        amount: a.amount,
        description: a.description,
      })),
    });

    await prisma.disbursement.upsert({
      where: { disbursementNo: `DCS-${siInput.siNo}` },
      update: {
        supplierInvoiceId: seededSIs[siInput.siNo].id,
        amount: siInput.disbursement.amount,
        status: 'PAID',
        paymentMethod: siInput.disbursement.paymentMethod,
        referenceNo: siInput.disbursement.referenceNo,
        paidAt: siInput.disbursement.paidAt,
        recordedById: dcsUser.id,
      },
      create: {
        disbursementNo: `DCS-${siInput.siNo}`,
        supplierInvoiceId: seededSIs[siInput.siNo].id,
        amount: siInput.disbursement.amount,
        status: 'PAID',
        paymentMethod: siInput.disbursement.paymentMethod,
        referenceNo: siInput.disbursement.referenceNo,
        paidAt: siInput.disbursement.paidAt,
        recordedById: dcsUser.id,
      },
    });
  }

  const pr = seededPRs['PR-2026-0042'];
  const po = seededPOs['PO-2026-0042'];
  const si = seededSIs['SI-2026-0042'];

  const opexInputs = [
    {
      requestNo: 'OPEX-GJOB-JULY/2026-007',
      category: 'Acetylene Gas Refill',
      description: 'Acetylene gas cylinder refill for oxy-fuel cutting',
      amount: 4500.0,
      requestedById: svcUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-07-28'),
      status: OpexStatus.DISBURSED,
      notes: 'Approved by GM',
      disbursement: {
        paymentMethod: 'CHEQUE',
        referenceNo: 'BDO-0089201',
        paidAt: new Date('2026-07-29'),
      },
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-001',
      category: 'Tool Upgrade',
      description: 'Technician Pneumatic Wrench Upgrade',
      amount: 12800.0,
      requestedById: svcUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-01'),
      status: OpexStatus.APPROVED,
      notes: 'Approved by GM — awaiting DCS release',
      disbursement: null,
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-002',
      category: 'Utilities',
      description: 'Facility Electric Utility Bill',
      amount: 28900.0,
      requestedById: svcUser.id,
      approvedById: null,
      approvedAt: null,
      status: OpexStatus.PENDING_APPROVAL,
      notes: 'Pending GM approval',
      disbursement: null,
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-003',
      category: 'Waste Disposal',
      description: 'Shop Waste Oil Disposal Fee',
      amount: 3500.0,
      requestedById: purchUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-02'),
      status: OpexStatus.DISBURSED,
      notes: 'Approved by GM',
      disbursement: {
        paymentMethod: 'CHEQUE',
        referenceNo: 'BPI-441092',
        paidAt: new Date('2026-08-03'),
      },
    },
    {
      requestNo: 'OPEX-2026-0001',
      category: 'Shop Supplies',
      description: 'Monthly shop consumables replenishment',
      amount: 3500.0,
      requestedById: svcUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-03'),
      status: OpexStatus.APPROVED,
      notes: 'Approved by GM — awaiting DCS release',
      disbursement: null,
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-004',
      category: 'Lifting Equipment',
      description: 'Hydraulic Jack Oil Refill',
      amount: 2200.0,
      requestedById: svcUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-04'),
      status: OpexStatus.DISBURSED,
      notes: 'Approved by GM',
      disbursement: {
        paymentMethod: 'CASH',
        referenceNo: 'PETTY-081',
        paidAt: new Date('2026-08-05'),
      },
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-005',
      category: 'Safety',
      description: 'PPE Restock — Gloves, Goggles, Coveralls',
      amount: 5600.0,
      requestedById: purchUser.id,
      approvedById: null,
      approvedAt: null,
      status: OpexStatus.PENDING_APPROVAL,
      notes: 'Pending GM approval',
      disbursement: null,
    },
    {
      requestNo: 'OPEX-GJOB-AUG/2026-006',
      category: 'Air Compressor',
      description: 'Air Compressor Filter and Belt Replacement',
      amount: 7800.0,
      requestedById: svcUser.id,
      approvedById: gmUser.id,
      approvedAt: new Date('2026-08-05'),
      status: OpexStatus.DISBURSED,
      notes: 'Approved by GM',
      disbursement: {
        paymentMethod: 'CHEQUE',
        referenceNo: 'MBTC-770192',
        paidAt: new Date('2026-08-06'),
      },
    },
  ];

  const seededOpex: Record<string, Awaited<ReturnType<typeof prisma.opexRequest.upsert>>> = {};
  for (const opexInput of opexInputs) {
    seededOpex[opexInput.requestNo] = await prisma.opexRequest.upsert({
      where: { requestNo: opexInput.requestNo },
      update: {
        category: opexInput.category,
        description: opexInput.description,
        amount: opexInput.amount,
        requestedById: opexInput.requestedById,
        approvedById: opexInput.approvedById,
        approvedAt: opexInput.approvedAt,
        status: opexInput.status,
        notes: opexInput.notes,
      },
      create: {
        requestNo: opexInput.requestNo,
        category: opexInput.category,
        description: opexInput.description,
        amount: opexInput.amount,
        requestedById: opexInput.requestedById,
        approvedById: opexInput.approvedById,
        approvedAt: opexInput.approvedAt,
        status: opexInput.status,
        notes: opexInput.notes,
      },
    });

    if (opexInput.disbursement) {
      await prisma.disbursement.upsert({
        where: { disbursementNo: `DCS-${opexInput.requestNo}` },
        update: {
          opexRequestId: seededOpex[opexInput.requestNo].id,
          amount: opexInput.amount,
          status: 'PAID',
          paymentMethod: opexInput.disbursement.paymentMethod,
          referenceNo: opexInput.disbursement.referenceNo,
          paidAt: opexInput.disbursement.paidAt,
          recordedById: dcsUser.id,
        },
        create: {
          disbursementNo: `DCS-${opexInput.requestNo}`,
          opexRequestId: seededOpex[opexInput.requestNo].id,
          amount: opexInput.amount,
          status: 'PAID',
          paymentMethod: opexInput.disbursement.paymentMethod,
          referenceNo: opexInput.disbursement.referenceNo,
          paidAt: opexInput.disbursement.paidAt,
          recordedById: dcsUser.id,
        },
      });
    }
  }

  const serviceInvoiceInputs = [
    {
      invoiceNo: 'INV-2026-0042',
      joNo: 'RA0003973',
      subtotal: 15931.49,
      vatAmount: 1911.78,
      total: 17843.27,
      status: ServiceInvoiceStatus.SENT,
      dueDate: new Date('2026-08-21'),
      notes: 'VAT inclusive billing for RA0003973',
      payments: [
        {
          amount: 7843.27,
          paymentMethod: 'CASH',
          referenceNo: 'CASH-RA3973',
          paidAt: new Date('2026-08-07'),
        },
      ],
    },
    {
      invoiceNo: 'INV-2026-0043',
      joNo: 'RA0003974',
      subtotal: 28450.0,
      vatAmount: 3414.0,
      total: 31864.0,
      status: ServiceInvoiceStatus.SENT,
      dueDate: new Date('2026-08-25'),
      notes: 'VAT inclusive billing for RA0003974',
      payments: [],
    },
    {
      invoiceNo: 'INV-2026-0044',
      joNo: 'RA0003978',
      subtotal: 34100.0,
      vatAmount: 4092.0,
      total: 38192.0,
      status: ServiceInvoiceStatus.PAID,
      dueDate: new Date('2026-08-10'),
      notes: 'VAT inclusive billing for RA0003978',
      payments: [
        {
          amount: 38192.0,
          paymentMethod: 'CHEQUE',
          referenceNo: 'BDO-CHK-3312',
          paidAt: new Date('2026-08-11'),
        },
      ],
    },
    {
      invoiceNo: 'INV-2026-0045',
      joNo: 'RA0003980',
      subtotal: 42000.0,
      vatAmount: 5040.0,
      total: 47040.0,
      status: ServiceInvoiceStatus.PARTIAL,
      dueDate: new Date('2026-08-28'),
      notes: 'VAT inclusive billing for RA0003980',
      payments: [
        {
          amount: 20000.0,
          paymentMethod: 'CASH',
          referenceNo: 'DP-RA3980',
          paidAt: new Date('2026-08-08'),
        },
      ],
    },
  ];

  for (const inv of serviceInvoiceInputs) {
    const joRef = seededJOs[inv.joNo];
    const created = await prisma.serviceInvoice.upsert({
      where: { invoiceNo: inv.invoiceNo },
      update: {},
      create: {
        invoiceNo: inv.invoiceNo,
        joId: joRef.id,
        customerId: joRef.customerId,
        subtotal: inv.subtotal,
        vatAmount: inv.vatAmount,
        total: inv.total,
        status: inv.status,
        dueDate: inv.dueDate,
        notes: inv.notes,
      },
    });

    await prisma.payment.deleteMany({ where: { serviceInvoiceId: created.id } });
    if (inv.payments.length > 0) {
      await prisma.payment.createMany({
        data: inv.payments.map((p) => ({
          serviceInvoiceId: created.id,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          referenceNo: p.referenceNo,
          paidAt: p.paidAt,
          recordedById: dcsUser.id,
        })),
      });
    }
  }

  const seededCustomerCount = Object.keys(seededCustomers).length;
  const seededVehicleCount = Object.keys(seededVehicles).length;
  const seededJOCount = Object.keys(seededJOs).length;
  const seededPOCount = Object.keys(seededPOs).length;
  const seededOpexCount = Object.keys(seededOpex).length;

  console.log(
    `Seeding complete! ${seededCustomerCount} customers, ${seededVehicleCount} vehicles, ${seededJOCount} job orders, ${seededPOCount} purchase orders, ${seededOpexCount} OPEX records, ${Object.keys(seededQuotes).length} quotes, ${Object.keys(seededSIs).length} supplier invoices created.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
