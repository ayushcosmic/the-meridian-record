import "../config/env.js";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db.js";
import Article from "../models/Article.js";
import Category from "../models/Category.js";
import Setting from "../models/Setting.js";

const categoriesData = [
  { name: "World", slug: "world", description: "International relations, global alliances, and international developments.", order: 1 },
  { name: "India", slug: "india", description: "National policy, democratic governance, institutions, and India's global trajectory.", order: 2 },
  { name: "Politics", slug: "politics", description: "Electoral systems, parliament, legislative debate, and public policy.", order: 3 },
  { name: "Geopolitics", slug: "geopolitics", description: "Strategic competition, bilateral diplomacy, international law, and regional stability.", order: 4 },
  { name: "Business", slug: "business", description: "Global macroeconomics, trade treaties, sovereign debt, energy markets, and supply chains.", order: 5 },
  { name: "Technology", slug: "technology", description: "Artificial intelligence, semiconductor fabrication, digital privacy, and telecommunications.", order: 6 },
  { name: "Defence", slug: "defence", description: "Military modernization, strategic deterrence, aerospace, and maritime security.", order: 7 },
  { name: "Science", slug: "science", description: "Space exploration, quantum computing, climate research, and epidemiological science.", order: 8 },
  { name: "Opinion", slug: "opinion", description: "Authoritative commentary, foreign policy analysis, and diverse editorial viewpoints.", order: 9 },
  { name: "Entertainment", slug: "entertainment", description: "Cinema, arts, investigative cultural reporting, and global literature.", order: 10 },
  { name: "Sports", slug: "sports", description: "International championships, sports diplomacy, and competitive athletics.", order: 11 }
];

const demonstrationArticles = [
  {
    title: "The Shifting Indo-Pacific Balance: Maritime Corridors, Ports, and Naval Statecraft",
    slug: "indo-pacific-maritime-corridors-naval-statecraft",
    summary: "As global trade routes converge on critical straits, littoral democracies and naval powers are recalibrating logistics, deep-water port access, and joint patrols across key maritime chokepoints.",
    body: `### The Strategic Imperative of Open Sea Lanes

Freedom of navigation across the Indian Ocean and the Western Pacific remains the backbone of the contemporary economic order. With over eighty percent of global maritime crude and manufactured freight traversing critical choke points, national security doctrines increasingly merge commercial logistics with naval preparedness.

> "A sea route is not merely a geographic line on an admiralty chart; it is the nervous system of industrial resilience." — Dr. Alistair Vance, Center for Maritime Geopolitics

#### Key Developments in Regional Coordination
- **Deep-Water Port Infrastructure:** Collaborative financing for deep-water berths across Sri Lanka, Oman, and Singapore ensures continuous merchant passage during supply shocks.
- **Interoperability and Surveillance:** Unmanned aerial maritime patrols and satellite-linked automatic identification systems now provide continuous domain awareness from Malacca to the Gulf of Aden.
- **Dual-Use Logistics:** Commercial ship repair hubs are standardizing container handling to accommodate humanitarian assistance, disaster relief, and auxiliary support.

### Institutional Frameworks and Multilateral Law

Adherence to the United Nations Convention on the Law of the Sea (UNCLOS) serves as the primary arbiter of sovereign coastal entitlements and exclusive economic zones. Analysts emphasize that preserving commercial transit requires robust multilateral dispute mechanisms rather than unilateral blockades.

As regional powers commission advanced guided-missile frigates and bolster maritime patrol aircraft, the emphasis remains firmly focused on deterring interdiction and guaranteeing equitable oceanic commons for all trading nations.`,
    author: "Amb. Rajeshwar Sen",
    authorRole: "Chief Geopolitical Analyst",
    categorySlug: "geopolitics",
    tags: ["geopolitics", "maritime", "defence", "trade", "indo-pacific"],
    imageUrl: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Commercial container vessel navigating oceanic shipping channels at dusk",
    imageCredit: "The Meridian Record Archives / Unsplash License",
    status: "published",
    isBreaking: true,
    breakingPriority: 10,
    isFeatured: true,
    isTrending: true,
    isOpinion: false,
    readingTime: 6,
    views: 1420
  },
  {
    title: "Semiconductor Sovereign Supply Chains: Inside the Race for Advanced Lithography",
    slug: "semiconductor-sovereign-supply-chains-lithography",
    summary: "Nations invest hundreds of billions in domestic silicon fabs and extreme ultraviolet lithography systems to insulate national economies from geopolitical shocks and component bottlenecks.",
    body: `### The New Currency of Technological Hegemony

Every modern vehicle, telecommunication array, precision defense platform, and artificial intelligence cluster relies on sub-5-nanometer semiconductor logic. The extreme concentration of advanced foundry capacity has triggered unprecedented government subsidies across North America, Europe, and Asia.

#### The Three Pillars of Chip Independence
1. **Specialized Chemical Feeds:** Ultra-pure photoresists, silicon wafers, and industrial gases require intricate chemical supply chains with zero tolerance for impurity.
2. **Extreme Ultraviolet (EUV) Systems:** The mirror assemblies, laser plasma sources, and precision vacuum stages represent decades of physics research consolidated into single fabrication tools.
3. **Packaging and Testing Clusters:** Advanced 3D packaging technologies now provide performance leaps comparable to physical transistor scaling.

> "Silicon sovereignty is no longer an industrial luxury; it is the fundamental foundation of economic independence."

While building state-of-the-art cleanrooms demands multi-year lead times and disciplined workforce pipelines, the long-term strategic dividend shields domestic industries against unexpected trade restrictions.`,
    author: "Elena Rostova",
    authorRole: "Technology & Industrial Policy Editor",
    categorySlug: "technology",
    tags: ["technology", "semiconductors", "chips", "innovation", "policy"],
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Silicon wafer under cleanroom inspection lighting",
    imageCredit: "Semiconductor Research Alliance / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: true,
    isTrending: true,
    isOpinion: false,
    readingTime: 5,
    views: 980
  },
  {
    title: "India's Capital Expenditure Surge: How Logistics Corridors Are Reshaping Manufacturing",
    slug: "indias-capital-expenditure-logistics-corridors-manufacturing",
    summary: "Dedicated freight corridors, modern expressways, and unified digital customs platforms reduce transit times between industrial hubs and sea outlets, accelerating factory integration.",
    body: `### From Inland Factories to Coastal Gateways

Reducing the logistics cost share of GDP from double digits toward the single-digit global standard is transforming India's domestic manufacturing competitiveness. The completion of dedicated rail freight corridors between northern industrial clusters and western ports has cut cargo transit times by more than half.

#### Key Transformative Drivers
- **Multi-Modal Logistics Parks:** Integrating rail sidings, cold storage, and container freight stations under unified customs clearance.
- **National Highway Expansion:** High-speed access-controlled corridors allowing heavy commercial trucks to maintain consistent average speeds without urban congestion.
- **Digital Freight Interfaces:** Paperless e-way bills and unified logistics interfaces eliminate bureaucratic checkpoints and optimize truck turnarounds.

### Attracting Global Value Chains

As global conglomerates seek supply chain diversification, reliable transport infrastructure provides the predictability required for high-tech electronics assembly, pharmaceutical exports, and automotive component fabrication.`,
    author: "Vikramaditya Roy",
    authorRole: "Senior Economics Correspondent",
    categorySlug: "india",
    tags: ["india", "economy", "logistics", "manufacturing", "infrastructure"],
    imageUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Modern freight railway yard with double-stack container trains",
    imageCredit: "Logistics Infrastructure Bureau / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: true,
    isTrending: false,
    isOpinion: false,
    readingTime: 4,
    views: 750
  },
  {
    title: "Next-Generation Air Defence Systems: Integrated Sensors and Directed Energy",
    slug: "next-generation-air-defence-integrated-sensors-directed-energy",
    summary: "Military commands deploy layered radar domes, kinetic interceptors, and high-energy lasers to counter asymmetric drone swarms, cruise missiles, and hypersonic threats.",
    body: `### The Complexities of Modern Multi-Tiered Defense

Modern air defense architectures face an unprecedented threat matrix: inexpensive autonomous drone swarms attacking simultaneously alongside low-observable cruise missiles and high-altitude hypersonic glide vehicles.

#### The Three Layers of Protection
1. **Outer Tier (Strategic Interception):** Long-range phased-array radars and surface-to-air missiles operating above 100 kilometers to engage ballistic trajectories.
2. **Mid Tier (Area Denial):** Mobile radar-guided interceptors designed to neutralize strike aircraft, reconnaissance platforms, and cruise missiles.
3. **Inner Tier (Short Range & Directed Energy):** Rapid-fire automated cannon systems and solid-state high-energy lasers offering low per-shot engagement costs against unmanned aerial vehicles.

Command and control networks increasingly utilize automated decision-support algorithms to classify incoming targets in fractions of a second, ensuring optimal weapon assignment across the entire defensive perimeter.`,
    author: "Col. Marcus Sterling (Ret.)",
    authorRole: "Defence Policy Fellow",
    categorySlug: "defence",
    tags: ["defence", "military", "air-defence", "security", "technology"],
    imageUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Radar antenna dome scanning the horizon at military outpost",
    imageCredit: "Defence Photography Unit / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: false,
    isTrending: true,
    isOpinion: false,
    readingTime: 5,
    views: 620
  },
  {
    title: "OPINION: Why Strategic Autonomy Is the Most Durable Currency in a Fractured World",
    slug: "opinion-strategic-autonomy-durable-currency-fractured-world",
    summary: "As binary alliance demands intensify across multilateral forums, maintaining non-aligned independence and issue-based partnerships preserves sovereign diplomatic flexibility.",
    body: `### Navigating the Age of Polarization

For decades, conventional diplomatic orthodoxy insisted that nations must anchor themselves permanently within one of two competing political blocs. Today, the reality of a multi-aligned multipolar world demonstrates that strategic autonomy is not isolationism—it is the deliberate preservation of freedom of choice.

> "A sovereign nation's highest duty in foreign policy is not to flatter another capital's ideological doctrine, but to safeguard its citizens' energy, food, and technological security."

#### Why Pragmatic Multi-Alignment Works
- **Diversified Partnerships:** Engaging simultaneously with partners across trade, defense procurement, and technological exchange avoids single-point vulnerabilities.
- **Issue-Based Coalitions:** Nations can collaborate closely on clean energy transition with one group while coordinating maritime security with another.
- **Mediation Clout:** Non-aligned powers retain credibility as honest brokers during international crises when treaty allies are bound by collective defense obligations.

The coming decades will reward governments that combine moral clarity with geopolitical realism, avoiding zero-sum entanglements while championing universal rules of sovereignty.`,
    author: "Dr. K. S. Parthasarathy",
    authorRole: "Contributing Foreign Affairs Columnist",
    categorySlug: "opinion",
    tags: ["opinion", "geopolitics", "diplomacy", "strategy", "foreign-policy"],
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Diplomatic conference table with sovereign delegations",
    imageCredit: "Global Policy Forum / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: false,
    isTrending: true,
    isOpinion: true,
    readingTime: 4,
    views: 890
  },
  {
    title: "Global Central Banks Navigate the Neutral Rate: Inflation, Debt, and Growth Signals",
    slug: "global-central-banks-navigate-neutral-rate-inflation-debt",
    summary: "Monetary policymakers balance declining headline inflation against structural labour pressures and sovereign debt issuance, debating the terminal resting point for policy rates.",
    body: `### The Search for Equilibrium in Monetary Policy

After one of the most synchronized rate-hiking cycles in half a century, central bankers across Zurich, Washington, London, and Tokyo are grappling with where the neutral interest rate (r-star) truly sits.

#### Factors Keeping Real Rates Higher
- **Fiscal Deficits and Bond Supply:** Massive government debt issuance to fund defense, industrial subsidies, and climate transitions increases term premiums on long-dated sovereign bonds.
- **Deglobalization and Reshoring:** Building redundant domestic factories and supply networks is inherently more capital-intensive than relying on lowest-cost offshore hubs.
- **Demographic Transitions:** Aging workforces in major industrial centers maintain upward pressure on service-sector wages.

Market participants who expected a swift return to the zero-rate regimes of the previous decade are adjusting portfolios to a world where capital once again carries an enduring real cost.`,
    author: "Claire Chen",
    authorRole: "Chief Economics Editor",
    categorySlug: "business",
    tags: ["business", "markets", "economy", "central-banks", "inflation"],
    imageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Financial market electronic trading display boards",
    imageCredit: "Market Analytics Bureau / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    isOpinion: false,
    readingTime: 4,
    views: 450
  },
  {
    title: "Deep Space Laser Communications: Transmitting High-Definition Telemetry from Mars",
    slug: "deep-space-laser-communications-mars-telemetry",
    summary: "Optical laser transmitters aboard interplanetary probes achieve multi-gigabit data throughput across millions of kilometers, revolutionizing planetary exploration science.",
    body: `### Overcoming the Radio Frequency Bottleneck

For six decades, planetary spacecraft relied on radio frequency antennas to transmit scientific photographs, radar scans, and atmospheric telemetry back to Earth. While reliable, radio waves exhibit beam spreading over hundreds of millions of kilometers, restricting bandwidth to kilobits or low megabits per second.

#### Optical Communication Breakthroughs
- **Infrared Laser Transceivers:** Narrow-beam near-infrared lasers compress photons into tightly collimated beams, achieving over ten to one hundred times higher data rates than traditional X-band radio.
- **Sub-Arcsecond Pointer Accuracy:** Spacecraft thrusters and fine-steering mirrors lock laser beams onto ground-based telescope receivers despite orbital velocities exceeding tens of thousands of kilometers per hour.
- **Photon-Counting Superconducting Detectors:** Ground stations utilize cryogenically cooled nanowire detectors capable of registering individual photons arriving through Earth's atmosphere.

This breakthrough paves the way for high-definition streaming video from future crewed lunar bases and Martian scientific rovers.`,
    author: "Dr. Arthur Pendelton",
    authorRole: "Science & Aerospace Desk",
    categorySlug: "science",
    tags: ["science", "space", "astronomy", "optics", "mars"],
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Earth viewed from deep space with atmospheric illumination",
    imageCredit: "Planetary Science Institute / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    isOpinion: false,
    readingTime: 5,
    views: 510
  },
  {
    title: "The Architecture of Cinema Preservation: Restoring Classical Masterpieces in 4K",
    slug: "architecture-cinema-preservation-restoring-masterpieces-4k",
    summary: "Archivists and sound engineers use photochemical rescue and AI-assisted scratch removal to rescue fragile nitrate and acetate negatives from irreversible chemical decay.",
    body: `### Rescuing Celluloid Heritage

Film negatives made prior to the mid-twentieth century were coated on cellulose nitrate—an inherently unstable compound prone to vinegar syndrome and spontaneous combustion. Across national film archives, dedicated conservators are conducting painstaking digital preservation.

#### The Restoration Process
1. **Physical Ultrasonic Cleaning:** Chemical washing baths remove decades of dust, tape residue, and organic mould without abrading the emulsion layer.
2. **Wet-Gate 4K Scanning:** Immersing film in refractive liquid during scanning eliminates surface abrasions and optical scratches before digital capture.
3. **Color Grading from Original Dailies:** Colorists inspect vintage camera notes and historic distribution prints to ensure restoration respects the original cinematographer's intent.

The resulting high-dynamic-range restorations ensure historical cultural achievements remain accessible to international audiences in original fidelity.`,
    author: "Nalini Krishnan",
    authorRole: "Arts & Culture Critic",
    categorySlug: "entertainment",
    tags: ["entertainment", "cinema", "culture", "arts", "heritage"],
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Historic cinema projector lens illuminated in dark projection booth",
    imageCredit: "Film Heritage Archive / Unsplash License",
    status: "published",
    isBreaking: false,
    isFeatured: false,
    isTrending: false,
    isOpinion: false,
    readingTime: 4,
    views: 380
  }
];

