const STORAGE_KEY = "obsidian-dashboard-v2";

class DashboardApp {
  constructor() {
    this.state = { clock:{showSeconds:true,use24h:false}, calendarOffset:0, events:[{title:"Design Review",date:"2026-05-02"}], gradDate:"2026-12-15", location:{lat:37.7749,lon:-122.4194}, layout:[] };
    this.loadState();
    this.bindUI();
    this.renderAll();
    setInterval(()=>this.tick(),1000);
    this.tick();
    this.fetchWeather();
  }
  loadState(){const raw=localStorage.getItem(STORAGE_KEY);if(raw) this.state={...this.state,...JSON.parse(raw)};}
  saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(this.state));}
  bindUI(){
    document.querySelector("[data-action='toggle-settings']").onclick=()=>clockSettings.classList.toggle("hidden");
    toggleSeconds.checked=this.state.clock.showSeconds; toggle24Hour.checked=this.state.clock.use24h;
    toggleSeconds.onchange=()=>{this.state.clock.showSeconds=toggleSeconds.checked;this.saveState();};
    toggle24Hour.onchange=()=>{this.state.clock.use24h=toggle24Hour.checked;this.saveState();};
    prevMonth.onclick=()=>{this.state.calendarOffset--;this.renderCalendar();}; nextMonth.onclick=()=>{this.state.calendarOffset++;this.renderCalendar();};
    gradDate.value=this.state.gradDate; gradDate.onchange=()=>{this.state.gradDate=gradDate.value; this.saveState(); this.updateGradCountdown();};
    fullscreenBtn.onclick=()=>this.toggleFullscreen();
  }
  renderAll(){this.renderCalendar();}
  tick(){this.updateDate();this.updateClock();this.updateSunData();this.updateMidnightCountdown();this.updateGradCountdown();}
  updateDate(){const n=new Date();dayName.textContent=n.toLocaleDateString(undefined,{weekday:"long"});fullDate.textContent=n.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"});}
  updateClock(){clockTime.textContent=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:this.state.clock.showSeconds?"2-digit":undefined,hour12:!this.state.clock.use24h});}
  updateMidnightCountdown(){const n=new Date(),m=new Date(n);m.setHours(24,0,0,0);const d=m-n;const h=String(Math.floor(d/36e5)).padStart(2,"0"),mm=String(Math.floor((d%36e5)/6e4)).padStart(2,"0"),s=String(Math.floor((d%6e4)/1000)).padStart(2,"0");midnightCountdown.textContent=`Until midnight: ${h}:${mm}:${s}`;}
  renderCalendar(){const now=new Date(),t=new Date(now.getFullYear(),now.getMonth()+this.state.calendarOffset,1),m=t.getMonth(),y=t.getFullYear();calendarMonth.textContent=t.toLocaleDateString(undefined,{month:"long",year:"numeric"});calendarGrid.innerHTML="";["S","M","T","W","T","F","S"].forEach(d=>calendarGrid.append(this.cell(d,"header")));for(let i=0;i<new Date(y,m,1).getDay();i++)calendarGrid.append(this.cell(""));for(let d=1;d<=new Date(y,m+1,0).getDate();d++){const today=d===now.getDate()&&m===now.getMonth()&&y===now.getFullYear();calendarGrid.append(this.cell(String(d),today?"today":""));}upcomingEvents.innerHTML="";this.state.events.forEach(e=>{const li=document.createElement("li");li.textContent=`${new Date(e.date).toLocaleDateString()}: ${e.title}`;upcomingEvents.append(li);});}
  cell(t,c=""){const el=document.createElement("div");el.className=`day-cell ${c}`.trim();el.textContent=t;return el;}
  updateGradCountdown(){if(!this.state.gradDate){gradCountdown.textContent="Set a date";return;}const target=new Date(this.state.gradDate);target.setHours(0,0,0,0);const now=new Date();now.setHours(0,0,0,0);const d=Math.ceil((target-now)/86400000);gradCountdown.textContent=d>=0?`${d} day${d===1?"":"s"}`:`${Math.abs(d)} days ago`;}
  toggleFullscreen(){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}
  sunTimes(dayOfYear){const seasonal=Math.sin(((dayOfYear-80)/365)*Math.PI*2);const sunrise=6.5-seasonal*1.2;const sunset=17.5+seasonal*1.2;return {sunrise,sunset};}
  fmtHour(h){const d=new Date();d.setHours(Math.floor(h),Math.round((h%1)*60),0,0);return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
  updateSunData(){const n=new Date();const day=Math.floor((Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())-Date.UTC(n.getFullYear(),0,0))/86400000);const hr=n.getHours()+n.getMinutes()/60;const lat=this.state.location.lat*Math.PI/180;const decl=-23.44*Math.cos(((360/365)*(day+10))*Math.PI/180)*Math.PI/180;const alt=Math.asin(Math.sin(lat)*Math.sin(decl)+Math.cos(lat)*Math.cos(decl)*Math.cos((15*(hr-12))*Math.PI/180))*180/Math.PI;const {sunrise,sunset}=this.sunTimes(day);sunAngle.textContent=`Altitude: ${alt.toFixed(1)}°`;sunriseSunset.textContent=`Sunrise: ${this.fmtHour(sunrise)} • Sunset: ${this.fmtHour(sunset)}`;goldenHour.textContent=`Golden Hour: ${this.fmtHour(sunrise-0.6)}–${this.fmtHour(sunrise+0.2)}, ${this.fmtHour(sunset-0.5)}–${this.fmtHour(sunset+0.3)}`;}
  async fetchWeather(){
    try{
      const {lat,lon}=this.state.location;
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto`;
      const r=await fetch(u); const j=await r.json();
      weatherTemp.textContent=`${Math.round(j.current.temperature_2m)}°F`;
      weatherCond.textContent=this.weatherCodeToText(j.current.weather_code);
      weatherRange.textContent=`H: ${Math.round(j.daily.temperature_2m_max[0])}° • L: ${Math.round(j.daily.temperature_2m_min[0])}°`;
      weatherIcon.textContent=this.weatherCodeToIcon(j.current.weather_code);
      weatherMeta.textContent=`Live via Open-Meteo • Updated ${new Date().toLocaleTimeString()}`;
    } catch { weatherCond.textContent="Weather unavailable"; weatherMeta.textContent="Check internet connection."; }
  }
  weatherCodeToText(code){if(code===0)return"Clear";if([1,2,3].includes(code))return"Cloudy";if([45,48].includes(code))return"Fog";if([51,53,55,61,63,65,80,81,82].includes(code))return"Rain";if([71,73,75,77,85,86].includes(code))return"Snow";if([95,96,99].includes(code))return"Storm";return"Unknown";}
  weatherCodeToIcon(code){if(code===0)return"☀️";if([1,2,3].includes(code))return"⛅";if([45,48].includes(code))return"🌫️";if([51,53,55,61,63,65,80,81,82].includes(code))return"🌧️";if([71,73,75,77,85,86].includes(code))return"❄️";if([95,96,99].includes(code))return"⛈️";return"☁️";}
}
document.addEventListener("DOMContentLoaded",()=>new DashboardApp());
