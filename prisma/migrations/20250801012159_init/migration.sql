-- CreateTable
CREATE TABLE "public"."TMenuItem" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "image" TEXT,

    CONSTRAINT "TMenuItem_pkey" PRIMARY KEY ("id")
);
