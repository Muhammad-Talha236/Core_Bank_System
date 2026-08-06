// Reads markdown files from knowledge-base/, splits them into sections
// (by ## headers), embeds each section with Gemini, and stores them in
// the KnowledgeChunk table for the chatbot to search later.
//
// Run from the Backend folder:
//   node scripts/ingestKnowledge.js
//
// Safe to re-run - it clears old chunks for a doc before re-inserting,
// so editing the .md file and re-running keeps things in sync.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { embedText } = require('../services/gemini.service');

const KB_DIR = path.join(__dirname, '..', 'knowledge-base');

function splitIntoSections(markdown) {
  // Split on lines starting with "## " - each section becomes one chunk.
  const lines = markdown.split('\n');
  const sections = [];
  let currentTitle = null;
  let currentContent = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = line.replace('## ', '').trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      // top-level title, skip it - not a chunk on its own
      continue;
    } else {
      currentContent.push(line);
    }
  }
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  return sections.filter((s) => s.content.length > 0);
}

async function ingestFile(filename) {
  const filePath = path.join(KB_DIR, filename);
  const markdown = fs.readFileSync(filePath, 'utf-8');
  const sections = splitIntoSections(markdown);

  console.log(`\n📄 ${filename}: ${sections.length} sections found`);

  // Clear old chunks for this doc so re-running doesn't duplicate
  await pool.query(`DELETE FROM "KnowledgeChunk" WHERE "SourceDoc" = $1`, [filename]);

  for (const section of sections) {
    const textToEmbed = `${section.title}\n\n${section.content}`;
    process.stdout.write(`   Embedding "${section.title}"... `);

    try {
      const embedding = await embedText(textToEmbed);
      const vectorLiteral = `[${embedding.join(',')}]`;
      console.log("Embedding dimensions:", embedding.length);

     await pool.query(
  `INSERT INTO "KnowledgeChunk" ("SourceDoc", "SourceSection", "Content", "Embedding")
   VALUES ($1, $2, $3, $4)`,
  [filename, section.title, section.content, vectorLiteral]
);
      console.log('✅');
    } catch (err) {
      console.log('❌', err.message);
    }
  }
}

async function main() {
  const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith('.md'));

  if (files.length === 0) {
    console.log('No .md files found in knowledge-base/');
    process.exit(0);
  }

  for (const file of files) {
    await ingestFile(file);
  }

  console.log('\n✅ Ingestion complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});