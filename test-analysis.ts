#!/usr/bin/env bun

import { BibleWordAnalyzer } from './src/analyzer';
import type { BibleCorpus } from './src/types';

async function test() {
  const corpusFile = await Bun.file('data/bible-corpus.json').text();
  const corpus: BibleCorpus = JSON.parse(corpusFile);
  const analyzer = new BibleWordAnalyzer(corpus);
  
  const testPhrases = [
    "there is no such thing as a coincidence",
    "how many",
    "the quick brown fox jumps over the lazy dog"
  ];
  
  for (const phrase of testPhrases) {
    const analysis = analyzer.analyze(phrase);
    console.log(`\nPhrase: "${phrase}"`);
    console.log(`Total words: ${analysis.totalWords}`);
    console.log(`Words in Bible: ${analysis.wordsInBible} (${analysis.percentage}%)`);
    console.log(`Found: ${analysis.foundWords.join(', ')}`);
    console.log(`Not found: ${analysis.notFoundWords.join(', ')}`);
  }
}

test();