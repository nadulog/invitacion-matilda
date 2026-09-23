const data = window.invitationData;
const eventDate = new Date(data.event.start);

const pad = (value) => String(value).padStart(2, "0");

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setCountdownNumber(selector, value) {
  const element = document.querySelector(selector);
  if (!element || element.textContent === value) return;

  element.classList.remove("is-changing");
  element.textContent = value;
  window.requestAnimationFrame(() => element.classList.add("is-changing"));
}

function applyEditableContent() {
  document.querySelectorAll("[data-copy]").forEach((element) => {
    const key = element.dataset.copy;
    if (data.copy[key]) element.textContent = data.copy[key];
  });

  const welcomePhotos = document.querySelector("#welcomePhotos");
  if (welcomePhotos) {
    welcomePhotos.innerHTML = "";
    data.bookPhotos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = `welcome-photo welcome-photo--${index + 1}`;

      const imageWrap = document.createElement("div");
      imageWrap.className = "welcome-photo__image";

      const image = document.createElement("img");
      image.src = photo.src;
      image.alt = photo.alt || "Foto del book de Matilda";
      image.loading = "lazy";

      const caption = document.createElement("figcaption");
      caption.innerHTML = `<span>${data.event.honoree}</span><strong>${data.event.year}</strong>`;

      imageWrap.appendChild(image);
      figure.appendChild(imageWrap);
      figure.appendChild(caption);
      welcomePhotos.appendChild(figure);
    });
  }

  setText("#day", data.event.day);
  setText("#weekday", data.event.weekday);
  setText("#monthName", data.event.month);
  setText("#yearLabel", data.event.year);
  setText("#timeLabel", data.event.timeLabel);
  setText("#venueName", data.location.venue);
  setText("#venueAddress", data.location.address);
  setText("#mapTitle", data.location.venue);
  setText("#mapAddress", data.location.address);
  setText("#giftAlias", data.gifts.alias);
  setText("#giftHolder", data.gifts.holder);
  setText("#giftEntity", data.gifts.entity);

  const playlistLink = document.querySelector("#playlistLink");
  if (playlistLink && data.playlist.url) {
    playlistLink.href = data.playlist.url;
  } else {
    document.querySelector("#musica")?.classList.add("is-unavailable");
  }
  const mapFrameUrl = new URL(data.location.embedUrl);
  mapFrameUrl.searchParams.set("z", "16");
  mapFrameUrl.searchParams.set("iwloc", "near");
  document.querySelector("#mapFrame").src = mapFrameUrl.toString();
  document.querySelector("#mapsLink").href = data.location.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location.mapsQuery)}`;

  const audio = document.querySelector("#backgroundAudio");
  if (audio && data.audio?.enabled && data.audio.src) {
    audio.src = data.audio.src;
    audio.loop = true;
  }
}

function updateCountdown() {
  const now = new Date();
  const diff = Math.max(eventDate - now, 0);
  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  setCountdownNumber("#days", String(days));
  setCountdownNumber("#hours", pad(hours));
  setCountdownNumber("#minutes", pad(minutes));
  setCountdownNumber("#seconds", pad(remainingSeconds));
}

function formatCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadCalendarEvent() {
  const start = new Date(data.event.start);
  const end = new Date(data.event.end);
  const location = `${data.location.venue} - ${data.location.address}`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BloomDate//Matilda Mis 15//ES",
    "BEGIN:VEVENT",
    `UID:matilda-mis-15-${Date.now()}@bloomdate.site`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${data.event.title}`,
    `LOCATION:${location}`,
    "DESCRIPTION:Mis 15 de Matilda",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = data.event.calendarFileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderGallery() {
  const gallery = document.querySelector("#gallery");
  gallery.innerHTML = "";
  data.gallery.forEach((photo, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-card";
    figure.tabIndex = 0;
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", `Abrir ${photo.alt || "foto de Matilda"}`);
    figure.style.setProperty("--tilt", `${index % 2 === 0 ? -1.6 : 1.4}deg`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt || "Foto de Matilda";
    image.loading = "lazy";

    const openPhoto = () => openGalleryPhoto(photo);
    figure.addEventListener("click", openPhoto);
    figure.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPhoto();
      }
    });

    figure.appendChild(image);
    gallery.appendChild(figure);
  });
}

function openGalleryPhoto(photo) {
  const modal = document.querySelector("#galleryModal");
  const image = document.querySelector("#galleryModalImage");
  if (!modal || !image) return;

  image.src = photo.src;
  image.alt = photo.alt || "Foto de Matilda";
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function setupModal() {
  const mapModal = document.querySelector("#mapModal");
  const giftModal = document.querySelector("#giftModal");
  const bloomkeepModal = document.querySelector("#bloomkeepModal");
  const galleryModalImage = document.querySelector("#galleryModalImage");
  const mapOpenButton = document.querySelector("#openMap");
  const giftOpenButton = document.querySelector("#openGifts");
  const bloomkeepOpenButton = document.querySelector("#openBloomkeep");
  const closeButtons = document.querySelectorAll("[data-close-modal]");

  const openModal = (modal) => {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeModals = () => {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.setAttribute("aria-hidden", "true");
    });
    if (galleryModalImage) {
      galleryModalImage.removeAttribute("src");
      galleryModalImage.alt = "";
    }
    document.body.classList.remove("modal-open");
  };

  mapOpenButton?.addEventListener("click", () => openModal(mapModal));
  giftOpenButton?.addEventListener("click", () => openModal(giftModal));
  bloomkeepOpenButton?.addEventListener("click", () => openModal(bloomkeepModal));

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModals);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModals();
    }
  });
}

