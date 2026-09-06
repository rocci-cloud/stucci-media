/** FAQ sets, verbatim from the source site. Keyed so pages pull their own. */

export type Faq = { q: string; a: string };

export const generalFaqs: Faq[] = [
  {
    q: "Do I need grading, drainage work, or new gravel?",
    a: "It depends on what is causing the problem. Ruts, potholes, washouts, and soft spots can come from poor drainage, worn-out material, traffic, slope, or a weak base. The evaluation starts by figuring out why the driveway is failing.",
  },
  {
    q: "Can you tell what is wrong from photos?",
    a: "Photos and videos help a lot, especially if they show water flow, ruts, potholes, culverts, low spots, and the overall slope. Some issues still need an on-site look.",
  },
  {
    q: "Do you work on steep or mountain driveways?",
    a: "Yes, when the site conditions are appropriate. Steep driveways often need extra attention to water control, traction, crown, ditching, and where runoff exits the road surface.",
  },
  {
    q: "Will grading fix potholes permanently?",
    a: "Not always. If potholes are caused by trapped water, weak base material, or poor drainage, grading alone may only be temporary. The goal is to correct the cause where practical.",
  },
  {
    q: "Do you work on private roads or shared driveways?",
    a: "Yes. DDG can evaluate private access roads, shared rural roads, HOA roads, and longer gravel drives.",
  },
  {
    q: "What areas do you serve?",
    a: "DDG serves Durango, Bayfield, Hesperus, Ignacio, Durango Hills, Forest Lakes, Vallecito, and surrounding La Plata County areas.",
  },
  {
    q: "What happens after I submit the form?",
    a: "Doug reviews the request personally. If photos are included, he may be able to give initial guidance before scheduling a site visit or recommending next steps.",
  },
  {
    q: "Do you require a deposit?",
    a: "For approved projects, a 50% deposit reserves your spot on the schedule and allows material, equipment, and timing to be planned properly.",
  },
];

export const drainageFaqs: Faq[] = [
  {
    q: "How do I know if my driveway has a drainage problem?",
    a: "Common signs include water running down the tire tracks, ruts getting deeper after storms, gravel washing to the bottom of the driveway, potholes returning quickly, soft spots, standing water, or muddy areas that do not dry out. On many Durango-area gravel driveways, the surface problem is really a water problem.",
  },
  {
    q: "Can grading fix driveway drainage issues?",
    a: "Yes, grading can often fix or reduce driveway drainage problems when the issue is caused by poor shape, lost crown, low shoulders, ruts, or water being trapped on the surface. The goal is to reshape the driveway so water sheds off the driving surface instead of running down it.",
  },
  {
    q: "Why does water run down my tire tracks?",
    a: "Water follows the lowest path. When tire tracks become ruts, they act like small ditches and guide water straight down the driveway. Once that starts, every storm can make the ruts deeper and pull more gravel with it.",
  },
  {
    q: "Do I need a culvert, ditch, or just better grading?",
    a: "It depends on where the water is coming from and where it needs to go. Some driveways only need better grading and crown restoration. Others need ditch cleanup, turnouts, culvert work, or a combination of drainage corrections. That is one of the main things I look at during an evaluation.",
  },
  {
    q: "Will adding gravel fix the problem?",
    a: "Sometimes, but not always. If the driveway has lost material and the base is still shaped correctly, new gravel can help. But if water is running down the driveway, filling ruts, or washing material away, adding gravel without fixing the drainage usually just gives the water more material to move.",
  },
  {
    q: "Can you repair driveway washouts?",
    a: "Yes. Washout repair usually starts with figuring out why the water concentrated in that area. From there, the repair may include reshaping the surface, rebuilding the crown, redirecting water, adding road base where needed, and compacting the repaired area.",
  },
  {
    q: "Do steep driveways need a different drainage approach?",
    a: "Yes. Steep gravel driveways need more attention to water control because runoff moves faster and can cause more damage. The surface shape, ditching, turnouts, material choice, and compaction all matter more on steep driveways.",
  },
];

