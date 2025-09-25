#!/usr/bin/env node
// diagnostic-script.js - Deep dive into Supabase auth issues

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env;

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnostics() {
  console.log("🔬 Running Supabase Auth Diagnostics...\n");

  // 1. Check service key validity and permissions
  console.log("1️⃣ Testing Service Key Permissions...");
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("❌ Service key error:", error);
      console.log("   This suggests your service key doesn't have admin permissions");
      return;
    }
    console.log(`✅ Service key works. Found ${data.users.length} existing users`);
    
    // List existing users
    if (data.users.length > 0) {
      console.log("   Existing users:");
      data.users.forEach(user => {
        console.log(`   - ${user.email} (${user.id}) - confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      });
    }
  } catch (err) {
    console.error("❌ Service key test failed:", err.message);
    return;
  }

  console.log();

  // 2. Check auth configuration
  console.log("2️⃣ Testing Auth Configuration...");
  try {
    // Try a simple operation to test auth settings
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`   Attempting to create test user: ${testEmail}`);
    
    const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: "testpassword123",
      email_confirm: true,
    });

    if (testError) {
      console.error("❌ Test user creation failed:");
      console.error("   Message:", testError.message);
      console.error("   Status:", testError.status);
      console.error("   Code:", testError.code);
      
      // Common error codes and solutions
      if (testError.message.includes("Database error")) {
        console.log("\n🔍 Database Error Analysis:");
        console.log("   This typically indicates:");
        console.log("   - Auth schema is corrupted or missing");
        console.log("   - Database constraints are failing"); 
        console.log("   - RLS policies are blocking the operation");
        console.log("   - Database storage is full");
      }
      
    } else {
      console.log(`✅ Test user created successfully: ${testUser.user.id}`);
      
      // Clean up test user
      console.log("   Cleaning up test user...");
      const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.user.id);
      if (deleteError) {
        console.warn("⚠️ Failed to delete test user:", deleteError.message);
      } else {
        console.log("✅ Test user cleaned up");
      }
    }
  } catch (err) {
    console.error("❌ Auth configuration test failed:", err);
  }

  console.log();

  // 3. Check database tables and permissions
  console.log("3️⃣ Testing Database Access...");
  
  const testTables = ['schools', 'teachers', 'students', 'classes'];
  
  for (const table of testTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ ${table} table error:`, error.message);
      } else {
        console.log(`✅ ${table} table accessible`);
      }
    } catch (err) {
      console.error(`❌ ${table} table test failed:`, err.message);
    }
  }

  console.log();

  // 4. Test auth.users table directly (if accessible)
  console.log("4️⃣ Testing Auth Tables...");
  try {
    // Note: This might not work if RLS is enabled on auth tables
    const { data, error } = await supabase
      .from('auth.users')
      .select('id, email, created_at', { count: 'exact', head: true });
    
    if (error) {
      console.log("ℹ️ Cannot directly query auth.users (this is often normal due to RLS)");
      console.log("   Error:", error.message);
    } else {
      console.log("✅ Can query auth.users directly");
    }
  } catch (err) {
    console.log("ℹ️ Cannot query auth.users directly (this is normal):", err.message);
  }

  console.log();

  // 5. Check specific email that's failing
  console.log("5️⃣ Testing Specific Email...");
  const problemEmail = "sayaneezy254@gmail.com";
  
  try {
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === problemEmail);
    
    if (existingUser) {
      console.log(`ℹ️ User ${problemEmail} already exists:`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Created: ${existingUser.created_at}`);
      console.log(`   Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Last sign in: ${existingUser.last_sign_in_at || 'Never'}`);
      
      // Try to delete and recreate
      console.log("   Attempting to delete existing user...");
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.error("❌ Failed to delete existing user:", deleteError.message);
      } else {
        console.log("✅ Deleted existing user, trying to recreate...");
        
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: problemEmail,
          password: "password123", 
          email_confirm: true,
        });
        
        if (createError) {
          console.error("❌ Still failed to create user after deletion:");
          console.error("   Message:", createError.message);
          console.error("   Status:", createError.status);
        } else {
          console.log("✅ Successfully created user after deletion!");
        }
      }
    } else {
      console.log(`ℹ️ User ${problemEmail} does not exist, creation should work`);
    }
    
  } catch (err) {
    console.error("❌ Email-specific test failed:", err);
  }

  console.log();
  console.log("🏁 Diagnostics Complete!");
  console.log("\nNext Steps:");
  console.log("1. Check your Supabase dashboard for any error logs");
  console.log("2. Verify your project isn't paused or has billing issues");
  console.log("3. Check if you have any RLS policies blocking auth operations");
  console.log("4. Consider reaching out to Supabase support with the error details");
}

diagnostics().catch((err) => {
  console.error("❌ Diagnostics failed:", err);
  process.exit(1);
});