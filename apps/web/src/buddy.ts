export interface BuddyConfig {
  name: string;
  /** Hex body color, one of BUDDY_COLORS */
  color: string;
  accessories: string[];
}

export const BUDDY_COLORS = [
  { id: "#B9A8FF", label: "Lavender" },
  { id: "#FFB3C7", label: "Strawberry milk" },
  { id: "#9BE3C8", label: "Mint" },
  { id: "#FFD27A", label: "Butter" },
  { id: "#8FC9FF", label: "Sky" },
  { id: "#FFB08A", label: "Peach" },
  { id: "#E9E4F5", label: "Cloud" },
  { id: "#C7E58A", label: "Pistachio" },
] as const;

export const ACCESSORIES = [
  { id: "bow", label: "Bow" },
  { id: "glasses", label: "Round glasses" },
  { id: "beanie", label: "Beanie" },
  { id: "sprout", label: "Leaf sprout" },
  { id: "scarf", label: "Scarf" },
] as const;

export const DEFAULT_BUDDY: BuddyConfig = {
  name: "Mochi",
  color: BUDDY_COLORS[0].id,
  accessories: [],
};

export type Mood = "happy" | "concerned" | "sleepy";