export const evaluationFaqs: Faq[] = [
  {
    q: "Do I need to know what is wrong with my driveway before contacting you?",
    a: "No. Most homeowners know the symptoms: ruts, potholes, mud, washouts, or water running where it shouldn't. You don't need to diagnose the cause. That's what the evaluation is for.",
  },
  {
    q: "Can this usually be diagnosed from photos or video?",
    a: "Often, yes. Clear photos or a short video walkthrough are usually enough to identify major drainage red flags and determine whether grading alone is realistic. If it's not clear remotely, I'll let you know that an on-site evaluation makes more sense.",
  },
  {
    q: "Does requesting a consultation mean I am committing to a project?",
    a: "No. This is a starting conversation, not a commitment. The purpose is to understand what's happening and decide whether it makes sense to move forward.",
  },
  {
    q: "What if the driveway needs more than a simple fix?",
    a: "Some driveways need phased work or additional drainage improvements. If that's the case, I'll explain why, outline practical options, and help you decide what should happen first. There is no pressure to do everything at once.",
  },
  {
    q: "What types of work do you not take on?",
    a: "I focus on gravel driveway grading, driveway drainage correction, culvert flow restoration, private road access maintenance, and seasonal snow plowing. I don't take on paving, landscaping, utility work, or engineering work that requires a licensed professional engineer. If something falls outside my lane, I'll say so clearly.",
  },
];

export const privateRoadFaqs: Faq[] = [
  {
    q: "Do you maintain HOA roads?",
    a: "Sometimes, depending on the size, width, condition, and scope. My best fit is long rural driveways, ranch access, mountain property roads, and smaller private access routes. Larger HOA or community road projects may require bigger equipment, extra operators, or a different production setup.",
  },
  {
    q: "Can you fix a long gravel driveway?",
    a: "Yes. Long rural driveways are a strong fit for this service, especially when the problems involve ruts, washouts, potholes, drainage issues, thin gravel, or rough seasonal wear.",
  },
  {
    q: "Is this different from regular driveway grading?",
    a: "The principles are similar, but longer access roads usually require more attention to travel width, drainage outlets, material condition, curves, grades, and how water behaves over a longer distance.",
  },
  {
    q: "Can you add new gravel or road base?",
    a: "Yes, when the road needs additional compactable material. If existing material can be reshaped and reused, I'll say so. If the road is too thin or weak, new road base may be part of the recommendation.",
  },
  {
    q: "Do you offer ongoing maintenance?",
    a: "Yes, when it is a good fit. Some rural access roads benefit from seasonal or annual maintenance instead of waiting until the road fails again.",
  },
];

export const snowFaqs: Faq[] = [
  {
    q: "Do you offer snow removal to everyone?",
    a: "No. Winter service capacity is limited. Priority is generally given to existing DDG clients, VIP clients, and properties that fit established routes.",
  },
  {
    q: "Do you provide commercial snow removal?",
    a: "This service is focused on residential driveways, rural access, and limited neighborhood routes. Larger commercial work is considered case by case rather than offered as a standing service.",
  },
  {
    q: "How do I reserve a spot?",
    a: "Start by requesting a winter service evaluation. If your property is a good fit, your first plow payment reserves your place on the route.",
  },
  {
    q: "How soon after a storm will my driveway be plowed?",
    a: "Response depends on snowfall, road conditions, route order, and storm timing. The goal is dependable access, not instant 24-hour emergency response.",
  },
  {
    q: "Do you provide deicing or ice management?",
    a: "Not as a primary service. Snow plowing may improve access, but dedicated deicing and ice management are limited.",
  },
];

/** Which FAQ set each service page renders. */
export const faqsForService: Record<string, Faq[]> = {
  "gravel-driveway-grading": generalFaqs,
  "driveway-drainage-correction": drainageFaqs,
  "rut-pothole-washout-repair": generalFaqs,
  "gravel-resurfacing-road-base": generalFaqs,
  "culvert-ditch-flow-correction": drainageFaqs,
  "private-road-rural-access-maintenance": privateRoadFaqs,
  "snow-removal": snowFaqs,
};
