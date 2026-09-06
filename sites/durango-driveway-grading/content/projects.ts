/**
 * Project case studies.
 *
 * Only Bayfield is published. The old site also had a Star Plaza commercial
 * snow-removal page, but it sits behind an unresolved contradiction — the snow
 * page said commercial work was not offered — so it is deliberately not
 * migrated until the client confirms which is current. Fabricating the copy
 * would be worse than the gap.
 */

export type Project = {
  slug: string;
  title: string;
  location: string;
  eyebrow: string;
  summary: string;
  snapshot: { label: string; value: string }[];
  problem: { intro: string; bullets: string[] };
  diagnosis: string[];
  solution: { intro: string; bullets: string[] };
  result: { intro: string; bullets: string[] };
  testimonial: { quote: string; attribution: string; location: string };
  closing: string[];
  hero: string;
  heroAlt: string;
  gallery: { src: string; alt: string; phase: "before" | "during" | "after" }[];
};

export const projects: Project[] = [
  {
    slug: "bayfield-driveway-transformation",
    title: "Gravel Driveway Transformation in Bayfield, CO",
    location: "Bayfield, CO",
    eyebrow: "Featured project · Bayfield, CO",
    summary:
      "A steep private driveway restored with drainage correction, crown rebuilding, road base placement, final grading, and compaction.",
    snapshot: [
      { label: "Location", value: "Bayfield, CO" },
      { label: "Project type", value: "Gravel driveway restoration + drainage correction" },
      { label: "Primary issue", value: "Water running down the driveway instead of off it" },
      { label: "Scope", value: "Approximately 1/4 mile of primary repair work" },
      { label: "Material", value: 'Compactable 3/4" road base' },
      { label: "Work completed", value: "Crown restoration, drainage shaping, road base placement, grading, compaction" },
    ],
    problem: {
      intro:
        "This Bayfield driveway had years of wear from water erosion, snow plowing, and surface breakdown. The main issue was not simply that the driveway was rough — it was that water was running down the travel lane instead of shedding off the surface. Over time, that created ruts, exposed rock, loss of fines, rough travel, and reduced traction on the steeper sections.",
      bullets: [
        "Water running down wheel tracks",
        "Weak or inconsistent crown",
        "Surface rutting and washboarding",
        "Loss of compactable fines",
        "Exposed aggregate",
        "Snow plow wear",
        "Poor water exits",
      ],
    },
    diagnosis: [
      "Adding gravel alone would not have solved the real problem. Without correcting the driveway shape and giving water a better path off the surface, new material would eventually follow the same failure pattern.",
      "The repair strategy focused on restoring crown, cleaning and improving drainage paths, adding turnouts where needed, and rebuilding the driving surface with compactable road base.",
    ],
    solution: {
      intro:
        "Durango Driveway Grading reshaped the driveway to restore proper water movement, strengthened the driving surface with compactable road base, and finished the surface with grading and compaction.",
      bullets: [
        "Restoring crown through key driveway sections",
        "Cleaning and improving drainage paths",
        "Creating turnouts to move water off the road",
        "Reworking weak and contaminated material",
        'Placing and blending compactable 3/4" road base',
        "Final grading for a smooth, natural finish",
        "Vibratory compaction to lock in the surface",
      ],
    },
    result: {
      intro:
        "The finished driveway now sheds water more effectively, drives smoother, and has a cleaner, more consistent surface. The crown was restored, drainage paths were improved, and the treated sections were compacted for a tighter, more durable finish. The goal was not just to make the driveway look better. The goal was to make it function better.",
      bullets: [
        "Improved water shedding",
        "More consistent crown",
        "Better traction and drivability",
        "Smoother surface",
        "Cleaner transitions",
        "Stronger compacted finish",
        "More professional appearance",
      ],
    },
    testimonial: {
      quote:
        "Our steep gravel driveway was in need of repair and resurfacing from years of water erosion and snow plow damage. Doug at Durango Driveway Grading had great communication and professionalism from beginning to final completion. The final result was over the top. He went above and beyond to make sure we were satisfied. We highly recommend Durango Driveway Grading.",
      attribution: "Eddie",
      location: "Bayfield, CO",
    },
    closing: [
      "After the project was complete, the property owner described the work as watching an artist shape the driveway. That comment stuck, because good gravel driveway work is not just about moving material. It is about reading the terrain, understanding water, shaping the surface, and finishing the driveway so it looks natural while performing better.",
      "That is the DDG standard: drainage first, structure second, finish always.",
    ],
    hero: "/images/projects/bayfield-after-27.jpg",
    heroAlt: "Gravel driveway transformation after grading and drainage repair in Bayfield, Colorado",
    gallery: [
      { src: "/images/projects/bayfield-before-16.jpg", alt: "Worn gravel driveway surface before repair in Bayfield, Colorado", phase: "before" },
      { src: "/images/projects/bayfield-before-23.jpg", alt: "Rough gravel driveway before repair in Bayfield, Colorado", phase: "before" },
      { src: "/images/projects/bayfield-before-30.jpg", alt: "Bayfield gravel driveway before drainage correction and grading", phase: "before" },
      { src: "/images/projects/bayfield-during-1.jpg", alt: "Reshaping the driveway surface during the Bayfield restoration", phase: "during" },
      { src: "/images/projects/bayfield-during-13.jpg", alt: "Freshly re-cut roadside ditch directing water away from a gravel driveway near Bayfield, Colorado", phase: "during" },
      { src: "/images/projects/bayfield-during-34.jpg", alt: "Road base placement in progress on the Bayfield driveway", phase: "during" },
      { src: "/images/projects/bayfield-after-27.jpg", alt: "Gravel driveway transformation after grading and drainage repair in Bayfield, Colorado", phase: "after" },
      { src: "/images/projects/bayfield-after-23.jpg", alt: "Finished crowned gravel driveway surface in Bayfield, Colorado", phase: "after" },
      { src: "/images/projects/bayfield-after-13.jpg", alt: "Driveway grading equipment used on the Bayfield gravel driveway project", phase: "after" },
      { src: "/images/projects/bayfield-after-7.jpg", alt: "Compacted gravel driveway after restoration in Bayfield, Colorado", phase: "after" },
    ],
  },
];

export const projectsBySlug = new Map(projects.map((p) => [p.slug, p]));

/** The single before/during/after triple used on the comparison strip. */
export const bayfieldComparison = {
  before: { src: "/images/projects/bayfield-before-16.jpg", alt: "Worn, rough gravel driveway surface before repair", caption: "Worn, rough surface" },
  during: { src: "/images/projects/bayfield-during-13.jpg", alt: "Roadside ditch re-cut during drainage correction", caption: "Reshaping and drainage correction" },
  after: { src: "/images/projects/bayfield-after-27.jpg", alt: "Smooth, compacted, crowned gravel driveway after restoration", caption: "Smooth, compacted, crowned finish" },
} as const;
