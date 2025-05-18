/**
 * Utility to completely reset the application state
 * Clears all authentication cookies, local storage, and client-side state
 */

// Clear all cookies
export function clearAllCookies() {
  // Get all cookies
  const cookies = document.cookie.split(";")

  // For each cookie, set its expiration date to a past date
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  }
}

// Clear local storage items related to authentication
export function clearAuthStorage() {
  // Remove the auth state from localStorage
  localStorage.removeItem("brc_auth_state")

  // Clear any other auth-related items
  const authKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes("auth") || key.includes("token") || key.includes("session") || key.includes("access"))) {
      authKeys.push(key)
    }
  }

  // Remove all identified auth keys
  authKeys.forEach((key) => localStorage.removeItem(key))
}

// Reset the entire application state
export function resetAppState() {
  // Clear cookies
  clearAllCookies()

  // Clear local storage
  clearAuthStorage()

  // Clear session storage
  sessionStorage.clear()

  console.log("Application state has been reset. All authentication data cleared.")

  // Return true to indicate success
  return true
}
