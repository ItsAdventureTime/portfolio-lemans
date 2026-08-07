import { PrismaClient, ItemType, SQStatus, JOStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Le Mans database with authentic reference data...');

  // Create Customer matching Service Invoice & Repair Order RA0003973
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

  // Create Vehicle matching RA0003973
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

  // Create Sales Quotation
  const quote = await prisma.salesQuotation.create({
    data: {
      quoteNo: 'SQ-2026-0042',
      customerId: customer.id,
      vehicleId: vehicle.id,
      advisor: 'JEFFREY P. PERIN',
      totalLabor: 2880.00,
      totalParts: 13051.49,
      netTotal: 15931.49,
      status: SQStatus.CONVERTED,
      items: {
        create: [
          {
            itemType: ItemType.LABOR,
            description: 'Perform 125,000 kilometers Check up Service Labor',
            quantity: 1,
            unitPrice: 2000.00,
            discount: 200.00,
            netAmount: 1800.00,
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
            unitPrice: 345.00,
            discount: 34.50,
            netAmount: 310.50,
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
            unitPrice: 1111.50,
            discount: 0,
            netAmount: 1111.50,
          },
          {
            itemType: ItemType.PARTS,
            description: 'FRT BRAKE PADS SET',
            quantity: 1,
            unitPrice: 2925.00,
            discount: 0,
            netAmount: 2925.00,
          },
          {
            itemType: ItemType.LABOR,
            description: 'Cleaning of Throttle Valve and Replace Spark Plugs Labor',
            quantity: 2,
            unitPrice: 600.00,
            discount: 120.00,
            netAmount: 1080.00,
          },
          {
            itemType: ItemType.PARTS,
            description: 'SPARK PLUG (IRIDIUM)',
            quantity: 4,
            unitPrice: 1560.00,
            discount: 624.00,
            netAmount: 5616.00,
          },
        ],
      },
    },
  });

  // Create Job Order RA0003973
  const jo = await prisma.jobOrder.create({
    data: {
      joNo: 'RA0003973',
      sqId: quote.id,
      customerId: customer.id,
      vehicleId: vehicle.id,
      advisor: 'JEFFREY P. PERIN',
      cubeTopperNo: '08',
      status: JOStatus.IN_PROGRESS,
      totalEstimatedLabor: 2880.00,
      totalEstimatedParts: 13051.49,
      actualLaborCost: 2100.00,
      actualPartsCost: 9850.00,
      billedAmount: 15931.49,
      netProfit: 3981.49,
      items: {
        create: [
          {
            itemType: ItemType.LABOR,
            description: 'Perform 125,000 kilometers Check up Service Labor',
            quantity: 1,
            unitPrice: 2000.00,
            discount: 200.00,
            netAmount: 1800.00,
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
            unitPrice: 345.00,
            discount: 34.50,
            netAmount: 310.50,
          },
          {
            itemType: ItemType.LABOR,
            description: 'Cleaning of Throttle Valve and Replace Spark Plugs Labor',
            quantity: 2,
            unitPrice: 600.00,
            discount: 120.00,
            netAmount: 1080.00,
          },
          {
            itemType: ItemType.PARTS,
            description: 'SPARK PLUG (IRIDIUM)',
            quantity: 4,
            unitPrice: 1560.00,
            discount: 624.00,
            netAmount: 5616.00,
          },
        ],
      },
    },
  });

  console.log(`Seeding complete! Job Order ${jo.joNo} created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
