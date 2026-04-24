import { auth } from "@/auth";
import type { UserRole } from "@/types";

export interface SessionUser {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: Response };

/** Require any authenticated session. Returns 401 if not signed in. */
export async function requireAuth(): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return {
    ok: true,
    user: {
      id: session.user.id,
      // @ts-expect-error role is a custom field attached in the JWT callback
      role: (session.user.role as UserRole) ?? "seeker",
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}

/** Require one of the specified roles. Returns 401 if not signed in, 403 if wrong role. */
export async function requireRole(...roles: UserRole[]): Promise<AuthResult> {
  const result = await requireAuth();
  if (!result.ok) return result;

  if (!roles.includes(result.user.role)) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "Forbidden",
          details: `Required role: ${roles.join(" or ")}. Your role: ${result.user.role}`,
        },
        { status: 403 },
      ),
    };
  }
  return result;
}

/** Check role without making an HTTP response — useful in Server Components. */
export function hasRole(
  role: UserRole | undefined,
  ...allowed: UserRole[]
): boolean {
  return role !== undefined && allowed.includes(role);
}
