"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password } = signUpSchema.parse(credentials);

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const [existingUsername, existingEmail] = await Promise.all([
      prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: "insensitive",
          },
        },
      }),
      prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      }),
    ]);

    if (existingUsername) {
      return {
        error: "Username is already taken. Please choose a different one.",
      };
    }

    if (existingEmail) {
      return {
        error: "User with this email already exists. Please log in.",
      };
    }

    await createUser(userId, username, email, passwordHash);
    await createAndSetSession(userId);

    return redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: "Something went wrong! Please try again.",
    };
  }
}

async function createUser(
  userId: string,
  username: string,
  email: string,
  passwordHash: string,
) {
  await prisma.user.create({
    data: {
      id: userId,
      username,
      displayName: username,
      email,
      passwordHash,
    },
  });
}

async function createAndSetSession(userId: string) {
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}
