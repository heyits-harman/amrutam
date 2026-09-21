import type { FastifyRequest, FastifyReply } from 'fastify';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '../../lib/prisma'

// 1. Get Current User Profile
export const getMeHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id: userId } = request.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isMfaEnabled: true,
        isActive: true,
        createdAt: true,
        profile: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found.' });
    }

    return reply.status(200).send({ user });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to retrieve user profile.' });
  }
};

// 2. Update Current User Profile
export const updateProfileHandler = async (request:FastifyRequest, reply: FastifyReply) => {
  try {

    const body = (request.body ?? {}) as {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
    }

    const { id: userId } = request.user;
    const { firstName, lastName, dateOfBirth, gender, address } = body;

    // Upsert user profile (create if missing, update if existing)
    const updatedProfile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
        ...(gender && { gender }),
        ...(address && { address }),
      },
      create: {
        user: { connect: { id: userId } },
        firstName: firstName || '',
        lastName: lastName || '',
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
      },
    });

    return reply.status(200).send({
      message: 'Profile updated successfully.',
      profile: updatedProfile,
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to update profile.' });
  }
};

// 3. Setup MFA
export const setupMfaHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id: userId } = request.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found.' });
    }

    const secret = speakeasy.generateSecret({
      name: `Amrutam Telemedicine (${user.email})`,
      issuer: 'Amrutam',
    });

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return reply.status(200).send({
      message: 'MFA setup initialized.',
      qrCodeUrl,
      secret: secret.base32,
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to initiate MFA setup.' });
  }
};

// 4. Enable MFA
export const enableMfaHandler = async (
  request: FastifyRequest<{ Body: { code: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: userId } = request.user;
    const { code } = request.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.mfaSecret) {
      return reply.status(400).send({ error: 'MFA setup not initiated.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isVerified) {
      return reply.status(400).send({ error: 'Invalid verification code.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isMfaEnabled: true },
    });

    return reply.status(200).send({ message: 'MFA enabled successfully.' });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to enable MFA.' });
  }
};