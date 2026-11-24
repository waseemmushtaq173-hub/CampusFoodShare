/* Easy mode: picture-first screens, English / Hindi / Kannada, read-aloud, tap-only flows */
const I18N = {
  en: {
    startTitle: 'What do you want to do?', needFood: 'I NEED FOOD', needFoodSub: 'See free food near you', giveFood: 'I HAVE FOOD TO GIVE', giveFoodSub: 'Tell hungry people now',
    helpOut: 'I WANT TO HELP', helpOutSub: 'Volunteer or NGO', freeFood: 'Free food near you', meals: 'meals', km: 'km', min: 'min walk', hurry: 'Hurry', left: 'left',
    takeMe: 'Take me there', call: 'Call', askFood: 'Nobody near me? Ask for food', howMany: 'How many people need food?', phoneOpt: 'Your phone number (optional)', sendReq: 'SEND',
    thanks: 'Thank you! Help is on the way.', thanksSub: 'NGOs and volunteers near you have been told.', noFood: 'No free food right now. Tap the red button to ask for help.',
    allowLoc: 'Tap here to allow your location', usingLoc: 'Using your location', places: 'places with free food', seeThem: 'See them',
    g1: 'What food do you have?', g2: 'How many people can eat?', g3: 'How long is the food good for?', g4: 'Is the food safe? Tick all 4', g5: 'Where can they collect it?',
    sendFood: 'SEND - TELL NGOs NOW', back: 'Back', people: 'people', hours: 'hours', c1: 'Cooked today', c2: 'Clean boxes', c3: 'Smells fresh', c4: 'Labelled',
    doneGive: 'Done! NGOs are being told.', giveMore: 'Give more food', signFirst: 'Please sign in as a donor first', signIn: 'Sign in', whereHint: 'Example: Hostel gate',
    reqTitle: 'People who need food', iHelped: 'I helped', directions: 'Directions', noReq: 'Nobody is waiting right now. Thank you for checking!', ago: 'ago',
    f1: 'Rice & Dal', f2: 'Roti & Sabzi', f3: 'Biryani', f4: 'Bakery / Snacks', next: 'Next', easy: 'Easy mode', peopleWaiting: 'people waiting for food',
    nav_start: 'Start Here', nav_need: 'Find Food', nav_give: 'Give Food (Easy)', nav_requests: 'People Needing Food',
  },
  hi: {
    startTitle: 'आप क्या करना चाहते हैं?', needFood: 'मुझे खाना चाहिए', needFoodSub: 'आसपास मुफ़्त खाना देखें', giveFood: 'मेरे पास देने के लिए खाना है', giveFoodSub: 'भूखे लोगों को अभी बताएँ',
    helpOut: 'मैं मदद करना चाहता हूँ', helpOutSub: 'स्वयंसेवक या संस्था', freeFood: 'आपके पास मुफ़्त खाना', meals: 'खाने', km: 'कि.मी.', min: 'मिनट पैदल', hurry: 'जल्दी करें', left: 'बचे हैं',
    takeMe: 'मुझे वहाँ ले चलो', call: 'फ़ोन करें', askFood: 'पास में कुछ नहीं? खाना माँगें', howMany: 'कितने लोगों को खाना चाहिए?', phoneOpt: 'आपका फ़ोन नंबर (ज़रूरी नहीं)', sendReq: 'भेजें',
    thanks: 'धन्यवाद! मदद आ रही है।', thanksSub: 'आपके पास के स्वयंसेवकों को बता दिया गया है।', noFood: 'अभी कोई मुफ़्त खाना नहीं है। मदद के लिए लाल बटन दबाएँ।',
    allowLoc: 'अपनी जगह की अनुमति देने के लिए यहाँ दबाएँ', usingLoc: 'आपकी जगह इस्तेमाल हो रही है', places: 'जगह जहाँ मुफ़्त खाना है', seeThem: 'देखें',
    g1: 'कौन सा खाना है?', g2: 'कितने लोग खा सकते हैं?', g3: 'खाना कितनी देर तक ठीक है?', g4: 'क्या खाना सुरक्षित है? चारों पर निशान लगाएँ', g5: 'खाना कहाँ से मिलेगा?',
    sendFood: 'भेजें - संस्थाओं को अभी बताएँ', back: 'पीछे', people: 'लोग', hours: 'घंटे', c1: 'आज बना है', c2: 'साफ़ डिब्बे', c3: 'ताज़ी खुशबू', c4: 'लेबल लगा है',
    doneGive: 'हो गया! संस्थाओं को बता दिया गया है।', giveMore: 'और खाना दें', signFirst: 'पहले दाता के रूप में साइन इन करें', signIn: 'साइन इन', whereHint: 'जैसे: हॉस्टल का गेट',
    reqTitle: 'खाना चाहने वाले लोग', iHelped: 'मैंने मदद की', directions: 'रास्ता', noReq: 'अभी कोई इंतज़ार में नहीं है। देखने के लिए धन्यवाद!', ago: 'पहले',
    f1: 'चावल-दाल', f2: 'रोटी-सब्ज़ी', f3: 'बिरयानी', f4: 'बेकरी / नाश्ता', next: 'आगे', easy: 'आसान मोड', peopleWaiting: 'लोग खाने का इंतज़ार कर रहे हैं',
    nav_start: 'यहाँ से शुरू करें', nav_need: 'खाना चाहिए', nav_give: 'खाना दें', nav_requests: 'भूखे लोग', nav_overview: 'होम', nav_explore: 'नक्शा', nav_insights: 'आँकड़े', nav_roadmap: 'आगे की योजना',
    nav_dashboard: 'डैशबोर्ड', nav_post: 'खाना पोस्ट करें', nav_mylistings: 'मेरे पोस्ट', nav_pickups: 'मेरे पिकअप', nav_moderation: 'सभी पोस्ट', nav_users: 'उपयोगकर्ता',
  },
  kn: {
    startTitle: 'ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?', needFood: 'ನನಗೆ ಊಟ ಬೇಕು', needFoodSub: 'ಹತ್ತಿರದ ಉಚಿತ ಊಟ ನೋಡಿ', giveFood: 'ನನ್ನ ಬಳಿ ಕೊಡಲು ಊಟವಿದೆ', giveFoodSub: 'ಹಸಿದವರಿಗೆ ಈಗಲೇ ತಿಳಿಸಿ',
    helpOut: 'ನಾನು ಸಹಾಯ ಮಾಡಲು ಬಯಸುತ್ತೇನೆ', helpOutSub: 'ಸ್ವಯಂಸೇವಕ ಅಥವಾ ಸಂಸ್ಥೆ', freeFood: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಉಚಿತ ಊಟ', meals: 'ಊಟ', km: 'ಕಿ.ಮೀ', min: 'ನಿಮಿಷ ನಡಿಗೆ', hurry: 'ಬೇಗ ಮಾಡಿ', left: 'ಉಳಿದಿದೆ',
    takeMe: 'ನನ್ನನ್ನು ಅಲ್ಲಿಗೆ ಕರೆದುಕೊಂಡು ಹೋಗಿ', call: 'ಕರೆ ಮಾಡಿ', askFood: 'ಹತ್ತಿರ ಏನೂ ಇಲ್ಲವೇ? ಊಟ ಕೇಳಿ', howMany: 'ಎಷ್ಟು ಜನರಿಗೆ ಊಟ ಬೇಕು?', phoneOpt: 'ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ)', sendReq: 'ಕಳುಹಿಸಿ',
    thanks: 'ಧನ್ಯವಾದ! ಸಹಾಯ ಬರುತ್ತಿದೆ.', thanksSub: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಸ್ವಯಂಸೇವಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.', noFood: 'ಈಗ ಉಚಿತ ಊಟ ಇಲ್ಲ. ಸಹಾಯಕ್ಕಾಗಿ ಕೆಂಪು ಬಟನ್ ಒತ್ತಿ.',
    allowLoc: 'ನಿಮ್ಮ ಸ್ಥಳದ ಅನುಮತಿ ನೀಡಲು ಇಲ್ಲಿ ಒತ್ತಿ', usingLoc: 'ನಿಮ್ಮ ಸ್ಥಳ ಬಳಸಲಾಗುತ್ತಿದೆ', places: 'ಉಚಿತ ಊಟ ಇರುವ ಸ್ಥಳಗಳು', seeThem: 'ನೋಡಿ',
    g1: 'ಯಾವ ಊಟ ಇದೆ?', g2: 'ಎಷ್ಟು ಜನ ತಿನ್ನಬಹುದು?', g3: 'ಊಟ ಎಷ್ಟು ಹೊತ್ತು ಚೆನ್ನಾಗಿರುತ್ತದೆ?', g4: 'ಊಟ ಸುರಕ್ಷಿತವೇ? ನಾಲ್ಕಕ್ಕೂ ಟಿಕ್ ಮಾಡಿ', g5: 'ಊಟ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?',
    sendFood: 'ಕಳುಹಿಸಿ - ಸಂಸ್ಥೆಗಳಿಗೆ ಈಗಲೇ ತಿಳಿಸಿ', back: 'ಹಿಂದೆ', people: 'ಜನ', hours: 'ಗಂಟೆ', c1: 'ಇಂದು ಮಾಡಿದ್ದು', c2: 'ಶುದ್ಧ ಡಬ್ಬಿಗಳು', c3: 'ತಾಜಾ ವಾಸನೆ', c4: 'ಲೇಬಲ್ ಇದೆ',
    doneGive: 'ಆಯಿತು! ಸಂಸ್ಥೆಗಳಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.', giveMore: 'ಇನ್ನಷ್ಟು ಊಟ ಕೊಡಿ', signFirst: 'ಮೊದಲು ದಾನಿಯಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಿ', signIn: 'ಸೈನ್ ಇನ್', whereHint: 'ಉದಾ: ಹಾಸ್ಟೆಲ್ ಗೇಟ್',
    reqTitle: 'ಊಟ ಬೇಕಾದ ಜನರು', iHelped: 'ನಾನು ಸಹಾಯ ಮಾಡಿದೆ', directions: 'ದಾರಿ', noReq: 'ಈಗ ಯಾರೂ ಕಾಯುತ್ತಿಲ್ಲ. ನೋಡಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದ!', ago: 'ಹಿಂದೆ',
    f1: 'ಅನ್ನ-ಸಾರು', f2: 'ರೊಟ್ಟಿ-ಪಲ್ಯ', f3: 'ಬಿರಿಯಾನಿ', f4: 'ಬೇಕರಿ / ತಿಂಡಿ', next: 'ಮುಂದೆ', easy: 'ಸುಲಭ ಮೋಡ್', peopleWaiting: 'ಜನ ಊಟಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದ್ದಾರೆ',
    nav_start: 'ಇಲ್ಲಿಂದ ಪ್ರಾರಂಭಿಸಿ', nav_need: 'ಊಟ ಬೇಕು', nav_give: 'ಊಟ ಕೊಡಿ', nav_requests: 'ಹಸಿದ ಜನರು', nav_overview: 'ಮುಖಪುಟ', nav_explore: 'ನಕ್ಷೆ', nav_insights: 'ಅಂಕಿಅಂಶ', nav_roadmap: 'ಮುಂದಿನ ಯೋಜನೆ',
    nav_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', nav_post: 'ಊಟ ಪೋಸ್ಟ್ ಮಾಡಿ', nav_mylistings: 'ನನ್ನ ಪೋಸ್ಟ್', nav_pickups: 'ನನ್ನ ಪಿಕಪ್', nav_moderation: 'ಎಲ್ಲಾ ಪೋಸ್ಟ್', nav_users: 'ಬಳಕೆದಾರರು',
  },
};
const VOICE_LANG = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
let lang = 'en';
try { lang = localStorage.getItem('cf_lang') || 'en'; } catch (e) { /* ignore */ }
if (!I18N[lang]) lang = 'en';
const t = (k) => (I18N[lang] && I18N[lang][k]) || I18N.en[k] || k;
const navLabel = (id, label) => (I18N[lang] && I18N[lang]['nav_' + id]) || (lang === 'en' ? I18N.en['nav_' + id] : null) || label;
let afterLogin = '';
function landingAfterLogin(role) {
  const want = afterLogin; afterLogin = '';
  return want && NAV[role].some((n) => n[0] === want) ? want : 'dashboard';
}

