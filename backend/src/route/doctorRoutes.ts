import type { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/role'

async function doctorRoutes(app: FastifyInstance){
  app.get('/', requireRole('PATIENT'));               //Search and filter doctors by specialization, experience etc
  app.get('/:id', requireRole('PATIENT'));            //Fetch doctor details alongside their active schedules
  app.post('/slots', requireRole('DOCTOR'));          //Bulk-create upcoming availability time slots
  app.get('/slots/available', requireRole('PATIENT')) //Query available slots across dates and specializations.
  app.delete('/slots/:id', requireRole('DOCTOR'))
}

export default doctorRoutes;