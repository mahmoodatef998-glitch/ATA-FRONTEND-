import { customAlphabet } from "nanoid";

// Generate public order tracking token
// Uses uppercase letters and numbers for easy reading
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 12);

export function generatePublicToken(): string {
  return nanoid();
}

