import { createHmac } from "node:crypto";
import { requireCommentIpHashSecret } from "@/lib/env";

export function hashCommentIp(ipAddress: string): string {
  return createHmac("sha256", requireCommentIpHashSecret()).update(ipAddress.trim()).digest("hex");
}
