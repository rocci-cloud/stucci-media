/**
 * Service areas. Seven had pages on the old site; Vallecito is new — it was
 * named in the drainage FAQ's service list but never had a page of its own.
 */

export type Area = {
  slug: string;
  name: string;
  shortName: string;
  h1: string;
  lede: string;
  /** Summary used on the areas grid and the homepage. */
  cardBlurb: string;
  /** Neighbourhoods and sub-areas — real long-tail search terms. */
  localities: string[];
  /** What makes driveways here fail, specifically. */
  challenges: { title: string; body: string }[];
  closing: string;
  seoTitle: string;
  seoDescription: string;
  image: string;
  imageAlt: string;
  /** New in this rebuild — no page existed on the old site. */
  isNew?: boolean;
};

export const areas: Area[] = [
  {
    slug: "durango-co",
    name: "Durango",
    shortName: "Durango",
    h1: "Gravel Driveway Grading in Durango, CO",
    lede: "Drainage-first driveway grading, driveway repair, and rural access improvements for Durango mountain properties, private roads, and gravel driveways throughout La Plata County.",
    cardBlurb:
      "Gravel driveway grading, drainage repair, rut repair, and private access help for Durango-area homes, rural properties, and mountain driveways.",
    localities: [
      "Durango Hills", "North Durango", "Florida Mesa", "Falls Creek",
      "Junction Creek", "Hermosa", "Trimble", "Animas Valley",
      "Missionary Ridge", "Wildcat Canyon", "Lightner Creek",
    ],
    challenges: [
      { title: "Steep Mountain Grades", body: "Steeper driveways require proper drainage and surface shape to reduce erosion and washboarding." },
      { title: "Snowmelt & Runoff", body: "Spring snowmelt and summer storms can quickly expose drainage weaknesses." },
      { title: "Long Private Access Roads", body: "Many Durango properties rely on gravel roads that need consistent maintenance to remain dependable year-round." },
    ],
    closing:
      "A driveway in downtown Durango faces different challenges than a long gravel driveway on Missionary Ridge or a steep mountain access road near Durango Hills. Grade, runoff, elevation, soil conditions, drainage patterns, and traffic all influence the best approach.",
    seoTitle: "Gravel Driveway Grading in Durango, CO",
    seoDescription:
      "Gravel driveway grading, drainage correction, rut repair, washout repair, and private road maintenance for Durango, CO mountain properties and rural homes.",
    image: "/images/areas/durango-colorado-gravel-driveway-mountain-property.jpg",
    imageAlt: "Well-maintained gravel driveway on a mountain property near Durango, Colorado",
  },
  {
    slug: "bayfield-co",
    name: "Bayfield",
    shortName: "Bayfield",
    h1: "Gravel Driveway Grading in Bayfield, CO",
    lede: "Driveway grading and drainage correction for Bayfield-area properties, long gravel entrances, private roads, and rural driveways east of Durango.",
    cardBlurb:
      "Driveway grading and drainage correction for Bayfield-area properties, long gravel entrances, private roads, and rural driveways.",
    localities: ["Bayfield", "Gem Village", "Forest Lakes", "Los Pinos River Valley", "County Road 501 corridor", "Vallecito"],
    challenges: [
      { title: "Long Rural Entrances", body: "Bayfield-area properties often sit well back from the county road, so a single drainage problem affects the whole length of the drive." },
      { title: "Snow Plow Wear", body: "Repeated plowing over a season pulls material off the crown and rounds the surface flat." },
      { title: "Storm Runoff", body: "Summer storms concentrate quickly and can cut a channel down a travel lane in a single afternoon." },
    ],
    closing:
      "The Bayfield driveway restoration featured on this site — roughly a quarter mile of crown restoration, drainage shaping, road base, and compaction — is a good picture of what these properties often need.",
    seoTitle: "Gravel Driveway Grading in Bayfield, CO",
    seoDescription:
      "Drainage-first gravel driveway grading, washout repair, and private road maintenance for Bayfield, CO rural properties and long gravel entrances.",
    image: "/images/projects/bayfield-after-27.jpg",
    imageAlt: "Gravel driveway transformation after grading and drainage repair in Bayfield, Colorado",
  },
  {
    slug: "hesperus-co",
    name: "Hesperus",
    shortName: "Hesperus",
    h1: "Gravel Driveway Grading in Hesperus, CO",
    lede: "Driveway repair and drainage-focused grading for Hesperus properties with slope, runoff, snowmelt, and rural access challenges.",
    cardBlurb:
      "Driveway repair and drainage-focused grading for Hesperus properties with slope, runoff, snowmelt, and rural access challenges.",
    localities: ["Hesperus", "La Plata Canyon", "Mayday", "Kline", "Marvel", "Breen"],
    challenges: [
      { title: "Canyon Runoff", body: "Properties below the La Plata range take concentrated runoff from above, which arrives fast and carries material with it." },
      { title: "Sustained Grades", body: "Long, consistent slopes give water distance to build speed unless turnouts break it up." },
      { title: "Late Snowmelt", body: "Higher-elevation melt keeps ground saturated well into spring, so soft spots persist longer than they do lower down." },
    ],
    closing:
      "On sloped Hesperus properties, where the water exits matters more than how smooth the surface looks the day the work is finished.",
    seoTitle: "Gravel Driveway Grading in Hesperus, CO",
    seoDescription:
      "Drainage-first driveway grading and washout repair for Hesperus, CO properties with slope, runoff, and snowmelt challenges.",
    image: "/images/areas/colorado-rural-landscape-la-plata-mountains.jpg",
    imageAlt: "View of the La Plata Mountains and rural landscape near Hesperus, Colorado",
  },
  {
    slug: "ignacio-co",
    name: "Ignacio",
    shortName: "Ignacio",
    h1: "Gravel Driveway Grading in Ignacio, CO",
    lede: "Gravel driveway repair, pothole correction, drainage shaping, and private road maintenance for Ignacio-area properties.",
    cardBlurb:
      "Gravel driveway repair, pothole correction, drainage shaping, and private road maintenance for Ignacio-area properties.",
    localities: ["Ignacio", "Oxford", "Tiffany", "Allison", "Los Pinos", "Southern Ute lands (private property only)"],
    challenges: [
      { title: "Flatter Terrain, Slower Water", body: "Less slope means water leaves slowly and sits. Standing water softens a base as surely as fast water cuts one." },
      { title: "Agricultural Traffic", body: "Heavier and wider vehicles spread wear across the full travel width and push material to the shoulders." },
      { title: "Irrigation & Ditch Interaction", body: "Ditch systems near the driveway can put water where the driveway was never shaped to handle it." },
    ],
    closing:
      "Fast water cuts. Slow water sinks. Around Ignacio the problem is more often the second one, and it calls for a different shape than a mountain drive does.",
    seoTitle: "Gravel Driveway Grading in Ignacio, CO",
    seoDescription:
      "Gravel driveway repair, pothole correction, drainage shaping, and private road maintenance for Ignacio, CO rural properties.",
    image: "/images/areas/rural-gravel-driveway-colorado.jpg",
    imageAlt: "Rural gravel driveway serving a country property near Ignacio, Colorado",
  },
  {
    slug: "durango-hills-co",
    name: "Durango Hills",
    shortName: "Durango Hills",
    h1: "Gravel Driveway Grading in Durango Hills, CO",
    lede: "Driveway grading and drainage repair for Durango Hills properties with steep access, runoff patterns, rutting, and washout issues.",
    cardBlurb:
      "Driveway grading and drainage repair for Durango Hills properties with steep access, runoff patterns, rutting, and washout issues.",
    localities: ["Durango Hills", "Edgemont Ranch", "Edgemont Highlands", "Rafter J", "Skyridge", "Holly Hills"],
    challenges: [
      { title: "Steep Access", body: "Grade is the defining feature here. Runoff moves fast, so surface shape, ditching, turnouts, and material choice all matter more." },
      { title: "Shaded North Slopes", body: "Snow and ice hold longer where sun does not reach, extending the freeze-thaw cycle that breaks a surface apart." },
      { title: "Shared Lanes", body: "Several homes on one access road means more traffic on a surface no single owner maintains." },
    ],
    closing:
      "Steep driveways need more attention to water control because runoff moves faster and can cause more damage. Surface shape, ditching, turnouts, material choice, and compaction all matter more here than they do on flat ground.",
    seoTitle: "Gravel Driveway Grading in Durango Hills, CO",
    seoDescription:
      "Steep driveway grading, washout repair, and drainage correction for Durango Hills, CO mountain properties and shared access roads.",
    image: "/images/areas/durango-hills-colorado-mountain-gravel-driveway.jpg",
    imageAlt: "Steep gravel driveway serving a mountain home in Durango Hills, Colorado",
  },
  {
    slug: "forest-lakes-co",
    name: "Forest Lakes",
    shortName: "Forest Lakes",
    h1: "Gravel Driveway Grading in Forest Lakes, CO",
    lede: "Gravel driveway grading and access repair for Forest Lakes homes, mountain roads, drainage problems, and seasonal driveway wear.",
    cardBlurb:
      "Gravel driveway grading and access repair for Forest Lakes homes, mountain roads, drainage problems, and seasonal driveway wear.",
    localities: ["Forest Lakes", "Bayfield north", "Vallecito", "Los Pinos", "County Road 501"],
    challenges: [
      { title: "Forested & Shaded", body: "Tree cover keeps surfaces damp and drops needles and debris that block ditches and culvert inlets." },
      { title: "Seasonal Occupancy", body: "Cabins used part of the year accumulate a season of damage before anyone sees it." },
      { title: "Higher Elevation Melt", body: "Snow holds later and releases over a longer window, which keeps the base saturated." },
    ],
    closing:
      "On seasonal properties, a driveway usually fails between visits. Catching it before spring melt is far cheaper than repairing what a full runoff season does to an unshaped surface.",
    seoTitle: "Gravel Driveway Grading in Forest Lakes, CO",
    seoDescription:
      "Gravel driveway grading, drainage repair, and seasonal access maintenance for Forest Lakes, CO mountain homes and cabin properties.",
    image: "/images/areas/forest-lakes-colorado-gravel-driveway.jpg",
    imageAlt: "Gravel driveway winding through a forested property in Forest Lakes, Colorado",
  },
  {
    slug: "vallecito-co",
    name: "Vallecito",
    shortName: "Vallecito",
    isNew: true,
    h1: "Gravel Driveway Grading in Vallecito, CO",
    lede: "Gravel driveway grading, drainage correction, and access repair for Vallecito Lake-area cabins, seasonal homes, and mountain properties.",
    cardBlurb:
      "Driveway grading and drainage work for Vallecito Lake-area cabins, seasonal residences, and steep mountain access.",
    localities: ["Vallecito", "Vallecito Lake", "Pine River Valley", "Middle Mountain", "Bayfield north"],
    challenges: [
      { title: "Heavy Snow Load", body: "Vallecito takes more snow than most of the county, so plow wear and a long melt season both work on the surface." },
      { title: "Lake-Effect Moisture", body: "Ground near the reservoir stays wetter longer, and a saturated base loses strength quickly under traffic." },
      { title: "Seasonal Cabin Access", body: "Drives that sit unused through winter often need attention before they can carry a loaded vehicle again in spring." },
    ],
    closing:
      "Vallecito was named in passing on the old site but never had a page. If your property is up here, send photos — this is within range.",
    seoTitle: "Gravel Driveway Grading in Vallecito, CO",
    seoDescription:
      "Gravel driveway grading, drainage correction, and seasonal access repair for Vallecito Lake-area cabins and mountain properties in La Plata County.",
    image: "/images/areas/forest-lakes-colorado-gravel-driveway.jpg",
    imageAlt: "Forested mountain property with a gravel access driveway near Vallecito, Colorado",
  },
  {
    slug: "la-plata-county-co",
    name: "La Plata County",
    shortName: "La Plata County",
    h1: "Gravel Driveway Grading in La Plata County, CO",
    lede: "Drainage-first gravel driveway grading, washout repair, and private road maintenance for rural and mountain properties across La Plata County.",
    cardBlurb:
      "Drainage-first driveway repair and gravel access work for rural and mountain properties throughout La Plata County.",
    localities: [
      "Durango", "Bayfield", "Hesperus", "Ignacio", "Durango Hills",
      "Forest Lakes", "Vallecito", "Marvel", "Kline", "Breen", "Hermosa", "Gem Village",
    ],
    challenges: [
      { title: "Terrain That Changes Fast", body: "The county runs from river valley to high mountain in a short distance, and a driveway's problems change with it." },
      { title: "Monsoon Season", body: "Late-summer storms deliver a lot of water in very little time, which is when unshaped driveways fail." },
      { title: "Freeze-Thaw Cycles", body: "Repeated freezing and thawing works trapped moisture through the base and breaks the surface apart from underneath." },
    ],
    closing:
      "Not sure whether you are in range? Send the property location and a few photos and I'll tell you either way.",
    seoTitle: "Gravel Driveway Grading in La Plata County, CO",
    seoDescription:
      "Drainage-first gravel driveway grading, drainage correction, and private road maintenance for rural and mountain properties across La Plata County, Colorado.",
    image: "/images/areas/la-plata-county-colorado-landscape.jpg",
    imageAlt: "View of the La Plata Mountains and rural landscape in La Plata County, Colorado",
  },
];

export const areasBySlug = new Map(areas.map((a) => [a.slug, a]));

/** The six shown as cards on the homepage — county page is the catch-all. */
export const featuredAreaSlugs = [
  "durango-co", "bayfield-co", "hesperus-co",
  "ignacio-co", "durango-hills-co", "forest-lakes-co",
] as const;
