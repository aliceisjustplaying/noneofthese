#!/usr/bin/env bun

const WEB_BIBLE_URL = "https://www.sacred-texts.com/bib/web/";

async function downloadBible() {
  console.log("Downloading World English Bible...");
  
  const books = [
    "gen", "exo", "lev", "num", "deu", "jos", "jdg", "rut", "sa1", "sa2",
    "kg1", "kg2", "ch1", "ch2", "ezr", "neh", "est", "job", "psa", "pro",
    "ecc", "sol", "isa", "jer", "lam", "eze", "dan", "hos", "joe", "amo",
    "oba", "jon", "mic", "nah", "hab", "zep", "hag", "zac", "mal",
    "mat", "mar", "luk", "joh", "act", "rom", "co1", "co2", "gal", "eph",
    "phi", "col", "th1", "th2", "ti1", "ti2", "tit", "plm", "heb", "jam",
    "pe1", "pe2", "jo1", "jo2", "jo3", "jde", "rev"
  ];
  
  // Download all books in parallel with concurrency limit
  const BATCH_SIZE = 10;
  const results: string[] = [];
  
  for (let i = 0; i < books.length; i += BATCH_SIZE) {
    const batch = books.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (book) => {
      try {
        const response = await fetch(`${WEB_BIBLE_URL}${book}.htm`);
        if (!response.ok) {
          console.warn(`Failed to fetch ${book}: ${response.status}`);
          return '';
        }
        
        const html = await response.text();
        const textMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (textMatch) {
          const bodyText = textMatch[1]
            .replace(/<[^>]*>/g, ' ')
            .replace(/&[^;]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          console.log(`Downloaded ${book}`);
          return bodyText;
        }
        return '';
      } catch (error) {
        console.error(`Error downloading ${book}:`, error);
        return '';
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(text => text.length > 0));
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < books.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results.join(' ');
}

function buildWordSet(text: string): Set<string> {
  // First, remove verse numbers and chapter headings (e.g., "1:1", "Chapter 1")
  const cleanedText = text
    .toLowerCase()
    .replace(/\b\d+:\d+\b/g, ' ') // Remove verse numbers like "3:16"
    .replace(/chapter\s+\d+/gi, ' ') // Remove chapter headings
    .replace(/\b\d+\b/g, ' '); // Remove standalone numbers
  
  // Extract words, handling contractions properly
  const words = cleanedText
    .replace(/--/g, ' ') // Replace double dashes with space
    .replace(/[''`]/g, "'") // Normalize apostrophes
    .replace(/[^a-z\s'-]/g, ' ') // Keep only letters, spaces, apostrophes, and hyphens
    .split(/\s+/)
    .map(word => word.trim())
    .filter(word => {
      // Filter out empty strings, single quotes, and single hyphens
      if (word.length === 0 || word === "'" || word === '-') return false;
      
      // Remove leading/trailing quotes and hyphens
      word = word.replace(/^['"-]+|['"-]+$/g, '');
      
      // Skip if it's just punctuation or too short
      if (word.length === 0) return false;
      
      // Skip if it starts or ends with punctuation (except valid contractions)
      if (/^[-']|[-']$/.test(word) && !isValidContraction(word)) return false;
      
      return true;
    })
    .map(word => {
      // Clean up the word one more time
      return word.replace(/^['"-]+|['"-]+$/g, '');
    })
    .filter(word => word.length > 0);
  
  return new Set(words);
}

function isValidContraction(word: string): boolean {
  // Common valid contractions
  const validContractions = [
    "don't", "doesn't", "didn't", "won't", "wouldn't", "shouldn't", "couldn't",
    "can't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't",
    "i'm", "i've", "i'll", "i'd", "you're", "you've", "you'll", "you'd",
    "he's", "he'll", "he'd", "she's", "she'll", "she'd", "it's", "it'll",
    "we're", "we've", "we'll", "we'd", "they're", "they've", "they'll", "they'd",
    "that's", "that'll", "that'd", "who's", "who'll", "who'd", "what's", "what'll",
    "where's", "where'll", "when's", "how's", "let's", "here's", "there's"
  ];
  
  return validContractions.includes(word.toLowerCase());
}

async function main() {
  try {
    // Check if we have cached raw text
    const cacheFile = "data/bible-raw-text.cache";
    let bibleText: string;
    
    try {
      const cached = await Bun.file(cacheFile).text();
      console.log("Using cached Bible text");
      bibleText = cached;
    } catch {
      // No cache, download fresh
      const startTime = Date.now();
      bibleText = await downloadBible();
      const downloadTime = Date.now() - startTime;
      console.log(`Downloaded ${bibleText.length} characters in ${(downloadTime / 1000).toFixed(1)}s`);
      
      // Cache the raw text for future runs
      await Bun.write(cacheFile, bibleText);
      console.log("Cached raw text for future use");
    }
    
    console.log("Building word corpus...");
    const wordSet = buildWordSet(bibleText);
    console.log(`Found ${wordSet.size} unique words`);
    
    const corpus = {
      source: "World English Bible",
      wordCount: wordSet.size,
      words: Array.from(wordSet).sort()
    };
    
    await Bun.write("data/bible-corpus.json", JSON.stringify(corpus));
    console.log("Corpus saved to data/bible-corpus.json");
    
  } catch (error) {
    console.error("Error building corpus:", error);
    process.exit(1);
  }
}

main();