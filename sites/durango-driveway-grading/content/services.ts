/**
 * All seven services.
 *
 * Three of these — rut/pothole/washout repair, resurfacing & road base, and
 * culvert & ditch flow — were marketed on the old site with "Learn More"
 * buttons that dead-ended on the generic services index. They get real pages
 * here for the first time.
 */

export type Service = {
  slug: string;
  name: string;
  navLabel: string;
  eyebrow: string;
  h1: string;
  lede: string;
  helpsWith: string;
  /** Bullets rendered under the hero. */
  highlights: string[];
  /** Long-form body, one <p> per entry. */
  body: string[];
  /** The sub-services grid. */
  includes: { title: string; body: string }[];
  /** "Is this a fit?" list. */
  fitFor: string[];
  seoTitle: string;
  seoDescription: string;
  /** Photograph from the migrated library. */
  image: string;
  imageAlt: string;
};

export const services: Service[] = [
  {
    slug: "gravel-driveway-grading",
    name: "Gravel Driveway Grading & Repair",
    navLabel: "Driveway Grading",
    eyebrow: "Drainage-first gravel grading",
    h1: "Gravel Driveway Grading in Durango, CO",
    lede: "I help Durango-area homeowners fix ruts, potholes, washboarding, soft spots, and drainage issues with drainage-first gravel driveway grading built for Colorado weather.",
    helpsWith:
      "Ruts, potholes, washboarding, rough travel, loose material, uneven crown.",
    highlights: [
      "Gravel driveway grading and reshaping",
      "Rut, pothole, and washout repair",
      "Crown and slope correction",
      "Drainage-first surface grading",
      "Road base placement and compaction",
    ],
    body: [
      "A rough gravel driveway is usually the visible problem. The real cause is often deeper than the surface.",
      "Ruts, potholes, washouts, mud, soft spots, loose gravel, and washboarding are often symptoms of poor drainage, a lost crown, weak material, poor compaction, or water running where it should not.",
      "That is why simply blading the driveway smooth may not last. It can make the surface look better for a while, but if water still runs down the tire tracks or collects in low spots, the same problems often come back after the next storm, snowmelt cycle, or heavy use.",
      "Many contractors focus primarily on appearance. My focus starts with understanding why the driveway is failing. Before grading begins, I evaluate water movement, existing crown, cross-slope, drainage paths, material condition, traffic patterns, and problem areas. Then the driveway is reshaped to encourage drainage, improved where necessary, and compacted to help create a stronger finished surface.",
    ],
    includes: [
      { title: "Crown Restoration", body: "Restore proper shape so water sheds from the driving surface." },
      { title: "Rut & Pothole Repair", body: "Repair damaged sections caused by traffic, runoff, soft base conditions, or failed drainage patterns." },
      { title: "Washboard Correction", body: "Cut down the ripples and re-establish a consistent, compacted travel surface." },
      { title: "Material Reclamation", body: "Some driveways need fresh material. Others simply need the existing gravel reclaimed and reshaped." },
      { title: "Road Base Placement", body: "Place, blend, and compact suitable material where the existing surface is too thin or too weak to rework." },
      { title: "Compaction", body: "Help strengthen the finished surface for improved performance." },
    ],
    fitFor: [
      "Rural homes",
      "Mountain properties",
      "Long gravel driveways",
      "Shared access roads",
      "Seasonal residences",
      "Properties with recurring potholes or drainage issues",
      "Homeowners preparing for winter or spring runoff",
    ],
    seoTitle: "Gravel Driveway Grading in Durango, CO",
    seoDescription:
      "I fix ruts, potholes, washboarding, and drainage issues with gravel driveway grading in Durango, Bayfield, and La Plata County. Request a consultation today.",
    image: "/images/projects/bayfield-after-18.jpg",
    imageAlt:
      "Doug O'Dell standing on a finished gravel driveway with grading equipment in the background",
  },
  {
    slug: "driveway-drainage-correction",
    name: "Driveway Drainage Correction",
    navLabel: "Drainage Correction",
    eyebrow: "Driveway drainage services",
    h1: "Driveway Drainage Correction in Durango & La Plata County",
    lede: "I help Durango-area homeowners fix water running down driveways, washouts, soft spots, ruts, and drainage problems with owner-operated driveway work built for Colorado weather.",
    helpsWith:
      "Tire-track flow, erosion, washouts, standing water, soft spots, repeated damage.",
    highlights: [
      "Water running down tire tracks",
      "Washouts, ruts, mud, and soft spots",
      "Crown, slope, ditch, and turnout correction",
      "Culvert and runoff problem solving",
    ],
    body: [
      "If water is running down your driveway instead of off of it, the surface will eventually start to fail.",
      "Ruts get deeper. Potholes return. Gravel washes downhill. Soft spots stay wet. In steep or rural areas around Durango, snowmelt and summer storms can turn a small drainage issue into a recurring access problem.",
      "Driveway drainage correction starts by figuring out where the water is coming from, where it is going, and where it should leave the driveway surface.",
      "A smooth driveway can still fail if water is moving the wrong way. Before recommending grading, gravel, or repair work, I look at how water moves across the property. That includes where runoff enters the driveway, where it crosses the surface, where it collects, and where it can safely exit.",
    ],
    includes: [
      { title: "Crown & Cross-Slope Correction", body: "Reshape the driveway so water is encouraged to leave the driving surface." },
      { title: "Ditch Line Cleanup & Re-Shaping", body: "Help restore flow paths along the driveway where appropriate." },
      { title: "Turnouts & Runoff Exits", body: "Create or improve places where water can exit before it gains speed and causes damage." },
      { title: "Washout Repair", body: "Repair damaged areas where water has cut through the driveway surface." },
      { title: "Culvert Area Problem Solving", body: "Evaluate water entering, crossing, or backing up around culverts." },
      { title: "Soft Spot & Low Area Correction", body: "Address areas where water collects and weakens the driveway." },
    ],
    fitFor: [
      "Water runs down your driveway during storms",
      "Ruts keep coming back in the same place",
      "Gravel washes downhill",
      "Potholes return after grading",
      "Your driveway gets soft or muddy",
      "Snowmelt creates recurring damage",
      "Culverts, ditches, or runoff paths are not working properly",
      "You have a steep or mountain driveway",
    ],
    seoTitle: "Driveway Drainage Correction in Durango, CO",
    seoDescription:
      "Fix driveway drainage problems before they become expensive repairs. Washouts, ruts, soft spots, culvert issues, and water running down tire tracks in Durango and La Plata County.",
    image: "/images/projects/bayfield-drainage-ditch-excavation.jpg",
    imageAlt:
      "Mini excavator constructing a roadside drainage ditch during gravel driveway drainage correction in Bayfield, Colorado",
  },
  {
    slug: "rut-pothole-washout-repair",
    name: "Rut, Pothole & Washout Repair",
    navLabel: "Rut & Pothole Repair",
    eyebrow: "Targeted surface repair",
    h1: "Rut, Pothole & Washout Repair near Durango",
    lede: "For damaged sections that need more than a quick scrape-over — deep ruts, returning potholes, eroded channels, exposed rock, and weak areas that keep breaking down.",
    helpsWith: "Deep ruts, potholes, eroded channels, exposed rock, weak sections.",
    highlights: [
      "Deep rut cutting and re-shaping",
      "Pothole repair that addresses the cause",
      "Washout and erosion channel repair",
      "Soft spot and weak section correction",
    ],
    body: [
      "Ruts, potholes, and washouts are the damage most people call about. They are also the damage most likely to come back, because each one is usually a symptom of something else.",
      "A rut is a channel. Once tire tracks drop below the surrounding surface, they collect water and every storm cuts them deeper. A pothole that returns weeks after grading is usually sitting over trapped water or a weak base. A washout marks the place where runoff concentrated and had nowhere else to go.",
      "So the repair starts by working out why the damage formed there. Sometimes the fix is reshaping and compaction. Sometimes the surrounding drainage has to change first, or the repair simply becomes the next thing to fail.",
      "Where the base is sound, damaged sections can often be cut down, reworked, and re-compacted using material already on site. Where it is not, road base is placed and blended so the repaired section is at least as strong as what surrounds it.",
    ],
    includes: [
      { title: "Rut Cutting & Reshaping", body: "Cut down the high shoulders and re-establish a surface that sheds water instead of channeling it." },
      { title: "Pothole Repair", body: "Repair the pothole and address the trapped water or weak base underneath where practical." },
      { title: "Washout Repair", body: "Rebuild eroded sections and improve where the runoff exits so the channel does not simply re-cut." },
      { title: "Exposed Rock & Segregation", body: "Address areas where fines have washed out and larger rock has floated to the surface." },
      { title: "Soft Spot Correction", body: "Address areas where water collects and weakens the driveway." },
      { title: "Compaction", body: "Compact the repaired area so the fix holds up under traffic and weather." },
    ],
    fitFor: [
      "Ruts that keep getting deeper",
      "Potholes that return after grading",
      "Storm or snowmelt washouts",
      "Exposed rock and lost fines",
      "Soft or unstable sections",
      "Damage concentrated in a few specific areas",
    ],
    seoTitle: "Rut, Pothole & Washout Repair in Durango, CO",
    seoDescription:
      "Targeted repair for deep ruts, returning potholes, washouts, and soft spots on gravel driveways in Durango, Bayfield, and La Plata County.",
    image: "/images/problems/gravel-driveway-washout-potholes.png",
    imageAlt: "Gravel driveway showing washout damage and potholes before repair",
  },
  {
    slug: "gravel-resurfacing-road-base",
    name: "Gravel Resurfacing & Road Base",
    navLabel: "Resurfacing & Road Base",
    eyebrow: "Material work",
    h1: "Gravel Driveway Resurfacing & Road Base Placement",
    lede: "For driveways that need suitable additional material or more extensive reconditioning than grading alone — new compactable material placed, shaped, blended, and compacted.",
    helpsWith: "Thin gravel, exposed subgrade, poor traction, tired surface material.",
    highlights: [
      "Compactable road base placement",
      "Blending new material into existing surface",
      "Surface reconditioning and reshaping",
      "Vibratory compaction",
    ],
    body: [
      "Not every driveway can be fixed with what is already on it. When the gravel has lost its fines, the subgrade is showing through, or the surface has simply worn too thin to reshape, adding suitable material is part of the answer.",
      "It is rarely the whole answer. Adding gravel to a driveway that still sends water down the travel lane usually just gives the water more material to move. That is why material work follows the drainage evaluation rather than replacing it.",
      "Where new material makes sense, the goal is a compactable road base — material with enough fines to lock together under a roller rather than staying loose underfoot. On the Bayfield project that meant 3/4\" road base, placed and blended into the existing surface, graded, then finished with vibratory compaction.",
      "If the existing material can be reclaimed and reshaped instead, I will say so. Hauling in gravel that was not needed is an expensive way to solve nothing.",
    ],
    includes: [
      { title: "Material Assessment", body: "Whether the existing gravel still has fines, has segregated, or can realistically be reshaped and compacted." },
      { title: "Road Base Placement", body: "Place suitable compactable material where the surface is too thin or too weak to rework." },
      { title: "Blending", body: "Blend new material into the existing surface so there is no abrupt edge or loose seam." },
      { title: "Surface Reconditioning", body: "Reshape and re-establish the driving surface across the treated area." },
      { title: "Final Grading", body: "Grade for a smooth, natural finish that follows the terrain." },
      { title: "Vibratory Compaction", body: "Lock the surface in so it carries traffic instead of moving under it." },
    ],
    fitFor: [
      "Gravel worn thin or washed away",
      "Subgrade or large rock showing through",
      "Loose surface with no fines left",
      "Poor traction on grades",
      "Driveways needing more than a grading pass",
      "Sections rebuilt after washout repair",
    ],
    seoTitle: "Gravel Driveway Resurfacing & Road Base in Durango, CO",
    seoDescription:
      "Road base placement, gravel resurfacing, blending, and vibratory compaction for worn gravel driveways in Durango, Bayfield, and La Plata County.",
    image: "/images/projects/bayfield-road-base-delivery.jpg",
    imageAlt:
      "Dump truck placing road base during gravel driveway restoration in Bayfield, Colorado",
  },
  {
    slug: "culvert-ditch-flow-correction",
    name: "Culvert & Ditch Flow Correction",
    navLabel: "Culverts & Ditches",
    eyebrow: "Flow restoration",
    h1: "Culvert & Ditch Flow Correction near Durango",
    lede: "Help restoring water flow where blocked culverts, clogged ditches, or poor outlets are contributing to driveway damage.",
    helpsWith: "Blocked culverts, full ditches, missing outlets, water backing onto the driveway.",
    highlights: [
      "Culvert inlet and outlet evaluation",
      "Ditch line cleanup and re-shaping",
      "Turnout and runoff exit creation",
      "Overtopping and backup problem solving",
    ],
    body: [
      "A driveway often fails at its edges first. If ditches are full, swales are blocked, edges are built up, or turnouts are missing, water may choose the driveway instead of the drainage path.",
      "Culverts are the same story. A culvert does not help much if water cannot enter it, exit it, or flow through it properly. Sediment buries inlets. Outlets get overgrown or undercut. Where a culvert is undersized or sitting at the wrong grade, water simply goes over the top and takes the driveway with it.",
      "So I check inlets, outlets, sediment buildup, flow direction, and any signs of overtopping — then work out whether the fix is cleaning and reshaping what is there, adding a turnout upstream to reduce what reaches it, or flagging something that needs more than I should take on.",
      "That last part matters. Culvert replacement, county right-of-way work, and anything requiring a licensed engineer sit outside what I do, and I will tell you plainly when that is where you are.",
    ],
    includes: [
      { title: "Culvert Inlet & Outlet Check", body: "Evaluate water entering, crossing, or backing up around culverts." },
      { title: "Sediment & Blockage Removal", body: "Clear what is stopping flow where the culvert itself is sound." },
      { title: "Ditch Line Cleanup", body: "Help restore flow paths along the driveway where appropriate." },
      { title: "Ditch Re-Shaping", body: "Re-cut grade and profile so the ditch carries water rather than holding it." },
      { title: "Turnouts & Runoff Exits", body: "Create or improve places where water can exit before it gains speed and causes damage." },
      { title: "Edge & Shoulder Correction", body: "Lower built-up edges that trap water on the driving surface." },
    ],
    fitFor: [
      "Culvert inlets buried in sediment",
      "Water backing up or overtopping a crossing",
      "Ditches full, flat, or overgrown",
      "No turnouts on a long grade",
      "Runoff from a county road entering the driveway",
      "Recurring damage at one specific crossing",
    ],
    seoTitle: "Culvert & Ditch Flow Correction in Durango, CO",
    seoDescription:
      "Restore flow where blocked culverts, clogged ditches, and missing turnouts are damaging gravel driveways in Durango, Bayfield, and La Plata County.",
    image: "/images/problems/driveway-culvert-drainage-issue.jpg",
    imageAlt:
      "Restricted culvert beneath a gravel driveway showing a potential drainage problem common on rural properties",
  },
  {
    slug: "private-road-rural-access-maintenance",
    name: "Private Road & Rural Access Maintenance",
    navLabel: "Private Roads",
    eyebrow: "Private road & rural access maintenance",
    h1: "Private Road & Rural Access Maintenance near Durango",
    lede: "Drainage-first grading, surface repair, and road base maintenance for long gravel driveways, ranch access roads, mountain properties, and private rural access routes.",
    helpsWith: "Rough access roads, water damage, seasonal wear, maintenance grading.",
    highlights: [
      "Long gravel driveways and rural access roads",
      "Ranch, cabin, and mountain property access",
      "Ruts, potholes, washouts, and rough travel surfaces",
      "Drainage shaping and ditch cleanup",
    ],
    body: [
      "Long gravel driveways and private access roads take a beating from runoff, snowmelt, traffic, plowing, and seasonal wear.",
      "When water starts running down the travel lane, gravel gets pushed aside, ruts deepen, potholes form, and rough sections keep coming back. A quick grading pass may smooth the surface for a short time, but if the road shape, drainage, or material condition is wrong, the same problems usually return.",
      "Private road maintenance can be simple or involved depending on the length of the road, the slope, the existing material, the drainage pattern, and how badly the surface has deteriorated.",
      "Some roads only need maintenance grading and surface reshaping. Others need ditch cleanup, turnout work, targeted washout repair, new road base, compaction, or a phased plan that addresses the worst sections first.",
    ],
    includes: [
      { title: "Maintenance Grading", body: "Surface reshaping across the travel width to restore a consistent driving path." },
      { title: "Crown & Cross-Slope Restoration", body: "Reshape the road so water is encouraged to leave the driving surface." },
      { title: "Priority-Zone Repairs", body: "Address the worst sections first on longer roads, rather than treating everything equally." },
      { title: "Drainage Shaping & Turnouts", body: "Create or improve places where water can exit before it gains speed and causes damage." },
      { title: "Ditch Cleanup", body: "Help restore flow paths along the road where appropriate." },
      { title: "Maintenance Planning", body: "Seasonal or annual maintenance for rural properties and shared access roads, instead of waiting until the road fails again." },
    ],
    fitFor: [
      "Long rural driveways",
      "Ranch and cabin access",
      "Mountain property roads",
      "Shared private lanes",
      "Roads needing seasonal maintenance",
      "Access that gets difficult after every storm",
    ],
    seoTitle: "Private Road Maintenance in Durango, CO",
    seoDescription:
      "Drainage-first grading, surface repair, and road base maintenance for long gravel driveways, ranch roads, and private rural access in Durango and La Plata County.",
    image: "/images/projects/durango-driveway-grading-truck-trailer-skid-steer.jpg",
    imageAlt:
      "Durango Driveway Grading truck, trailer, and skid steer on a rural mountain driveway in La Plata County, Colorado",
  },
  {
    slug: "snow-removal",
    name: "Seasonal Snow & Access Support",
    navLabel: "Snow Removal",
    eyebrow: "Winter access services",
    h1: "Snow Removal for Rural Driveways in Durango, CO",
    lede: "When winter weather makes access difficult, Durango Driveway Grading provides limited snow plowing services for select residential clients and established route areas throughout La Plata County.",
    helpsWith: "Snow-packed driveways, rural access, winter drivability.",
    highlights: [
      "Residential driveway snow plowing",
      "Rural property access",
      "Route-based neighborhood service",
      "Existing customer priority",
    ],
    body: [
      "Snow and ice can make rural driveways difficult fast, especially on steep grades, shaded areas, long private drives, and mountain properties.",
      "Durango Driveway Grading offers limited snow removal services focused on keeping residential driveways usable during winter weather. This is not a large commercial snow operation. It is selective, route-based winter access support for properties that are a good fit.",
      "Because capacity is limited, priority is generally given to existing clients, VIP clients, and established service routes.",
      "I do not currently provide large commercial snow management, sidewalk crews, deicing programs, or 24-hour storm response operations.",
    ],
    includes: [
      { title: "Residential Driveway Plowing", body: "Driveway clearing for homeowners who need dependable access during winter weather." },
      { title: "Rural Property Access", body: "Snow removal for longer rural driveways and mountain properties where access is critical." },
      { title: "Route-Based Service", body: "Limited recurring service in established neighborhoods and service routes." },
    ],
    fitFor: [
      "Existing DDG clients",
      "Properties on an established route",
      "Steep or shaded driveways",
      "Long rural drives",
      "Mountain properties where access is critical",
    ],
    seoTitle: "Snow Removal in Durango, CO",
    seoDescription:
      "Limited, route-based residential snow plowing for rural and mountain driveways in Durango, Bayfield, Durango Hills, and nearby La Plata County areas.",
    image: "/images/snow/snow-removal-durango-hills.jpg",
    imageAlt: "Snow removal on a rural driveway in Durango Hills, Colorado",
  },
];

export const servicesBySlug = new Map(services.map((s) => [s.slug, s]));

/** Nav dropdown order — snow removal sits last, it is seasonal and selective. */
export const serviceNavOrder = services.map((s) => s.slug);
