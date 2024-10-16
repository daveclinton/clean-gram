/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import {
  type LoginInput,
  loginSchema,
  type SignupInput,
  signupSchema,
} from "../validators/auth";
import { Paths } from "../constants";
import { db } from "~/server/db";
import { generateId, Scrypt } from "lucia";
import { lucia } from "~/lib/auth";
import { cookies } from "next/headers";
import {
  emailVerificationCodes,
  passwordResetTokens,
  users,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { generateRandomString, alphabet } from "oslo/crypto";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";
import { EmailTemplate, sendMail } from "../email";
import { validateRequest } from "./validate-request";
import { z } from "zod";
import { env } from "~/env";

export interface ActionResponse<T> {
  fieldError?: Partial<Record<keyof T, string | undefined>>;
  formError?: string;
}

export async function login(
  _: any,
  formData: FormData,
): Promise<ActionResponse<LoginInput>> {
  const obj = Object.fromEntries(formData.entries());

  const parsed = loginSchema.safeParse(obj);
  if (!parsed.success) {
    const err = parsed.error.flatten();
    return {
      fieldError: {
        email: err.fieldErrors.email?.[0],
        password: err.fieldErrors.password?.[0],
      },
    };
  }

  const { email, password } = parsed.data;

  const existingUser = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
  if (!existingUser || !existingUser?.hashedPassword) {
    return {
      formError: "Incorrect email or password",
    };
  }
  const validPassword = await new Scrypt().verify(
    existingUser.hashedPassword,
    password,
  );

  if (!validPassword) {
    return {
      formError: "Incorrect email or password",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect(Paths.Dashboard);
}
export async function signup(
  _: any,
  formData: FormData,
): Promise<ActionResponse<SignupInput>> {
  const obj = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(obj);

  if (!parsed.success) {
    const err = parsed.error.flatten();
    return {
      fieldError: {
        email: err.fieldErrors.email?.[0],
        password: err.fieldErrors.password?.[0],
      },
    };
  }

  const { email, password } = parsed.data;

  const existingUser = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
    columns: { email: true },
  });

  if (existingUser) {
    return {
      formError: "Cannot create account with that email",
    };
  }

  const userId = generateId(21);
  const hashedPassword = await new Scrypt().hash(password);

  await db.insert(users).values({
    id: userId,
    email,
    hashedPassword,
  });

  const verificationCode = await generateEmailVerificationCode(userId, email);
  await sendMail(email, EmailTemplate.EmailVerification, {
    code: verificationCode,
  });
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect(Paths.VerifyEmail);
}

export async function logout(): Promise<{ error: string } | void> {
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "No session found",
    };
  }
  await lucia.invalidateSession(session.id);
  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/");
}

export async function resendVerificationEmail(): Promise<{
  error?: string;
  success?: boolean;
}> {
  const { user } = await validateRequest();
  if (!user) {
    return redirect(Paths.Login);
  }
  const lastSent = await db.query.emailVerificationCodes.findFirst({
    where: (table, { eq }) => eq(table.userId, user.id),
    columns: { expiresAt: true },
  });

  if (lastSent && isWithinExpirationDate(lastSent.expiresAt)) {
    return {
      error: `Please wait ${timeFromNow(lastSent.expiresAt)} before resending`,
    };
  }
  const verificationCode = await generateEmailVerificationCode(
    user.id,
    user.email,
  );
  await sendMail(user.email, EmailTemplate.EmailVerification, {
    code: verificationCode,
  });

  return { success: true };
}

export async function sendPasswordResetLink(
  _: any,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const email = formData.get("email");
  const parsed = z.string().trim().email().safeParse(email);
  if (!parsed.success) {
    return { error: "Provided email is invalid." };
  }
  try {
    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, parsed.data),
    });

    if (!user || !user.emailVerified)
      return { error: "Provided email is invalid." };

    const verificationToken = await generatePasswordResetToken(user.id);

    const verificationLink = `${env.NEXTAUTH_URL}/reset-password/${verificationToken}`;

    await sendMail(user.email, EmailTemplate.PasswordReset, {
      link: verificationLink,
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Failed to send verification email." };
  }
}

async function generateEmailVerificationCode(
  userId: string,
  email: string,
): Promise<string> {
  await db
    .delete(emailVerificationCodes)
    .where(eq(emailVerificationCodes.userId, userId));

  const code = generateRandomString(8, alphabet("0-9"));

  await db.insert(emailVerificationCodes).values({
    userId,
    email,
    code,
    expiresAt: createDate(new TimeSpan(10, "m")),
  });
  return code;
}

async function generatePasswordResetToken(userId: string): Promise<string> {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  const tokenId = generateId(40);
  await db.insert(passwordResetTokens).values({
    id: tokenId,
    userId,
    expiresAt: createDate(new TimeSpan(2, "h")),
  });
  return tokenId;
}
const timeFromNow = (time: Date) => {
  const now = new Date();
  const diff = time.getTime() - now.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor(diff / 1000) % 60;
  return `${minutes}m ${seconds}s`;
};
