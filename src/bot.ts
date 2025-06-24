import { Bot } from '@skyware/bot';
import { BibleWordAnalyzer } from './analyzer';
import type { BibleCorpus } from './types';

const IDENTIFIER = process.env.BLUESKY_IDENTIFIER!;
const PASSWORD = process.env.BLUESKY_PASSWORD!;

if (!IDENTIFIER || !PASSWORD) {
  console.error('Please set BLUESKY_IDENTIFIER and BLUESKY_PASSWORD environment variables');
  process.exit(1);
}

async function loadCorpus(): Promise<BibleCorpus> {
  try {
    const corpusFile = await Bun.file('data/bible-corpus.json').text();
    return JSON.parse(corpusFile);
  } catch (error) {
    console.error('Failed to load corpus. Run "bun run build-corpus" first.');
    process.exit(1);
  }
}

async function main() {
  console.log('Loading Bible corpus...');
  const corpus = await loadCorpus();
  const analyzer = new BibleWordAnalyzer(corpus);
  console.log(`Loaded ${corpus.wordCount} unique words from ${corpus.source}`);

  const bot = new Bot();
  
  await bot.login({
    identifier: IDENTIFIER,
    password: PASSWORD
  });

  console.log('Bot logged in successfully!');

  bot.on('mention', async (mention) => {
    try {
      console.log(`Received mention from @${mention.author.handle}: "${mention.text}"`);
      
      // Debug logging
      console.log('Mention object:', {
        text: mention.text,
        hasParent: !!mention.parent,
        parentType: mention.parent ? typeof mention.parent : 'none'
      });
      
      // Determine which post to analyze based on mention text
      let postToAnalyze;
      const mentionTextLower = mention.text.toLowerCase();
      
      if (mentionTextLower.includes("how many")) {
        // "how many" - analyze the post this mention is replying to
        postToAnalyze = mention.parent;
      } else if (mentionTextLower.includes("really?") || mentionTextLower.includes("really")) {
        // "really?" - user is questioning our analysis
        // Structure: original post -> bot reply -> "really?"
        // We need to find what the bot originally analyzed
        console.log('Really path - checking parent chain...');
        
        try {
          const parent = mention.parent; // This should be bot's reply
          console.log('Parent (bot reply):', {
            exists: !!parent,
            text: parent && 'text' in parent ? (parent.text as string).substring(0, 100) + '...' : 'no text'
          });
          
          if (parent && 'fetchParent' in parent) {
            // Fetch the post that the bot was replying to (the original post)
            const originalPost = await parent.fetchParent({ parentHeight: 1 });
            console.log('Fetched original post:', {
              exists: !!originalPost,
              text: originalPost && 'text' in originalPost ? (originalPost.text as string) : 'no text'
            });
            
            postToAnalyze = originalPost;
          }
        } catch (error) {
          console.error('Error fetching parent chain:', error);
        }
      } else {
        // Ignore mentions that don't contain "how many" or "really"
        console.log('Ignoring mention - no recognized command');
        return;
      }

      // More debug logging
      if (postToAnalyze) {
        console.log('Post to analyze:', {
          hasText: 'text' in postToAnalyze,
          textPreview: 'text' in postToAnalyze ? (postToAnalyze.text as string).substring(0, 50) : 'no text'
        });
      }

      if (!postToAnalyze || typeof postToAnalyze !== 'object' || !('text' in postToAnalyze)) {
        // This should only happen if someone uses the command on a post without a parent
        console.log('No post found to analyze');
        return;
      }

      const textToAnalyze = postToAnalyze.text;
      const analysis = analyzer.analyze(textToAnalyze);

      // Detailed logging of analysis
      console.log('\n=== ANALYSIS RESULTS ===');
      console.log(`Text: "${textToAnalyze}"`);
      console.log(`Total words: ${analysis.totalWords}`);
      console.log(`Words in Bible: ${analysis.wordsInBible} (${analysis.percentage}%)`);
      console.log(`\nWords FOUND in Bible: ${analysis.foundWords.join(', ') || '(none)'}`);
      console.log(`Words NOT found in Bible: ${analysis.notFoundWords.join(', ') || '(none)'}`);
      console.log('========================\n');

      let replyText;
      if (mentionTextLower.includes("really?") || mentionTextLower.includes("really")) {
        // For "really?" responses, use "actually"
        replyText = analysis.percentage === 0 
          ? "none of these words are in the Bible"
          : `actually, ${analysis.percentage}% of these words are in the Bible`;
      } else {
        // For "how many" and other mentions, don't use "actually"
        replyText = analysis.percentage === 0 
          ? "none of these words are in the Bible"
          : `${analysis.percentage}% of these words are in the Bible`;
      }

      await mention.reply({
        text: replyText
      });
      
    } catch (error) {
      console.error('Error handling mention:', error);
      try {
        await mention.reply({
          text: "Sorry, I encountered an error analyzing that post."
        });
      } catch (replyError) {
        console.error('Failed to send error reply:', replyError);
      }
    }
  });

  bot.on('error', (error) => {
    console.error('Bot error:', error);
  });

  console.log('Bot is running! Waiting for mentions...');
}

main().catch(console.error);