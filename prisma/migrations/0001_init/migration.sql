-- CreateEnum
CREATE TYPE "StatutReservation" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "SourceReservation" AS ENUM ('PUBLIC', 'INTERNE');

-- CreateTable
CREATE TABLE "Creneau" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dureeMinutes" INTEGER NOT NULL DEFAULT 45,
    "capaciteMax" INTEGER NOT NULL DEFAULT 2,
    "lieuDepart" TEXT NOT NULL DEFAULT 'Devant le CCAS',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Creneau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "creneauId" TEXT NOT NULL,
    "nomClient" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "adresse" TEXT,
    "nombrePersonnes" INTEGER NOT NULL DEFAULT 1,
    "besoinsParticuliers" TEXT,
    "statut" "StatutReservation" NOT NULL DEFAULT 'EN_ATTENTE',
    "source" "SourceReservation" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Creneau_date_idx" ON "Creneau"("date");

-- CreateIndex
CREATE INDEX "Reservation_creneauId_idx" ON "Reservation"("creneauId");

-- CreateIndex
CREATE INDEX "Reservation_statut_idx" ON "Reservation"("statut");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_creneauId_fkey" FOREIGN KEY ("creneauId") REFERENCES "Creneau"("id") ON DELETE CASCADE ON UPDATE CASCADE;
