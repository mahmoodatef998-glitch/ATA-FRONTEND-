/**
 * Update Company Profile with Complete Information
 * This script adds comprehensive company information to the database
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateCompanyProfile() {
  try {
    console.log("🏢 Updating Company Profile...\n");

    // Get the first company (or create if doesn't exist)
    let company = await prisma.companies.findFirst();

    if (!company) {
      console.log("❌ No company found. Please create a company first.");
      return;
    }

    const companyProfile = {
      name: "AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR LLC",
      description: `ATA Switchgear Limited pioneers the manufacture and supply of a diverse range of electrical panels, including switchboards, low and medium voltage, motor control centers, capacitor banks, and more. With extensive experience in the switchgear industry, our team combines engineering expertise with a deep understanding of GCC standards and regulations, serving a wide client base across various industries.

Our core values as a prominent electrical switchboard manufacturer in the UAE include honesty, loyalty, integrity, and responsibility. Client satisfaction is paramount, and we strive to exceed expectations while fostering staff growth and leaving a positive legacy.`,

      products: `We offer a comprehensive range of products:
1. LV & MV switchgear panels
2. Generator synchronizing panels
3. Change over switches (Auto & Manual)
4. Capacitor banks (Power factor correction)
5. Generator control panels
6. PLC and intelligent control panels
7. Domestic and household panels
8. Resistive load and dummy load banks
9. Switchgear maintenance, modification and repair
10. Switchgear spare part supply
11. Containerized switchgear substations (LV & MV)
12. Motor starter panels (VFD, Y-D, Soft-Starter)
13. Generators (10KVA – 1600KVA)
14. Lighting towers`,

      services: `Switchgear Control Board Manufacturing & Design

Our Manufacturing Process and Procedures:
• Receive client requirements and specifications
• Optimize design for cost-effectiveness
• Coordinate with clients for design approval
• Submit quotation and finalize pricing
• Conduct factory acceptance test (FAT) as per standards
• Deliver products with as-built schematics and test reports

Our Targeted Markets:
• Residential: Economical power distribution panels for apartments and villas
• Commercial: Reliable switchboards for hospitals, offices, and schools
• Industrial: High-power solutions for various industries
• Water and Sewage Treatment plants
• Generator Packaging companies
• Oil and Gas industries
• Rental companies`,

      specialties: `Our Team:
• 8 highly qualified switchgear manufacturing technicians
• AutoCAD drafters
• Two electrical supervising engineers
• Qualified administrators and accountants
• Two dedicated sales and customer relation executives
• General Manager with an electrical engineering degree
• Electrical consultant and designer

Our Manufacturing Plant:
Located in Sharjah airport free zone (SAIF zone), our facility is strategically positioned for easy access and fast deliveries. Equipped with modern machinery and ample workspace, we prioritize both excellent relationships and high-quality products.

Tools and Equipment:
Our workshop is equipped with a range of tools and test equipment to ensure the quality and safety of our products, including bus bar forming machines, wire cutting and stripping machines, insulation testers, label engraving machine, primary injection test unit up to 3200A (3 phase), secondary injection set, and more.

Partners and Suppliers:
We partner with global companies to supply high-quality products and equipment, ensuring reliability and customer satisfaction.`,

      contactInfo: `AL TAQA AL MALAWNA ELECTRICAL SWITCHGEAR ASSEMBLY LLC

Address:
Central Region - Al Dhaid - Behind Wushah Street - New Industrial Area, Fenced Land No.1

Contact:
Landline: +971 6 5353462
Mobile: +971 50229 6962
Website: https://ataswg.com
Email: sales@ataswg.com / info@ataswg.com`,

      businessHours: `Business Hours:
Monday - Friday: 8:00 AM - 6:00 PM
Saturday: 8:00 AM - 1:00 PM
Sunday: Closed

Note: Contact us for urgent matters outside business hours.`,
    };

    // Update company with profile information
    const updated = await prisma.companies.update({
      where: { id: company.id },
      data: {
        name: companyProfile.name,
        description: companyProfile.description,
        products: companyProfile.products,
        services: companyProfile.services,
        specialties: companyProfile.specialties,
        contactInfo: companyProfile.contactInfo,
        businessHours: companyProfile.businessHours,
      },
    });

    console.log("✅ Company profile updated successfully!\n");
    console.log("📋 Updated Information:");
    console.log(`   Name: ${updated.name}`);
    console.log(`   Description: ${updated.description?.substring(0, 50)}...`);
    console.log(`   Products: ${updated.products ? "✅ Added" : "❌ Missing"}`);
    console.log(`   Services: ${updated.services ? "✅ Added" : "❌ Missing"}`);
    console.log(`   Specialties: ${updated.specialties ? "✅ Added" : "❌ Missing"}`);
    console.log(`   Contact Info: ${updated.contactInfo ? "✅ Added" : "❌ Missing"}`);
    console.log(`   Business Hours: ${updated.businessHours ? "✅ Added" : "❌ Missing"}`);
    console.log("\n🎉 Company profile is now ready for the chatbot!");
    console.log("\n💡 The chatbot will now use this information to answer questions about:");
    console.log("   - Company overview and expertise");
    console.log("   - Products and services");
    console.log("   - Manufacturing capabilities");
    console.log("   - Contact information");
    console.log("   - Business hours");
  } catch (error) {
    console.error("❌ Error updating company profile:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCompanyProfile()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

