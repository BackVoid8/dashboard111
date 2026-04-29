const STORAGE_KEY = "obsidian-dashboard-v1";

class DashboardApp {
  constructor() {
    this.state = {
      clock: { showSeconds: true, use24h: false },
      accent: "#7f5af0",
      notes: "",
      countdowns: [
        { id: crypto.randomUUID(), name: "Days Until Graduation", date: "2026-12-15" },
      ],
      layout: [],
      events: [
        { title: "Design Review", date: "2026-05-02" },
        { title: "Weekend Trip", date: "2026-05-10" },
      ],
      calendarOffset: 0,
      weather: { temp: 72, condition: "Partly Cloudy", hi: 77, lo: 64, icon: "⛅" },
      location: { lat: 37.7749, lon: -122.4194 },
    };
    this.loadState();
    this.bindUI();
    this.initDragAndDrop();
    this.renderAll();
    this.startTickers();
  }

  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try { this.state = { ...this.state, ...JSON.parse(raw) }; } catch { /* ignore corrupt state */ }
  }

  saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); }

  bindUI() {
    document.querySelectorAll("[data-action='toggle-settings']").forEach(btn => {
      btn.onclick = () => document.getElementById(btn.dataset.target).classList.toggle("hidden");
    });
    const sec = document.getElementById("toggleSeconds");
    const use24 = document.getElementById("toggle24Hour");
    sec.checked = this.state.clock.showSeconds;
    use24.checked = this.state.clock.use24h;
    sec.onchange = () => { this.state.clock.showSeconds = sec.checked; this.saveState(); this.updateClock(); };
    use24.onchange = () => { this.state.clock.use24h = use24.checked; this.saveState(); this.updateClock(); };

    document.getElementById("prevMonth").onclick = () => { this.state.calendarOffset--; this.renderCalendar(); };
    document.getElementById("nextMonth").onclick = () => { this.state.calendarOffset++; this.renderCalendar(); };

    document.getElementById("addCountdown").onclick = () => this.upsertCountdown();
    document.getElementById("notes").value = this.state.notes;
    document.getElementById("notes").oninput = (e) => { this.state.notes = e.target.value; this.saveState(); };

    const accent = document.getElementById("accentColor");
    accent.value = this.state.accent;
    accent.oninput = () => { this.state.accent = accent.value; this.applyAccent(); this.saveState(); };
  }

  startTickers() {
    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  tick() {
    this.updateDate();
    this.updateClock();
    this.updateMidnightCountdown();
    this.updateSunData();
    this.renderCountdowns();
  }

  renderAll() {
    this.applyAccent();
    this.updateWeather();
    this.renderCalendar();
    this.renderCountdowns();
  }

  updateDate() {
    const now = new Date();
    dayName.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
    fullDate.textContent = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }

  updateClock() {
    const now = new Date();
    clockTime.textContent = now.toLocaleTimeString([], {
      hour: "2-digit", minute: "2-digit", second: this.state.clock.showSeconds ? "2-digit" : undefined,
      hour12: !this.state.clock.use24h,
    });
  }

  updateMidnightCountdown() {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = String(Math.floor(diff / 36e5)).padStart(2, "0");
    const m = String(Math.floor((diff % 36e5) / 6e4)).padStart(2, "0");
    const s = String(Math.floor((diff % 6e4) / 1000)).padStart(2, "0");
    midnightCountdown.textContent = `${h}:${m}:${s}`;
  }

  renderCalendar() {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + this.state.calendarOffset, 1);
    const month = target.getMonth(), year = target.getFullYear();
    calendarMonth.textContent = target.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    calendarGrid.innerHTML = "";
    ["S","M","T","W","T","F","S"].forEach(d => calendarGrid.append(this.dayCell(d, "header")));
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) calendarGrid.append(this.dayCell(""));
    for (let d = 1; d <= days; d++) {
      const isToday = d === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      calendarGrid.append(this.dayCell(String(d), isToday ? "today" : ""));
    }
    this.renderUpcomingEvents();
  }

  dayCell(text, cls = "") {
    const div = document.createElement("div");
    div.className = `day-cell ${cls}`.trim();
    div.textContent = text;
    return div;
  }

  renderUpcomingEvents() {
    const ul = document.getElementById("upcomingEvents");
    ul.innerHTML = "";
    const upcoming = [...this.state.events].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
    upcoming.forEach(e => {
      const li = document.createElement("li");
      li.textContent = `${new Date(e.date).toLocaleDateString()}: ${e.title}`;
      ul.append(li);
    });
  }

  updateWeather() {
    const w = this.state.weather;
    weatherIcon.textContent = w.icon;
    weatherTemp.textContent = `${w.temp}°F`;
    weatherCond.textContent = w.condition;
    weatherRange.textContent = `H: ${w.hi}° • L: ${w.lo}°`;
  }

  updateSunData() {
    const { lat } = this.state.location;
    const now = new Date();
    const day = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(now.getFullYear(), 0, 0)) / 86400000);
    const hour = now.getHours() + now.getMinutes() / 60;
    const decl = -23.44 * Math.cos(((360 / 365) * (day + 10)) * Math.PI / 180);
    const altitude = Math.asin(
      Math.sin(lat * Math.PI / 180) * Math.sin(decl * Math.PI / 180) +
      Math.cos(lat * Math.PI / 180) * Math.cos(decl * Math.PI / 180) * Math.cos((15 * (hour - 12)) * Math.PI / 180)
    ) * 180 / Math.PI;

    sunAngle.textContent = `Altitude: ${altitude.toFixed(1)}°`;
    sunriseSunset.textContent = `Sunrise: ~06:22 • Sunset: ~19:48`;
    goldenHour.textContent = `Golden Hour: ~05:45–06:30, ~19:15–20:00`;
  }

  upsertCountdown(existingId = null) {
    const current = this.state.countdowns.find(c => c.id === existingId);
    const name = prompt("Countdown name", current?.name || "");
    if (!name) return;
    const date = prompt("Target date (YYYY-MM-DD)", current?.date || new Date().toISOString().slice(0, 10));
    if (!date || Number.isNaN(new Date(date).getTime())) return;
    if (existingId) Object.assign(current, { name, date });
    else this.state.countdowns.push({ id: crypto.randomUUID(), name, date });
    this.saveState();
    this.renderCountdowns();
  }

  renderCountdowns() {
    const list = document.getElementById("countdownList");
    const tpl = document.getElementById("countdownItemTemplate");
    list.innerHTML = "";
    this.state.countdowns.forEach(item => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      node.querySelector(".event-name").textContent = item.name;
      node.querySelector(".event-date").textContent = new Date(item.date).toDateString();
      node.querySelector(".event-remaining").textContent = this.daysUntil(item.date);
      node.querySelector(".edit-btn").onclick = () => this.upsertCountdown(item.id);
      node.querySelector(".delete-btn").onclick = () => {
        this.state.countdowns = this.state.countdowns.filter(c => c.id !== item.id);
        this.saveState(); this.renderCountdowns();
      };
      list.append(node);
    });
  }

  daysUntil(dateStr) {
    const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const d = Math.ceil((target - now) / 86400000);
    return d >= 0 ? `${d} day${d === 1 ? "" : "s"}` : `${Math.abs(d)} days ago`;
  }

  applyAccent() { document.documentElement.style.setProperty("--accent", this.state.accent); }

  initDragAndDrop() {
    const dashboard = document.getElementById("dashboard");
    const savedOrder = this.state.layout;
    if (savedOrder?.length) {
      savedOrder.forEach(key => {
        const el = dashboard.querySelector(`[data-widget='${key}']`);
        if (el) dashboard.append(el);
      });
    }

    let dragged = null;
    dashboard.querySelectorAll(".widget").forEach(w => {
      w.draggable = true;
      w.addEventListener("dragstart", () => { dragged = w; w.classList.add("dragging"); });
      w.addEventListener("dragend", () => { w.classList.remove("dragging"); this.persistLayout(); });
      w.addEventListener("dragover", e => {
        e.preventDefault();
        if (!dragged || dragged === w) return;
        const rect = w.getBoundingClientRect();
        const after = (e.clientY - rect.top) / rect.height > 0.5;
        w.parentNode.insertBefore(dragged, after ? w.nextSibling : w);
      });
    });
  }

  persistLayout() {
    this.state.layout = [...document.querySelectorAll(".widget")].map(w => w.dataset.widget);
    this.saveState();
  }
}

document.addEventListener("DOMContentLoaded", () => new DashboardApp());
