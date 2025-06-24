# None Of These Words Are In The Bible

A Bluesky bot that analyzes posts and reports what percentage of words appear in the Bible.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create a `.env` file with your Bluesky credentials:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Build the Bible corpus:
```bash
bun run build-corpus
```

4. Run the bot:
```bash
bun start
```

## How it works

The bot supports two modes based on your mention text:

### Mode 1: "how many"
When you reply to any post with "@bot how many", it analyzes that post.

Example:
```
Post: "there is no such thing as a coincidence"
└─ You: "@noneofthesewords how many"
   └─ Bot: "actually, 71% of these words are in the Bible"
```

### Mode 2: "really?"
When you reply to the bot's analysis with "@bot really?", it re-analyzes the original post (useful for double-checking).

Example:
```
Post: "there is no such thing as a coincidence"
└─ You: "@noneofthesewords how many"
   └─ Bot: "actually, 71% of these words are in the Bible"
      └─ You: "@noneofthesewords really?"
         └─ Bot: "actually, 71% of these words are in the Bible" (re-analyzes the original post)
```

The bot:
1. Checks each word against the World English Bible corpus
2. Replies with the percentage of words found in the Bible
3. Handles contractions and common word variations properly

## Development

Run in watch mode:
```bash
bun dev
```

## Deployment

The bot can be deployed to:
- VPS with PM2 or systemd
- Docker container
- Deno Deploy (with minor modifications)
- Cloud functions (AWS Lambda, Vercel, etc.)

Environment variables needed:
- `BLUESKY_IDENTIFIER`: Your Bluesky handle
- `BLUESKY_PASSWORD`: Your app password (not main password)
