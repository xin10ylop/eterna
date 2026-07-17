/**
 * Auth service — mock implementation.
 *
 * The interface is the contract; `MockAuthService` will be replaced by a
 * `SupabaseAuthService` implementing the same methods. Security posture even
 * in the mock:
 *  - passwords never leave the sign-in call and are never stored or logged
 *  - verification is a distinct step (code entry) as it will be with OTP
 *  - all methods are async so swapping in network calls changes no callers
 */

export interface AuthService {
  signUp(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  verifyCode(email: string, code: string): Promise<{ ok: true } | { ok: false; error: string }>;
  signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }>;
  signOut(): Promise<void>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const authService: AuthService = {
  async signUp(_email, _password) {
    await delay(600); // simulate network
    return { ok: true };
  },
  async verifyCode(_email, code) {
    await delay(500);
    if (!/^\d{6}$/.test(code)) return { ok: false, error: 'Enter the 6-digit code.' };
    return { ok: true }; // demo: any 6 digits verify
  },
  async signIn(_email, _password) {
    await delay(600);
    return { ok: true };
  },
  async signOut() {
    await delay(200);
  },
};
