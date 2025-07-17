import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Создать схему БД используя SQL команды
    console.log('Creating database schema...')
    
    // Проверить подключение к БД
    await prisma.$connect()
    
    // Создать enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "Platform" AS ENUM ('APPSTORE', 'GOOGLEPLAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    
    // Создать таблицы
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "apps" (
        "id" TEXT NOT NULL,
        "appId" TEXT NOT NULL,
        "platform" "Platform" NOT NULL,
        "name" TEXT,
        "bundleId" TEXT,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
      );
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "reviews" (
        "id" TEXT NOT NULL,
        "originalId" TEXT NOT NULL,
        "appId" TEXT NOT NULL,
        "platform" "Platform" NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "author" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL,
        "version" TEXT,
        "helpful" INTEGER,
        "geoScope" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
      );
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "analyses" (
        "id" TEXT NOT NULL,
        "appId" TEXT NOT NULL,
        "version" INTEGER NOT NULL DEFAULT 1,
        "shareId" TEXT NOT NULL,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "dateFilter" TEXT NOT NULL,
        "reviewsCount" INTEGER NOT NULL,
        "sentiment" TEXT NOT NULL,
        "themes" TEXT[],
        "summary" TEXT NOT NULL,
        "recommendations" TEXT[],
        "score" INTEGER NOT NULL,
        "problems" JSONB NOT NULL,
        "appreciatedFeatures" JSONB,
        "featureRequests" JSONB,
        "reviewsAnalyzed" INTEGER,
        "openaiModel" TEXT NOT NULL DEFAULT 'gpt-4.1',
        "processingTime" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
      );
    `)
    
    // Создать индексы
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "apps_appId_key" ON "apps"("appId");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "reviews_originalId_platform_appId_key" ON "reviews"("originalId", "platform", "appId");
    `)
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "analyses_shareId_key" ON "analyses"("shareId");
    `)
    
    // Добавить внешние ключи
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "analyses" ADD CONSTRAINT "analyses_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)
    
    // Проверить что таблицы созданы
    const appsCount = await prisma.app.count()
    const reviewsCount = await prisma.review.count()
    const analysesCount = await prisma.analysis.count()
    
    console.log('Database schema created successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema created and ready',
      stats: {
        apps: appsCount,
        reviews: reviewsCount,
        analyses: analysesCount
      }
    })
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create database schema',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  try {
    // Проверить статус БД
    await prisma.$connect()
    
    const appsCount = await prisma.app.count()
    const reviewsCount = await prisma.review.count()
    const analysesCount = await prisma.analysis.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database is ready',
      stats: {
        apps: appsCount,
        reviews: reviewsCount,
        analyses: analysesCount
      }
    })
    
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Database not ready',
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}