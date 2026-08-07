import { db } from '../lib/db';

// These integration tests exercise the database layer behind the creation
// forms directly, avoiding the Next.js server action runtime (which depends
// on request-scoped `headers()`). They rely on the demo seed schema and are
// safe only in the local/demo container environment.

export async function runCreationFormTests() {
  console.log('Running creation form integration tests...');

  const suffix = Date.now();

  // Customer + vehicle creation
  const customer = await db.customer.create({
    data: {
      customerNo: `TEST-CUST-${suffix}`,
      name: 'Test Customer Corp',
      address: '123 Test St',
      vehicles: {
        create: {
          plateNo: `TEST-PLT-${suffix}`,
          makeModel: '2024 Test Sedan',
        },
      },
    },
    include: { vehicles: true },
  });

  if (!customer || customer.vehicles.length === 0) {
    throw new Error('Customer and vehicle were not created');
  }

  // Sales quotation creation
  const quoteCount = await db.salesQuotation.count();
  const quoteNo = `SQ-TEST-${suffix}`;
  await db.salesQuotation.create({
    data: {
      quoteNo,
      customerId: customer.id,
      vehicleId: customer.vehicles[0].id,
      advisor: 'Test Advisor',
      totalLabor: 1000,
      totalParts: 1000,
      netTotal: 2000,
      status: 'DRAFT',
      items: {
        create: [
          {
            itemType: 'LABOR',
            description: 'Test labor',
            quantity: 1,
            unitPrice: 1000,
            discount: 0,
            netAmount: 1000,
          },
          {
            itemType: 'PARTS',
            description: 'Test part',
            quantity: 2,
            unitPrice: 500,
            discount: 0,
            netAmount: 1000,
          },
        ],
      },
    },
  });

  const quote = await db.salesQuotation.findUnique({ where: { quoteNo } });
  if (!quote) {
    throw new Error('Sales quotation was not created');
  }

  // Purchase request creation
  const prNo = `PR-TEST-${suffix}`;
  await db.purchaseRequest.create({
    data: {
      prNo,
      status: 'PENDING_APPROVAL',
      requestedById: customer.id, // reusing customer id as a valid user id placeholder
      notes: 'Integration test PR',
      items: {
        create: {
          description: 'Test PR item',
          quantity: 1,
          unitCost: 100,
          total: 100,
        },
      },
    },
  });

  const pr = await db.purchaseRequest.findUnique({ where: { prNo } });
  if (!pr) {
    throw new Error('Purchase request was not created');
  }

  // OPEX request creation
  const opexNo = `OPEX-TEST-${suffix}`;
  await db.opexRequest.create({
    data: {
      requestNo: opexNo,
      category: 'Shop Supplies',
      description: 'Integration test OPEX',
      amount: 1234.56,
      requestedById: customer.id,
      status: 'PENDING_APPROVAL',
    },
  });

  const opex = await db.opexRequest.findUnique({ where: { requestNo: opexNo } });
  if (!opex) {
    throw new Error('OPEX request was not created');
  }

  // Clean up test records
  await db.salesQuotationItem.deleteMany({ where: { quoteId: quote.id } });
  await db.salesQuotation.deleteMany({ where: { customerId: customer.id } });
  await db.purchaseRequestItem.deleteMany({ where: { prId: pr.id } });
  await db.purchaseRequest.deleteMany({ where: { prNo } });
  await db.opexRequest.deleteMany({ where: { requestNo: opexNo } });
  await db.vehicle.deleteMany({ where: { customerId: customer.id } });
  await db.customer.deleteMany({ where: { customerNo: `TEST-CUST-${suffix}` } });

  console.log('✓ Creation form tests passed.');
}
