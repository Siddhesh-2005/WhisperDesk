import crypto from "crypto";
import {User} from "../models/user.model.js";

export async function generateUniqueUsername() {
  const MAX_ATTEMPTS = 5;

  const adjs = [
    "low", "mid", "fake", "npc", "bot",
    "dead", "soft", "fraud", "lost"
  ];

  const nouns = [
    "iq", "ego", "brain", "aim",
    "skill", "luck", "logic"
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const adj = adjs[crypto.randomInt(adjs.length)];
    const noun = nouns[crypto.randomInt(nouns.length)];
    const suffix = crypto.randomInt(100, 1000);

    const username = `${adj}${noun}${suffix}`;

    const exists = await User.exists({ username });
    if (!exists) {
      return username;
    }
  }

  throw new Error("Unable to generate unique username");
}
