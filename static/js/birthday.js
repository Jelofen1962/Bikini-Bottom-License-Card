(() => {
  "use strict";

  const layer = document.getElementById("birthday-rain");
  if (!layer) return;

  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const designs = [
    { theme: "lemon", art: "🎂", message: "HAPPY<br>BIRTHDAY!" },
    { theme: "coral", art: "💝", message: "BIG<br>WISHES!" },
    { theme: "lilac", art: "🧁", message: "MAKE A<br>WISH!" },
    { theme: "mint", art: "🎈", message: "IT'S YOUR<br>DAY!" },
    { theme: "blue", art: "⭐", message: "YOU'RE<br>THE BEST!" },
    { theme: "pink", art: "🎁", message: "PARTY<br>TIME!" },
    { theme: "lemon", art: "🌼", message: "HAVE A<br>GOOD ONE!" }
  ];

  const lanes = [2, 15, 29, 68, 83, 94, 48];
  const fragment = document.createDocumentFragment();

  designs.forEach((design, index) => {
    const fall = document.createElement("div");
    fall.className = `birthday-card-fall birthday-card-fall--${design.theme}`;
    fall.style.setProperty("--left", `${lanes[index]}%`);
    fall.style.setProperty("--duration", `${18 + (index % 4) * 2.4}s`);
    fall.style.setProperty("--delay", `${-((index * 3.7) % 19)}s`);
    fall.style.setProperty("--drift", `${(index % 2 ? -1 : 1) * (3 + (index % 3) * 1.4)}vw`);
    fall.style.setProperty("--tilt", `${index % 2 ? 10 : -10}deg`);
    fall.style.setProperty("--opacity", index === 6 ? "0.54" : "0.72");

    const card = document.createElement("div");
    card.className = "birthday-card";

    const kicker = document.createElement("span");
    kicker.className = "birthday-card-kicker";
    kicker.textContent = "A LITTLE WISH";

    const art = document.createElement("span");
    art.className = "birthday-card-art";
    art.textContent = design.art;

    const message = document.createElement("span");
    message.className = "birthday-card-message";
    message.innerHTML = design.message;

    const stars = document.createElement("span");
    stars.className = "birthday-card-stars";
    stars.textContent = "✦  ✧  ✦";

    card.append(kicker, art, message, stars);
    fall.append(card);
    fragment.append(fall);
  });

  layer.append(fragment);
})();
