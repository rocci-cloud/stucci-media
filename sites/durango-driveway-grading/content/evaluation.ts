/**
 * The evaluation framework — the single strongest piece of content either
 * version of the site produced, and the thing no competitor in this market
 * has any answer to. Verbatim from the source site.
 */

export const evaluationIntro = [
  "Most gravel driveway problems are not caused by “bad gravel” alone.",
  "Ruts, potholes, washboarding, soft spots, and washouts are usually symptoms of a bigger problem: water moving the wrong way, staying too long, or finding the driveway as the easiest path downhill.",
  "Before I recommend grading, gravel, drainage correction, or repair work, I look at how water is interacting with the driveway from top to bottom.",
  "That way we are not just making the driveway look better for a few weeks. We are trying to understand why it is failing in the first place.",
] as const;

/** The three questions the whole method hangs on. */
export const waterQuestions = [
  {
    n: "01",
    q: "Where is it coming from?",
    a: "Water can enter from the county road, a hillside, a roofline, a ditch, a culvert, a low spot, melting snow, or runoff from nearby ground. Sometimes the driveway is not the original problem. It is simply where all the water ends up.",
    image: "/images/evaluation/1-where-is-it-coming-from.jpg",
    imageAlt: "Winter gravel driveway with snowmelt entering the driving surface from uphill areas",
  },
  {
    n: "02",
    q: "Where is it going?",
    a: "I look at whether water is being pushed safely off the driving surface or whether it is running down the driveway like a channel. When water follows the driveway instead of leaving it, it can accelerate ruts, potholes, washboarding, erosion, and washouts.",
    image: "/images/evaluation/2-where-is-it-going.jpg",
    imageAlt: "Snowmelt flowing along a gravel driveway instead of shedding off to the side",
  },
  {
    n: "03",
    q: "What is it doing?",
    a: "Cutting channels. Softening the base. Carrying gravel away. Creating mud. Pooling in low spots. Undermining the driving surface.",
    image: "/images/evaluation/3-what-is-it-doing.jpg",
    imageAlt: "Water channeling along a gravel driveway causing rutting and surface erosion",
  },
] as const;

/** The seven-point on-site checklist. */
export const checklist = [
  {
    n: 1,
    title: "Where water enters the driveway",
    body: "I look for runoff coming from roads, hillsides, ditches, culverts, rooflines, and surrounding terrain. The goal is to understand whether water is starting on the driveway or being delivered to it from somewhere else.",
  },
  {
    n: 2,
    title: "Whether water runs with the driveway or across it",
    body: "Water should not be allowed to run straight down the driveway for long distances. If the driveway has become the water channel, that is one of the fastest ways to create ruts, washouts, and soft spots.",
  },
  {
    n: 3,
    title: "Crown, cross-slope, and surface shape",
    body: "I check whether the driveway has enough shape to move water off the driving surface. That may mean a crown in the middle, a cross-slope to one side, or a specific shape based on the terrain and drainage path. I also look for where the crown disappears, where the driveway has flattened out, and where tire tracks have become low channels.",
  },
  {
    n: 4,
    title: "Where water speeds up, slows down, or pools",
    body: "Fast water cuts. Slow water sinks. Both can damage a driveway. I look for areas where water gains speed, collects sediment, pools in low spots, or saturates the surface and base.",
  },
  {
    n: 5,
    title: "Ditches, swales, edges, and turnouts",
    body: "A driveway often fails at the edges first. If ditches are full, swales are blocked, edges are built up, or turnouts are missing, water may choose the driveway instead of the drainage path. I look for ways to get water off the driveway before it becomes a bigger problem.",
  },
  {
    n: 6,
    title: "Culverts and crossings",
    body: "If a driveway has culverts, I check the inlets, outlets, sediment buildup, flow direction, and signs of overtopping. A culvert does not help much if water cannot enter it, exit it, or flow through it properly.",
  },
  {
    n: 7,
    title: "Material condition",
    body: "Not all gravel behaves the same. I look at whether the material still has fines, whether it has segregated, whether larger rock has floated to the surface, whether the base is pumping mud, and whether the existing material can realistically be reshaped and compacted.",
  },
] as const;

/** The three outcome categories every driveway lands in. */
export const categories = [
  {
    key: "surface",
    name: "Surface Reconditioning",
    when: "The drainage is generally working, but the surface has degraded.",
    signs: "Light washboarding, minor potholes, shallow ruts, loose gravel, or a driveway that needs reshaping and compaction.",
  },
  {
    key: "drainage",
    name: "Drainage-Corrective Grading",
    when: "Water is actively contributing to the problem.",
    signs: "Water running down tire tracks, repeated rutting, washouts, muddy areas, edge failure, or a crown/cross-slope that no longer moves water off the driveway.",
  },
  {
    key: "structural",
    name: "Structural or Flow Intervention",
    when: "The driveway needs more than a simple grading pass.",
    signs: "Recurring washouts, culvert issues, severe erosion, soft base conditions, heavy hillside runoff, or areas where the water path needs to be corrected before the surface can hold up.",
  },
] as const;

export const categoriesNote =
  "This doesn't always mean everything has to be fixed at once. Sometimes the smartest approach is a phased plan that handles the highest-priority problems first.";

/** Two ways to start. */
export const startOptions = [
  {
    key: "A",
    title: "Photo or Video Review",
    body: "This is the fastest starting point. Send a few clear photos or a short video walkthrough showing the problem areas, driveway slope, ruts, washouts, potholes, soft spots, culverts, and where water seems to travel. In many cases, I can identify the obvious red flags and give you a realistic next step from photos or video.",
  },
  {
    key: "B",
    title: "On-Site Evaluation",
    body: "Some driveways need to be seen in person, especially when slope, drainage paths, culverts, material depth, access, or safety are difficult to judge remotely. If an on-site visit makes more sense, we'll schedule it based on weather, ground conditions, and availability.",
  },
] as const;

export const evaluationOutcomes = [
  "What appears to be causing the problem",
  "Whether grading alone is realistic",
  "Whether drainage needs to be corrected first",
  "Whether new material is needed",
  "Whether the work should be handled in phases",
  "What I would prioritize if it were my driveway",
] as const;
