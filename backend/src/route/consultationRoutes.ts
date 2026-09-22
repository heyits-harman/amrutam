import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role';
import { authValidation } from '../middleware/authValidation'
import { checkIdempotency } from '../middleware/idempotency'
import { 
  bookConsultationHandler,
  getConsultationsHandler,
  getConsultationByIdHandler,
  cancelConsultationHandler,
  completeConsultationHandler, } from '../controllers/consultation';

import {
  createPrescriptionHandler,
  getPrescriptionHandler,
} from '../controllers/prescription'

async function consultationRoutes(app: FastifyInstance){

  // Auth Middelware
  app.addHook('preHandler', authValidation);

  app.post('/book', { preHandler: [requireRole('PATIENT'), checkIdempotency] }, bookConsultationHandler);     //Atomic reservation of a time slot (Requires Idempotency-Key header)

  app.get('/', getConsultationsHandler);    //Get paginated list of consultations (filtered by role: Patient/Doctor

  app.get('/:id', getConsultationByIdHandler);     //Retrieve single consultation details

  app.patch('/:id/cancel', { preHandler: requireRole('PATIENT', 'DOCTOR') }, cancelConsultationHandler);         //Cancel booking and release availability slot

  app.patch('/:id/complete', { preHandler: requireRole('DOCTOR') }, completeConsultationHandler);         //Mark consultation as completed.

  app.post('/:id/prescription', { preHandler: requireRole('DOCTOR') }, createPrescriptionHandler);         //Issue digital prescription with medicine payload

  app.get('/:id/prescription', { preHandler: requireRole('PATIENT', 'DOCTOR') }, getPrescriptionHandler);         //Fetch consultation prescription details

}

export default consultationRoutes;