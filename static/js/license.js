(() => {
  "use strict";

  const card = document.getElementById("license-card");
  const stage = document.querySelector(".license-stage");
  const emptyState = document.getElementById("empty-state");
  const downloadButton = document.getElementById("download-license");
  const status = document.getElementById("download-status");
  const profilePhoto = document.getElementById("profile-photo");

  if (!card || !stage || !emptyState || !downloadButton || !status || !profilePhoto) return;

  const STORAGE_KEY = "bikiniBottomLicense";
  const EXPORT_WIDTH = 1800;
  const EXPORT_HEIGHT = 1140;
  const EXPORT_FILE_NAME = "Bikini-Bottom-Friends-License.png";
  const CARD_SERIF = '"Bodoni MT", Didot, "Times New Roman", "Nimbus Roman", "Liberation Serif", serif';

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("error", isError);
  }

  function getStoredData() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (error) {
      console.warn("Could not read license data:", error);
      return null;
    }
  }

  function formatDate(value) {
    if (!value) return "—";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return String(value);
    return `${match[2]}-${match[3]}-${match[1].slice(-2)}`;
  }

  function shortGender(value) {
    const normalized = String(value || "").trim().toLocaleUpperCase();
    if (["MALE", "M"].includes(normalized)) return "M";
    if (["FEMALE", "F"].includes(normalized)) return "F";
    if (["OTHER", "O"].includes(normalized)) return "O";
    if (["PREFER NOT TO SAY", "PREFER NOT", ""].includes(normalized)) return "—";
    return normalized;
  }

  function setDemographic(id, label, value, showEmpty = false) {
    const element = document.getElementById(id);
    if (!element) return;
    const cleanValue = String(value || "").trim();
    element.textContent = cleanValue
      ? `${label}: ${cleanValue.toLocaleUpperCase()}`
      : (showEmpty ? `${label}: —` : "");
    element.hidden = !cleanValue && !showEmpty;
  }

  function titleCase(value) {
    return String(value || "")
      .toLocaleLowerCase()
      .replace(/(^|[\s'-])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase()}`);
  }

  function makeLicenseCode(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const number = (hash >>> 0) % 9000000 + 1000000;
    return `A${number}`;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "—";
  }

  const data = getStoredData();
  if (!data || !String(data.name || "").trim() || !String(data.lastName || "").trim()) {
    stage.hidden = true;
    const intro = document.querySelector(".license-intro");
    if (intro) intro.hidden = true;
    emptyState.hidden = false;
    return;
  }

  const fullName = `${String(data.name).trim()} ${String(data.lastName).trim()}`.replace(/\s+/g, " ");
  const displayName = fullName.toLocaleUpperCase();
  const licenseCode = makeLicenseCode(`${fullName}|${data.birthday || ""}|${data.city || ""}`);
  const birthDate = formatDate(data.birthday);

  setText("license-name", displayName);
  setText("license-location", String(data.city || "").toLocaleUpperCase());
  setText("license-country", String(data.country || "").toLocaleUpperCase());
  setDemographic("license-gender", "SEX", shortGender(data.gender), true);
  setDemographic("license-hair", "HAIR", data.hairColor);
  setDemographic("license-eyes", "EYES", data.eyeColor);
  setDemographic("license-height", "HT", data.height);
  setDemographic("license-weight", "WT", data.weight);
  setDemographic("license-birthday", "DOB", birthDate, true);
  document.querySelectorAll(".demographic-row").forEach((row) => {
    row.hidden = !Array.from(row.children).some((child) => !child.hidden);
  });
  setText("license-signature", titleCase(fullName));
  setText("license-code", licenseCode);

  function fitCardLine(id, minimumSize = 8) {
    const element = document.getElementById(id);
    if (!element) return;
    element.style.fontSize = "";
    let nextSize = Number.parseFloat(getComputedStyle(element).fontSize) || 16;
    while (element.scrollWidth > element.clientWidth + 1 && nextSize > minimumSize) {
      nextSize = Math.max(minimumSize, nextSize - 0.5);
      element.style.fontSize = `${nextSize}px`;
    }
  }

  function fitDemographicRows() {
    document.querySelectorAll(".demographic-row:not([hidden])").forEach((row) => {
      row.style.fontSize = "";
      let size = Number.parseFloat(getComputedStyle(row).fontSize) || 10;
      while (row.scrollWidth > row.clientWidth + 1 && size > 5) {
        size = Math.max(5, size - 0.25);
        row.style.fontSize = `${size}px`;
      }
    });
  }

  const signatureMeasureContext = document.createElement("canvas").getContext("2d");

  function fitSignature() {
    const signature = document.getElementById("license-signature");
    const container = signature && signature.parentElement;
    if (!signature || !container || !signatureMeasureContext) return;

    const text = signature.textContent.trim();
    if (!text) return;

    signature.style.fontSize = "";
    const styles = getComputedStyle(signature);
    const weight = styles.fontWeight || "400";
    const family = styles.fontFamily || '"Riches", cursive';
    const availableWidth = Math.max(0, container.clientWidth - 18);
    let size = Number.parseFloat(styles.fontSize) || 24;
    const minimumSize = 8;

    // Measure the actual glyphs, not the signature element's layout box.
    // Measuring the transformed/full-width box previously forced the font
    // down to its minimum size even when the handwritten text fit easily.
    const measureAt = (fontSize) => {
      signatureMeasureContext.font = `${weight} ${fontSize}px ${family}`;
      return signatureMeasureContext.measureText(text).width;
    };

    while (measureAt(size) > availableWidth && size > minimumSize) {
      size = Math.max(minimumSize, size - 0.5);
    }

    signature.style.fontSize = `${size}px`;
  }

  function fitCardContent() {
    fitCardLine("license-name", 8);
    fitCardLine("license-location", 8);
    fitCardLine("license-country", 8);
    fitDemographicRows();
    fitSignature();
  }

  const fitAfterFonts = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();
  fitAfterFonts.then(() => requestAnimationFrame(fitCardContent));
  if (typeof ResizeObserver === "function") {
    const cardResizeObserver = new ResizeObserver(() => requestAnimationFrame(fitCardContent));
    cardResizeObserver.observe(card);
  }

  profilePhoto.addEventListener("error", () => {
    profilePhoto.onerror = null;
    profilePhoto.src = "./assets/profile.png";
  }, { once: true });
  if (typeof data.profile === "string" && data.profile.startsWith("data:image/")) {
    profilePhoto.src = data.profile;
  }

  downloadButton.disabled = false;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load a card asset: ${src}`));
      image.src = src;
    });
  }

  function roundedRect(context, x, y, width, height, radius) {
    const r = Math.max(0, Math.min(radius, width / 2, height / 2));
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
  }

  function drawCover(context, image, x, y, width, height, zoom = 1, verticalBias = 0.12) {
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = width / height;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (imageRatio > boxRatio) {
      sourceWidth = image.naturalHeight * boxRatio;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth / boxRatio;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }
    if (zoom > 1) {
      sourceWidth /= zoom;
      sourceHeight /= zoom;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
      sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, (image.naturalHeight - sourceHeight) * verticalBias));
    }
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function drawImageRounded(context, image, x, y, width, height, radius, zoom = 1) {
    context.save();
    roundedRect(context, x, y, width, height, radius);
    context.clip();
    drawCover(context, image, x, y, width, height, zoom, 0.10);
    context.restore();
  }

  function fitText(context, text, maxWidth, startSize, minSize, family, weight = "700") {
    let size = startSize;
    context.font = `${weight} ${size}px ${family}`;
    while (context.measureText(text).width > maxWidth && size > minSize) {
      size -= 1;
      context.font = `${weight} ${size}px ${family}`;
    }
    return size;
  }

  function drawGoldBands(context) {
    const bandWidth = 340;
    const bandHeight = 51;
    const top = 25;
    const gap = 27;
    const positions = [0, EXPORT_WIDTH - bandWidth];
    positions.forEach((x) => {
      context.fillStyle = "#dfa62b";
      context.fillRect(x, top, bandWidth, bandHeight);
      context.fillRect(x, top + bandHeight + gap, bandWidth, bandHeight);
      context.fillStyle = "rgba(255,255,255,.58)";
      context.fillRect(x, top + bandHeight - 3, bandWidth, 5);
      context.fillRect(x, top + bandHeight + gap + bandHeight - 3, bandWidth, 5);
      context.fillStyle = "rgba(118,82,20,.13)";
      context.fillRect(x, top + bandHeight, bandWidth, 2);
      context.fillRect(x, top + bandHeight * 2 + gap, bandWidth, 2);
    });
  }

  function drawWaves(context) {
    context.save();
    context.strokeStyle = "#28251f";
    context.lineWidth = 5.5;
    context.lineCap = "round";
    [0, 42].forEach((offset) => {
      context.beginPath();
      for (let x = 740; x <= 1740; x += 3) {
        const y = 377 + offset + Math.sin(((x - 740) / 40) * Math.PI * 2) * 6.5;
        if (x === 740) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    });
    context.restore();
  }

  function drawInfoText(context, text, x, y, maxWidth, startSize, minSize, color = "#191816") {
    const safeText = String(text || "—").toLocaleUpperCase();
    const size = fitText(context, safeText, maxWidth, startSize, minSize, CARD_SERIF, "700");
    context.textAlign = "left";
    context.fillStyle = color;
    context.font = `700 ${size}px ${CARD_SERIF}`;
    context.fillText(safeText, x, y);
  }

  function drawDemographicRow(context, items, x, y, maxWidth, startSize = 35, minSize = 23) {
    const values = items
      .filter((item) => String(item.value || "").trim())
      .map((item) => `${item.label}: ${String(item.value).trim().toLocaleUpperCase()}`);
    if (!values.length) return;

    let size = startSize;
    const gap = 34;
    const measure = () => {
      context.font = `700 ${size}px ${CARD_SERIF}`;
      return values.reduce((sum, value) => sum + context.measureText(value).width, 0) + gap * (values.length - 1);
    };
    while (measure() > maxWidth && size > minSize) size -= 1;

    context.font = `700 ${size}px ${CARD_SERIF}`;
    context.fillStyle = "#1d1b19";
    context.textAlign = "left";
    let cursor = x;
    values.forEach((value) => {
      context.fillText(value, cursor, y);
      cursor += context.measureText(value).width + gap;
    });
  }

  async function buildCanvas() {
    const portraitSource = profilePhoto.complete && profilePhoto.naturalWidth
      ? profilePhoto.currentSrc || profilePhoto.src
      : "./assets/profile.png";
    const [paper, portrait] = await Promise.all([
      loadImage("./assets/license-paper.svg"),
      loadImage(portraitSource)
    ]);

    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
      try {
        await document.fonts.load('96px "Riches"');
        await document.fonts.load(`700 96px ${CARD_SERIF}`);
      } catch (_) { /* Browser fallback fonts remain available. */ }
    }

    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser cannot create the license image.");

    context.save();
    roundedRect(context, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT, 34);
    context.clip();
    context.fillStyle = "#f5f1e7";
    context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    context.drawImage(paper, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    context.restore();

    // Two gold header stripes sit flush with the physical card edges.
    drawGoldBands(context);

    // Condensed-looking serif title, closer to the lettering on the source card.
    context.save();
    context.translate(900, 0);
    context.scale(1.04, .95);
    context.textAlign = "center";
    context.fillStyle = "#151412";
    const titleSize = fitText(context, "BIKINI BOTTOM", 1400, 136, 100, CARD_SERIF, "700");
    context.font = `700 ${titleSize}px ${CARD_SERIF}`;
    context.fillText("BIKINI BOTTOM", 0, 130);
    context.restore();

    context.save();
    context.translate(900, 0);
    context.scale(1.16, 1);
    context.textAlign = "center";
    context.fillStyle = "#151412";
    context.font = `700 72px ${CARD_SERIF}`;
    context.fillText("DRIVER LICENSE", 0, 253);
    context.restore();

    context.textAlign = "right";
    context.font = `700 39px ${CARD_SERIF}`;
    context.fillStyle = "#211f1b";
    context.fillText("CLASS: S", 1738, 260);

    // Expiration and license number intentionally occupy two close, offset rows.
    context.textAlign = "left";
    context.font = `700 40px ${CARD_SERIF}`;
    context.fillStyle = "#bd2626";
    context.fillText("EXPIRES: NEVER", 120, 348);
    context.font = `700 84px ${CARD_SERIF}`;
    context.fillStyle = "#26764a";
    context.save();
    context.translate(900, 0);
    context.scale(1.22, 1);
    context.fillText(licenseCode, -10, 338);
    context.restore();
    drawWaves(context);

    // Purple portrait mat touches the left card edge, as in the reference.
    const photoX = 0;
    const photoY = 444;
    const photoWidth = 716;
    const photoHeight = 696;
    context.save();
    roundedRect(context, photoX, photoY, photoWidth, photoHeight, 27);
    context.fillStyle = "#8562a2";
    context.fill();
    context.restore();

    context.save();
    roundedRect(context, photoX + 15, photoY + 15, photoWidth - 30, photoHeight - 15, 19);
    context.clip();
    context.fillStyle = "#edc83b";
    context.fillRect(photoX + 15, photoY + 15, photoWidth - 30, photoHeight - 15);
    drawImageRounded(context, portrait, photoX + 27, photoY + 27, photoWidth - 54, photoHeight - 27, 9, 1.14);
    context.restore();

    // Compact, left-aligned identity block with the same vertical rhythm as the print.
    const infoX = 742;
    const maxInfoWidth = 1000;
    drawInfoText(context, displayName, infoX, 550, maxInfoWidth, 78, 30);
    drawInfoText(context, data.city || "BIKINI BOTTOM", infoX, 660, maxInfoWidth, 67, 28);
    drawInfoText(context, data.country || "UNDERSEA", infoX, 765, maxInfoWidth, 67, 28);

    drawDemographicRow(context, [
      { label: "SEX", value: shortGender(data.gender) },
      { label: "HAIR", value: data.hairColor },
      { label: "EYES", value: data.eyeColor }
    ], infoX, 835, maxInfoWidth, 35, 23);

    drawDemographicRow(context, [
      { label: "HT", value: data.height },
      { label: "WT", value: data.weight },
      { label: "DOB", value: birthDate === "—" ? "" : birthDate }
    ], infoX, 890, maxInfoWidth, 35, 23);

    // Handwritten signature, no modern divider or microprint footer.
    const signature = titleCase(fullName);
    const signatureSize = fitText(
      context,
      signature,
      maxInfoWidth - 36,
      124,
      22,
      '"Riches", "Brush Script MT", cursive',
      "400"
    );
    context.textAlign = "left";
    context.fillStyle = "#272a36";
    context.font = `400 ${signatureSize}px "Riches", "Brush Script MT", cursive`;
    context.save();
    context.translate(infoX + 15, 0);
    context.rotate(-2 * Math.PI / 180);
    context.fillText(signature, 0, 1083);
    context.restore();

    // Fine outer keyline follows the card silhouette.
    context.save();
    roundedRect(context, 1, 1, EXPORT_WIDTH - 2, EXPORT_HEIGHT - 2, 34);
    context.strokeStyle = "#8a8173";
    context.lineWidth = 2;
    context.stroke();
    context.restore();

    return canvas;
  }

  function downloadCanvas(canvas) {
    return new Promise((resolve, reject) => {
      const triggerDownload = (url, shouldRevoke = false) => {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = EXPORT_FILE_NAME;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        if (shouldRevoke) window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      };

      if (typeof canvas.toBlob !== "function") {
        try {
          triggerDownload(canvas.toDataURL("image/png"));
          resolve();
        } catch (error) {
          reject(error);
        }
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("The PNG could not be created. Please try again."));
          return;
        }
        const url = URL.createObjectURL(blob);
        triggerDownload(url, true);
        resolve();
      }, "image/png");
    });
  }

  downloadButton.addEventListener("click", async () => {
    if (downloadButton.disabled) return;
    downloadButton.disabled = true;
    const buttonLabel = downloadButton.querySelector("span:first-child");
    if (buttonLabel) buttonLabel.textContent = "Preparing PNG…";
    setStatus("Creating your high-resolution license image…");

    try {
      const canvas = await buildCanvas();
      await downloadCanvas(canvas);
      setStatus("Your license has been saved. See you in Bikini Bottom!");
    } catch (error) {
      console.error("License export failed:", error);
      setStatus(error.message || "Could not export the license. Reload the page and try again.", true);
    } finally {
      downloadButton.disabled = false;
      if (buttonLabel) buttonLabel.textContent = "Download PNG";
    }
  });
})();
