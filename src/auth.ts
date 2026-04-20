import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import type { Adapter } from "@auth/core/adapters";

// Custom adapter mapping NextAuth's camelCase expectations to our snake_case schema
function CribKEAdapter(): Adapter {
  return {
    async createUser(user) {
      const { name, email, emailVerified, image } = user;
      const result = await sql`
        INSERT INTO users (name, email, image)
        VALUES (${name ?? null}, ${email}, ${image ?? null})
        RETURNING id, name, email, image, created_at
      `;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: emailVerified ?? null,
        image: row.image,
      };
    },

    async getUser(id) {
      const result = await sql`SELECT * FROM users WHERE id = ${id}::uuid`;
      if (!result[0]) return null;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: null,
        image: row.image,
        role: row.role,
      };
    },

    async getUserByEmail(email) {
      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      if (!result[0]) return null;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: null,
        image: row.image,
        role: row.role,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const result = await sql`
        SELECT u.* FROM users u
        JOIN accounts a ON u.id::text = a.user_id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      if (!result[0]) return null;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: null,
        image: row.image,
        role: row.role,
      };
    },

    async updateUser(user) {
      const result = await sql`
        UPDATE users
        SET name = ${user.name ?? null}, image = ${user.image ?? null}
        WHERE id = ${user.id}::uuid
        RETURNING id, name, email, image
      `;
      const row = result[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        emailVerified: null,
        image: row.image,
      };
    },

    async deleteUser(userId) {
      await sql`DELETE FROM users WHERE id = ${userId}::uuid`;
    },

    async linkAccount(account) {
      await sql`
        INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type,
          scope, id_token, session_state
        ) VALUES (
          gen_random_uuid()::text,
          ${account.userId},
          ${account.type},
          ${account.provider},
          ${account.providerAccountId},
          ${account.refresh_token ?? null},
          ${account.access_token ?? null},
          ${account.expires_at ?? null},
          ${account.token_type ?? null},
          ${account.scope ?? null},
          ${account.id_token ?? null},
          ${account.session_state ?? null}
        )
        ON CONFLICT (provider, provider_account_id) DO NOTHING
      `;
      return account;
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await sql`
        DELETE FROM accounts
        WHERE provider_account_id = ${providerAccountId} AND provider = ${provider}
      `;
    },

    async createSession({ sessionToken, userId, expires }) {
      await sql`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (gen_random_uuid()::text, ${sessionToken}, ${userId}, ${expires.toISOString()})
      `;
      return { sessionToken, userId, expires };
    },

    async getSessionAndUser(sessionToken) {
      const sessionResult = await sql`
        SELECT * FROM sessions WHERE session_token = ${sessionToken}
      `;
      if (!sessionResult[0]) return null;
      const session = sessionResult[0];

      const userResult = await sql`
        SELECT * FROM users WHERE id::text = ${session.user_id}
      `;
      if (!userResult[0]) return null;
      const row = userResult[0];

      return {
        session: {
          sessionToken: session.session_token,
          userId: session.user_id,
          expires: new Date(session.expires),
        },
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          emailVerified: null,
          image: row.image,
          role: row.role,
        },
      };
    },

    async updateSession({ sessionToken, expires }) {
      if (!expires) return null;
      await sql`
        UPDATE sessions SET expires = ${expires.toISOString()}
        WHERE session_token = ${sessionToken}
      `;
      const result = await sql`
        SELECT * FROM sessions WHERE session_token = ${sessionToken}
      `;
      if (!result[0]) return null;
      const row = result[0];
      return {
        sessionToken: row.session_token,
        userId: row.user_id,
        expires: new Date(row.expires),
      };
    },

    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },

    async createVerificationToken({ identifier, token, expires }) {
      await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${identifier}, ${token}, ${expires.toISOString()})
        ON CONFLICT (identifier, token) DO NOTHING
      `;
      return { identifier, token, expires };
    },

    async useVerificationToken({ identifier, token }) {
      const result = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING identifier, token, expires
      `;
      if (!result[0]) return null;
      const row = result[0];
      return {
        identifier: row.identifier,
        token: row.token,
        expires: new Date(row.expires),
      };
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: CribKEAdapter(),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await sql`
          SELECT id, name, email, password, role, image
          FROM users
          WHERE email = ${credentials.email as string}
        `;
        const user = result[0];
        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        // @ts-expect-error role is a custom field on our user
        session.user.role = user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    newUser: "/auth/signup",
  },
  session: {
    strategy: "database",
  },
});
