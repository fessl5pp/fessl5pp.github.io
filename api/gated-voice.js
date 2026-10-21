import voiceHandler from "./voice.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";

export default async function handler(req, res) {
  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;
  req.__bellaAccountVerified = access;
  return voiceHandler(req, res);
}
