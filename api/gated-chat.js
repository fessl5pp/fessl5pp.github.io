import chatHandler from "./chat.js";
import { checkBellaAccountAccess, rejectSuspendedAccount } from "../lib/bella-account-access.js";
import { requireBellaOwner } from "../lib/bella-owner-access.js";
import { handleBellaOwnerPersonaPreview } from "../lib/bella-owner-persona-preview.js";

export default async function handler(req, res) {
  if (req.method === "POST" && req.body?.ownerPreview === true) {
    const owner = await requireBellaOwner(req, res);
    if (!owner) return;
    return handleBellaOwnerPersonaPreview(req, res);
  }

  const access = await checkBellaAccountAccess(req);
  if (rejectSuspendedAccount(res, access)) return;
  return chatHandler(req, res);
}
