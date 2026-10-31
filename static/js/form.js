(() => {
  "use strict";

  const form = document.getElementById("license-form");
  if (!form) return;

  const imageInput = document.getElementById("profile-image");
  const preview = document.getElementById("photo-preview");
  const previewImage = document.getElementById("photo-preview-image");
  const fileLabel = document.getElementById("file-picker-label");
  const message = document.getElementById("form-message");
  const submitButton = document.getElementById("create-license");
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const MAX_IMAGE_EDGE = 1200;

  let selectedImage = null;
  let previewUrl = null;
  let imageTask = null;
  let imageSelectionId = 0;

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.classList.toggle("success", type === "success");
  }

  function clearPreviewUrl() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("That image could not be opened. Try another file."));
      };
      image.src = objectUrl;
    });
  }

  async function compressImage(file) {
    const image = await readImage(file);
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error("That image has invalid dimensions. Try another photo.");
    }
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Your browser could not process this image.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.84);
  }

  imageInput.addEventListener("change", () => {
    const selectionId = ++imageSelectionId;
    const file = imageInput.files && imageInput.files[0];
    selectedImage = null;
    clearPreviewUrl();
    preview.classList.remove("has-image");
    fileLabel.textContent = "Choose image";
    showMessage("");

    const task = (async () => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        imageInput.value = "";
        showMessage("Choose an image file to use as your profile photo.");
        return;
      }
      if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
        imageInput.value = "";
        showMessage("Please use a PNG, JPG or WebP image.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        imageInput.value = "";
        showMessage("That image is over 5 MB. Choose a smaller file.");
        return;
      }

      try {
        const compressedImage = await compressImage(file);
        if (selectionId !== imageSelectionId) return;
        selectedImage = compressedImage;
        previewUrl = URL.createObjectURL(file);
        previewImage.src = previewUrl;
        preview.classList.add("has-image");
        fileLabel.textContent = "Change image";
        showMessage("Photo ready. Looking good.", "success");
      } catch (error) {
        if (selectionId !== imageSelectionId) return;
        imageInput.value = "";
        selectedImage = null;
        showMessage(error.message || "This image could not be processed.");
      }
    })();

    imageTask = task;
    task.finally(() => {
      if (imageTask === task) imageTask = null;
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");

    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.querySelector("span:first-child").textContent = "Preparing your license…";
    imageInput.disabled = true;

    try {
      if (imageTask) await imageTask;
    } catch (error) {
      console.warn("Photo processing did not finish:", error);
    }

    const formData = new FormData(form);
    const values = {
      name: String(formData.get("firstName") || "").trim().toLocaleUpperCase(),
      lastName: String(formData.get("lastName") || "").trim().toLocaleUpperCase(),
      country: String(formData.get("country") || "").trim().toLocaleUpperCase(),
      city: String(formData.get("city") || "").trim().toLocaleUpperCase(),
      gender: String(formData.get("gender") || "").trim().toLocaleUpperCase(),
      birthday: String(formData.get("birthdate") || ""),
      hairColor: String(formData.get("hairColor") || "").trim(),
      eyeColor: String(formData.get("eyeColor") || "").trim(),
      height: String(formData.get("height") || "").trim(),
      weight: String(formData.get("weight") || "").trim(),
      profile: selectedImage || ""
    };

    if (!values.name || !values.lastName || !values.country || !values.city) {
      showMessage("Please complete the required fields before continuing.");
      submitButton.disabled = false;
      submitButton.querySelector("span:first-child").textContent = "Create my license";
      imageInput.disabled = false;
      return;
    }

    try {
      sessionStorage.setItem("bikiniBottomLicense", JSON.stringify(values));
      window.location.assign("./license.html");
    } catch (error) {
      showMessage("Your browser storage is full or unavailable. Try a smaller photo or use a regular browser tab.");
      submitButton.disabled = false;
      submitButton.querySelector("span:first-child").textContent = "Create my license";
      imageInput.disabled = false;
    }
  });

  window.addEventListener("pagehide", clearPreviewUrl, { once: true });
})();
