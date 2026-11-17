import type { ClassLevel, CurriculumBoard } from "../types/navigation";

export type CurriculumSlotStatus = "placeholder";

export interface PhysicsExperimentTopic {
  id: string;
  slotCode: string;
  classLevel: ClassLevel;
  boardCoverage: readonly CurriculumBoard[];
  domainLabel: string;
  topicTitle: string;
  placeholderSummary: string;
  interactionFormat: string;
  status: CurriculumSlotStatus;
}

export interface PhysicsClassStructure {
  classLevel: ClassLevel;
  sectionHeading: string;
  scopeDescription: string;
  boardCoverage: readonly CurriculumBoard[];
  topics: readonly PhysicsExperimentTopic[];
}

/**
 * Structural placeholder definitions for Classes 6-10 Physics.
 * Intentionally avoids fabricating verified textbook chapter numbers,
 * numerical apparatus results, or student mastery data prior to
 * formal syllabus ingestion.
 */
export const PHYSICS_CURRICULUM_PLACEHOLDERS: readonly PhysicsClassStructure[] = [
  {
    classLevel: "Class 6",
    sectionHeading: "Class 6 Physics Placeholder Structure",
    scopeDescription:
      "Foundational observation slots reserved for measurement, light behavior, and introductory circuits.",
    boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
    topics: [
      {
        id: "phy-c6-slot-01",
        slotCode: "P6-01",
        classLevel: "Class 6",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Measurement & Motion",
        topicTitle: "Placeholder Slot: Length Measurement & Motion Types",
        placeholderSummary:
          "Reserved structure for interactive scale calibration and motion observation aligned to Class 6 syllabus mapping.",
        interactionFormat: "2D Interactive Bench (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c6-slot-02",
        slotCode: "P6-02",
        classLevel: "Class 6",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Light & Shadows",
        topicTitle: "Placeholder Slot: Shadows, Reflection & Pinhole Ray Path",
        placeholderSummary:
          "Reserved structure for exploring opaque, translucent, and transparent materials with adjustable light sources.",
        interactionFormat: "Ray Path Diagram Canvas (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c6-slot-03",
        slotCode: "P6-03",
        classLevel: "Class 6",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Electricity & Magnetism",
        topicTitle: "Placeholder Slot: Simple Cell, Switch & Magnetic Poles",
        placeholderSummary:
          "Reserved structure for closed-loop circuit continuity and magnetic attraction/repulsion checks.",
        interactionFormat: "Guided Component Explorer (Planned)",
        status: "placeholder",
      },
    ],
  },
  {
    classLevel: "Class 7",
    sectionHeading: "Class 7 Physics Placeholder Structure",
    scopeDescription:
      "Intermediate observation slots reserved for thermal transfer, timekeeping, and spherical optics.",
    boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
    topics: [
      {
        id: "phy-c7-slot-01",
        slotCode: "P7-01",
        classLevel: "Class 7",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Thermal Physics",
        topicTitle: "Placeholder Slot: Heat Transfer & Thermometer Reading",
        placeholderSummary:
          "Reserved structure for conduction, convection, and radiation comparisons without fabricated lab metrics.",
        interactionFormat: "Thermal Gradient Simulation (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c7-slot-02",
        slotCode: "P7-02",
        classLevel: "Class 7",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Kinematics",
        topicTitle: "Placeholder Slot: Simple Pendulum & Distance-Time Plots",
        placeholderSummary:
          "Reserved structure for periodic oscillation timing and uniform motion graphing.",
        interactionFormat: "Pendulum & Plot Split View (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c7-slot-03",
        slotCode: "P7-03",
        classLevel: "Class 7",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Electromagnetism & Optics",
        topicTitle: "Placeholder Slot: Electromagnet Coil & Lens Dispersion",
        placeholderSummary:
          "Reserved structure for heating/magnetic effects of current and prism light dispersion.",
        interactionFormat: "Interactive Apparatus Bench (Planned)",
        status: "placeholder",
      },
    ],
  },
  {
    classLevel: "Class 8",
    sectionHeading: "Class 8 Physics Placeholder Structure",
    scopeDescription:
      "Core physical interaction slots reserved for force, pressure, acoustics, and plane reflection.",
    boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
    topics: [
      {
        id: "phy-c8-slot-01",
        slotCode: "P8-01",
        classLevel: "Class 8",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Force & Pressure",
        topicTitle: "Placeholder Slot: Contact Force, Friction & Fluid Pressure",
        placeholderSummary:
          "Reserved structure for surface friction comparison and depth-dependent liquid pressure visualization.",
        interactionFormat: "Force Vector Stage (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c8-slot-02",
        slotCode: "P8-02",
        classLevel: "Class 8",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Waves & Sound",
        topicTitle: "Placeholder Slot: Amplitude, Frequency & Vibration Source",
        placeholderSummary:
          "Reserved structure for visual waveform controls connecting pitch and loudness concepts.",
        interactionFormat: "Oscilloscope Canvas (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c8-slot-03",
        slotCode: "P8-03",
        classLevel: "Class 8",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Optics",
        topicTitle: "Placeholder Slot: Laws of Reflection & Multiple Mirrors",
        placeholderSummary:
          "Reserved structure for incident/reflected ray angle manipulation and textbook diagram annotation.",
        interactionFormat: "Interactive Ray Table (Planned)",
        status: "placeholder",
      },
    ],
  },
  {
    classLevel: "Class 9",
    sectionHeading: "Class 9 Physics Placeholder Structure",
    scopeDescription:
      "Quantitative mechanics slots reserved for laws of motion, gravitation, buoyancy, and mechanical energy.",
    boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
    topics: [
      {
        id: "phy-c9-slot-01",
        slotCode: "P9-01",
        classLevel: "Class 9",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Mechanics",
        topicTitle: "Placeholder Slot: Uniform Acceleration & Velocity-Time Curves",
        placeholderSummary:
          "Reserved structure for kinematic parameter sliders linked to live graphical slopes.",
        interactionFormat: "Kinematics Sandbox (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c9-slot-02",
        slotCode: "P9-02",
        classLevel: "Class 9",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Gravitation & Fluids",
        topicTitle: "Placeholder Slot: Archimedes Upthrust & Density Comparison",
        placeholderSummary:
          "Reserved structure for fluid displacement observation across variable solid densities.",
        interactionFormat: "Immersion Vessel Lab (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c9-slot-03",
        slotCode: "P9-03",
        classLevel: "Class 9",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Work & Energy",
        topicTitle: "Placeholder Slot: Kinetic-Potential Energy Exchange",
        placeholderSummary:
          "Reserved structure for conservative mechanical energy transfer along inclined or pendulum paths.",
        interactionFormat: "Energy Conservation Stage (Planned)",
        status: "placeholder",
      },
    ],
  },
  {
    classLevel: "Class 10",
    sectionHeading: "Class 10 Physics Placeholder Structure",
    scopeDescription:
      "Board-aligned laboratory slots reserved for geometric optics, Ohm's law circuits, and magnetic fields.",
    boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
    topics: [
      {
        id: "phy-c10-slot-01",
        slotCode: "P10-01",
        classLevel: "Class 10",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Ray Optics",
        topicTitle: "Placeholder Slot: Spherical Mirrors, Lenses & Focal Length",
        placeholderSummary:
          "Reserved structure for principal ray tracing and image formation across concave/convex assemblies.",
        interactionFormat: "Optical Bench Simulator (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c10-slot-02",
        slotCode: "P10-02",
        classLevel: "Class 10",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Current Electricity",
        topicTitle: "Placeholder Slot: Ohm's Law & Series-Parallel Resistor Networks",
        placeholderSummary:
          "Reserved structure for circuit schematic inspection, voltage-current controls, and resistor combinations.",
        interactionFormat: "Circuit Workbench (Planned)",
        status: "placeholder",
      },
      {
        id: "phy-c10-slot-03",
        slotCode: "P10-03",
        classLevel: "Class 10",
        boardCoverage: ["NCERT / CBSE", "Karnataka State Board"],
        domainLabel: "Electromagnetism",
        topicTitle: "Placeholder Slot: Solenoid Field Lines & Electromagnetic Induction",
        placeholderSummary:
          "Reserved structure for interactive field direction visualization and moving-magnet coil response.",
        interactionFormat: "3D / 2D Field Visualizer (Planned)",
        status: "placeholder",
      },
    ],
  },
] as const;

export const PHYSICS_EXPERIMENT_TOPICS: readonly PhysicsExperimentTopic[] =
  PHYSICS_CURRICULUM_PLACEHOLDERS.flatMap((unit) => unit.topics);
