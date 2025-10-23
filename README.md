# 🌿 BioQuest

**Transform your iNaturalist observations into an epic adventure**

BioQuest is a gamified companion app for [iNaturalist](https://www.inaturalist.org/) that adds points, levels, badges, quests, and leaderboards to biodiversity observation. Catch 'em all in real life - with virtually infinite species to discover!

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-green)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

### 🎮 Gamification Core (✅ Implemented)
- **Points & Levels**: Earn XP for every observation with bonuses for new species (+50), rarity (up to +1000), research grade (+25), and photos (+5 each)
- **Rarity System**: Automatic classification of Normal, Rare, and **Legendary** species based on global observation counts
- **Badge Collection**: Unlock 29 unique achievements across 7 categories:
  - 🏆 **Milestone**: First Steps, Century Club, Elite Observer
  - 🦜 **Taxon**: Bird Watcher, Plant Expert, Insect Hunter, Marine Explorer
  - 💎 **Rarity**: Rare Finder, Legendary Finder, First Discovery
  - 🌍 **Geography**: World Traveler, Local Expert
  - ⏰ **Time**: Early Bird, Night Owl, Year-Round Naturalist
  - 🎯 **Challenge**: Photographer, Research Contributor
  - 🎁 **Secret**: Hidden achievements to discover
- **Animated Achievements**: Full-screen animations with sparkles for badge unlocks and confetti for level-ups
- **Smart Notifications**: Toast notifications for all achievements with automatic batching

### 📊 Stats & Tracking (✅ Implemented)
- **Live Dashboard**: Real-time stats including total observations, species, rare finds, and legendary discoveries
- **Level Progress**: Visual XP bar showing progress to next level with 7 rank titles (Novice → Legendary)
- **Observation Browser**: Filter and browse all observations by rarity and quality grade
- **Sync System**: One-click sync with achievement detection and notifications

### 🗺️ Planned Features (Coming Soon)
- **Quest System**: Daily, weekly, and monthly challenges (v0.2.0)
- **Gap Analysis**: Find missing species in your region
- **Trip Planning**: Suggestions for target species locations

### 👥 Future Enhancements
- **Leaderboards**: Global, regional, and friends rankings (v0.3.0)
- **Group Challenges**: Team events and BioBlitz competitions (v0.3.0)
- **Social Sharing**: Celebrate achievements with the community (v0.3.0)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- SQLite (included - no database server needed!)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bioquest.git
cd bioquest

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your iNaturalist OAuth credentials

# Setup database (SQLite - creates dev.db automatically)
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Get iNaturalist OAuth Credentials

1. Go to [iNaturalist OAuth Apps](https://www.inaturalist.org/oauth/applications)
2. Create a new application:
   - **Name**: BioQuest (Development)
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/inaturalist`
   - **Scopes**: `read` (and `write` if implementing observation upload)
3. Copy your Client ID and Client Secret to `.env.local`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js + iNaturalist OAuth 2.0 |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Vercel / Railway |

---

## 📖 Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and patterns
- **[API Documentation](docs/API.md)** - iNaturalist integration and endpoints
- **[Gamification Design](docs/GAMIFICATION.md)** - Points, badges, quests logic
- **[Development Guide](.claude/CLAUDE.md)** - For contributors and AI assistants
- **[Original Research](doc/initial-research-plan.md)** - Vision and inspiration

---

## 🎯 Roadmap

### Phase 1: PWA MVP (Current)
- [x] Project setup & architecture
- [x] iNaturalist OAuth integration
- [ ] Dashboard with basic stats
- [ ] Points & leveling system
- [ ] Badge system (20+ badges)
- [ ] Rarity classification
- [ ] Quest system (daily/weekly/monthly)
- [ ] PWA configuration

### Phase 2: Enhanced Features
- [ ] Advanced analytics & visualizations
- [ ] Leaderboards (global, regional, friends)
- [ ] Group challenges & events
- [ ] Trip planning & gap analysis
- [ ] Notification system

### Phase 3: Flutter Native App
- [ ] Flutter mobile app (iOS & Android)
- [ ] Camera integration for observations
- [ ] Offline-first architecture
- [ ] GPS integration
- [ ] Push notifications

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
```bash
# Create a feature branch
git checkout -b feature/awesome-feature

# Make your changes and test
npm run test
npm run lint

# Commit with conventional commits
git commit -m "feat: add awesome feature"

# Push and create a pull request
git push origin feature/awesome-feature
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[iNaturalist](https://www.inaturalist.org/)** - For their incredible platform and API
- **iNaturalist Community** - Millions of naturalists worldwide contributing observations
- **Open Source Community** - For the amazing tools that make this possible

---

## ⚠️ Disclaimer

BioQuest is an **unofficial** companion app and is not affiliated with or endorsed by iNaturalist. We respect iNaturalist's Terms of Service and API usage guidelines. All observation data belongs to iNaturalist users and is used in accordance with their licenses.

**Please observe wildlife ethically:**
- Do not disturb animals or damage plants
- Respect private property and protected areas
- Follow local regulations
- Quality over quantity - focus on accurate, useful observations

---

## 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/bioquest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bioquest/discussions)

---

<p align="center">
  <strong>🌿 Go outside. Explore. Discover. Level up. 🌿</strong>
</p>
