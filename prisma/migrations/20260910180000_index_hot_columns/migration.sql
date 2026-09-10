-- Index the columns the hot read paths filter and sort on.
--
-- Postgres does not create indexes for foreign keys, and none were declared, so
-- every sheet view ran a sequential scan over "Problem" and sorted the result:
--
--   Sort  (actual time=0.432..0.452 rows=500)
--     ->  Seq Scan on "Problem"  (actual time=0.013..0.194 rows=500)
--           Filter: ("sheetId" = 'preset-top300')
--           Rows Removed by Filter: 319
--
-- At ~800 rows that costs half a millisecond; the point is that it grows
-- linearly with the catalogue, which just went from 300 to 500 problems.
--
-- Purely additive: creating an index neither rewrites the table nor changes any
-- row, so this is safe to run against a live database.

CREATE INDEX "Problem_sheetId_order_idx" ON "Problem"("sheetId", "order");

CREATE INDEX "UserNote_userId_idx" ON "UserNote"("userId");
CREATE INDEX "UserNote_problemId_idx" ON "UserNote"("problemId");
