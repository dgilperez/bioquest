# 🎭 Mock Mode - Development Without iNaturalist OAuth

**Status:** ACTIVE - Mock mode is automatically enabled when iNaturalist OAuth credentials are not configured

---

## What is Mock Mode?

Mock Mode allows you to test and develop BioQuest without waiting for iNaturalist OAuth approval. It provides realistic fake data that simulates the full app experience.

## How It Works

Mock mode activates automatically when:
- `INATURALIST_CLIENT_ID` is not set in `.env.local`, OR
- `INATURALIST_CLIENT_ID` equals `your_client_id_here` (default value)

When active, you'll see:
- 🎭 **Sign-in page**: Shows "Demo Mode" with a username input field
- 🎭 **Mock observations**: 50 diverse observations with realistic data
- 🎭 **Sync endpoint**: Uses mock data instead of calling iNaturalist API

## What You Get in Mock Mode

### Mock Observations (50 total)
- **30 different species** including:
  - Birds (Great Tit, Common Raven, Golden Eagle, etc.)
  - Mammals (Red Fox, Red Squirrel, Gray Wolf, Brown Bear, etc.)
  - Amphibians & Reptiles (Common Frog, Fire Salamander, Grass Snake, etc.)
  - Fungi (Fly Agaric, Porcini, Chanterelle, etc.)
  - Insects (Honey Bee, Bumblebee, Stag Beetle, etc.)
  - Plants (European Oak, European Beech, Scots Pine, etc.)

### Realistic Rarity Distribution
- **70% Normal** (>1000 global observations)
- **25% Rare** (100-1000 global observations)
- **5% Legendary** (<100 global observations, including first-ever finds)

### Quality Grade Distribution
- **80% Research Grade** (gets +25 bonus points)
- **15% Needs ID**
- **5% Casual**

### Features & Variety
- Random photo counts (0-5 photos per observation)
- Dates spread across the last year
- 10 different locations (Central Park, Black Forest, Amazon, etc.)
- Proper iconic taxa (Aves, Mammalia, Plantae, Fungi, etc.)

### Points System Works Perfectly
Each observation earns points based on:
- **Base**: 10 points
- **New species** (70% chance): +50 points
- **Rarity bonuses**:
  - Rare: +100 points
  - Legendary: +500 points
  - First global: +500 additional points
- **Research grade**: +25 points
- **Photos** (max 3): +5 points each

**Typical first sync**: ~3,000-5,000 points, reaching level 4-6!

---

## How to Use Mock Mode

### 1. Start the App

```bash
npm run dev
```

The app will automatically detect mock mode and show the demo sign-in screen.

### 2. Sign In

1. Go to `http://localhost:3000` (or 3001 if 3000 is busy)
2. You'll see **"🎭 Demo Mode - Mock data for development"**
3. Enter any username (default: "naturalist")
4. Click **"🎭 Sign in with Mock Data"**

### 3. Explore the App

**Dashboard**:
- See your mock stats (50 observations, 30 species, ~4,000 points)
- View your level progress and title
- Check rare and legendary observation counts

**Sync Button**:
- Click "Sync Now" to load the mock observations
- Watch badges unlock!
- See quest progress update
- Experience level-up animations
- Get completion notifications

**Badges Page** (`/badges`):
- View unlocked badges based on mock data
- See locked badges you haven't earned yet
- Filter by category

**Observations Page** (`/observations`):
- Browse all 50 mock observations
- Filter by rarity (Normal/Rare/Legendary)
- Filter by quality grade
- See realistic observation cards with photos

**Quests Page** (`/quests`):
- View auto-generated daily/weekly/monthly quests
- See real-time progress tracking
- Watch quests complete based on mock observations

---

## Mock Data Details

### Observation IDs
- Range: 1000000 - 1000049
- Sequential for easy testing

### Taxon IDs
- Range: 100000 - 100029
- Mapped to real species names

### User ID
- Fixed: 999999
- Same for all mock users

### Dates
- Spread across last 365 days
- Random distribution for realistic variety

### Photos
- Placeholder images from picsum.photos
- Unique for each observation
- 0-5 photos per observation

---

## Switching to Real Mode

When your iNaturalist OAuth application is approved:

1. Update `.env.local`:
```bash
INATURALIST_CLIENT_ID=your_real_client_id
INATURALIST_CLIENT_SECRET=your_real_client_secret
```

2. Restart the dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

3. The app will automatically detect real credentials and switch to OAuth mode

4. You'll see the normal "Sign in with iNaturalist" button

---

## Technical Implementation

### Files Modified/Created

**Auth System**:
- `src/lib/auth.ts` - Added CredentialsProvider for mock mode
- `src/components/auth/SignInForm.tsx` - Added mock mode UI

**Mock Data**:
- `src/lib/inat/mock-data.ts` - Mock observation generator
- `src/lib/stats/mock-sync.ts` - Mock sync implementation
- `src/app/api/sync/route.ts` - Routes to mock sync when in dev mode

### Detection Logic

```typescript
const isMockMode = !process.env.INATURALIST_CLIENT_ID ||
                   process.env.INATURALIST_CLIENT_ID === 'your_client_id_here';
```

### Mock Flow

```
User enters username
  ↓
CredentialsProvider creates mock user
  ↓
User record created in database (inatId: 999999)
  ↓
Dashboard loads mock stats
  ↓
Sync button clicked
  ↓
Mock sync generates 50 observations
  ↓
Points calculated, badges unlocked, quests progress
  ↓
User sees full app experience!
```

---

## Benefits of Mock Mode

✅ **No waiting** for iNaturalist approval
✅ **Full feature testing** with realistic data
✅ **Badge system** works perfectly
✅ **Quest system** tracks progress
✅ **Animations** trigger correctly
✅ **Rarity detection** shows all types
✅ **Points calculation** matches production
✅ **Reproducible** testing (same data every sync)

---

## Limitations

⚠️ **Not real iNaturalist data** - species names are real but observations are fake
⚠️ **Fixed dataset** - always the same 50 observations
⚠️ **No actual API calls** - doesn't test iNaturalist integration
⚠️ **Single user ID** - all mock users share ID 999999

---

## Troubleshooting

### "Sign in with iNaturalist" shows instead of mock mode

**Solution**: Check your `.env.local` file:
```bash
# Should be:
INATURALIST_CLIENT_ID=your_client_id_here

# Or just delete/comment out the line:
# INATURALIST_CLIENT_ID=...
```

### Database errors on sync

**Solution**: Reset the database:
```bash
npx prisma migrate reset
# Confirm with 'y'
```

### No observations showing

**Solution**: Click the "Sync Now" button on the dashboard

### Mock mode not working

**Solution**:
1. Check server logs for "🎭 Using mock data sync"
2. Verify `.env` doesn't override `.env.local`
3. Restart dev server

---

## Next Steps

Once iNaturalist approves your OAuth app:
1. Add real credentials to `.env.local`
2. Restart the server
3. Test with real data
4. Keep mock mode code for future development
5. Deploy to production with real credentials

---

**Enjoy exploring BioQuest with mock data!** 🌿🎮

The mock mode gives you the complete experience - unlock badges, complete quests, level up, and see all the animations while you wait for iNaturalist approval!