export async function runSeed() {
  await connectDatabase();
  console.log("Connected to database for newsroom seeding...");

  // 1. Seed Categories
  const categoryMap = new Map();
  for (const cat of categoriesData) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { name: cat.name, slug: cat.slug, description: cat.description, order: cat.order },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap.set(cat.slug, doc._id);
    console.log(`Category verified: ${cat.name} (${cat.slug})`);
  }

  // 2. Seed Default Settings
  const defaultSettings = [
    { key: "siteName", value: "The Meridian Record" },
    { key: "tagline", value: "Independent News & Clear-Eyed Global Analysis" },
    { key: "breakingBannerActive", value: false },
    { key: "breakingBannerText", value: "" },
    { key: "breakingBannerUrl", value: "" },
    { key: "adsEnabled", value: true },
    { key: "adsenseClientId", value: process.env.ADSENSE_CLIENT_ID || "" },
    { key: "adsenseHeaderSlot", value: process.env.ADSENSE_HEADER_SLOT || "" },
    { key: "adsenseSidebarSlot", value: process.env.ADSENSE_SIDEBAR_SLOT || "" },
    { key: "adsenseInArticleSlot", value: process.env.ADSENSE_INARTICLE_SLOT || "" },
    { key: "sponsoredDisclaimer", value: "This article contains sponsored editorial content compliant with Meridian publication guidelines." }
  ];

  for (const s of defaultSettings) {
    await Setting.findOneAndUpdate({ key: s.key }, { key: s.key, value: s.value }, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log("Default publication settings initialized.");

  // 3. Seed Demonstration Articles
  for (const article of demonstrationArticles) {
    const { categorySlug, ...fields } = article;
    const categoryId = categoryMap.get(categorySlug);
    if (!categoryId) continue;

    await Article.findOneAndUpdate(
      { slug: fields.slug },
      {
        ...fields,
        category: categoryId,
        publishAt: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 24)),
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Seeded article: "${fields.title}" [${categorySlug}]`);
  }

  console.log("The Meridian Record seed completed successfully!");
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  runSeed()
    .catch((err) => {
      console.error("Seed error:", err);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
