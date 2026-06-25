const venues = {
  beige: {
    name: "Beige",
    traits: {
      team: 5,
      beer: 2,
      quiet: 9,
      food: 8,
      ambience: 7,
      service: 9
    }
  },
  tropika: {
    name: "Tropika",
    traits: {
      team: 10,
      beer: 10,
      quiet: 4,
      food: 7,
      ambience: 10,
      service: 6
    }
  }
};

const presets = {
  team: {
    team: 10,
    beer: 7,
    quiet: 3,
    food: 6,
    ambience: 9,
    service: 5
  },
  dinner: {
    team: 5,
    beer: 3,
    quiet: 9,
    food: 8,
    ambience: 6,
    service: 8
  },
  beer: {
    team: 8,
    beer: 10,
    quiet: 2,
    food: 6,
    ambience: 9,
    service: 4
  }
};

const inputs = [...document.querySelectorAll("[data-weight]")];
const winnerTitle = document.querySelector("#winnerTitle");
const winnerReason = document.querySelector("#winnerReason");
const beigeScore = document.querySelector("#beigeScore");
const tropikaScore = document.querySelector("#tropikaScore");
const storageKey = "bangaloreBirthdayVenueWeights";

function getWeights() {
  return Object.fromEntries(
    inputs.map((input) => [input.dataset.weight, Number(input.value)])
  );
}

function calculateScore(venue, weights) {
  return Object.entries(weights).reduce((total, [key, weight]) => {
    return total + venue.traits[key] * weight;
  }, 0);
}

function formatScore(score) {
  return Math.round(score / 10);
}

function updateDecision() {
  const weights = getWeights();
  const beige = calculateScore(venues.beige, weights);
  const tropika = calculateScore(venues.tropika, weights);
  const winner = tropika >= beige ? "tropika" : "beige";

  beigeScore.textContent = formatScore(beige);
  tropikaScore.textContent = formatScore(tropika);

  if (winner === "tropika") {
    winnerTitle.textContent = "Tropika for the team outing";
    winnerReason.textContent =
      "Best fit when group energy, beer, variety, and memorable atmosphere matter most.";
  } else {
    winnerTitle.textContent = "Beige for a polished rooftop dinner";
    winnerReason.textContent =
      "Best fit when the birthday plan needs calmer service, focused food, and a cozier evening.";
  }

  localStorage.setItem(storageKey, JSON.stringify(weights));
}

function applyWeights(weights) {
  inputs.forEach((input) => {
    if (weights[input.dataset.weight] !== undefined) {
      input.value = weights[input.dataset.weight];
    }
  });
  updateDecision();
}

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    applyWeights(presets[button.dataset.preset]);
  });
});

inputs.forEach((input) => {
  input.addEventListener("input", updateDecision);
});

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved) {
    applyWeights(saved);
  } else {
    updateDecision();
  }
} catch {
  updateDecision();
}
