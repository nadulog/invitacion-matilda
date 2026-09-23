(function () {
  var SUPABASE_URL = "https://fotugzhxlajyjdnjteld.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvdHVnemh4bGFqeWpkbmp0ZWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNDY2MzAsImV4cCI6MjA4MDgyMjYzMH0.GnEzF-iJuiZJH5IVUgszWOq5qv4AeHfFf8Y3_YRW5FA";
  var RSVP_BASE = "https://bloomdate-rsvp.netlify.app";

  function formatNames(names) {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " y " + names[names.length - 1];
  }

  function revealGuestSection() {
    var guestSection = document.getElementById("invitados");
    if (!guestSection) return;
    guestSection.hidden = false;
    guestSection.setAttribute("aria-hidden", "false");
  }

  async function initInvitation() {
    var params = new URLSearchParams(window.location.search);
    var token = params.get("invite");
    if (!token) {
      if (params.get("preview") === "invitados") {
        var previewNames = document.getElementById("nombres-invitados");
        var previewPasses = document.getElementById("cantidad-lugares");
        if (previewNames) previewNames.textContent = "Nombre del invitado";
        if (previewPasses) previewPasses.textContent = "Tenés 2 lugares reservados";
        revealGuestSection();
      }
      return;
    }

    try {
      var response = await fetch(SUPABASE_URL + "/rest/v1/rpc/get_invite_by_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ p_token: token })
      });

      if (!response.ok) return;
      var rows = await response.json();
      var invite = rows && rows[0];
      if (!invite) return;

      var companions = invite.companions || [];
      var names = [invite.first_name].concat(
        companions.map(function (companion) { return companion.first_name; })
      ).filter(Boolean);
      if (!names.length) return;

      var namesEl = document.getElementById("nombres-invitados");
      if (namesEl) namesEl.textContent = formatNames(names);

      var totalPasses = 1 + companions.length;
      var passesEl = document.getElementById("cantidad-lugares");
      if (passesEl) {
        passesEl.textContent = "Tenés " + totalPasses + (totalPasses === 1 ? " lugar reservado" : " lugares reservados");
      }

      var confirmBtn = document.getElementById("boton-confirmar");
      if (confirmBtn && invite.event_slug) {
        confirmBtn.href = RSVP_BASE + "/r/" + encodeURIComponent(invite.event_slug) + "?invite=" + encodeURIComponent(token);
      }

      revealGuestSection();
    } catch (_error) {
      return;
    }
  }

  initInvitation();
})();
