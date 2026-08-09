import { writeLog } from "../repository/log.repsitory.js";

export async function logger(action = "system", message = "", details = {}) {
  try {
    console.log(`[${action}] ${message}`, details || "");
    await writeLog({ action: `${action}: ${message}`, details });
  } catch (err) {
    console.error("Logger error", err.message);
  }
}
