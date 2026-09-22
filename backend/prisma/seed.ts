import {
  UserRole,
  SlotStatus,
  BookingStatus,
} from '../generated/prisma/enums'; // Imports from custom output location
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@amrutam.com',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      profile: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
        },
      },
    },
  });
  console.log(`👤 Created Admin: ${adminUser.email}`);

  // 4. Create Doctor Users & Profiles
  const doctor1User = await prisma.user.create({
    data: {
      name: 'Dr. Aarav Sharma',
      email: 'aarav.sharma@amrutam.com',
      passwordHash,
      role: UserRole.DOCTOR,
      isActive: true,
      profile: {
        create: {
          firstName: 'Aarav',
          lastName: 'Sharma',
          gender: 'Male',
        },
      },
      doctorProfile: {
        create: {
          specialization: 'Ayurveda',
          licenseNumber: 'AYU-102938',
          experienceYears: 12,
          consultationFee: 500.0,
          isVerified: true,
        },
      },
    },
    include: { doctorProfile: true },
  });

  const doctor2User = await prisma.user.create({
    data: {
      name: 'Dr. Priya Patel',
      email: 'priya.patel@amrutam.com',
      passwordHash,
      role: UserRole.DOCTOR,
      isActive: true,
      profile: {
        create: {
          firstName: 'Priya',
          lastName: 'Patel',
          gender: 'Female',
        },
      },
      doctorProfile: {
        create: {
          specialization: 'Dermatology',
          licenseNumber: 'DERM-564738',
          experienceYears: 8,
          consultationFee: 750.0,
          isVerified: true,
        },
      },
    },
    include: { doctorProfile: true },
  });

  console.log(`👨‍⚕️ Created Doctors: ${doctor1User.email}, ${doctor2User.email}`);

  // 5. Create Patient User
  const patientUser = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul.verma@example.com',
      passwordHash,
      role: UserRole.PATIENT,
      isActive: true,
      profile: {
        create: {
          firstName: 'Rahul',
          lastName: 'Verma',
          gender: 'Male',
          address: 'Connaught Place, New Delhi',
        },
      },
    },
  });
  console.log(`🧑 Created Patient: ${patientUser.email}`);

  // 6. Create Availability Slots
  const now = new Date();

  // Future slot 1 (Available)
  await prisma.availabilitySlot.create({
    data: {
      doctorId: doctor1User.doctorProfile!.id,
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: SlotStatus.AVAILABLE,
    },
  });

  // Future slot 2 (Available)
  await prisma.availabilitySlot.create({
    data: {
      doctorId: doctor1User.doctorProfile!.id,
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: SlotStatus.AVAILABLE,
    },
  });

  // Past slot (Booked)
  const slot3 = await prisma.availabilitySlot.create({
    data: {
      doctorId: doctor1User.doctorProfile!.id,
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: SlotStatus.BOOKED,
    },
  });

  console.log('📅 Created Availability Slots for Dr. Aarav Sharma.');

  // 7. Create Past Consultation & Prescription
  const pastConsultation = await prisma.consultation.create({
    data: {
      patientId: patientUser.id,
      doctorId: doctor1User.doctorProfile!.id,
      slotId: slot3.id,
      notes: 'Initial consultation for digestive issues.',
      status: BookingStatus.COMPLETED,
    },
  });

  await prisma.prescription.create({
    data: {
      consultationId: pastConsultation.id,
      medicines: [
        {
          name: 'Triphala Churna',
          dosage: '1 tsp',
          frequency: 'Once at night',
          duration: '14 days',
        },
        {
          name: 'Amla Extract',
          dosage: '500mg',
          frequency: 'Twice daily after meals',
          duration: '30 days',
        },
      ],
      instructions: 'Drink warm water throughout the day. Avoid fried food.',
    },
  });

  console.log('📋 Created past Completed Consultation & Prescription.');

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });