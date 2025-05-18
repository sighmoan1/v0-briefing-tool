import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Set an access cookie for a resource
export function setAccessCookie(resourceId: string, resourceType: string) {
  const session = {
    resource_id: resourceId,
    resource_type: resourceType,
    expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }

  cookies().set(`${resourceType}_access_${resourceId}`, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

// Check if a resource access cookie exists and is valid
export function checkAccessCookie(resourceId: string, resourceType: string): boolean {
  const cookie = cookies().get(`${resourceType}_access_${resourceId}`)

  if (!cookie) {
    return false
  }

  try {
    const session = JSON.parse(cookie.value)
    return session.expires > Date.now()
  } catch (error) {
    return false
  }
}
