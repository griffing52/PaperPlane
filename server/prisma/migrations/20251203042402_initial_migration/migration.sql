-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "licenseNumber" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "flights" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tail_number" TEXT NOT NULL,
    "aircraft_model" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "origin_airport_icao" TEXT NOT NULL,
    "destination_airport_icao" TEXT NOT NULL,
    "departure_time" DATETIME NOT NULL,
    "arrival_time" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "flight_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flight_id" TEXT,
    "user_id" TEXT NOT NULL,
    "upload_id" TEXT,
    "logbook_url" TEXT,
    "date" DATETIME NOT NULL,
    "tail_number" TEXT NOT NULL,
    "src_icao" TEXT NOT NULL,
    "dest_icao" TEXT NOT NULL,
    "route" TEXT,
    "totalFlightTime" DECIMAL NOT NULL DEFAULT 0,
    "picTime" DECIMAL NOT NULL DEFAULT 0,
    "dualReceivedTime" DECIMAL NOT NULL DEFAULT 0,
    "cross_country" BOOLEAN NOT NULL DEFAULT false,
    "night" BOOLEAN NOT NULL DEFAULT false,
    "solo" BOOLEAN NOT NULL DEFAULT false,
    "instrument_time" DECIMAL NOT NULL DEFAULT 0,
    "day_landings" INTEGER NOT NULL DEFAULT 0,
    "night_landings" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flight_entries_flight_id_fkey" FOREIGN KEY ("flight_id") REFERENCES "flights" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flight_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_hash_key" ON "users"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "users_licenseNumber_key" ON "users"("licenseNumber");
