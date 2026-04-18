import type { FastifyInstance } from "fastify";
import { searchMedicationRoute } from "./search/route.js";
import { medicationProfileRoute } from "./profile/route.js";
import { checkMedicationRoute } from "./check/route.js";

export function registerMedicationRoutes(app: FastifyInstance) {
  app.get("/api/medications/search", searchMedicationRoute);
  app.get("/api/medications/profile", medicationProfileRoute);
  app.post("/api/medications/check", checkMedicationRoute);
}