/* ── language, voice, easy mode ── */
function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('langSelect').value = lang;
  document.querySelectorAll('.lang-chip').forEach((c) => c.classList.toggle('active', c.dataset.lang === lang));
  $('easyBtn').textContent = t('easy');
}
function setLang(l) {
  lang = I18N[l] ? l : 'en';
  try { localStorage.setItem('cf_lang', lang); } catch (e) { /* ignore */ }
  applyLang();
  updateAuthUI(); // re-renders the menu and the open page in the new language
}
function speak(text) {
  if (!('speechSynthesis' in window)) return showToast('Voice is not supported in this browser');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = VOICE_LANG[lang]; u.rate = 0.9;
  const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
function setEasy(on) {
  document.body.classList.toggle('easy', on);
  $('easyBtn').setAttribute('aria-pressed', String(on));
  $('easyBtn').classList.toggle('active', on);
  try { localStorage.setItem('cf_easy', on ? '1' : '0'); } catch (e) { /* ignore */ }
}

/* ── Start screen ── */
async function loadStart() {
  const r = await api(`/api/listings?status=posted&${locQuery()}`);
  if (!r.ok) return;
  const list = r.data.listings;
  const meals = list.reduce((s, l) => s + Number(l.quantityMeals || 0), 0);
  $('startLive').innerHTML = list.length
    ? `<span class="live-dot"></span><b>${meals}</b> ${esc(t('meals'))} · <b>${list.length}</b> ${esc(t('places'))} <button class="big-btn mini-go" data-tile="need">${esc(t('seeThem'))} ▶</button>`
    : esc(t('noFood'));
}

/* ── Find food (no sign-in needed) ── */
const DIET = { Veg: ['🍛', '#22c55e'], 'Non-Veg': ['🍗', '#ef4444'], Vegan: ['🥗', '#14b8a6'], Bakery: ['🥐', '#f59e0b'] };
const walkMins = (km) => Math.max(1, Math.round((km / 5) * 60));

async function loadNeed() {
  const note = $('needLoc');
  if (gpsBlocked) {
    note.className = 'big-note bad';
    note.innerHTML = `<button class="big-btn" data-loc="1">📍 ${esc(t('allowLoc'))}</button>`;
  } else {
    note.className = `big-note ${watchId !== null && gpsAcc ? 'good' : 'wait'}`;
    note.textContent = `📍 ${t('usingLoc')}${gpsAcc ? ` (±${Math.round(gpsAcc)} m)` : ''}`;
  }
  const r = await api(`/api/listings?status=posted&${locQuery()}`);
  if (!r.ok) return;
  const list = r.data.listings.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
  $('needList').innerHTML = list.map((l) => {
    const [emo, col] = DIET[l.foodType] || DIET.Veg;
    const mins = walkMins(l.distanceKm);
    const nav = `https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}&travelmode=walking&origin=${ngoLocation.lat},${ngoLocation.lng}`;
    const phone = String(l.donorPhone || '').replace(/[^\d+]/g, '');
    const say = `${l.foodTitle}. ${l.quantityMeals} ${t('meals')}. ${l.distanceKm} ${t('km')}. ${mins} ${t('min')}.`;
    return `<div class="need-card">
      <div class="need-emo" style="border-color:${col}">${emo}<i style="background:${col}" title="${esc(l.foodType)}"></i></div>
      <div class="need-main"><h3>${esc(l.foodTitle)}</h3><div class="need-sub">${esc(l.donorName)}</div>
        <div class="need-meta"><span class="pill">🍽️ ${esc(l.quantityMeals)} ${esc(t('meals'))}</span><span class="pill">📍 ${esc(l.distanceKm)} ${esc(t('km'))} · 🚶 ${mins} ${esc(t('min'))}</span><span class="pill timer" data-exp2="${esc(l.useBefore)}"></span></div></div>
      <div class="need-actions"><a class="big-btn go" target="_blank" rel="noopener" href="${nav}">📍 ${esc(t('takeMe'))}</a>${phone ? `<a class="big-btn call" href="tel:${esc(phone)}">📞 ${esc(t('call'))}</a>` : ''}<span class="big-btn say speak" role="button" tabindex="0" data-speak-text="${esc(say)}" title="Listen">🔊</span></div>
    </div>`;
  }).join('') || `<div class="big-note wait">${esc(t('noFood'))}</div>`;
  tickExp2();
}
function tickExp2() {
  document.querySelectorAll('[data-exp2]').forEach((el) => {
    const ms = new Date(el.dataset.exp2) - Date.now();
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    el.textContent = ms <= 0 ? '⏳ 0' : `⏳ ${h > 0 ? `${h}h ` : ''}${m}m ${t('left')}`;
    el.classList.toggle('urgent', ms > 0 && ms < 3600000);
  });
}

/* ── Ask for food ── */
let reqPeople = 1;
function openReq() {
  reqPeople = 1;
  document.querySelectorAll('#reqPeople .num-btn').forEach((b) => b.classList.toggle('active', b.dataset.people === '1'));
  $('reqDone').style.display = 'none'; $('reqForm').style.display = 'block';
  $('reqModal').classList.add('active');
}
async function sendReq() {
  const r = await api('/api/requests', { method: 'POST', body: { people: reqPeople, phone: $('reqPhone').value, lat: ngoLocation.lat, lng: ngoLocation.lng } });
  if (!r.ok) return showToast(r.data.error || 'Could not send. Please try again.');
  $('reqForm').style.display = 'none'; $('reqDone').style.display = 'block';
  speak(`${t('thanks')} ${t('thanksSub')}`);
}

/* ── Give food wizard ── */
const FOODS = [['🍛', 'f1', 'Steamed Rice, Dal Tadka & Veg Curry', 'Veg'], ['🫓', 'f2', 'Chapati, Sabzi & Jeera Rice', 'Veg'], ['🥘', 'f3', 'Biryani & Raita', 'Non-Veg'], ['🥐', 'f4', 'Bakery & Snacks Packs', 'Bakery']];
const MEAL_CHOICES = [10, 25, 50, 100, 200];
const HOUR_CHOICES = [[1.5, '1½'], [2.5, '2½'], [4, '4']];
const CHECKS = [['c1', '🔥'], ['c2', '🥡'], ['c3', '👃'], ['c4', '🏷️']];
function newGive() { return { step: 1, food: null, meals: null, hours: null, checks: [false, false, false, false], done: false, sending: false }; }
let give = newGive();

function renderGive() {
  const el = $('giveBody');
  if (!currentUser || !['donor', 'admin'].includes(currentUser.role)) {
    el.innerHTML = `<div class="big-note bad">${esc(t('signFirst'))}</div><button class="big-cta cta-green" data-tile="give"><span class="emo">🔑</span><b>${esc(t('signIn'))}</b></button>`;
    return;
  }
  if (give.done) {
    el.innerHTML = `<div class="req-done"><div class="emo">✅</div><h3>${esc(t('doneGive'))}</h3><button class="big-cta cta-green" data-give="again"><span class="emo">🎁</span><b>${esc(t('giveMore'))}</b></button></div>`;
    return;
  }
  const s = give.step;
  const dots = [1, 2, 3, 4, 5].map((n) => `<i class="${n < s ? 'done' : n === s ? 'now' : ''}"></i>`).join('');
  let body = '';
  if (s === 1) body = `<div class="choice-grid">${FOODS.map((f, i) => `<button class="choice ${give.food === i ? 'on' : ''}" data-give="food" data-i="${i}"><span class="emo">${f[0]}</span><b>${esc(t(f[1]))}</b></button>`).join('')}</div>`;
  if (s === 2) body = `<div class="choice-grid">${MEAL_CHOICES.map((n) => `<button class="choice ${give.meals === n ? 'on' : ''}" data-give="meals" data-v="${n}"><span class="emo">👥</span><b>${n}</b><small>${esc(t('people'))}</small></button>`).join('')}</div>`;
  if (s === 3) body = `<div class="choice-grid">${HOUR_CHOICES.map(([v, label]) => `<button class="choice ${give.hours === v ? 'on' : ''}" data-give="hours" data-v="${v}"><span class="emo">⏱️</span><b>${label}</b><small>${esc(t('hours'))}</small></button>`).join('')}</div>`;
  if (s === 4) {
    body = `<div class="choice-grid">${CHECKS.map(([k, emo], i) => `<button class="choice ${give.checks[i] ? 'on' : ''}" data-give="check" data-i="${i}"><span class="emo">${emo}</span><b>${esc(t(k))}</b><small>${give.checks[i] ? '✔' : '☐'}</small></button>`).join('')}</div>`;
    if (give.checks.every(Boolean)) body += `<button class="big-cta cta-green" data-give="next"><span class="emo">▶</span><b>${esc(t('next'))}</b></button>`;
  }
  if (s === 5) {
    body = `<label for="giveWhere">${esc(t('whereHint'))}</label><input id="giveWhere" class="input big" value="${esc((currentUser.organization || '') + '')}" />
      <div class="big-note ${gpsAcc ? 'good' : 'wait'}">📍 ${esc(t('usingLoc'))}${gpsAcc ? ` (±${Math.round(gpsAcc)} m)` : ''}</div>
      <button class="big-cta cta-green" data-give="send"><span class="emo">🚀</span><b>${esc(t('sendFood'))}</b></button>`;
  }
  el.innerHTML = `<div class="dots">${dots}</div>
    <div class="start-head"><h2>${esc(t('g' + s))}</h2><span class="speak" role="button" tabindex="0" data-speak="g${s}" title="Listen">🔊</span></div>
    ${body}${s > 1 ? `<button class="big-btn back" data-give="back">◀ ${esc(t('back'))}</button>` : ''}`;
}
async function sendGive() {
  if (give.sending) return;
  give.sending = true;
  const f = FOODS[give.food];
  const r = await api('/api/listings', { method: 'POST', body: {
    donorName: currentUser.organization || currentUser.name, donorPhone: currentUser.phone || '', foodType: f[3], foodTitle: f[2], quantityMeals: give.meals,
    useBefore: new Date(Date.now() + give.hours * 3600000).toISOString(), safetyChecklistConfirmed: true,
    checklistItems: ['temp_control', 'hygienic_containers', 'no_spoilage', 'allergen_labeled'],
    location: { address: ($('giveWhere') && $('giveWhere').value) || 'My location (GPS)', lat: ngoLocation.lat, lng: ngoLocation.lng },
  } });
  give.sending = false;
  if (!r.ok) return showToast((r.data.details || [r.data.error || 'Could not send']).join(', '));
  lastOwnAction = Date.now();
  give.done = true; renderGive(); speak(t('doneGive'));
}
function giveClick(a, el) {
  if (a === 'food') { give.food = Number(el.dataset.i); give.step = 2; }
  else if (a === 'meals') { give.meals = Number(el.dataset.v); give.step = 3; }
  else if (a === 'hours') { give.hours = Number(el.dataset.v); give.step = 4; }
  else if (a === 'check') give.checks[Number(el.dataset.i)] = !give.checks[Number(el.dataset.i)];
  else if (a === 'next') give.step = 5;
  else if (a === 'back') give.step = Math.max(1, give.step - 1);
  else if (a === 'again') give = newGive();
  else if (a === 'send') return sendGive();
  renderGive();
}

/* ── People asking for food (NGO / volunteer / admin) ── */
function requestCard(r) {
  const nav = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}&origin=${ngoLocation.lat},${ngoLocation.lng}`;
  const phone = String(r.phone || '').replace(/[^\d+]/g, '');
  return `<div class="need-card"><div class="need-emo" style="border-color:#ef4444">🙋</div>
    <div class="need-main"><h3>${esc(r.people)} ${esc(t('people'))}</h3><div class="need-meta"><span class="pill">📍 ${esc(r.distanceKm.toFixed(2))} ${esc(t('km'))}</span><span class="pill">🕒 ${esc(timeAgo(r.createdAt))}</span>${phone ? `<span class="pill">📞 ${esc(r.phone)}</span>` : ''}</div></div>
    <div class="need-actions"><a class="big-btn go" target="_blank" rel="noopener" href="${nav}">📍 ${esc(t('directions'))}</a>${phone ? `<a class="big-btn call" href="tel:${esc(phone)}">📞 ${esc(t('call'))}</a>` : ''}<button class="big-btn done" data-help="${esc(r.id)}">✅ ${esc(t('iHelped'))}</button></div></div>`;
}
async function loadRequests() {
  const r = await api(`/api/requests?${locQuery()}`);
  if (!r.ok) return;
  $('requestsList').innerHTML = r.data.requests.map(requestCard).join('') || `<div class="big-note wait">${esc(t('noReq'))}</div>`;
}
async function loadNeedsPanel() {
  const r = await api(`/api/requests?${locQuery()}`);
  const body = $('dashboardBody');
  const old = document.getElementById('needsPanel'); if (old) old.remove();
  if (!r.ok || !body || !r.data.requests.length) return;
  const div = document.createElement('div');
  div.id = 'needsPanel'; div.className = 'glass panel needs-panel';
  div.innerHTML = `<div class="panel-head"><div><h2>🙋 ${esc(r.data.peopleWaiting)} ${esc(t('peopleWaiting'))}</h2><p class="muted">${esc(t('reqTitle'))}</p></div><button class="btn btn-primary btn-sm" data-go="requests">${esc(t('seeThem'))}</button></div><div class="need-list">${r.data.requests.slice(0, 3).map(requestCard).join('')}</div>`;
  body.appendChild(div);
}

/* ── events ── */
document.addEventListener('click', (e) => {
  const sp = e.target.closest('[data-speak],[data-speak-text]');
  if (sp) { e.preventDefault(); e.stopPropagation(); speak(sp.dataset.speakText || t(sp.dataset.speak)); return; }
  const tile = e.target.closest('[data-tile]');
  if (tile) {
    const kind = tile.dataset.tile;
    if (kind === 'need') go('need');
    else if (kind === 'give') {
      if (currentUser && ['donor', 'admin'].includes(currentUser.role)) go('give');
      else { afterLogin = 'give'; showToast(t('signFirst')); openAuth('signin', 'donor'); }
    } else if (kind === 'help') {
      if (currentUser && ['ngo', 'volunteer', 'admin'].includes(currentUser.role)) go('dashboard');
      else { afterLogin = 'dashboard'; openAuth('signin', 'volunteer'); }
    }
    return;
  }
  const g = e.target.closest('[data-give]'); if (g) return giveClick(g.dataset.give, g);
  if (e.target.closest('[data-ask]')) return openReq();
  const pn = e.target.closest('#reqPeople .num-btn');
  if (pn) { reqPeople = Number(pn.dataset.people); document.querySelectorAll('#reqPeople .num-btn').forEach((b) => b.classList.toggle('active', b === pn)); return; }
  if (e.target.closest('#reqSend')) return sendReq();
  if (e.target.closest('[data-loc]')) { gpsBlocked = false; startLiveGps(); return; }
  const lc = e.target.closest('[data-lang]'); if (lc) return setLang(lc.dataset.lang);
  const hp = e.target.closest('[data-help]');
  if (hp) {
    api(`/api/requests/${encodeURIComponent(hp.dataset.help)}/help`, { method: 'POST', body: {} }).then((r) => { showToast(r.ok ? '✅' : (r.data.error || 'Failed')); refreshCurrent(); });
  }
}, true);

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"].speak')) { e.preventDefault(); e.target.click(); }
});

document.addEventListener('DOMContentLoaded', () => {
  $('closeReqBtn').innerHTML = ic('x');
  $('closeReqBtn').addEventListener('click', () => $('reqModal').classList.remove('active'));
  $('langSelect').addEventListener('change', (e) => setLang(e.target.value));
  $('easyBtn').addEventListener('click', () => setEasy(!document.body.classList.contains('easy')));
  let easy = true; // on by default; remembered after the first choice
  try { const saved = localStorage.getItem('cf_easy'); if (saved !== null) easy = saved === '1'; } catch (e) { /* ignore */ }
  setEasy(easy);
  applyLang();
  setInterval(tickExp2, 30000);
});
