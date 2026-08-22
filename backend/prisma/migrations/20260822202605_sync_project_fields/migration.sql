-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "challenge" TEXT,
ADD COLUMN     "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "keyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "results" TEXT,
ADD COLUMN     "solution" TEXT;
