export interface Example {
  icon: string;
  displayText: string;
  messageText: string;
}

export const DEFAULT_EXAMPLES: Example[] = [
  {
    icon: "🚀",
    displayText: "Mobile app idea",
    messageText: "I have an idea for a mobile app that helps people track their daily habits and build better routines.",
  },
  {
    icon: "🏢",
    displayText: "Business startup",
    messageText: "I want to start a business that connects local artisans with customers in their community.",
  },
  {
    icon: "📱",
    displayText: "Tech solution",
    messageText: "I'm thinking about creating a platform that uses AI to help students with personalized learning.",
  },
  {
    icon: "🌱",
    displayText: "Sustainability project",
    messageText: "I have an idea for a community garden project that could help reduce food waste and bring neighborhoods together.",
  },
  {
    icon: "🎨",
    displayText: "Creative project",
    messageText: "I want to create an online platform where artists can collaborate on projects and share resources.",
  },
  {
    icon: "💡",
    displayText: "Product innovation",
    messageText: "I have an idea for a smart home device that could help elderly people stay connected with their families.",
  },
];
