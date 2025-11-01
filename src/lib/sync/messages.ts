/**
 * Rotating funny messages for the sync progress UI
 * Messages change every 5-10 seconds to keep users entertained during long syncs
 */

export const NATURALIST_MESSAGES = [
  "Counting all your moss photos (yes, all 47 of them)...",
  "Teaching AI to distinguish between corvids (it's harder than it looks)...",
  "Calculating the statistical significance of your lichen obsession...",
  "Consulting with taxonomists about that 'mystery slug' from 2019...",
  "Converting your bird calls into XP (tweet tweet = level up!)...",
  "Analyzing why you photograph so many fungi (no judgment)...",
  "Cross-referencing your observations with the International Code of Botanical Nomenclature...",
  "Debating whether that blob is a jellyfish or a plastic bag...",
  "Determining if your 'rare find' is actually just a weird pigeon...",
  "Discovering you've photographed the same oak tree 23 times...",
  "Evaluating your contribution to citizen science (spoiler: it's awesome)...",
  "Fact-checking that this butterfly isn't just a moth in good lighting...",
  "Generating motivational speeches for the one spider you actually identified...",
  "Harmonizing your phenology data with cosmic significance...",
  "Identifying which observations were taken during 'golden hour' (all of them)...",
  "Judging your enthusiasm for photographing every dandelion variant...",
  "Keeping score of your cat vs. wildlife photo ratio...",
  "Locating that one really good photo from three years ago...",
  "Measuring the biodiversity of your backyard (it's more than you think!)...",
  "Negotiating with servers about how many beetle photos is 'too many'...",
  "Organizing your observations by 'how likely to bite you'...",
  "Pondering the philosophical implications of identifying grass species...",
  "Quantifying your dedication to documenting every snail you've ever met...",
  "Ranking your observations by 'convincing evidence it's not a rock'...",
  "Searching for that legendary bird you swear you saw but didn't photograph...",
  "Tallying up how many times you've said 'I need to learn plant ID'...",
  "Upgrading your mushroom photos to 'professionally confused' status...",
  "Validating that yes, barnacles are actually arthropods (mind blown)...",
  "Weighing whether your 'nature photography' is 80% insects...",
  "X-raying your data for signs of cryptozoology (none found, sadly)...",
  "Yearning for the day you'll finally ID that tree (any day now)...",
  "Zoning in on exactly how obsessed you are with local biodiversity...",
  "Apologizing to taxonomists for your creative species name spellings...",
  "Calculating how many weekend mornings you've spent in marshes...",
  "Documenting your evolution from 'bird watcher' to 'complete naturalist nerd'...",
  "Estimating how much storage space is devoted to 'blurry bird photos'...",
  "Filing your observations under 'definitely not just garden weeds'...",
  "Grading your botanical Latin pronunciation (it's... improving)...",
  "Hypothesizing why you take 47 photos of the same flower 'just in case'...",
  "Indexing observations by 'excitement level when identified'...",
  "Justifying why you need 8 photos of one beetle from different angles...",
  "Kudos for that time you correctly IDed something before anyone else...",
  "Listing all the times someone corrected your 'sparrow' to 'hawk'...",
  "Mapping your naturalist journey from 'what's that?' to 'that's a Larus!'...",
  "Noting that you've become the person who stops traffic to photograph fungi...",
  "Observing that your camera roll is now 94% nature, 6% cats...",
  "Processing the fact that you can now identify trees by their bark...",
  "Remembering when you thought all seagulls were the same species...",
  "Surveying the evidence that you're now 'that plant person' in your friend group...",
  "Tracking how your definition of 'quick walk' changed to 'four-hour bioblitz'...",
];

/**
 * Get a random message from the pool
 */
export function getRandomNaturalistMessage(): string {
  return NATURALIST_MESSAGES[Math.floor(Math.random() * NATURALIST_MESSAGES.length)];
}

/**
 * Message rotation manager for progress updates
 * Ensures messages change at a slower pace than progress polls
 */
export class MessageRotator {
  private currentMessage: string;
  private lastRotation: number;
  private rotationIntervalMs: number;

  constructor(rotationIntervalMs: number = 7000) { // Default 7 seconds
    this.currentMessage = getRandomNaturalistMessage();
    this.lastRotation = Date.now();
    this.rotationIntervalMs = rotationIntervalMs;
  }

  /**
   * Get current message, rotating if enough time has passed
   */
  getMessage(): string {
    const now = Date.now();
    if (now - this.lastRotation >= this.rotationIntervalMs) {
      this.currentMessage = getRandomNaturalistMessage();
      this.lastRotation = now;
    }
    return this.currentMessage;
  }

  /**
   * Force rotation to next message
   */
  rotate(): string {
    this.currentMessage = getRandomNaturalistMessage();
    this.lastRotation = Date.now();
    return this.currentMessage;
  }
}
