import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import type { 
  CreatePrescriptionInput,
  GetPrescriptionParams, 
} from '../validations/consultationSchema';

// Create Prescription (Doctor Only)
export const createPrescriptionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string };
    const { id: consultationId } = request.params as GetPrescriptionParams;
    const { medicines, instructions } = request.body as CreatePrescriptionInput;

    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!doctorProfile) {
      return reply.status(404).send({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { prescription: true },
    });

    if (!consultation) {
      return reply.status(404).send({
        success: false,
        message: 'Consultation not found',
      });
    }

    if (consultation.doctorId !== doctorProfile.id) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: You can only issue prescriptions for your assigned patients',
      });
    }

    if (consultation.prescription) {
      return reply.status(400).send({
        success: false,
        message: 'A prescription has already been issued for this consultation',
      });
    }

    // Create prescription record
    const prescription = await prisma.prescription.create({
      data: {
        consultationId,
        medicines: medicines as any, // Stored as structured JSON array in PostgreSQL
        instructions: instructions ?? null,
      },
    });

    return reply.status(201).send({
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to create prescription',
    });
  }
};

// Fetch Prescription
export const getPrescriptionHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string; role: string };
    const { id: consultationId } = request.params as GetPrescriptionParams;

    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { prescription: true },
    });

    if (!consultation) {
      return reply.status(404).send({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Ownership check
    if (user.role === 'PATIENT' && consultation.patientId !== user.id) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: You cannot access this prescription',
      });
    }

    if (user.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!doctorProfile || consultation.doctorId !== doctorProfile.id) {
        return reply.status(403).send({
          success: false,
          message: 'Forbidden: You cannot access this prescription',
        });
      }
    }

    if (!consultation.prescription) {
      return reply.status(404).send({
        success: false,
        message: 'No prescription has been issued yet for this consultation',
      });
    }

    return reply.status(200).send({
      success: true,
      data: consultation.prescription,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve prescription',
    });
  }
};