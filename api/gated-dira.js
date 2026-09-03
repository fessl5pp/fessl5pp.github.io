import diraHandler from "./dira.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";

export default async function handler(req, res) {
  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;
  return diraHandler(req, res);
}
