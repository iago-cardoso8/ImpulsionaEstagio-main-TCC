-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vagas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "time" TEXT NOT NULL DEFAULT 'Agora mesmo',
    "type" TEXT NOT NULL DEFAULT 'Estágio',
    "salary" TEXT NOT NULL DEFAULT 'A combinar',
    "target" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "requirements" TEXT NOT NULL DEFAULT '[]',
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "usuario_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vagas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vagas" ("benefits", "company", "created_at", "desc", "email", "id", "location", "requirements", "salary", "target", "time", "title", "type", "updated_at") SELECT "benefits", "company", "created_at", "desc", "email", "id", "location", "requirements", "salary", "target", "time", "title", "type", "updated_at" FROM "vagas";
DROP TABLE "vagas";
ALTER TABLE "new_vagas" RENAME TO "vagas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
