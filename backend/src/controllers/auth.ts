import type { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma'
import { UserRole } from "../../generated/prisma/enums";

export const createUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const body = (req.body ?? {}) as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }

    const { name, email, password } = body;
    let role = body.role ?? UserRole.PATIENT;

    if (!name || !email || !password) {
      return res.status(400).send({ error: "INVALID_REQUEST" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser !== null) {
      return res.status(400).send({ error: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, email, passwordHash: hashedPassword, role },
    });

    return res.status(201).send({ message: "User Created", user: newUser });
  } catch (err: any) {
    console.error("Registration Error: ", err.message);
    return res.status(500).send({ error: "Server error during registration" });
  }
}

export const loginUser = async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const body = (req.body ?? {}) as { email: string; password: string; }

    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true, password: true },
    });

    if (!user) {
      return res.status(400).send({ error: "User is not registered!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ error: "Invalid password!" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN!, { expiresIn: "1d" });
    return res.send({ message: 'Login Succesfully', token });
  } catch (err: any) {
    console.error("Login Error: ", err.message);
    return res.status(500).send({ error: "Server error during login" });
  }
}

export const mfaVerify = async (req: FastifyRequest, res: FastifyReply) => {

}