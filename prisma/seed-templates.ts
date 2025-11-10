import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTemplates() {
  console.log("🎯 Adding order templates...");

  // Clear existing templates
  await prisma.order_templates.deleteMany();

  // Template 1: Diesel Generator
  await prisma.order_templates.create({
    data: {
      name: "Diesel Generator",
      category: "GENERATOR",
      description: "Complete diesel generator with specifications",
      fields: {
        power: { type: "select", label: "Power (KVA)", options: ["100", "250", "500", "750", "1000"], required: true },
        engine: { type: "select", label: "Engine Brand", options: ["Cummins", "Perkins", "Volvo", "Deutz"], required: true },
        type: { type: "select", label: "Type", options: ["Silent Type", "Open Type", "Soundproof Canopy"], required: true },
        ats: { type: "select", label: "ATS Included?", options: ["Yes - Included", "No - Separate"], required: true },
        quantity: { type: "number", label: "Quantity", min: 1, required: true },
        urgency: { type: "select", label: "Urgency", options: ["Standard (2-3 weeks)", "Urgent (1 week)", "Very Urgent (3-5 days)"], required: false },
        additionalSpecs: { type: "textarea", label: "Additional Requirements", required: false }
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Template 2: ATS (Automatic Transfer Switch)
  await prisma.order_templates.create({
    data: {
      name: "Automatic Transfer Switch (ATS)",
      category: "ATS",
      description: "Automatic Transfer Switch with control panel",
      fields: {
        current: { type: "select", label: "Current Rating (Ampere)", options: ["200A", "400A", "600A", "800A", "1000A", "1250A"], required: true },
        phases: { type: "select", label: "Phases", options: ["3-Phase, 4-Wire", "3-Phase, 3-Wire", "Single Phase"], required: true },
        controlPanel: { type: "select", label: "Control Panel Type", options: ["AMF Panel - Auto", "Manual Panel", "Smart Digital Controller"], required: true },
        voltage: { type: "select", label: "Voltage", options: ["380-415V", "220-240V", "Other"], required: true },
        quantity: { type: "number", label: "Quantity", min: 1, required: true },
        installation: { type: "select", label: "Installation Required?", options: ["Yes - Include in quote", "No - Supply only"], required: false },
        additionalSpecs: { type: "textarea", label: "Additional Requirements", required: false }
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Template 3: Switchgear & Control Panels
  await prisma.order_templates.create({
    data: {
      name: "Switchgear & Control Panels",
      category: "SWITCHGEAR",
      description: "Electrical switchgear and distribution panels",
      fields: {
        type: { type: "select", label: "Panel Type", options: ["Main Distribution Board (MDB)", "Sub Distribution Board (SDB)", "Control Panel", "Metering Panel"], required: true },
        current: { type: "select", label: "Current Rating", options: ["200A", "400A", "630A", "800A", "1000A"], required: true },
        incomers: { type: "select", label: "Incomer Type", options: ["MCCB", "ACB", "Fuse Switch"], required: true },
        outgoingWays: { type: "number", label: "Number of Outgoing Ways", min: 1, required: true },
        protection: { type: "select", label: "Protection", options: ["Standard", "With Earth Leakage", "With Motor Protection"], required: false },
        quantity: { type: "number", label: "Quantity", min: 1, required: true },
        additionalSpecs: { type: "textarea", label: "Additional Specifications", required: false }
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Template 4: Spare Parts
  await prisma.order_templates.create({
    data: {
      name: "Generator Spare Parts",
      category: "SPARE_PARTS",
      description: "Spare parts and consumables for generators",
      fields: {
        generatorModel: { type: "text", label: "Generator Model/Brand", placeholder: "e.g., Cummins 500KVA", required: true },
        partType: { type: "select", label: "Part Type", options: ["Air Filter", "Oil Filter", "Fuel Filter", "Battery", "Alternator", "Starter Motor", "Control Board", "Other"], required: true },
        quantity: { type: "number", label: "Quantity", min: 1, required: true },
        partNumber: { type: "text", label: "Part Number (if known)", required: false },
        original: { type: "select", label: "Part Quality", options: ["Original (OEM)", "Compatible (Aftermarket)"], required: true },
        urgency: { type: "select", label: "Urgency", options: ["Standard", "Urgent"], required: false },
        additionalNotes: { type: "textarea", label: "Additional Notes", required: false }
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });

  // Template 5: Maintenance Service
  await prisma.order_templates.create({
    data: {
      name: "Generator Maintenance Service",
      category: "SERVICE",
      description: "Maintenance and service request",
      fields: {
        serviceType: { type: "select", label: "Service Type", options: ["Preventive Maintenance", "Breakdown Repair", "Annual Maintenance Contract", "Inspection"], required: true },
        generatorDetails: { type: "textarea", label: "Generator Details", placeholder: "Brand, Model, KVA, Location", required: true },
        lastService: { type: "date", label: "Last Service Date", required: false },
        issues: { type: "textarea", label: "Current Issues/Requirements", required: true },
        preferredDate: { type: "date", label: "Preferred Service Date", required: false },
        urgency: { type: "select", label: "Urgency", options: ["Standard", "Urgent", "Emergency"], required: true }
      },
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log("✅ Added 5 order templates");
  console.log("   • Diesel Generator");
  console.log("   • ATS");
  console.log("   • Switchgear");
  console.log("   • Spare Parts");
  console.log("   • Maintenance Service");
}

seedTemplates()
  .then(() => {
    console.log("\n🎉 Templates seeding completed!");
  })
  .catch((e) => {
    console.error("❌ Error seeding templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






