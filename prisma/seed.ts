import { PrismaClient, Platform } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Создаем тестовое приложение
  const testApp = await prisma.app.upsert({
    where: { appId: '686449807' },
    update: {},
    create: {
      appId: '686449807',
      platform: Platform.APPSTORE,
      name: 'Telegram',
      bundleId: 'ph.telegra.Telegraph',
      description: 'Fast, secure messaging app'
    }
  })

  console.log('✅ Created test app:', testApp.name)

  // Создаем несколько тестовых отзывов
  const testReviews = [
    {
      originalId: 'review1',
      appId: '686449807',
      platform: Platform.APPSTORE,
      title: 'Отличное приложение!',
      content: 'Пользуюсь уже несколько лет, всё работает быстро и стабильно. Спасибо разработчикам!',
      rating: 5,
      author: 'TestUser1',
      date: new Date('2024-01-15'),
      version: '10.4.1',
      geoScope: 'RU'
    },
    {
      originalId: 'review2',
      appId: '686449807',
      platform: Platform.APPSTORE,
      title: 'Есть проблемы с уведомлениями',
      content: 'Приложение хорошее, но иногда уведомления приходят с задержкой. Хотелось бы исправить.',
      rating: 4,
      author: 'TestUser2',
      date: new Date('2024-01-14'),
      version: '10.4.1',
      geoScope: 'RU'
    },
    {
      originalId: 'review3',
      appId: '686449807',
      platform: Platform.APPSTORE,
      title: 'Нужны новые функции',
      content: 'Добавьте пожалуйста темную тему для всех экранов и возможность группировки чатов.',
      rating: 4,
      author: 'TestUser3',
      date: new Date('2024-01-13'),
      version: '10.4.0',
      geoScope: 'RU'
    }
  ]

  for (const review of testReviews) {
    await prisma.review.upsert({
      where: {
        originalId_platform_appId: {
          originalId: review.originalId,
          platform: review.platform,
          appId: review.appId
        }
      },
      update: {},
      create: review
    })
  }

  console.log('✅ Created test reviews:', testReviews.length)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })