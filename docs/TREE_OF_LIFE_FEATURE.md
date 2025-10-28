# Tree of Life Visualization - Feature Specification

## Vision

An interactive, explorable Tree of Life that lets users navigate the taxonomic hierarchy from Kingdom down to Species, visualizing:
- **What exists** in nature (total taxa at each level)
- **What's observable** in their region (RG observations available)
- **What they've seen** (their personal observations)
- **Completeness metrics** at each level

## Core Concept

Start at any taxonomic level (Kingdom, Phylum, Class, Order, Family, Genus, Species) and explore:

```
Kingdom Animalia
├─ Phylum Arthropoda [User: 145/2000 families observed in Europe]
│  ├─ Class Insecta
│  │  ├─ Order Diptera [User: 23/120 families | Region: 98/120 families RG]
│  │  │  ├─ Superfamily Tipuloidea
│  │  │  ├─ Superfamily Culicoidea
│  │  │  └─ ... [drill down to families → genus → species]
│  │  ├─ Order Lepidoptera
│  │  ├─ Order Coleoptera
│  │  └─ ... [explore other orders]
│  └─ ... [other classes]
└─ ... [other phyla]
```

## Key Features

### 1. Multi-Level Exploration
- **Start anywhere**: Kingdom, Phylum, Class, Order, Family, etc.
- **Zoom in/out**: Navigate up and down the tree
- **Quick jumps**: "Go to Diptera", "View all my Coleoptera"

### 2. Completeness Metrics
For each taxon node, show:
- **Total taxa**: How many sub-taxa exist worldwide (e.g., 120 Diptera families)
- **Regional taxa**: How many have RG observations in user's region
- **User observations**: How many the user has observed
- **Completion %**: `(User / Regional) * 100`

**Example for Diptera in Europe:**
```
Order: Diptera (True Flies)
├─ Total families: 120 worldwide
├─ Observable in Europe: 98 families (RG observations exist)
├─ You've observed: 23 families
└─ Completion: 23.5% of Europe, 19.2% worldwide
```

### 3. Regional Filtering
- **My location** (province/state)
- **My country**
- **My continent**
- **Worldwide**

Show different stats based on selected region:
- Species richness in that region
- User's completeness for that region
- Suggest species to target (gap analysis)

### 4. Visual Representation

#### Option A: Hierarchical Tree (D3.js)
- Collapsible tree visualization
- Node size = number of observations
- Node color = completion percentage (red → yellow → green)
- Click to drill down, right-click to zoom out

#### Option B: Sunburst Chart
- Circular hierarchy visualization
- Inner rings = higher taxonomy
- Outer rings = lower taxonomy
- Slice size = observation count

#### Option C: Treemap
- Rectangular hierarchy
- Size = observation count
- Color = completion percentage
- Click to zoom into taxon

### 5. Stat Cards per Taxon

When viewing a taxon (e.g., Order Diptera):

```
┌─────────────────────────────────────┐
│ Order: Diptera (True Flies)         │
├─────────────────────────────────────┤
│ Families                             │
│ • 120 worldwide                      │
│ • 98 in Europe (RG)                  │
│ • 23 observed by you                 │
│ • 23.5% complete                     │
├─────────────────────────────────────┤
│ Species                              │
│ • ~150,000 worldwide                 │
│ • ~8,000 in Europe (RG)              │
│ • 347 observed by you                │
│ • 4.3% complete                      │
├─────────────────────────────────────┤
│ Observations                         │
│ • 1,247 total                        │
│ • 892 RG                             │
│ • 234 needs ID                       │
└─────────────────────────────────────┘
```

### 6. Gap Analysis Integration

For each taxon level, show:
- **Missing families** (in your region, not yet observed)
- **Rare finds** (few RG observations in region)
- **Common targets** (many RG observations, easy to find)
- **Seasonal availability** (best time to observe)

**Example:**
```
Missing Diptera Families in Your Area:
1. Tipulidae (Crane Flies) - 234 RG obs in Europe, 0 by you
2. Tabanidae (Horse Flies) - 156 RG obs, 0 by you
3. Syrphidae (Hover Flies) - 1,240 RG obs, 0 by you
```

### 7. Gamification Elements

#### Badges
- "Insect Explorer" - Observe 10 insect orders
- "Diptera Master" - Observe 50 Diptera families
- "Family Completionist" - Complete 80% of families in one order
- "Regional Expert" - Complete 50% of orders in your province

#### Quests
- "Complete the Flies" - Observe 5 new Diptera families this month
- "Order Challenge" - Observe species from 20 different orders
- "Family Focus" - Observe 10 species from the same family

