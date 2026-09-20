import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma'
import { Prisma } from "../../generated/prisma/client";
import type { GetDoctorsQuery, GetDoctorByIdParams, CreateBulkSlotsInput, GetAvailableSlotsQuery, DeleteSlotParams } from '../validations/doctorSchema';

export const getDoctorsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { specialization, minExperience, maxFee, search, page = 1, limit = 10 } = request.query as GetDoctorsQuery;

    const skip = (page - 1) * limit;

    // Build conditions array dynamically
    const conditions: Prisma.DoctorProfileWhereInput[] = [];

    if (specialization) {
      conditions.push({
        specialization: { contains: specialization, mode: 'insensitive' },
      });
    }

    if (minExperience !== undefined) {
      conditions.push({
        experienceYears: { gte: minExperience },
      });
    }

    if (maxFee !== undefined) {
      conditions.push({
        consultationFee: { lte: maxFee },
      });
    }

    if (search) {
      conditions.push({
        user: {
          name: { contains: search, mode: 'insensitive' },
        },
      });
    }

    // Combine conditions into a single where object
    const whereClause: Prisma.DoctorProfileWhereInput = conditions.length > 0 ? { AND: conditions } : {};

    // Execute query and count simultaneously
    const [doctors, total] = await Promise.all([
      prisma.doctorProfile.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.doctorProfile.count({ where: whereClause }),
    ]);

    return reply.status(200).send({
      success: true,
      data: doctors,
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
      message: 'Failed to retrieve doctors.',
    });
  }
};

export const getDoctorByIdHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as GetDoctorByIdParams;

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        slots: {
          where: {
            status: 'AVAILABLE',
            startTime: {
              gte: new Date(), // Only fetch future available slots
            },
          },
          orderBy: {
            startTime: 'asc',
          },
        },
      },
    });

    if (!doctor) {
      return reply.status(404).send({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    return reply.status(200).send({
      success: true,
      data: doctor,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve doctor profile details',
    });
  }
};

export const createSlotsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as { id: string }).id;
    const { slots } = request.body as CreateBulkSlotsInput;

    // 1. Retrieve the doctor profile corresponding to the authenticated user
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctorProfile) {
      return reply.status(404).send({
        success: false,
        message: 'Doctor profile not found for this account',
      });
    }

    // 2. Validate time slots (startTime < endTime and not in the past)
    const now = new Date();
    for (const slot of slots) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      if (start >= end) {
        return reply.status(400).send({
          success: false,
          message: `Invalid slot time range: startTime (${slot.startTime}) must be before endTime (${slot.endTime})`,
        });
      }

      if (start < now) {
        return reply.status(400).send({
          success: false,
          message: `Cannot create availability slot in the past: ${slot.startTime}`,
        });
      }
    }

    // 3. Map slots payload with doctorId
    const slotsData = slots.map((slot) => ({
      doctorId: doctorProfile.id,
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      status: 'AVAILABLE' as const,
    }));

    // 4. Batch insert into database
    const createdSlots = await prisma.availabilitySlot.createMany({
      data: slotsData,
      skipDuplicates: true, // Prevents throwing errors if duplicate slot exists
    });

    return reply.status(201).send({
      success: true,
      message: `${createdSlots.count} availability slot(s) created successfully`,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to create availability slots',
    });
  }
};

export const getAvailableSlotsHandler = async(request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { specialization, doctorId, startDate, endDate } =
      request.query as GetAvailableSlotsQuery;

    const now = new Date();
    const start = startDate ? new Date(startDate) : now;

    // Build filter for availability slots
    const whereClause: Prisma.AvailabilitySlotWhereInput = {
      status: 'AVAILABLE',
      startTime: {
        gte: start,
        ...(endDate && { lte: new Date(endDate) }),
      },
      ...(doctorId && { doctorId }),
      ...(specialization && {
        doctor: {
          specialization: { contains: specialization, mode: 'insensitive' },
        },
      }),
    };

    const availableSlots = await prisma.availabilitySlot.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            id: true,
            specialization: true,
            consultationFee: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return reply.status(200).send({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to retrieve available slots',
    });
  }
};

export const deleteSlotHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as { id: string }).id;
    const { id } = request.params as DeleteSlotParams;

    // 1. Fetch doctor profile associated with current authenticated user
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!doctorProfile) {
      return reply.status(404).send({
        success: false,
        message: 'Doctor profile not found',
      });
    }

    // 2. Fetch target availability slot
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id },
    });

    if (!slot) {
      return reply.status(404).send({
        success: false,
        message: 'Availability slot not found',
      });
    }

    // 3. Ownership check: ensure doctor owns this slot
    if (slot.doctorId !== doctorProfile.id) {
      return reply.status(403).send({
        success: false,
        message: 'Forbidden: You can only delete your own availability slots',
      });
    }

    // 4. Booking check: do not allow deleting already booked slots
    if (slot.status === 'BOOKED') {
      return reply.status(400).send({
        success: false,
        message: 'Cannot delete a slot that is already booked by a patient. Please cancel the consultation instead.',
      });
    }

    // 5. Delete slot
    await prisma.availabilitySlot.delete({
      where: { id },
    });

    return reply.status(200).send({
      success: true,
      message: 'Availability slot deleted successfully',
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to delete availability slot',
    });
  }
};