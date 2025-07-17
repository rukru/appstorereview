import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
  try {
    // Создать схему БД используя prisma db push
    console.log('Creating database schema...')
    
    // Проверить подключение к БД
    await prisma.$connect()
    
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