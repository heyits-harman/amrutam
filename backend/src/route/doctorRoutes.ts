import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role';
import { getDoctorsHandler, getDoctorByIdHandler, createSlotsHandler, getAvailableSlotsHandler,  deleteSlotHandler } from '../controllers/doctor'

async function doctorRoutes(app: FastifyInstance){

  app.get('/', getDoctorsHandler );       //Search and filter doctors by specialization, experience etc

  app.get('/:id', { preHandler: requireRole('PATIENT') }, getDoctorByIdHandler);     //Fetch doctor details alongside their active schedules

  app.post('/slots', { preHandler: requireRole('DOCTOR') }, createSlotsHandler);  //Bulk-create upcoming availability time slots

  app.get('/slots/available', { preHandler: requireRole('PATIENT') }, getAvailableSlotsHandler);         //Query available slots across dates and specializations.

  app.delete('/slots/:id', { preHandler: requireRole('DOCTOR') }, deleteSlotHandler);         //Cancle Booking
}

export default doctorRoutes;