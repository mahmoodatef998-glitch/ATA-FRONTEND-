import { PrismaClient, UserRole, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data (optional - be careful in production!)
  console.log("🧹 Cleaning existing data...");
  await prisma.notifications.deleteMany();
  await prisma.order_histories.deleteMany();
  await prisma.quotations.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.clients.deleteMany();
  await prisma.users.deleteMany();
  await prisma.companies.deleteMany();

  // Create Company
  console.log("🏢 Creating company...");
  const company = await prisma.companies.create({
    data: {
      name: "ATA Generators & Parts",
      slug: "ata-generators",
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Company created: ${company.name} (ID: ${company.id})`);

  // Create Admin User
  console.log("👤 Creating admin user...");
  const hashedAdminPassword = await bcrypt.hash("00243540000", 10);
  const adminUser = await prisma.users.create({
    data: {
      companyId: company.id,
      name: "Admin User",
      email: "admin@demo.co",
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // No broker needed for this project

  // Create Sample Clients
  console.log("👥 Creating sample clients...");
  const client1 = await prisma.clients.create({
    data: {
      name: "Emirates Power Solutions LLC",
      phone: "+971501234567",
      email: "procurement@emiratespower.ae",
      updatedAt: new Date(),
    },
  });

  const client2 = await prisma.clients.create({
    data: {
      name: "Gulf Industries Trading",
      phone: "+971507654321",
      email: "orders@gulfindustries.com",
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Clients created: ${client1.name}, ${client2.name}`);

  // Create Sample Orders
  console.log("📦 Creating sample orders...");

  // Order 1: PENDING
  const order1 = await prisma.orders.create({
    data: {
      companyId: company.id,
      clientId: client1.id,
      publicToken: nanoid(),
      details: "Diesel generator for construction site - urgent requirement",
      items: [
        { name: "Diesel Generator", quantity: 1, specs: "500 KVA, Cummins Engine, Silent Type with ATS" },
      ],
      status: OrderStatus.PENDING,
      currency: "AED",
      updatedAt: new Date(),
    },
  });

  await prisma.order_histories.create({
    data: {
      orderId: order1.id,
      actorName: client1.name,
      action: "client_created_order",
      payload: { details: "Order submitted via public form" },
    },
  });

  await prisma.notifications.create({
    data: {
      companyId: company.id,
      userId: adminUser.id,
      title: `New Order from ${client1.name}`,
      body: `Order #${order1.id} - ${order1.details}`,
      meta: { orderId: order1.id },
      read: false,
    },
  });

  console.log(`✅ Order 1 created: #${order1.id} (PENDING)`);

  // Order 2: QUOTATION_SENT
  const order2 = await prisma.orders.create({
    data: {
      companyId: company.id,
      clientId: client2.id,
      publicToken: nanoid(),
      details: "Automatic Transfer Switch for factory backup power",
      items: [
        { name: "ATS (Automatic Transfer Switch)", quantity: 1, specs: "800A, 3-Phase, 4-Wire" },
        { name: "Control Panel", quantity: 1, specs: "AMF Panel with Digital Controller" },
      ],
      status: OrderStatus.QUOTATION_SENT,
      totalAmount: 45000,
      currency: "AED",
      createdById: adminUser.id,
      updatedAt: new Date(),
    },
  });

  await prisma.order_histories.create({
    data: {
      orderId: order2.id,
      actorName: client2.name,
      action: "client_created_order",
      payload: { details: "Order submitted via public form" },
    },
  });

  const quotation1 = await prisma.quotations.create({
    data: {
      orderId: order2.id,
      createdById: adminUser.id,
      items: [
        { name: "ATS (Automatic Transfer Switch)", quantity: 1, price: 35000, total: 35000 },
        { name: "Control Panel (AMF)", quantity: 1, price: 10000, total: 10000 },
      ],
      total: 45000,
      currency: "AED",
      notes: "Delivery: 10-14 days. Installation & commissioning included. 1-year warranty.",
      accepted: false,
      updatedAt: new Date(),
    },
  });

  await prisma.order_histories.create({
    data: {
      orderId: order2.id,
      actorId: adminUser.id,
      actorName: adminUser.name,
      action: "quotation_created",
      payload: { quotationId: quotation1.id, total: 125000 },
    },
  });

  console.log(`✅ Order 2 created: #${order2.id} (QUOTATION_SENT)`);

  // Order 3: APPROVED
  const order3 = await prisma.orders.create({
    data: {
      companyId: company.id,
      clientId: client1.id,
      publicToken: nanoid(),
      details: "Spare parts for generator maintenance",
      items: [
        { name: "Air Filter", quantity: 2, specs: "For Cummins 500KVA" },
        { name: "Oil Filter", quantity: 4, specs: "Original Cummins" },
        { name: "Fuel Filter", quantity: 2, specs: "Original Cummins" },
      ],
      status: OrderStatus.APPROVED,
      totalAmount: 3500,
      currency: "AED",
      createdById: adminUser.id,
      updatedAt: new Date(),
    },
  });

  await prisma.order_histories.create({
    data: {
      orderId: order3.id,
      actorName: client1.name,
      action: "client_created_order",
    },
  });

  await prisma.order_histories.create({
    data: {
      orderId: order3.id,
      actorId: adminUser.id,
      actorName: adminUser.name,
      action: "order_approved",
      payload: { note: "Approved for procurement" },
    },
  });

  console.log(`✅ Order 3 created: #${order3.id} (APPROVED)`);

  // Create more notifications
  await prisma.notifications.create({
    data: {
      companyId: company.id,
      userId: adminUser.id,
      title: `New Order from ${client2.name}`,
      body: `Order #${order2.id} - ${order2.details}`,
      meta: { orderId: order2.id },
      read: true,
    },
  });

  console.log("✅ Sample notifications created");

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("   Admin: admin@demo.co / 00243540000");
  console.log(`\n🔗 Sample tracking tokens:`);
  console.log(`   Order #${order1.id}: ${order1.publicToken}`);
  console.log(`   Order #${order2.id}: ${order2.publicToken}`);
  console.log(`   Order #${order3.id}: ${order3.publicToken}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

