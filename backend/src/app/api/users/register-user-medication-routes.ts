import type { FastifyInstance } from "fastify";
import { listUserMedicationsRoute, saveUserMedicationRoute } from "./[id]/medications/route.js";
import { deleteUserMedicationRoute } from "./[id]/medications/[medId]/route.js";

export function registerUserMedicationRoutes(app: FastifyInstance) {
  app.get("/api/users/:id/medications", listUserMedicationsRoute);
  app.post("/api/users/:id/medications", saveUserMedicationRoute);
  app.delete("/api/users/:id/medications/:medId", deleteUserMedicationRoute);
}
