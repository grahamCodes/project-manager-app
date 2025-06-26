// src/app/api/auth/signup/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const { name, email, password, confirmPassword, acceptedTerms } =
      await request.json();

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      acceptedTerms !== true
    ) {
      return NextResponse.json(
        { error: "Missing required fields or terms not accepted" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    // Enforce password policy: at least 12 chars, uppercase, lowercase, number or symbol
    const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{12,}$/;
    if (!policyRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 12 characters long and include upper case, lower case, and a number or symbol",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and default settings in one transaction
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        accepted_terms: true,
        Settings: {
          create: {}, // uses default values (including UTC timezone)
        },
      },
      include: { Settings: true },
    });

    // Grab JWT
    const token = signToken({ sub: user.id });

    // Build the response
    const response = NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );

    // Set the httpOnly cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
