export type AppRoutePath =
  | "/"
  | "/labs"
  | "/curriculum"
  | "/tutor"
  | "/teacher";

export interface NavItem {
  label: string;
  path: AppRoutePath;
}

export const PRIMARY_NAV_ITEMS: readonly NavItem[] = [
  { label: "Overview", path: "/" },
  { label: "Laboratories", path: "/labs" },
  { label: "Curriculum", path: "/curriculum" },
  { label: "AI Tutor", path: "/tutor" },
  { label: "Teacher", path: "/teacher" },
] as const;

export type SubjectArea = "Physics" | "Chemistry" | "Biology" | "Mathematics";

export type ClassLevel = "Class 6" | "Class 7" | "Class 8" | "Class 9" | "Class 10";

export type CurriculumBoard = "NCERT / CBSE" | "Karnataka State Board";

export type TutorLanguage = "English" | "Kannada" | "Hindi";
