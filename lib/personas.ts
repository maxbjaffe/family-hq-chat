export interface Persona {
  id: string;
  name: string;
  role: string;
  emoji: string;
  avatarUrl: string;
  color: string;       // text color class
  borderColor: string; // border accent
}

export const MAX_POPPINS: Persona = {
  id: "max-poppins",
  name: "Max Poppins",
  role: "Family Command Center",
  emoji: "🎩",
  avatarUrl: "/avatars/max-poppins.png",
  color: "text-purple-600",
  borderColor: "border-purple-400",
};

/** Get the default persona for Family HQ */
export function getPersona(): Persona {
  return MAX_POPPINS;
}
