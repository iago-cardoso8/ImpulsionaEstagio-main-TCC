PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_candidaturas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vaga_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "cover_letter" TEXT NOT NULL DEFAULT '',
    "applied_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "candidaturas_vaga_id_fkey" FOREIGN KEY ("vaga_id") REFERENCES "vagas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "candidaturas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
  INSERT OR IGNORE INTO "new_candidaturas" ("applied_at", "cover_letter", "id", "status", "updated_at", "usuario_id", "vaga_id")
  SELECT candidatura."applied_at", candidatura."cover_letter", candidatura."id", candidatura."status", candidatura."updated_at", usuario."id", candidatura."vaga_id"
  FROM "candidaturas" AS candidatura
  INNER JOIN "candidatos" AS candidato ON candidato."id" = candidatura."candidato_id"
  INNER JOIN "usuarios" AS usuario ON usuario."id" = (
    SELECT MIN(matching_usuario."id")
    FROM "usuarios" AS matching_usuario
    WHERE lower(matching_usuario."email") = lower(candidato."email")
      AND matching_usuario."role" = 'student'
  );
DROP TABLE "candidaturas";
  DROP TABLE "candidatos";
ALTER TABLE "new_candidaturas" RENAME TO "candidaturas";
CREATE UNIQUE INDEX "candidaturas_vaga_id_usuario_id_key" ON "candidaturas"("vaga_id", "usuario_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
