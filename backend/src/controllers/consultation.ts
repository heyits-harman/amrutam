import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { Prisma } from "../../generated/prisma/client";
import type { 
  BookConsultationInput, 
  GetConsultationsQuery, 
  GetConsultationByIdParams, 
  ConsultationIdParams, 
} from '../validations/consultationSchema';


export const bookConsultationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  const idempotencyKey = request.headers['idempotency-key'] as string;
  const patientId = (request.user as { id: string }).id;
  const { slotId, notes } = request.body as BookConsultationInput;

  try {
    // Execute atomic transaction for slot reservation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch slot with concurrency lock check
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
      });

      if (!slot) {
        throw { status: 404, message: 'Availability slot not found' };
      }

      if (slot.status !== 'AVAILABLE') {
        throw { status: 409, message: 'Slot has already been reserved or booked' };
      }

      if (new Date(slot.startTime) < new Date()) {
        throw { status: 400, message: 'Cannot book a time slot in the past' };
      }

      // 2. Mark slot as BOOKED and increment version
      const updatedSlot = await tx.availabilitySlot.updateMany({
        where: {
          id: slotId,
          status: 'AVAILABLE',
          version: slot.version, // Optimistic concurrency check
        },
        data: {
          status: 'BOOKED',
          version: { increment: 1 },
        },
      });

      if (updatedSlot.count === 0) {
        throw { status: 409, message: 'Slot booking collision detected. Please try another slot.' };
      }

      // 3. Create Consultation Record
      const consultation = await tx.consultation.create({
        data: {
          patientId,
          doctorId: slot.doctorId,
          slotId,
          notes: notes ?? null,
          status: 'CONFIRMED',
        },
        include: {
          slot: true,
          doctor: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      return consultation;
    });

    const responseBody = {
      success: true,
      message: 'Consultation booked successfully',
      data: result,
    };

    // Cache successful response against the Idempotency Key in audit logs
    await prisma.auditLog.create({
      data: {
        userId: patientId,
        action: `IDEMPOTENCY_KEY:${idempotencyKey}`,
        resource: `Consultation:${result.id}`,
        metadata: { status: 201, body: responseBody },
      },
    });

    return reply.status(201).send(responseBody);
  } catch (error: any) {
    if (error.status) {
      return reply.status(error.status).send({
        success: false,
        message: error.message,
      });
    }

    return reply.status(500).send({
      success: false,
      message: 'Failed to complete consultation booking',
    });
  }
};

// List Consultations (Role-Filtered)
export const getConsultationsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string; role: string };
    const { status, page = 1, limit = 10 } = request.query as GetConsultationsQuery;

    const skip = (page - 1) * limit;
    const whereClause: Prisma.ConsultationWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    // Role-based filtering scope
    if (user.role === 'PATIENT') {
      whereClause.patientId = user.id;
    } else if (user.role === 'DOCTOR') {
      // Find doctor profile ID matching authenticated user ID
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!doctorProfile) {
        return reply.status(404).send({
          success: false,
          message: 'Doctor profile not found',
        });
      }
      whereClause.doctorId = doctorProfile.id;
    }
    // Note: ADMIN role bypasses filters and sees all records

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          slot: true,
          patient: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
          doctor: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
          prescription: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consultation.count({ where: whereClause }),
    ]);

    return reply.status(200).send({
      success: true,
      data: consultations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve consultations',
    });
  }
};

// Get Single Consultation Details by ID
export const getConsultationByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as GetConsultationByIdParams;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        slot: true,
        patient: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        doctor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        prescription: true,
      },
    });

    if (!consultation) {
      return reply.status(404).send({
        success: false,
        message: 'Consultation record not found',
      });
    }

    // Access control check: User must be Patient owner, assigned Doctor, or Admin
    if (user.role === 'PATIENT' && consultation.patientId !== user.id) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: You cannot access this consultation',
      });
    }

    if (user.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!doctorProfile || consultation.doctorId !== doctorProfile.id) {
        return reply.status(403).send({
          success: false,
          message: 'Forbidden: You cannot access this consultation',
        });
      }
    }

    return reply.status(200).send({
      success: true,
      data: consultation,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve consultation details',
    });
  }
};

// Cancel Consultation & Release Slot
export const cancelConsultationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as ConsultationIdParams;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!consultation) {
      return reply.status(404).send({
        success: false,
        message: 'Consultation not found',
      });
    }

    if (consultation.status === 'CANCELLED' || consultation.status === 'COMPLETED') {
      return reply.status(400).send({
        success: false,
        message: `Cannot cancel a consultation that is already ${consultation.status.toLowerCase()}`,
      });
    }

    // Ownership check
    if (user.role === 'PATIENT' && consultation.patientId !== user.id) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: You can only cancel your own consultations',
      });
    }

    if (user.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: user.id },
      });

      if (!doctorProfile || consultation.doctorId !== doctorProfile.id) {
        return reply.status(403).send({
          success: false,
          message: 'Forbidden: You can only cancel your own consultations',
        });
      }
    }

    // Perform atomic status updates inside a transaction
    await prisma.$transaction([
      prisma.consultation.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      prisma.availabilitySlot.update({
        where: { id: consultation.slotId },
        data: { status: 'AVAILABLE', version: 0 },
      }),
    ]);

    return reply.status(200).send({
      success: true,
      message: 'Consultation cancelled and slot released successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to cancel consultation',
    });
  }
};

// Mark Consultation as Completed (Doctor Only)
export const completeConsultationHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as { id: string; role: string };
    const { id } = request.params as ConsultationIdParams;

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
      where: { id },
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
        message: 'Forbidden: You can only complete your own assigned consultations',
      });
    }

    if (consultation.status !== 'CONFIRMED' && consultation.status !== 'PENDING') {
      return reply.status(400).send({
        success: false,
        message: `Cannot mark consultation as completed from status '${consultation.status}'`,
      });
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    return reply.status(200).send({
      success: true,
      message: 'Consultation marked as completed',
      data: updatedConsultation,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to mark consultation as completed',
    });
  }
};