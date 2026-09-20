import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { prisma } from '../../lib/prisma'
import { UserRole } from "../../generated/prisma/enums";

export const createUserHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = (request.body ?? {}) as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }

    const { name, email, password } = body;
    let role = body.role ?? UserRole.PATIENT;

    if (!name || !email || !password) {
      return reply.status(400).send({ error: "INVALID_REQUEST" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser !== null) {
      return reply.status(400).send({ error: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash: hashedPassword, role },
    });

    return reply.status(201).send({ message: "User Created", user: newUser });
  } catch (err: any) {
    console.error("Registration Error: ", err.message);
    return reply.status(500).send({ error: "Server error during registration" });
  }
}

export const loginUserHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = (request.body ?? {}) as { email: string; password: string; }

    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(400).send({ error: "User is not registered!" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(400).send({ error: "Invalid password!" });
    }

    // CHECK IF MFA IS ENABLED
    if (user.isMfaEnabled) {
      // Generate a temporary 5-minute token for the second factor step
      const mfaToken = request.server.jwt.sign(
        { userId: user.id, type: 'MFA_AUTH_PENDING' },
        { expiresIn: '5m' }
      );

      return reply.status(200).send({
        mfaRequired: true,
        mfaToken,
        message: 'MFA code required. Post token and 6-digit code to /api/v1/auth/mfa/verify',
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN!, { expiresIn: "1d" });
    
    return reply.send({ message: 'Login Succesfully', token });

  } catch (err: any) {
    console.error("Login Error: ", err.message);
    return reply.status(500).send({ error: "Server error during login" });
  }
}

export const verifyMfaHandler = async (
  request: FastifyRequest<{ Body: { mfaToken: string; code: string } }>,
  reply: FastifyReply
) => {
  try {
    const { mfaToken, code } = request.body;

    let payload: any;
    try {
      payload = request.server.jwt.verify(mfaToken);
    } catch (err) {
      return reply.status(401).send({ error: 'Invalid or expired MFA token session.' });
    }

    if (payload.type !== 'MFA_AUTH_PENDING') {
      return reply.status(401).send({ error: 'Invalid token type.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.mfaSecret) {
      return reply.status(400).send({ error: 'MFA details not found for user.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      return reply.status(400).send({ error: 'Invalid MFA verification code.' });
    }

    // Issue full session access token upon success
    const accessToken = request.server.jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      { expiresIn: '1d' }
    );

    return reply.status(200).send({
      message: 'MFA login successful.',
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to complete MFA login.' });
  }
};