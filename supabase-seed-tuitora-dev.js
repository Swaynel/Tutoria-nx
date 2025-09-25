import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

// -------------------- Supabase Setup --------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// -------------------- Helper Functions --------------------
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate grades
function randomGrade() {
  return `${faker.datatype.number({ min: 1, max: 12 })}th Grade`;
}

// Generate attendance status
function randomAttendance() {
  return faker.helpers.arrayElement(['present', 'absent', 'late']);
}

// Generate payment description
function randomPaymentDescription() {
  return faker.helpers.arrayElement([
    'Math Tuition', 'Physics Tuition', 'Biology Lab', 'School Fee', 'Library Fee'
  ]);
}

// -------------------- Seed Function --------------------
async function seed() {
  try {
    console.log('🚀 Seeding started...');

    // ---------- Superadmin ----------
    const { data: superadmin, error: superadminError } = await supabase.from('profiles').upsert({
      email: 'sayaneezy254@gmail.com',
      full_name: 'Super Admin',
      role: 'superadmin',
    }).select().single();
    if (superadminError) {
      console.error('Error adding superadmin:', superadminError.message);
    } else if (superadmin) {
      console.log('Superadmin added:', superadmin.email);
    } else {
      console.log('Superadmin upsert did not return a row.');
    }

    // ---------- Schools Loop ----------
    const schoolNames = [
      'Tuitora Dev School',
      'Greenfield Academy',
      'Sunrise High',
      'Future Leaders School',
      'Knowledge Valley School'
    ];

    for (let s = 0; s < schoolNames.length; s++) {
      // ---------- School ----------
      const { data: school } = await supabase.from('schools').insert({
        name: schoolNames[s],
        address: faker.address.streetAddress() + ', Nairobi',
        phone: faker.phone.number('07########'),
        slug: schoolNames[s].toLowerCase().replace(/\s/g, '-')
      }).select().single();
      console.log('School added:', school.name);

      // ---------- School Admin ----------
      const { data: schoolAdmin } = await supabase.from('profiles').upsert({
        email: s === 0 ? 'isaiahnyariki300@gmail.com' : faker.internet.email(),
        full_name: faker.name.fullName(),
        role: 'school_admin',
        school_id: school.id,
      }).select().single();
      console.log('School Admin added:', schoolAdmin.email);

      // ---------- Teachers ----------
      const teachers = [];
      for (let i = 0; i < 20; i++) {
        const { data: teacher } = await supabase.from('profiles').insert({
          email: faker.internet.email(),
          full_name: faker.name.fullName(),
          role: 'teacher',
          school_id: school.id,
          phone: faker.phone.number('07########')
        }).select().single();
        teachers.push(teacher);
      }
      console.log(`${teachers.length} teachers added for ${school.name}.`);

      // ---------- Parents ----------
      const parents = [];
      for (let i = 0; i < 50; i++) {
        const phone = (s === 0 && i === 0) ? '711929567' : faker.phone.number('07########');
        const { data: parent } = await supabase.from('profiles').insert({
          email: faker.internet.email(),
          full_name: faker.name.fullName(),
          role: 'parent',
          phone,
          school_id: school.id
        }).select().single();
        parents.push(parent);
      }
      console.log(`${parents.length} parents added for ${school.name}.`);

      // ---------- Students ----------
      const students = [];
      for (let i = 0; i < 100; i++) {
        const { data: student } = await supabase.from('students').insert({
          name: faker.name.fullName(),
          grade: randomGrade(),
          date_of_birth: faker.date.birthdate({ min: 10, max: 18, mode: 'age' }),
          school_id: school.id,
          is_active: true,
        }).select().single();
        students.push(student);

        // Parent-Student Relationship
        const parent1 = randomFromArray(parents);
        const parent2 = randomFromArray(parents);
        await supabase.from('parent_student_relationships').insert([
          { parent_id: parent1.id, student_id: student.id },
          { parent_id: parent2.id, student_id: student.id }
        ]);
      }
      console.log(`${students.length} students added for ${school.name}.`);

      // ---------- Attendance ----------
      const attendanceRecords = [];
      for (let student of students) {
        const record = {
          student_id: student.id,
          school_id: school.id,
          date: faker.date.recent(30).toISOString().split('T')[0],
          status: randomAttendance(),
          marked_by: randomFromArray(teachers).id,
          created_at: new Date().toISOString()
        };
        attendanceRecords.push(record);
      }
      await supabase.from('attendance').insert(attendanceRecords);
      console.log(`Attendance added for ${students.length} students.`);

      // ---------- Payments ----------
      const payments = [];
      for (let student of students) {
        const payment = {
          student_id: student.id,
          school_id: school.id,
          amount: faker.datatype.number({ min: 1000, max: 5000 }),
          description: randomPaymentDescription(),
          paid_at: faker.date.recent(30).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        payments.push(payment);
      }
      await supabase.from('payments').insert(payments);
      console.log(`Payments added for ${students.length} students.`);

      // ---------- Messages ----------
      const messages = [];
      for (let i = 0; i < 50; i++) {
        const sender = randomFromArray([...teachers, ...parents]);
        const recipient = randomFromArray([...teachers, ...parents, ...students]);
        if (sender.id === recipient.id) continue; // avoid self-message
        const message = {
          sender_id: sender.id,
          recipient_id: recipient.id,
          school_id: school.id,
          subject: faker.lorem.sentence(3),
          content: faker.lorem.paragraph(),
          sent_at: faker.date.recent(10).toISOString(),
          created_at: new Date().toISOString()
        };
        messages.push(message);
      }
      await supabase.from('messages').insert(messages);
      console.log(`${messages.length} messages added for ${school.name}.`);
    }

    console.log('✅ Full seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    process.exit();
  }
}

seed();
