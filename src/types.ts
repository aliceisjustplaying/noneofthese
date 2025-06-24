export interface BibleCorpus {
  source: string;
  wordCount: number;
  words: string[];
}

export interface WordAnalysis {
  totalWords: number;
  wordsInBible: number;
  percentage: number;
  foundWords: string[];
  notFoundWords: string[];
}