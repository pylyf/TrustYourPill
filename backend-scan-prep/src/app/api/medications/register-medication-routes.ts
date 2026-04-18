import type { FastifyInstance } from "fastify";
import { searchMedicationRoute } from "./search/route.js";
import { medicationProfileRoute } from "./profile/route.js";
import { checkMedicationRoute } from "./check/route.js";
import { scanMedicationRoute } from "./scan/route.js";

export function registerMedicationRoutes(app: FastifyInstance) {
  app.get("/api/medications/search", searchMedicationRoute);
  app.get("/api/medications/profile", medicationProfileRoute);
  app.post("/api/medications/scan", scanMedicationRoute);
  app.post("/api/medications/check", checkMedicationRoute);
}
