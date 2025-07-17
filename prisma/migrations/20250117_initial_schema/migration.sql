-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('APPSTORE', 'GOOGLEPLAY');

-- CreateTable
CREATE TABLE "apps" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "name" TEXT,
    "bundleId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analyses" (
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

-- CreateIndex
CREATE UNIQUE INDEX "apps_appId_key" ON "apps"("appId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_originalId_platform_appId_key" ON "reviews"("originalId", "platform", "appId");

-- CreateIndex
CREATE INDEX "reviews_appId_platform_idx" ON "reviews"("appId", "platform");

-- CreateIndex
CREATE INDEX "reviews_appId_platform_geoScope_idx" ON "reviews"("appId", "platform", "geoScope");

-- CreateIndex
CREATE INDEX "reviews_date_idx" ON "reviews"("date");

-- CreateIndex
CREATE UNIQUE INDEX "analyses_shareId_key" ON "analyses"("shareId");

-- CreateIndex
CREATE INDEX "analyses_appId_dateFilter_idx" ON "analyses"("appId", "dateFilter");

-- CreateIndex
CREATE INDEX "analyses_createdAt_idx" ON "analyses"("createdAt");

-- CreateIndex
CREATE INDEX "analyses_shareId_idx" ON "analyses"("shareId");

-- CreateIndex
CREATE INDEX "analyses_isPublic_idx" ON "analyses"("isPublic");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("appId") ON DELETE CASCADE ON UPDATE CASCADE;