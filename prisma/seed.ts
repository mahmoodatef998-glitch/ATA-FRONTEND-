import { PrismaClient, UserRole, OrderStatus, TaskStatus, TaskPriority, AttendanceType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";

const prisma = new PrismaClient();

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data (optional - be careful in production!)
  console.log("🧹 Cleaning existing data...");
  await prisma.supervisor_reviews.deleteMany();
  await prisma.work_logs.deleteMany();
  await prisma.overtime.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.tasks.deleteMany();
  await prisma.company_settings.deleteMany();
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

  // Update Company with office location
  console.log("📍 Setting company office location...");
  await prisma.companies.update({
    where: { id: company.id },
    data: {
      officeLat: 25.2048, // Dubai coordinates (can be changed)
      officeLng: 55.2708,
      timezone: "Asia/Dubai",
    },
  });
  console.log("✅ Company location set");

  // Create Company Settings
  console.log("⚙️ Creating company settings...");
  await prisma.company_settings.create({
    data: {
      companyId: company.id,
      checkInRadius: 100, // 100 meters
      workingHours: 8.0,
      overtimeThreshold: 0.5,
    },
  });
  console.log("✅ Company settings created");

  // Create Supervisors
  console.log("👔 Creating supervisors...");
  const supervisor1Password = await bcrypt.hash("supervisor123", 10);
  const supervisor1 = await prisma.users.create({
    data: {
      companyId: company.id,
      name: "Ahmed Supervisor",
      email: "supervisor1@demo.co",
      password: supervisor1Password,
      role: UserRole.SUPERVISOR,
      updatedAt: new Date(),
    },
  });

  const supervisor2Password = await bcrypt.hash("supervisor123", 10);
  const supervisor2 = await prisma.users.create({
    data: {
      companyId: company.id,
      name: "Sara Supervisor",
      email: "supervisor2@demo.co",
      password: supervisor2Password,
      role: UserRole.SUPERVISOR,
      updatedAt: new Date(),
    },
  });
  console.log(`✅ Supervisors created: ${supervisor1.name}, ${supervisor2.name}`);

  // Create Technicians
  console.log("🔧 Creating technicians...");
  const technicianPasswords = await Promise.all([
    bcrypt.hash("tech123", 10),
    bcrypt.hash("tech123", 10),
    bcrypt.hash("tech123", 10),
    bcrypt.hash("tech123", 10),
    bcrypt.hash("tech123", 10),
  ]);

  const technicians = await Promise.all([
    prisma.users.create({
      data: {
        companyId: company.id,
        name: "Mohamed Ali",
        email: "tech1@demo.co",
        password: technicianPasswords[0],
        role: UserRole.TECHNICIAN,
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        companyId: company.id,
        name: "Omar Hassan",
        email: "tech2@demo.co",
        password: technicianPasswords[1],
        role: UserRole.TECHNICIAN,
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        companyId: company.id,
        name: "Khaled Ibrahim",
        email: "tech3@demo.co",
        password: technicianPasswords[2],
        role: UserRole.TECHNICIAN,
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        companyId: company.id,
        name: "Fatima Ahmed",
        email: "tech4@demo.co",
        password: technicianPasswords[3],
        role: UserRole.TECHNICIAN,
        updatedAt: new Date(),
      },
    }),
    prisma.users.create({
      data: {
        companyId: company.id,
        name: "Youssef Mohamed",
        email: "tech5@demo.co",
        password: technicianPasswords[4],
        role: UserRole.TECHNICIAN,
        updatedAt: new Date(),
      },
    }),
  ]);
  console.log(`✅ Technicians created: ${technicians.length} technicians`);

  // Create Tasks
  console.log("📋 Creating tasks...");
  const taskTitles = [
    "Install Generator at Client Site",
    "Maintenance Check - Generator #123",
    "Repair ATS System",
    "Install New Switchgear",
    "Emergency Repair - Generator Failure",
    "Routine Maintenance - 5 Generators",
    "Install Backup Power System",
    "Replace Generator Parts",
    "Test Generator Performance",
    "Install Generator Enclosure",
  ];

  const tasks = await Promise.all(
    taskTitles.map((title, index) => {
      const assignedTo = technicians[index % technicians.length];
      const assignedBy = index < 5 ? supervisor1 : supervisor2;
      const statuses: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETED"];
      const priorities: TaskPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (index % 7) + 1);

      return prisma.tasks.create({
        data: {
          companyId: company.id,
          title,
          description: `Task description for ${title}. This task requires attention and completion.`,
          assignedToId: assignedTo.id,
          assignedById: assignedBy.id,
          status: statuses[index % statuses.length],
          priority: priorities[index % priorities.length],
          deadline,
          location: `Location ${index + 1}`,
          locationLat: 25.2048 + (index * 0.01),
          locationLng: 55.2708 + (index * 0.01),
          estimatedHours: 4 + (index % 4),
        },
      });
    })
  );
  console.log(`✅ Tasks created: ${tasks.length} tasks`);

  // Create Sample Attendance Records
  console.log("⏰ Creating sample attendance records...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    for (const tech of technicians.slice(0, 3)) {
      const checkIn = new Date(date);
      checkIn.setHours(9, 0, 0, 0);

      const checkOut = new Date(date);
      checkOut.setHours(17, 30, 0, 0);

      await prisma.attendance.create({
        data: {
          userId: tech.id,
          companyId: tech.companyId,
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          checkInTime: checkIn,
          checkOutTime: checkOut,
          checkInLat: 25.2048,
          checkInLng: 55.2708,
          checkOutLat: 25.2048,
          checkOutLng: 55.2708,
          checkInLocation: "Office",
          checkOutLocation: "Office",
          attendanceType: AttendanceType.OFFICE,
        },
      });
    }
  }
  console.log("✅ Sample attendance records created");

  // Create Sample Overtime
  console.log("💰 Creating sample overtime records...");
  const overtimeDate = new Date(today);
  overtimeDate.setDate(overtimeDate.getDate() - 1);

  await prisma.overtime.create({
    data: {
      userId: technicians[0].id,
      date: overtimeDate,
      hours: 2.5,
      reason: "Emergency repair work",
      approved: true,
      approvedById: supervisor1.id,
      approvedAt: new Date(),
    },
  });

  await prisma.overtime.create({
    data: {
      userId: technicians[1].id,
      date: overtimeDate,
      hours: 1.5,
      reason: "Extended installation work",
      approved: false, // Pending approval
    },
  });
  console.log("✅ Sample overtime records created");

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📝 Login credentials:");
  console.log("   Admin: admin@demo.co / 00243540000");
  console.log("   Supervisor 1: supervisor1@demo.co / supervisor123");
  console.log("   Supervisor 2: supervisor2@demo.co / supervisor123");
  console.log("   Technician 1: tech1@demo.co / tech123");
  console.log("   Technician 2: tech2@demo.co / tech123");
  console.log("   Technician 3: tech3@demo.co / tech123");
  console.log("   Technician 4: tech4@demo.co / tech123");
  console.log("   Technician 5: tech5@demo.co / tech123");
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