#### Leaderboards
- Most complete taxonomic group (Order/Family level)
- Most diverse observations (species from different families)
- Regional completeness rankings

## Technical Implementation

### Data Sources
1. **iNaturalist API**
   - `/taxa` endpoint for taxonomy hierarchy
   - `/observations/species_counts` for user observations
   - `/observations?place_id=X` for regional data

2. **Tree of Life (TOL) Data**
   - Use iNat's taxonomy as source of truth
   - Cache taxonomy structure (millions of species)
   - Update cache weekly/monthly

3. **Local Database**
   - Store user's observations by taxon
   - Cache regional statistics (RG obs per taxon)
   - Pre-calculate completeness metrics

### Database Schema
```typescript
// Cache for taxonomy nodes
interface TaxonNode {
  taxonId: number;
  name: string;
  rank: string; // kingdom, phylum, class, order, family, genus, species
  parentId: number | null;
  childCount: number;
  observationCount: number; // worldwide
}

// User's progress per taxon
interface UserTaxonProgress {
  userId: string;
  taxonId: number;
  rank: string;
  observationCount: number;
  speciesCount: number;
  completionPercent: number;
  lastObservedAt: Date;
}

// Regional data (cached)
interface RegionalTaxonData {
  placeId: number;
  taxonId: number;
  rank: string;
  rgObservationCount: number;
  speciesCount: number;
  updatedAt: Date;
}
```

### UI Components
```
/tree-of-life
├─ TreeExplorer (main page)
├─ TaxonCard (stat card)
├─ TreeVisualization (D3.js chart)
├─ TaxonBrowser (list view with search)
├─ GapAnalysis (missing taxa)
└─ CompletionMetrics (progress bars)
```

### API Routes
```
/api/tree-of-life/node/:taxonId
  - Get taxon details + children
  - Get user progress
  - Get regional stats

/api/tree-of-life/path/:taxonId
  - Get full path from Kingdom to this taxon

/api/tree-of-life/gaps/:taxonId
  - Get missing children taxa in region

/api/tree-of-life/completeness
  - Get user's overall taxonomic completeness
```

## User Flows

### Flow 1: Explore Insects
1. User clicks "Tree of Life" in navigation
2. Starts at Kingdom Animalia view
3. Sees "Phylum Arthropoda: 45% complete"
4. Clicks on Arthropoda → Class Insecta
5. Sees all orders: Coleoptera, Lepidoptera, Diptera, etc.
6. Clicks on Diptera
7. Sees families, with progress bars
8. Identifies missing families in their region
9. Views gap analysis: "3 easy families to find near you"

### Flow 2: Check Regional Progress
1. User selects "My Province" filter
2. Tree updates to show only taxa with RG obs in province
3. User sees "Order Diptera: 12/45 families in your province"
4. Clicks "View missing families"
5. Gets recommendations for nearby locations to find them

### Flow 3: Complete an Order
1. User has observed 9/10 Odonata families in their region
2. Dashboard shows "Complete Odonata" quest
3. User checks Tree of Life → Odonata
4. Sees missing family: Lestidae
5. Clicks "Find near me" → Shows locations with Lestidae observations
6. User goes there, observes, completes the order
7. Unlocks "Odonata Master" badge

## Future Enhancements

### Phase 1 (MVP)
- Basic tree navigation (list view)
- Completeness stats per taxon
- Gap analysis
- Regional filtering

### Phase 2
- Interactive tree visualization (D3.js)
- Sunburst/treemap charts
- Quest integration
- Leaderboards by taxonomy

### Phase 3
- Phylogenetic tree view (evolutionary relationships)
- Time-series: completion over time
- Social: compare with friends
- Educational: species descriptions per family

## Why This is Amazing

1. **Educational**: Learn taxonomy while exploring
2. **Gamified**: Completeness % gives clear goals
3. **Exploratory**: Discover new taxa to observe
4. **Stats-driven**: Quantify biodiversity knowledge
5. **Region-aware**: Focuses on what's actually observable
6. **Progression**: Clear path from beginner to expert naturalist

## Inspiration

Similar to:
- Pokémon Pokédex (gotta catch 'em all!)
- Video game skill trees (unlock branches)
- GitHub contribution graphs (visualize progress)
- iNaturalist's own taxonomy browser (but gamified!)

---

**This feature would be THE killer feature that sets BioQuest apart from iNaturalist.**

It transforms passive observation into active taxonomic exploration, making users think like naturalists: "I've seen lots of beetles, but which families am I missing?"
