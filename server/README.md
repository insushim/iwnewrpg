# RuneWord Chronicle Server

Socket.IO server for the Lineage Classic-style RPG game.

## Quick Start

### Local Development
```bash
npm run dev:server     # Start server only
npm run dev           # Start both client and server
```

### Production Deployment

#### Railway (Recommended)
1. Push to GitHub
2. Connect repository to Railway
3. Railway will auto-detect the `railway.json` config
4. Set environment variables in Railway dashboard
5. Deploy!

#### Manual Docker
```bash
docker build -t runeword-server .
docker run -p 3001:3001 runeword-server
```

#### Heroku/Render
Upload with the included `Procfile`

## Environment Variables

Required for production:
```bash
PORT=3001
NODE_ENV=production
```

Optional (if using Firestore):
```bash
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=your-key
FIREBASE_CLIENT_EMAIL=your-email
```

## API Endpoints

- `GET /health` - Health check (returns `{ok: true}`)

## Socket.IO Events

### Client → Server
- `player:connect` - Initial connection
- `player:move` - Player movement
- `monster:attack` - Attack monster
- `quiz:answer` - Quiz answer
- `chat:send` - Chat message
- `shop:buy` / `shop:sell` - Store transactions

### Server → Client
- `world:init` - Initial world state
- `player:state` - Player data sync
- `monster:updated` - Monster state changes
- `quiz:open` / `quiz:result` - Quiz system
- `chat:message` - Chat messages

## Offline Mode

The client gracefully falls back to offline mode when the server is unavailable:

- ✅ Monster spawning and AI
- ✅ Combat system with damage calculation
- ✅ Quiz system for vocabulary learning
- ✅ Experience and gold rewards
- ✅ Local inventory management
- ✅ Shop transactions

Players can enjoy the full game experience without a server connection.

## Server Architecture

- **Express.js** - HTTP server
- **Socket.IO** - Real-time communication
- **TypeScript** - Type safety
- **Node.js 20** - Runtime

## File Structure

```
server/
├── index.ts          # Entry point
├── gameServer.ts     # Socket.IO setup
├── combatHandler.ts  # Combat logic
├── quizHandler.ts    # Quiz system
├── roomManager.ts    # Room management
├── monsterManager.ts # Monster AI
└── README.md         # This file
```