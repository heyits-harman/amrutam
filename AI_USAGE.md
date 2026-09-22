# AI Usage Disclosure

## Overview

This document outlines how artificial intelligence (AI) tools were utilized during the development of Amrutam's Telemedicine Backend MVP. AI was leveraged as a pair-programming collaborator to accelerate architectural planning, schema design, boilerplate code generation, and debugging.


## Areas of AI Collaboration

### 1. Architectural & Development Planning

* Assisted in breaking down the project scope into sequential, actionable execution steps matching the evaluation rubric.
* Helped organize implementation priorities, ranging from core authentication and transactional booking flows to containerization, testing, and system documentation.

### 2. Database Schema & Data Modeling Design

* Collaborated on defining the PostgreSQL relational database schema using Prisma ORM.
* Aided in structuring enums (`UserRole`, `SlotStatus`, `BookingStatus`, `PaymentStatus`) and model relationships across core domain entities (`User`, `DoctorProfile`, `AvailabilitySlot`, `Consultation`, `Prescription`, `Payment`, `AuditLog`).


* Advised on including explicit database indices and optimistic concurrency control fields (`version`) for high-frequency slot availability queries.



### 3. Boilerplate Code & CRUD Implementation

* Accelerated the creation of foundational boilerplate code for modular Fastify routes, controllers, Zod validation schemas, and database seeding scripts.


* Generated initial boilerplate templates for integration tests using Vitest and Supertest across authentication, doctor directory, and booking workflows.
* Assisted in generating standard Docker (`Dockerfile`, `docker-compose.yml`) and GitHub Actions CI workflow configurations.

### 4. Error Resolution & Debugging

* Assisted in diagnosing and fixing minor runtime bugs, TypeScript type mismatches, and route execution errors.
* Helped debug test harness assertions (such as status code mismatches and authentication token extractions) to ensure clean test suite execution.

---

## Human Supervision & Oversight

All AI-generated suggestions, code snippets, and database structures were independently reviewed, validated, and refined by the developer to ensure system reliability, security compliance (RBAC/MFA), data integrity, and strict adherence to project specifications.