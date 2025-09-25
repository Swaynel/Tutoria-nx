#!/usr/bin/env node
// supabase-seed-tuitora-dev-full-sms.js
// ✅ Full Dev Seed: auth users for teachers & parents, attendance included

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import africastalking from "africastalking";
import { faker } from "@faker-js/faker";

// ---------------- Env Vars ----------------
const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  AFRICAS_TALKING_API_KEY,
  AFRICAS_TALKING_USERNAME,
  AT_SHORTCODE,
  DEV_TEST_PHONE,
} = process.env;

const required = {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  AFRICAS_TALKING_API_KEY,
  AFRICAS_TALKING_USERNAME,
  AT_SHORTCODE,
  DEV_TEST_PHONE,
};

for (const [key, val] of Object.entries(required)) {
  if (!val) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// ---------------- Clients ----------------
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const at = africastalking({ apiKey: AFRICAS_TALKING_API_KEY, username: AFRICAS_TALKING_USERNAME });
const sms = at.SMS;

// ---------------- Helpers ----------------
function randomPhone() {
  return `+2547${faker.number.int({ min: 10000000, max: 99999999 })}`;
}
function randomPaymentStatus() {
  return faker.helpers.arrayElement(["pending", "completed", "failed", "refunded"]);
}
function randomPaymentMethod() {
  return faker.helpers.arrayElement(["cash", "card", "mobile_money", "bank_transfer"]);
}
function randomAttendanceStatus() {
  return faker.helpers.arrayElement(["present", "absent", "late", "excused"]);
}
function uniqueSlug(name) {
  return faker.helpers.slugify(name + "-" + faker.string.alphanumeric(5));
}

// ---------------- Seed ----------------
async function seed() {
  console.log("💾 Starting full dev seed for Tuitora...");
  const heartbeat = setInterval(() => console.log("⏳ Still seeding... please wait"), 10000);

  try {
    // --- Delete all auth users ---
    try {
      const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (users?.users?.length) {
        for (const u of users.users) {
          await supabase.auth.admin.deleteUser(u.id);
          console.log(`🗑 Deleted auth user: ${u.email}`);
        }
      }
    } catch (err) {
      console.warn("⚠️ Could not delete auth users:", err.message);
    }

    // --- Reset all tables ---
    const tablesToReset = [
      "payments",
      "parent_student_relationships",
      "student_classes",
      "grades",
      "students",
      "teachers",
      "parents",
      "classes",
      "schools",
      "profiles",
      "ussd_sessions",
      "attendance"
    ];
    for (const table of tablesToReset) {
      try {
        await supabase.from(table).delete().neq("id", null);
        console.log(`✅ Reset ${table}`);
      } catch (err) {
        console.warn(`⚠️ Error resetting ${table}:`, err.message);
      }
    }

    // --- Create Superadmin ---
    let superadmin;
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: "sayaneezy254@gmail.com",
        password: "Password123!",
        email_confirm: true,
      });
      if (!error && data) {
        superadmin = data.user;
        console.log(`✅ Superadmin created: ${superadmin.email}`);
        await supabase.from("profiles").insert([{ id: superadmin.id, full_name: "Super Admin" }]);
      }
    } catch (err) {
      console.warn("⚠️ Superadmin creation failed:", err.message);
    }

    // --- Create Schools ---
    let schoolIds = [];
    const schoolNames = [
      "Greenwood Academy",
      "Hillcrest International",
      "Riverdale High School",
      "Bright Future Academy",
      "Sunrise Preparatory"
    ];
    console.log("🏫 Creating schools...");
    for (let name of schoolNames) {
      try {
        const { data: school, error } = await supabase
          .from("schools")
          .insert([{ name, slug: uniqueSlug(name) }])
          .select()
          .single();
        if (!error && school) {
          schoolIds.push(school.id);
          console.log(`✅ Created school: ${school.name}`);
        } else if (error) console.warn(`⚠️ Failed creating school ${name}:`, error.message);
      } catch (err) {
        console.warn(`⚠️ Error creating school ${name}:`, err.message);
      }
    }

    if (schoolIds.length === 0) {
      console.error("❌ No schools created. Cannot continue seeding.");
      return;
    }

    // --- Create Classes ---
    const gradeNames = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8"];
    let classMap = {};
    console.log("📚 Creating classes...");
    for (const schoolId of schoolIds) {
      classMap[schoolId] = [];
      let classBatch = gradeNames.map(grade => ({ name: grade, school_id: schoolId }));
      try {
        const { data: classes } = await supabase.from("classes").insert(classBatch).select();
        if (classes) classMap[schoolId] = classes;
      } catch (err) {
        console.warn(`⚠️ Error creating classes for school ${schoolId}:`, err.message);
      }
    }

    // --- Create Teachers as auth users ---
    let teachers = [];
    console.log("👩‍🏫 Creating teachers (auth users)...");
    for (const schoolId of schoolIds) {
      for (let i = 0; i < 3; i++) {
        const email = faker.internet.email();
        const password = "Password123!";
        try {
          const { data: teacherData, error: authErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
          if (authErr) { console.warn("⚠️ Teacher auth creation failed:", authErr.message); continue; }

          // Insert into teachers table
          const teacher = {
            id: teacherData.user.id,
            full_name: faker.person.fullName(),
            email,
            phone: randomPhone(),
            school_id: schoolId
          };
          const { data: t } = await supabase.from("teachers").insert([teacher]).select().single();
          if (t) teachers.push(t);

          // Create profile
          await supabase.from("profiles").insert([{ id: teacherData.user.id, full_name: teacher.full_name }]);

        } catch (err) {
          console.warn("⚠️ Error creating teacher:", err.message);
        }
      }
    }

    // --- Create Parents as auth users ---
    let parents = [];
    console.log("👨‍👩‍👧‍👦 Creating parents (auth users)...");
    for (let i = 0; i < 20; i++) {
      const email = faker.internet.email();
      const password = "Password123!";
      try {
        const { data: parentData, error: authErr } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (authErr) { console.warn("⚠️ Parent auth creation failed:", authErr.message); continue; }

        const parent = {
          id: parentData.user.id,
          full_name: faker.person.fullName(),
          email,
          phone: randomPhone()
        };
        const { data: p } = await supabase.from("parents").insert([parent]).select().single();
        if (p) parents.push(p);

        // Create profile
        await supabase.from("profiles").insert([{ id: parentData.user.id, full_name: parent.full_name }]);

      } catch (err) {
        console.warn("⚠️ Error creating parent:", err.message);
      }
    }

    // --- Create Students & link parents ---
    let students = [];
    console.log("🎓 Creating students...");
    for (const schoolId of schoolIds) {
      for (const cls of classMap[schoolId]) {
        const numStudents = faker.number.int({ min: 10, max: 20 });
        let studentBatch = Array.from({ length: numStudents }, () => ({
          name: faker.person.fullName(),
          school_id: schoolId,
          grade: cls.name
        }));

        try {
          const { data: createdStudents } = await supabase.from("students").insert(studentBatch).select();
          if (!createdStudents) continue;
          students.push(...createdStudents);

          // --- student_classes ---
          const studentClassBatch = createdStudents.map(s => ({ student_id: s.id, class_id: cls.id }));
          await supabase.from("student_classes").insert(studentClassBatch);

          // --- parent_student_relationships ---
          if (parents.length) {
            const parentStudentBatch = [];
            for (const student of createdStudents) {
              const assignedParents = faker.helpers.arrayElements(parents, faker.number.int({ min: 1, max: 2 }));
              for (const parent of assignedParents) {
                parentStudentBatch.push({
                  student_id: student.id,
                  parent_user_id: parent.id,
                  relationship_type: "parent",
                  is_primary: true
                });
              }
            }
            await supabase.from("parent_student_relationships").insert(parentStudentBatch);
          }

          // --- Grades, Payments, Attendance ---
          const gradesBatch = [];
          const paymentsBatch = [];
          const attendanceBatch = [];
          for (const student of createdStudents) {
            gradesBatch.push({ student_id: student.id, subject: "Math", score: faker.number.int({ min: 40, max: 100 }) });
            gradesBatch.push({ student_id: student.id, subject: "English", score: faker.number.int({ min: 40, max: 100 }) });
            gradesBatch.push({ student_id: student.id, subject: "Science", score: faker.number.int({ min: 40, max: 100 }) });

            const numPayments = faker.number.int({ min: 1, max: 3 });
            for (let j = 0; j < numPayments; j++) {
              paymentsBatch.push({
                school_id: schoolId,
                student_id: student.id,
                amount: faker.number.int({ min: 500, max: 5000 }),
                description: `School fees ${cls.name} installment ${j + 1}`,
                payment_method: randomPaymentMethod(),
                status: randomPaymentStatus(),
                paid_at: faker.date.past().toISOString()
              });
            }

            // Attendance: pick random teacher from same school
            const teacherId = faker.helpers.arrayElement(teachers.filter(t => t.school_id === schoolId))?.id;
            if (teacherId) {
              const days = 5;
              for (let d = 0; d < days; d++) {
                attendanceBatch.push({
                  student_id: student.id,
                  school_id: schoolId,
                  date: faker.date.recent().toISOString(),
                  status: randomAttendanceStatus(),
                  marked_by: teacherId
                });
              }
            }
          }

          if (gradesBatch.length) await supabase.from("grades").insert(gradesBatch);
          if (paymentsBatch.length) await supabase.from("payments").insert(paymentsBatch);
          if (attendanceBatch.length) await supabase.from("attendance").insert(attendanceBatch);

        } catch (err) {
          console.warn("⚠️ Error creating students batch:", err.message);
        }
      }
    }

    console.log(`✅ Created ${students.length} students`);

    // --- USSD Sessions & Demo SMS ---
    try {
      const demoUser = faker.helpers.arrayElement([...teachers, ...parents]);
      if (demoUser) {
        await supabase.from("ussd_sessions").insert([{
          session_id: faker.string.uuid(),
          phone: demoUser.phone,
          service_code: "*123#",
          input_text: "1",
          response_text: "Welcome to Tuitora",
          status: "active",
        }]);
        await sms.send({
          to: DEV_TEST_PHONE,
          message: "✅ Tuitora dev seed complete! Check Supabase dashboard.",
          from: AT_SHORTCODE,
        });
        console.log("📲 Demo SMSes sent!");
      }
    } catch (err) {
      console.warn("⚠️ USSD or SMS failed:", err.message);
    }

    console.log("🎉 Full dev seed completed successfully!");
    console.log(`🏫 Schools: ${schoolIds.length}, 📚 Classes: ${Object.values(classMap).flat().length}, 👩‍🏫 Teachers: ${teachers.length}, 👨‍👩‍👧‍👦 Parents: ${parents.length}, 🎓 Students: ${students.length}`);

  } finally {
    clearInterval(heartbeat);
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
