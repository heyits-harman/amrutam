import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma'
import { Prisma } from "../../generated/prisma/client";
import type { GetAuditLogsQuery } from '../validations/adminSchema';

// 1. Platform Analytics
export const getAnalyticsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalSlots,
      bookedSlots,
      totalConsultations,
      consultationStatusCounts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.doctorProfile.count({ where: { isVerified: true } }),
      prisma.availabilitySlot.count(),
      prisma.availabilitySlot.count({ where: { status: 'BOOKED' } }),
      prisma.consultation.count(),
      prisma.consultation.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Format consultation breakdown into a structured object
    const statusBreakdown = consultationStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Slot utilization rate
    const slotUtilizationRate =
      totalSlots > 0 ? ((bookedSlots / totalSlots) * 100).toFixed(2) + '%' : '0%';

    return reply.status(200).send({
      success: true,
      data: {
        users: {
          totalPatients,
          totalDoctors,
        },
        slots: {
          totalSlots,
          bookedSlots,
          utilizationRate: slotUtilizationRate,
        },
        consultations: {
          total: totalConsultations,
          breakdownByStatus: statusBreakdown,
        },
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: 'Failed to compute platform analytics',
    });
  }
};

// 2. Audit Logs Query
export const getAuditLogsHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { action, userId, page = 1, limit = 20 } = request.query as GetAuditLogsQuery;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.AuditLogWhereInput = {
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
      ...(userId && { userId }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: whereClause }),
    ]);

    return reply.status(200).send({
      success: true,
      data: logs,
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
      message: 'Failed to retrieve audit logs',
    });
  }
};