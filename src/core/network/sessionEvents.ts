type SessionListener = () => void;

/**
 * Minimal pub/sub so `core/network` can announce "session expired" without
 * importing the Redux store (that would invert the dependency direction:
 * core → store). `store/slices/authSlice` subscribes to this at app startup
 * and dispatches `logout()` in response — see src/app/providers/AppProviders.tsx.
 */
class SessionEventBus {
  private listeners = new Set<SessionListener>();

  onSessionExpired(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emitSessionExpired(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const sessionEvents = new SessionEventBus();
