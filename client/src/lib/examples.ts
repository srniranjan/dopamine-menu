import type { Activity, CategoryType } from "@shared/schema";

export const exampleActivities: Record<CategoryType, Omit<Activity, 'id' | 'userId'>[]> = {
  appetizers: [
    { name: "One minute of jumping jacks", category: "appetizers", duration: 1, description: null },
    { name: "Listen to a favorite song", category: "appetizers", duration: 3, description: null },
    { name: "Do a few stretches or yoga poses", category: "appetizers", duration: 5, description: null },
    { name: "Take a warm shower", category: "appetizers", duration: 10, description: null },
    { name: "Drink a cup of coffee", category: "appetizers", duration: 2, description: null },
    { name: "Pet your dog or cat", category: "appetizers", duration: 2, description: null },
    { name: "Work on a crossword puzzle", category: "appetizers", duration: 5, description: null },
    { name: "Take 5 deep breaths", category: "appetizers", duration: 1, description: null },
  ],
  entrees: [
    { name: "Playing an instrument", category: "entrees", duration: 30, description: null },
    { name: "Going for a brisk walk", category: "entrees", duration: 20, description: null },
    { name: "Working on a hobby", category: "entrees", duration: 45, description: null },
    { name: "Exercising or HIIT class", category: "entrees", duration: 30, description: null },
    { name: "Journaling", category: "entrees", duration: 15, description: null },
    { name: "Cooking or baking", category: "entrees", duration: 60, description: null },
    { name: "Working on a jigsaw puzzle", category: "entrees", duration: 45, description: null },
    { name: "Taking a quick nap", category: "entrees", duration: 20, description: null },
  ],
  sides: [
    { name: "Listening to white noise", category: "sides", duration: 0, description: null },
    { name: "Playing a podcast", category: "sides", duration: 0, description: null },
    { name: "Using a fidget tool", category: "sides", duration: 0, description: null },
    { name: "ASMR videos", category: "sides", duration: 0, description: null },
    { name: "Upbeat instrumental music", category: "sides", duration: 0, description: null },
    { name: "Body doubling (virtual or in-person)", category: "sides", duration: 0, description: null },
    { name: "Happy music playlist", category: "sides", duration: 0, description: null },
    { name: "Cozy mystery audiobook", category: "sides", duration: 0, description: null },
  ],
  desserts: [
    { name: "Scrolling through social media", category: "desserts", duration: 15, description: null },
    { name: "Playing Candy Crush", category: "desserts", duration: 10, description: null },
    { name: "Watching TV/Reality shows", category: "desserts", duration: 30, description: null },
    { name: "NY Times game app", category: "desserts", duration: 10, description: null },
    { name: "Texting friends", category: "desserts", duration: 5, description: null },
    { name: "Playing video games", category: "desserts", duration: 30, description: null },
    { name: "Online shopping (window shopping)", category: "desserts", duration: 20, description: null },
  ],
  specials: [
    { name: "Attending a concert", category: "specials", duration: 180, description: null },
    { name: "Getting a massage", category: "specials", duration: 60, description: null },
    { name: "Weekend getaway", category: "specials", duration: 1440, description: null },
    { name: "Going out to dinner", category: "specials", duration: 120, description: null },
    { name: "Visiting a nail salon", category: "specials", duration: 60, description: null },
    { name: "Seeing a play or comedy show", category: "specials", duration: 180, description: null },
    { name: "Taking a vacation", category: "specials", duration: 10080, description: null },
    { name: "Spa day", category: "specials", duration: 240, description: null },
  ],
};

export const categoryTips: Record<CategoryType, string> = {
  appetizers: "Quick activities that provide an instant boost without getting you stuck. Perfect for when you need just a little stimulation.",
  entrees: "Main activities that excite you and make you feel alive. These are your go-to when you have time and energy.",
  sides: "Background activities that make boring tasks more stimulating. Use these while doing other necessary activities.",
  desserts: "Easy dopamine hits that are fine occasionally but easy to overdo. Be mindful of how much time you spend here.",
  specials: "Planned treats and bucket-filling activities that require more time, money, or planning but provide lasting satisfaction.",
};
