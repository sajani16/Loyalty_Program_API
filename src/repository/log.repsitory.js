import Log from "../models/Log.js";

export async function writeLog(entry) {
  const log = new Log(entry);
  return log.save();
}

export async function listLogs(filter, options) {
  const data = await Log.paginate(filter, options);

  return {
    data,
  };
}
