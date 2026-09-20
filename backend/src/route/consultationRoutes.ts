import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function consultationRoutes(app: FastifyInstance){
 app.post('/book', requireRole('PATIENT'));   //Atomic reservation of a time slot (Requires Idempotency-Key header)
 app.get('/', async (_request, reply) => {
    // Placeholder Controller.
    return reply.send();
  })         //Get paginated list of consultations (filtered by role: Patient/Doctor
 app.get('/:id', async (_request, reply) => {
    // Placeholder Controller.
    return reply.send();
  })   //Retrieve single consultation details
 app.patch('/:id/cancel', requireRole('PATIENT', 'DOCTOR'))   //Cancel booking and release availability slot
 app.patch('/:id/complete', requireRole('DOCTOR'));    //Mark consultation as completed.

 app.post('/:id/prescription', requireRole('DOCTOR'));      //Issue digital prescription with medicine payload

 app.get('/:id/prescription', requireRole('PATIENT', 'DOCTOR'));    //Fetch consultation prescription details
}

export default consultationRoutes;