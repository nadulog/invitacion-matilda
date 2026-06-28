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
      image.alt = photo.alt || "Foto del book de Martina";
      image.loading = "lazy";

      const caption = document.createElement("figcaption");
      caption.innerHTML = "<span>Martina</span><strong>2026</strong>";

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
  setText("#timeLabel", "21:30 hs · 05:00 am");
  setText("#venueName", data.location.venue);
  setText("#venueAddress", data.location.address);
  setText("#mapTitle", data.location.venue);
  setText("#mapAddress", data.location.address);
  setText("#giftAlias", data.gifts.alias);
  setText("#giftHolder", data.gifts.holder);
  setText("#giftEntity", data.gifts.entity);

  document.querySelector("#playlistLink").href = data.playlist.url;
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
    "PRODID:-//BloomDate//Martina Birthday Party//ES",
    "BEGIN:VEVENT",
    `UID:martina-birthday-party-${Date.now()}@bloomdate.site`,
    `DTSTAMP:${formatCalendarDate(new Date())}`,
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${data.event.title}`,
    `LOCATION:${location}`,
    "DESCRIPTION:Martina Birthday Party",
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
    figure.style.setProperty("--tilt", `${index % 2 === 0 ? -1.6 : 1.4}deg`);

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt || "Foto de Martina";
    image.loading = "lazy";

    figure.appendChild(image);
    gallery.appendChild(figure);
  });
}

function setupModal() {
  const mapModal = document.querySelector("#mapModal");
  const giftModal = document.querySelector("#giftModal");
  const mapOpenButton = document.querySelector("#openMap");
  const giftOpenButton = document.querySelector("#openGifts");
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
    document.body.classList.remove("modal-open");
  };

  mapOpenButton?.addEventListener("click", () => openModal(mapModal));
  giftOpenButton?.addEventListener("click", () => openModal(giftModal));

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
  } catch (error) {
    audio.pause();
  }
}

function setupSplash() {
  const splash = document.querySelector("#splash");
  const enterButton = document.querySelector("#enterInvitation");
  const firstSection = document.querySelector("#bienvenida");
  if (!splash || !enterButton || !firstSection) return;

  enterButton.addEventListener("click", async () => {
    await startBackgroundAudio();
    splash.classList.add("is-leaving");
    document.body.classList.remove("splash-active");

    setTimeout(() => {
      firstSection.scrollIntoView({ behavior: "smooth", block: "start" });
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

applyEditableContent();
renderGallery();
updateCountdown();
setupModal();
setupSplash();
setupWelcomeReveal();
setupCountdownReveal();
setupDateReveal();
setupDressReveal();
setupMusicReveal();

document.querySelector("#calendarButton").addEventListener("click", downloadCalendarEvent);
document.querySelector("#copyAlias")?.addEventListener("click", copyAlias);
setInterval(updateCountdown, 1000);
