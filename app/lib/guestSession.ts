/**
 * Guest Session Management
 * 
 * Handles guest session IDs for users who access the store without
 * going through Facebook Messenger. Guest sessions are stored in
 * localStorage and persist across browser sessions.
 */

const GUEST_SESSION_KEY = 'guest_session_id';

/**
 * Gets the existing guest session ID or creates a new one if none exists.
 * Guest IDs use the format `guest_<uuid>` to distinguish from Messenger PSIDs.
 */
export function getOrCreateGuestSessionId(): string {
    if (typeof window === 'undefined') return '';

    let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (!sessionId) {
        sessionId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem(GUEST_SESSION_KEY, sessionId);
    }
    return sessionId;
}

/**
 * Gets the existing guest session ID without creating a new one.
 * Returns null if no guest session exists.
 */
export function getGuestSessionId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(GUEST_SESSION_KEY);
}

/**
 * Clears the guest session (e.g., after order completion or manual logout).
 */
export function clearGuestSession(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(GUEST_SESSION_KEY);
    }
}

/**
 * Checks if a session ID is a guest session (vs a Messenger PSID).
 */
export function isGuestSession(sessionId: string): boolean {
    return sessionId.startsWith('guest_');
}
