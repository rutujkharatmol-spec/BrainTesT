#!/usr/bin/env node

/**
 * Recomputes stored SKEP scores from the saved raw answers.
 *
 * SKEP used to reverse-score the wrong items, so every stored score was
 * inverted (stored = 54 - correct): a participant who fully trusts advertising
 * was recorded as maximally skeptical. Raw answers were always saved exactly
 * as selected (strongly agree = 5), so the correct score can be rebuilt from
 * them. Recomputing, rather than applying 54 - score, makes this safe to run
 * more than once and leaves records submitted after the fix untouched.
 *
 * Usage:
 *   node scripts/recompute-skep-scores.js           # dry run: report only
 *   node scripts/recompute-skep-scores.js --apply   # write corrected scores
 *
 * Afterwards, press "Sync Google Sheet" in the admin page so the sheet matches.
 */

const { PrismaClient } = require('@prisma/client');

// Must match the SKEP entry in src/config/questionnaires.ts.
const ITEMS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9'];
const REVERSED = new Set(['q1', 'q2', 'q4', 'q6', 'q8']);
const SCALE_MIN = 1;
const SCALE_MAX = 5;

/** Correct SKEP total, or null if the raw answers are incomplete. */
function skepScore(raw) {
  let total = 0;
  for (const id of ITEMS) {
    const value = raw ? raw[id] : undefined;
    if (typeof value !== 'number' || value < SCALE_MIN || value > SCALE_MAX) return null;
    total += REVERSED.has(id) ? SCALE_MIN + SCALE_MAX - value : value;
  }
  return total;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const prisma = new PrismaClient();

  try {
    const rows = await prisma.sKEPSubmission.findMany({
      select: { id: true, rawScores: true, score: true },
    });

    const updates = [];
    let unchanged = 0;
    let unscorable = 0;

    for (const row of rows) {
      const correct = skepScore(row.rawScores);
      if (correct === null) {
        unscorable++;
        console.warn(`  ! ${row.id}: incomplete raw answers, score left at ${row.score}`);
      } else if (correct === row.score) {
        unchanged++;
      } else {
        updates.push({ id: row.id, from: row.score, to: correct });
      }
    }

    console.log(`SKEP submissions: ${rows.length}`);
    console.log(`  to correct:  ${updates.length}`);
    console.log(`  already correct: ${unchanged}`);
    console.log(`  unscorable:  ${unscorable}`);
    for (const u of updates.slice(0, 10)) console.log(`    ${u.id}: ${u.from} -> ${u.to}`);
    if (updates.length > 10) console.log(`    ... and ${updates.length - 10} more`);

    if (!apply) {
      console.log('\nDry run only. Re-run with --apply to write these corrections.');
      return;
    }

    await prisma.$transaction(
      updates.map((u) =>
        prisma.sKEPSubmission.update({ where: { id: u.id }, data: { score: u.to } })
      )
    );
    console.log(`\nUpdated ${updates.length} SKEP score(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
