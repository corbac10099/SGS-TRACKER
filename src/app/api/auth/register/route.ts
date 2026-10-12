import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, dataRetentionPolicy, dataRetentionDays } = body;

    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, mot de passe et pseudo sont requis.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cet email.' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName: lastName || null,
        onboardingDone: false,
        dataRetentionPolicy: dataRetentionPolicy || "1_season",
        dataRetentionDays: typeof dataRetentionDays === "number" ? dataRetentionDays : 90,
      },
    });

    return NextResponse.json(
      { message: 'Compte créé avec succès.', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
