import { ICONS } from "../lib/bella-icons.js";

export default function handler(req, res) {
  const url = new URL(req.url || "/api/icon-v3", "https://bella.local");
  const requested = url.searchParams.get("size") || "192";
  const size = requested === "512" ? "512" : "192";
  const data = Buffer.from(ICONS[size], "base64");
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.status(200).send(data);
}
