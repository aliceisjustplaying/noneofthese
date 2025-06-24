import type { BibleCorpus, WordAnalysis } from './types';

export class BibleWordAnalyzer {
  private wordSet: Set<string>;

  constructor(corpus: BibleCorpus) {
    this.wordSet = new Set(corpus.words);
  }

  analyze(text: string): WordAnalysis {
    const words = this.extractWords(text);
    
    // Count unique words only
    const uniqueWords = new Set(words);
    const foundWords: string[] = [];
    const notFoundWords: string[] = [];

    for (const word of uniqueWords) {
      if (this.wordSet.has(word)) {
        foundWords.push(word);
      } else {
        notFoundWords.push(word);
      }
    }

    const totalWords = uniqueWords.size;
    const wordsInBible = foundWords.length;
    const percentage = totalWords > 0 ? Math.round((wordsInBible / totalWords) * 100) : 0;

    return {
      totalWords,
      wordsInBible,
      percentage,
      foundWords: foundWords.sort(),
      notFoundWords: notFoundWords.sort()
    };
  }

  private extractWords(text: string): string[] {
    // Match the same word extraction logic as build-corpus.ts
    const cleanedText = text
      .toLowerCase()
      .replace(/\b\d+:\d+\b/g, ' ')
      .replace(/chapter\s+\d+/gi, ' ')
      .replace(/\b\d+\b/g, ' ');
    
    return cleanedText
      .replace(/--/g, ' ')
      .replace(/[''`]/g, "'")
      .replace(/[^a-z\s'-]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => {
        if (word.length === 0 || word === "'" || word === '-') return false;
        word = word.replace(/^['"-]+|['"-]+$/g, '');
        if (word.length === 0) return false;
        if (/^[-']|[-']$/.test(word) && !this.isValidContraction(word)) return false;
        return true;
      })
      .map(word => word.replace(/^['"-]+|['"-]+$/g, ''))
      .filter(word => word.length > 0);
  }

  private isValidContraction(word: string): boolean {
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
}