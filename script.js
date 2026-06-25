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
const voteEndpoint = "https://script.google.com/macros/s/1vWWUqkP_3Fe8wM9vHG484psDfs-ElGeEqZ6y2ipDwvA/exec";
const voteForm = document.querySelector("#voteForm");
const voterName = document.querySelector("#voterName");
const voteMessage = document.querySelector("#voteMessage");
const voteSyncStatus = document.querySelector("#voteSyncStatus");
const beigeVotes = document.querySelector("#beigeVotes");
const tropikaVotes = document.querySelector("#tropikaVotes");
const voteList = document.querySelector("#voteList");
const copyVotes = document.querySelector("#copyVotes");
const refreshVotesButton = document.querySelector("#refreshVotes");

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

function summarizeVotes(votes) {
  return votes.reduce(
    (summary, vote) => {
      summary[vote.venue] += 1;
      return summary;
    },
    { beige: 0, tropika: 0 }
  );
}

function setSyncStatus(message, state = "warning") {
  voteSyncStatus.textContent = message;
  voteSyncStatus.classList.toggle("is-connected", state === "connected");
  voteSyncStatus.classList.toggle("is-warning", state === "warning");
}

function renderVotes(votes = []) {
  const summary = summarizeVotes(votes);

  beigeVotes.textContent = summary.beige;
  tropikaVotes.textContent = summary.tropika;
  voteList.innerHTML = "";

  if (votes.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "No votes yet";
    voteList.append(empty);
    return;
  }

  votes.forEach((vote) => {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = vote.name;
    item.append(name, ` chose ${venues[vote.venue].name}`);
    voteList.append(item);
  });
}

function buildVoteSummary(votes) {
  const summary = summarizeVotes(votes);
  const winner =
    summary.tropika === summary.beige
      ? "Tie"
      : summary.tropika > summary.beige
        ? "Tropika"
        : "Beige";
  const lines = votes.map((vote) => `- ${vote.name}: ${venues[vote.venue].name}`);

  return [
    "Team birthday venue vote",
    `Beige: ${summary.beige}`,
    `Tropika: ${summary.tropika}`,
    `Current result: ${winner}`,
    "",
    ...lines
  ].join("\n");
}

function fetchVotes() {
  return new Promise((resolve, reject) => {
    if (!voteEndpoint) {
      reject(new Error("Missing vote endpoint"));
      return;
    }

    const callbackName = `handleVotes${Date.now()}`;
    const script = document.createElement("script");
    const separator = voteEndpoint.includes("?") ? "&" : "?";

    window[callbackName] = (payload) => {
      cleanup();
      if (!payload?.ok) {
        reject(new Error("Vote sheet returned an error"));
        return;
      }
      resolve(payload.votes || []);
    };

    function cleanup() {
      script.remove();
      delete window[callbackName];
    }

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not load vote sheet"));
    };

    script.src = `${voteEndpoint}${separator}callback=${callbackName}`;
    document.body.append(script);
  });
}

async function refreshVotes() {
  if (!voteEndpoint) {
    setSyncStatus("Add your Apps Script web app URL in script.js to sync votes to Google Sheets.");
    renderVotes();
    return;
  }

  try {
    const votes = await fetchVotes();
    renderVotes(votes);
    setSyncStatus("Connected to the shared Google Sheet.", "connected");
  } catch {
    setSyncStatus("Could not reach the Google Sheet vote endpoint.");
    renderVotes();
  }
}

async function submitVote(name, venue) {
  const body = new URLSearchParams({ name, venue });

  await fetch(voteEndpoint, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
}

voteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const submitter = event.submitter;
  const venue = submitter?.value;
  const name = voterName.value.trim();

  if (!name) {
    voteMessage.textContent = "Add your name before voting.";
    voterName.focus();
    return;
  }

  if (!voteEndpoint) {
    voteMessage.textContent = "Vote sheet is not connected yet.";
    return;
  }

  voteMessage.textContent = `Saving ${name}'s vote...`;

  submitVote(name, venue)
    .then(() => {
      voteMessage.textContent = `${name}'s vote for ${venues[venue].name} is saved.`;
      voterName.value = "";
      window.setTimeout(refreshVotes, 900);
    })
    .catch(() => {
      voteMessage.textContent = "Could not save the vote. Try again.";
    });
});

copyVotes.addEventListener("click", async () => {
  let votes = [];

  try {
    votes = await fetchVotes();
  } catch {
    voteMessage.textContent = "Could not copy because the vote sheet is not connected.";
    return;
  }

  const summary = buildVoteSummary(votes);

  try {
    await navigator.clipboard.writeText(summary);
    voteMessage.textContent = "Vote tally copied.";
  } catch {
    voteMessage.textContent = summary;
  }
});

refreshVotesButton.addEventListener("click", () => {
  refreshVotes();
  voteMessage.textContent = "Refreshing vote tally...";
});

refreshVotes();
