/**
 * Hospital Auth & Data Seed Script
 *
 * This script:
 * 1. Reads hospitals from hospitals_bangalore.json
 * 2. Creates Supabase Auth accounts for each hospital (using service role key)
 * 3. Inserts hospital data into the hospitals table
 * 4. Links auth users to hospitals in app_users table
 * 5. Creates demo ambulance and admin accounts
 *
 * SECURITY WARNING: This script requires the SUPABASE_SERVICE_ROLE_KEY
 * which has elevated privileges. Keep it secret and never commit it to version control.
 *
 * Run: node scripts/seed-hospitals.js
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase configuration
const SUPABASE_URL = "https://vtcnosxbkzxeojnhidiy.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required");
  console.log("\nUsage: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/seed-hospitals.js");
  console.log("\nGet your service role key from:");
  console.log("https://supabase.com/dashboard/project/vtcnosxbkzxeojnhidiy/settings/api");
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate short name from hospital name
function generateShortname(hospitalName) {
  // Extract key words from hospital name
  const words = hospitalName
    .split(" ")
    .filter((w) => !["Hospital", "Hospitals", "Medical", "Centre", "Center", "Road", "Layout"].includes(w));

  // Special cases
  if (hospitalName.includes("Fortis")) return "Fortis";
  if (hospitalName.includes("Apollo")) return "Apollo";
  if (hospitalName.includes("Manipal")) return "Manipal";
  if (hospitalName.includes("Columbia Asia")) return "Columbia";
  if (hospitalName.includes("Narayana")) return "Narayana";
  if (hospitalName.includes("Sakra")) return "Sakra";
  if (hospitalName.includes("St. John")) return "StJohns";
  if (hospitalName.includes("BGS")) return "BGS";
  if (hospitalName.includes("Aster")) return "Aster";
  if (hospitalName.includes("Cloudnine")) return "Cloudnine";
  if (hospitalName.includes("Sparsh")) return "Sparsh";
  if (hospitalName.includes("Vikram")) return "Vikram";
  if (hospitalName.includes("Motherhood")) return "Motherhood";
  if (hospitalName.includes("HCG")) return "HCG";
  if (hospitalName.includes("Ramaiah")) return "Ramaiah";
  if (hospitalName.includes("Sagar")) return "Sagar";
  if (hospitalName.includes("Baptist")) return "Baptist";
  if (hospitalName.includes("KIMS")) return "KIMS";
  if (hospitalName.includes("Rangadore")) return "Rangadore";
  if (hospitalName.includes("Kauvery")) return "Kauvery";
  if (hospitalName.includes("Rainbow")) return "Rainbow";
  if (hospitalName.includes("Brindavan")) return "Brindavan";

  // Default: use first word or first two words
  return words.slice(0, Math.min(2, words.length)).join("");
}

async function seedHospitals() {
  console.log("🏥 Starting hospital seed process...\n");

  // Read hospitals from JSON
  const hospitalsPath = join(__dirname, "../src/data/hospitals_bangalore.json");
  const hospitalsData = JSON.parse(readFileSync(hospitalsPath, "utf-8"));

  console.log(`📋 Found ${hospitalsData.length} hospitals to seed\n`);

  const credentials = [];
  const errors = [];

  // Seed each hospital
  for (const hospital of hospitalsData) {
    const shortname = generateShortname(hospital.name);
    const username = shortname.toLowerCase();
    const internalEmail = `${username}@internal.example`;
    const password = `123456789`;

    try {
      console.log(`Processing: ${hospital.name} (${shortname})...`);

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: internalEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          username: username,
          hospital_id: hospital.id,
          hospital_name: hospital.name,
          role: "hospital",
        },
      });

      if (authError) {
        console.error(`  ❌ Auth error: ${authError.message}`);
        errors.push({ hospital: hospital.name, error: authError.message });
        continue;
      }

      const authUid = authData.user.id;
      console.log(`  ✅ Created auth user: ${authUid}`);

      // 2. Insert hospital data
      const { error: hospitalError } = await supabase.from("hospitals").upsert({
        id: hospital.id,
        name: hospital.name,
        distance: hospital.distance,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
        address: hospital.address,
        contact: hospital.contact,
        equipment: hospital.equipment || [],
        specialties: hospital.specialties || [],
      });

      if (hospitalError) {
        console.error(`  ❌ Hospital insert error: ${hospitalError.message}`);
        errors.push({ hospital: hospital.name, error: hospitalError.message });
        continue;
      }

      console.log(`  ✅ Inserted hospital data`);

      // 3. Link auth user to hospital in app_users
      const { error: appUserError } = await supabase.from("app_users").upsert({
        auth_uid: authUid,
        username: username,
        role: "hospital",
        linked_entity: hospital.id,
      });

      if (appUserError) {
        console.error(`  ❌ App user link error: ${appUserError.message}`);
        errors.push({ hospital: hospital.name, error: appUserError.message });
        continue;
      }

      console.log(`  ✅ Linked to app_users\n`);

      // Save credentials
      credentials.push({
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        shortname: shortname,
        username: username,
        internal_email: internalEmail,
        password: password,
        auth_uid: authUid,
      });
    } catch (err) {
      console.error(`  ❌ Unexpected error: ${err.message}\n`);
      errors.push({ hospital: hospital.name, error: err.message });
    }
  }

  // Create demo ambulance account (amb1 / AMB-001 / 1234)
  console.log("\n🚑 Creating demo ambulance account...");
  try {
    const { data: ambAuthData, error: ambAuthError } = await supabase.auth.admin.createUser({
      email: "amb1@internal.example",
      password: "1234",
      email_confirm: true,
      user_metadata: {
        username: "amb1",
        ambulance_number: "AMB-001",
        role: "ambulance",
      },
    });

    if (ambAuthError) {
      console.error(`❌ Ambulance auth error: ${ambAuthError.message}`);
    } else {
      // Insert ambulance
      await supabase.from("ambulances").upsert({
        id: "amb-001",
        ambulance_number: "AMB-001",
        contact: "+91-9876543210",
        equipment: ["Defibrillator", "Oxygen", "Ventilator", "Cardiac Monitor"],
      });

      // Link to app_users
      await supabase.from("app_users").upsert({
        auth_uid: ambAuthData.user.id,
        username: "amb1",
        role: "ambulance",
        linked_entity: "amb-001",
      });

      console.log("✅ Created ambulance: amb1 / AMB-001 / password: 1234");

      credentials.push({
        hospital_id: "amb-001",
        hospital_name: "Demo Ambulance",
        shortname: "AMB-001",
        username: "amb1",
        internal_email: "amb1@internal.example",
        password: "1234",
        auth_uid: ambAuthData.user.id,
      });
    }
  } catch (err) {
    console.error(`❌ Ambulance creation error: ${err.message}`);
  }

  // Create demo admin account (hos1 / password: admin123)
  console.log("\n👤 Creating demo admin account...");
  try {
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: "hos1@internal.example",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        username: "hos1",
        role: "admin",
      },
    });

    if (adminAuthError) {
      console.error(`❌ Admin auth error: ${adminAuthError.message}`);
    } else {
      await supabase.from("app_users").upsert({
        auth_uid: adminAuthData.user.id,
        username: "hos1",
        role: "admin",
        linked_entity: null,
      });

      console.log("✅ Created admin: hos1 / password: admin123");

      credentials.push({
        hospital_id: "admin",
        hospital_name: "Admin Account",
        shortname: "Admin",
        username: "hos1",
        internal_email: "hos1@internal.example",
        password: "admin123",
        auth_uid: adminAuthData.user.id,
      });
    }
  } catch (err) {
    console.error(`❌ Admin creation error: ${err.message}`);
  }

  // Save credentials to CSV
  const csvPath = join(__dirname, "../hospital-credentials.csv");
  const csvHeader = "hospital_id,hospital_name,shortname,username,internal_email,password,auth_uid\n";
  const csvRows = credentials
    .map(
      (c) =>
        `${c.hospital_id},"${c.hospital_name}",${c.shortname},${c.username},${c.internal_email},${c.password},${c.auth_uid}`,
    )
    .join("\n");

  writeFileSync(csvPath, csvHeader + csvRows);
  console.log(`\n💾 Credentials saved to: hospital-credentials.csv`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SEED SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successfully seeded: ${credentials.length} accounts`);
  console.log(`❌ Failed: ${errors.length} accounts`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.forEach((e) => console.log(`  - ${e.hospital}: ${e.error}`));
  }

  console.log("\n🔐 SECURITY REMINDERS:");
  console.log("  1. Keep hospital-credentials.csv secure and DO NOT commit to git");
  console.log("  2. Rotate all demo passwords before production deployment");
  console.log("  3. Never expose the SUPABASE_SERVICE_ROLE_KEY");
  console.log("  4. Use strong passwords for production accounts");
  console.log("\n✅ Seed process complete!\n");
}

// Run the seed
seedHospitals().catch((err) => {
  console.error("\n❌ Fatal error:", err);
  process.exit(1);
});
