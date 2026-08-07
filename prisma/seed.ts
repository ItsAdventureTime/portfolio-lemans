import { PrismaClient, ItemType, SQStatus, JOStatus, ProjectRole } from '@prisma/client';
import { hashPassword } from '@better-auth/utils/password';

const prisma = new PrismaClient();

const DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'demo12345';

const demoUsers: Array<{ email: string; name: string; role: ProjectRole }> = [
  { email: 'sales@lemans.ph', name: 'Demo Sales', role: 'ROLE_SALES' },
  { email: 'svc@lemans.ph', name: 'Demo Service Advisor', role: 'ROLE_SVC' },
  { email: 'purch@lemans.ph', name: 'Demo Purchasing', role: 'ROLE_PURCH' },
  { email: 'gm@lemans.ph', name: 'Demo General Manager', role: 'ROLE_GM' },
  { email: 'dcs@lemans.ph', name: 'Demo DCS', role: 'ROLE_DCS' },
  { email: 'admin@lemans.ph', name: 'Demo Admin', role: 'ROLE_ADMIN' },
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

  const customer = await prisma.customer.upsert({
    where: { customerNo: '006500' },
    update: {},
    create: {
      customerNo: '006500',
      name: 'ACCUSTANDARD MEDICAL AND DIAGNOSTIC CORP.',
      address: 'EL DECARO BLDG. B2L2 ST. JUDE SUB. SAN AGUSTIN CITY OF SAN FERNANDO PAMPANGA',
      phone: '0917-136-6569',
      email: 'contact@accustandard.ph',
    },
  });

  const vehicle = await prisma.vehicle.upsert({
    where: { plateNo: 'CBE7864' },
    update: {},
    create: {
      customerId: customer.id,
      plateNo: 'CBE7864',
      vinChassis: 'MHKB3FE10NK001080',
      engineNo: '2NRG909564',
      makeModel: '2023 TOYOTA LITEACE',
      year: '2023',
      color: 'WHITE',
      odometer: 125000,
    },
  });

  const quote = await prisma.salesQuotation.upsert({
    where: { quoteNo: 'SQ-2026-0042' },
    update: {},
    create: {
      quoteNo: 'SQ-2026-0042',
      customerId: customer.id,
      vehicleId: vehicle.id,
      advisor: 'JEFFREY P. PERIN',
      totalLabor: 2880.0,
      totalParts: 13051.49,
      netTotal: 15931.49,
      status: SQStatus.CONVERTED,
      items: {
        create: [
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
    },
  });

  const jo = await prisma.jobOrder.upsert({
    where: { joNo: 'RA0003973' },
    update: {
      sqId: quote.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '08',
      status: JOStatus.IN_PROGRESS,
      totalEstimatedLabor: 2880.0,
      totalEstimatedParts: 13051.49,
      actualLaborCost: 2100.0,
      actualPartsCost: 9850.0,
      billedAmount: 15931.49,
      netProfit: 3981.49,
    },
    create: {
      joNo: 'RA0003973',
      sqId: quote.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '08',
      status: JOStatus.IN_PROGRESS,
      totalEstimatedLabor: 2880.0,
      totalEstimatedParts: 13051.49,
      actualLaborCost: 2100.0,
      actualPartsCost: 9850.0,
      billedAmount: 15931.49,
      netProfit: 3981.49,
      items: {
        create: [
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
      },
    },
  });

  await prisma.jobOrderEvent.deleteMany({ where: { joId: jo.id } });
  await prisma.jobOrderEvent.createMany({
    data: [
      {
        joId: jo.id,
        eventType: 'CREATED',
        description: 'Job Order created from Sales Quotation SQ-2026-0042',
      },
      {
        joId: jo.id,
        eventType: 'STATUS_CHANGE',
        description: 'Status set to IN_PROGRESS',
      },
    ],
  });

  const purchUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'purch@lemans.ph' },
  });
  const svcUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'svc@lemans.ph' },
  });
  const dcsUser = await prisma.user.findUniqueOrThrow({
    where: { email: 'dcs@lemans.ph' },
  });

  const pr = await prisma.purchaseRequest.upsert({
    where: { prNo: 'PR-2026-0042' },
    update: {},
    create: {
      prNo: 'PR-2026-0042',
      joId: jo.id,
      status: 'PENDING_APPROVAL',
      requestedById: purchUser.id,
      notes: 'Urgent parts for RA0003973',
      items: {
        create: [
          {
            description: 'MINERAL ENG OIL 15W-40 (WURTH)',
            quantity: 4,
            unitCost: 300.0,
            total: 1200.0,
          },
          {
            description: 'OIL FILTER VIC C-110',
            quantity: 1,
            unitCost: 300.0,
            total: 300.0,
          },
        ],
      },
    },
  });

  const po = await prisma.purchaseOrder.upsert({
    where: { poNo: 'PO-2026-0042' },
    update: {},
    create: {
      poNo: 'PO-2026-0042',
      prId: pr.id,
      status: 'RECEIVED',
      supplier: 'WURTH Philippines',
      total: 1500.0,
      orderedAt: new Date('2026-08-01'),
      receivedAt: new Date('2026-08-03'),
      notes: 'Delivered complete',
    },
  });

  const si = await prisma.supplierInvoice.upsert({
    where: { siNo: 'SI-2026-0042' },
    update: {},
    create: {
      siNo: 'SI-2026-0042',
      poId: po.id,
      supplier: 'WURTH Philippines',
      invoiceDate: new Date('2026-08-03'),
      totalAmount: 1500.0,
      status: 'PAID',
      notes: 'Paid via BDO cheque',
    },
  });

  await prisma.supplierInvoiceAllocation.deleteMany({ where: { siId: si.id } });
  await prisma.supplierInvoiceAllocation.create({
    data: {
      siId: si.id,
      joId: jo.id,
      amount: 1500.0,
      description: 'Parts allocated to RA0003973',
    },
  });

  await prisma.disbursement.upsert({
    where: { disbursementNo: 'DCS-2026-0042' },
    update: {},
    create: {
      disbursementNo: 'DCS-2026-0042',
      supplierInvoiceId: si.id,
      amount: 1500.0,
      status: 'PAID',
      paymentMethod: 'CHEQUE',
      referenceNo: 'BDO-123456',
      paidAt: new Date('2026-08-04'),
      recordedById: dcsUser.id,
    },
  });

  const opex = await prisma.opexRequest.upsert({
    where: { requestNo: 'OPEX-2026-0001' },
    update: {},
    create: {
      requestNo: 'OPEX-2026-0001',
      category: 'Shop Supplies',
      description: 'Monthly shop consumables replenishment',
      amount: 3500.0,
      requestedById: svcUser.id,
      status: 'APPROVED',
      notes: 'Approved by GM',
    },
  });

  await prisma.disbursement.upsert({
    where: { disbursementNo: 'DCS-2026-0001' },
    update: {},
    create: {
      disbursementNo: 'DCS-2026-0001',
      opexRequestId: opex.id,
      amount: 3500.0,
      status: 'PENDING',
      recordedById: dcsUser.id,
    },
  });

  await prisma.serviceInvoice.upsert({
    where: { invoiceNo: 'INV-2026-0042' },
    update: {},
    create: {
      invoiceNo: 'INV-2026-0042',
      joId: jo.id,
      customerId: customer.id,
      subtotal: 15931.49,
      vatAmount: 1911.78,
      total: 17843.27,
      status: 'SENT',
      dueDate: new Date('2026-08-21'),
      notes: 'VAT inclusive billing for RA0003973',
    },
  });

  console.log(`Seeding complete! Job Order ${jo.joNo} and supporting records created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