async function copyGiftValue(value, feedbackSelector, message) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
  } else {
    const input = document.createElement("input");
    input.value = value;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  }

  const feedback = document.querySelector(feedbackSelector);
  if (!feedback) return;
  feedback.textContent = message;
  setTimeout(() => {
    feedback.textContent = "";
  }, 2400);
}

async function copyAlias() {
  await copyGiftValue(data.gifts.alias, "#copyAliasFeedback", "Alias copiado.");
}

async function startBackgroundAudio() {
  const audio = document.querySelector("#backgroundAudio");
  if (!audio || !data.audio?.enabled || !data.audio.src) return;

  try {
    audio.volume = 0.72;
    await audio.play();
    updateAudioToggleState();
  } catch (error) {
    audio.pause();
    updateAudioToggleState();
  }
}

function updateAudioToggleState() {
  const button = document.querySelector("#audioToggle");
  const audio = document.querySelector("#backgroundAudio");
  if (!button) return;

  const hasPlayableAudio = Boolean(audio && data.audio?.enabled && data.audio.src);
  const isPlaying = hasPlayableAudio && !audio.paused;

  button.classList.toggle("is-playing", isPlaying);
  button.classList.toggle("is-muted", !isPlaying);
  button.setAttribute("aria-pressed", String(isPlaying));
  button.setAttribute("aria-label", hasPlayableAudio ? (isPlaying ? "Pausar musica" : "Activar musica") : "Ir a la seccion musica");
}

function revealAudioToggle() {
  const button = document.querySelector("#audioToggle");
  if (!button) return;
  button.hidden = false;
  updateAudioToggleState();
}

function setupAudioToggle() {
  const button = document.querySelector("#audioToggle");
  const audio = document.querySelector("#backgroundAudio");
  if (!button) return;

  const hasPlayableAudio = () => Boolean(audio && data.audio?.enabled && data.audio.src);

  button.addEventListener("click", async () => {
    if (!hasPlayableAudio()) {
      document.querySelector("#musica")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    try {
      if (audio.paused) {
        audio.volume = 0.72;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      audio.pause();
    } finally {
      updateAudioToggleState();
    }
  });

  audio?.addEventListener("play", updateAudioToggleState);
  audio?.addEventListener("pause", updateAudioToggleState);
  audio?.addEventListener("ended", updateAudioToggleState);
}

function setupSplash() {
  const splash = document.querySelector("#splash");
  const enterButton = document.querySelector("#enterInvitation");
  const welcomeSection = document.querySelector("#bienvenida");
  if (!splash || !enterButton || !welcomeSection) return;

  enterButton.addEventListener("click", async () => {
    revealAudioToggle();
    splash.classList.add("is-leaving");
    document.body.classList.remove("splash-active");

    setTimeout(() => {
      welcomeSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);

    setTimeout(() => {
      splash.setAttribute("aria-hidden", "true");
    }, 820);
  });

}

function setupWelcomeReveal() {
  const welcome = document.querySelector("#bienvenida");
  if (!welcome) return;

  const reveal = () => welcome.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.28 }
  );

  observer.observe(welcome);
}

function setupCountdownReveal() {
  const countdown = document.querySelector("#cuenta-regresiva");
  if (!countdown) return;

  const reveal = () => countdown.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.32 }
  );

  observer.observe(countdown);
}

function setupDateReveal() {
  const dateSection = document.querySelector("#fecha");
  if (!dateSection) return;

  const reveal = () => dateSection.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.32 }
  );

  observer.observe(dateSection);
}

function setupDressReveal() {
  const dressSection = document.querySelector("#dress-code");
  if (!dressSection) return;

  const reveal = () => dressSection.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.28 }
  );

  observer.observe(dressSection);
}

function setupMusicReveal() {
  const musicSection = document.querySelector("#musica");
  if (!musicSection) return;

  const reveal = () => musicSection.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.24 }
  );

  observer.observe(musicSection);
}

function setupBloomkeepReveal() {
  const bloomkeepSection = document.querySelector("#bloomkeep");
  if (!bloomkeepSection) return;

  const reveal = () => bloomkeepSection.classList.add("is-visible");

  if (!("IntersectionObserver" in window)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.24 }
  );

  observer.observe(bloomkeepSection);
}

applyEditableContent();
renderGallery();
updateCountdown();
setupModal();
setupAudioToggle();
setupSplash();
setupWelcomeReveal();
setupCountdownReveal();
setupDateReveal();
setupDressReveal();
setupMusicReveal();
setupBloomkeepReveal();

document.querySelector("#calendarButton").addEventListener("click", downloadCalendarEvent);
document.querySelector("#copyAlias")?.addEventListener("click", copyAlias);
setInterval(updateCountdown, 1000);
