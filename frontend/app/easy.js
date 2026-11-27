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
    nav_start: 'Start Here', nav_need: 'Find Food', nav_give: 'Give Food (Easy)', nav_requests: 'Food Requests',
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
Object.assign(I18N.en, {
  person: 'person', reqExpired: 'This request expired after 3 hours without a helper. Please call a helpline below, or ask again.', askAgain: 'Ask again', dismiss: 'Dismiss', expiredBadge: 'Expired',
  needFood: 'Find food', needFoodSub: 'Free food near you, with directions', giveFood: 'Donate food', giveFoodSub: 'Share leftovers in a few taps', helpOut: 'Volunteer', helpOutSub: 'Pick up and deliver for NGOs',
  freeFood: 'Free food near you', askFood: 'Nobody near me? Ask for food', sendReq: 'Send request', sendFood: 'Post this food now', takeMe: 'Directions', min: 'min walk',
  open: 'Open', kicker: 'Community food sharing', heroTitle: "Good food shouldn't go to waste.", heroSub: 'Campus kitchens and canteens share their surplus meals with people nearby, in minutes, while it is still fresh.',
  ctaFind: 'Find food near me', ctaGive: 'Donate surplus food', availNow: 'Available now', seeAll: 'See all', statMeals: 'Meals shared', statKg: 'Food rescued', statNow: 'Available now',
  howTitle: 'How it works', how1t: 'Surplus is posted', how1d: 'A mess or canteen lists leftover food and how long it stays safe.', how2t: 'Matched nearby', how2d: 'The most urgent food closest to you shows first, ranked by distance and expiry.',
  how3t: 'Verified handover', how3d: 'An NGO claims it and a 4-digit PIN confirms the pickup.', langLabel: 'Language', helplines: 'Helplines and community kitchens', helplinesSub: 'Call these directly if you need a meal today.',
  reqPrivacy: 'Your location and number are shared only with NGOs and volunteers who can help.', trackTitle: 'Your request', tr1: 'Request received', tr1d: 'NGOs and volunteers near you have been alerted.',
  tr2: 'A helper is on the way', tr2d: 'Waiting for someone nearby to accept. This usually takes a few minutes.', tr3: 'Help has arrived', tr3d: 'We hope the meal helps. Thank you for using CampusFoodShare.',
  cancelReq: 'Cancel request', noReqYet: 'You have not asked for food yet.', accept: 'I will help', meanwhile: 'Free food near you in the meantime', cancelled: 'This request was cancelled.', helperComing: 'is coming to help you',
  directions: 'Directions', call: 'Call', noFoodNear: 'No free food is listed near you right now. You can ask for help below or call a helpline.', peopleWaiting: 'people waiting for food', seeThem: 'See all',
  nav_start: 'Start Here', nav_need: 'Find Food', nav_track: 'My Request', nav_give: 'Donate Food', nav_requests: 'Food Requests',
});
Object.assign(I18N.hi, {
  person: 'व्यक्ति', reqExpired: 'किसी के न आने से यह अनुरोध 3 घंटे बाद समाप्त हो गया। नीचे हेल्पलाइन पर फ़ोन करें, या फिर से माँगें।', askAgain: 'फिर से माँगें', dismiss: 'हटाएँ', expiredBadge: 'समाप्त',
  needFood: 'खाना खोजें', needFoodSub: 'आसपास मुफ़्त खाना, रास्ते के साथ', giveFood: 'खाना दें', giveFoodSub: 'बचा हुआ खाना कुछ टैप में बाँटें', helpOut: 'स्वयंसेवक बनें', helpOutSub: 'संस्थाओं के लिए खाना पहुँचाएँ',
  freeFood: 'आपके पास मुफ़्त खाना', askFood: 'पास में कुछ नहीं? खाना माँगें', sendReq: 'अनुरोध भेजें', takeMe: 'रास्ता', open: 'खोलें', kicker: 'समुदाय में खाना बाँटें', heroTitle: 'अच्छा खाना बर्बाद नहीं होना चाहिए।',
  heroSub: 'कैंपस की रसोइयाँ और कैंटीन अपना बचा हुआ खाना आसपास के लोगों से मिनटों में साझा करते हैं, जब तक वह ताज़ा है।', ctaFind: 'मेरे पास खाना खोजें', ctaGive: 'बचा हुआ खाना दें', availNow: 'अभी उपलब्ध', seeAll: 'सब देखें',
  statMeals: 'खाने बाँटे गए', statKg: 'खाना बचाया', statNow: 'अभी उपलब्ध', howTitle: 'यह कैसे काम करता है', how1t: 'खाना पोस्ट होता है', how1d: 'रसोई या कैंटीन बचा हुआ खाना और उसकी समय-सीमा डालती है।',
  how2t: 'पास का मिलान', how2d: 'दूरी और समाप्ति समय के आधार पर सबसे ज़रूरी खाना सबसे ऊपर दिखता है।', how3t: 'सुरक्षित सुपुर्दगी', how3d: 'संस्था दावा करती है और 4 अंकों के पिन से लेना पक्का होता है।', langLabel: 'भाषा',
  helplines: 'हेल्पलाइन और सामुदायिक रसोई', helplinesSub: 'आज खाना चाहिए तो सीधे फ़ोन करें।', reqPrivacy: 'आपकी जगह और नंबर सिर्फ़ मदद कर सकने वाली संस्थाओं और स्वयंसेवकों को दिखता है।',
  trackTitle: 'आपका अनुरोध', tr1: 'अनुरोध मिल गया', tr1d: 'आपके पास की संस्थाओं और स्वयंसेवकों को बता दिया गया है।', tr2: 'कोई मदद के लिए आ रहा है', tr2d: 'आसपास कोई स्वीकार करे, इसका इंतज़ार है। इसमें कुछ मिनट लगते हैं।',
  tr3: 'मदद पहुँच गई', tr3d: 'उम्मीद है खाना काम आएगा। धन्यवाद।', cancelReq: 'अनुरोध रद्द करें', noReqYet: 'आपने अभी तक खाना नहीं माँगा है।', accept: 'मैं मदद करूँगा', meanwhile: 'तब तक आपके पास मुफ़्त खाना',
  cancelled: 'यह अनुरोध रद्द कर दिया गया।', helperComing: 'आपकी मदद के लिए आ रहे हैं', noFoodNear: 'अभी आपके पास कोई मुफ़्त खाना नहीं है। नीचे से मदद माँगें या हेल्पलाइन पर फ़ोन करें।',
  nav_track: 'मेरा अनुरोध',
});
Object.assign(I18N.kn, {
  person: 'ವ್ಯಕ್ತಿ', reqExpired: 'ಯಾರೂ ಬಾರದ ಕಾರಣ ಈ ವಿನಂತಿ 3 ಗಂಟೆಗಳ ನಂತರ ಮುಗಿದಿದೆ. ಕೆಳಗಿನ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ, ಅಥವಾ ಮತ್ತೆ ಕೇಳಿ.', askAgain: 'ಮತ್ತೆ ಕೇಳಿ', dismiss: 'ತೆಗೆದುಹಾಕಿ', expiredBadge: 'ಮುಗಿದಿದೆ',
  needFood: 'ಊಟ ಹುಡುಕಿ', needFoodSub: 'ಹತ್ತಿರದ ಉಚಿತ ಊಟ, ದಾರಿಯೊಂದಿಗೆ', giveFood: 'ಊಟ ಕೊಡಿ', giveFoodSub: 'ಉಳಿದ ಊಟವನ್ನು ಕೆಲವೇ ಟ್ಯಾಪ್‌ಗಳಲ್ಲಿ ಹಂಚಿ', helpOut: 'ಸ್ವಯಂಸೇವಕರಾಗಿ', helpOutSub: 'ಸಂಸ್ಥೆಗಳಿಗೆ ಊಟ ತಲುಪಿಸಿ',
  freeFood: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಉಚಿತ ಊಟ', askFood: 'ಹತ್ತಿರ ಏನೂ ಇಲ್ಲವೇ? ಊಟ ಕೇಳಿ', sendReq: 'ವಿನಂತಿ ಕಳುಹಿಸಿ', takeMe: 'ದಾರಿ', open: 'ತೆರೆಯಿರಿ', kicker: 'ಸಮುದಾಯದ ಊಟ ಹಂಚಿಕೆ', heroTitle: 'ಒಳ್ಳೆಯ ಊಟ ವ್ಯರ್ಥವಾಗಬಾರದು.',
  heroSub: 'ಕ್ಯಾಂಪಸ್ ಅಡುಗೆಮನೆ ಮತ್ತು ಕ್ಯಾಂಟೀನ್‌ಗಳು ಉಳಿದ ಊಟವನ್ನು ಹತ್ತಿರದ ಜನರೊಂದಿಗೆ ನಿಮಿಷಗಳಲ್ಲಿ ಹಂಚಿಕೊಳ್ಳುತ್ತವೆ, ಅದು ತಾಜಾ ಇರುವಾಗಲೇ.', ctaFind: 'ನನ್ನ ಹತ್ತಿರ ಊಟ ಹುಡುಕಿ', ctaGive: 'ಉಳಿದ ಊಟ ಕೊಡಿ', availNow: 'ಈಗ ಲಭ್ಯ', seeAll: 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
  statMeals: 'ಊಟ ಹಂಚಲಾಗಿದೆ', statKg: 'ಊಟ ಉಳಿಸಲಾಗಿದೆ', statNow: 'ಈಗ ಲಭ್ಯ', howTitle: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ', how1t: 'ಊಟ ಪೋಸ್ಟ್ ಆಗುತ್ತದೆ', how1d: 'ಅಡುಗೆಮನೆ ಅಥವಾ ಕ್ಯಾಂಟೀನ್ ಉಳಿದ ಊಟ ಮತ್ತು ಅದರ ಸಮಯ ಮಿತಿಯನ್ನು ಹಾಕುತ್ತದೆ.',
  how2t: 'ಹತ್ತಿರದ ಹೊಂದಾಣಿಕೆ', how2d: 'ದೂರ ಮತ್ತು ಮುಗಿಯುವ ಸಮಯದ ಆಧಾರದ ಮೇಲೆ ಅತ್ಯಂತ ತುರ್ತು ಊಟ ಮೇಲೆ ಕಾಣಿಸುತ್ತದೆ.', how3t: 'ಸುರಕ್ಷಿತ ಹಸ್ತಾಂತರ', how3d: 'ಸಂಸ್ಥೆ ಕ್ಲೈಮ್ ಮಾಡುತ್ತದೆ ಮತ್ತು 4 ಅಂಕಿಯ ಪಿನ್‌ನಿಂದ ಸಂಗ್ರಹಣೆ ದೃಢವಾಗುತ್ತದೆ.', langLabel: 'ಭಾಷೆ',
  helplines: 'ಸಹಾಯವಾಣಿ ಮತ್ತು ಸಮುದಾಯ ಅಡುಗೆಮನೆ', helplinesSub: 'ಇಂದು ಊಟ ಬೇಕಿದ್ದರೆ ನೇರವಾಗಿ ಕರೆ ಮಾಡಿ.', reqPrivacy: 'ನಿಮ್ಮ ಸ್ಥಳ ಮತ್ತು ಸಂಖ್ಯೆ ಸಹಾಯ ಮಾಡಬಲ್ಲ ಸಂಸ್ಥೆ ಮತ್ತು ಸ್ವಯಂಸೇವಕರಿಗೆ ಮಾತ್ರ ಕಾಣಿಸುತ್ತದೆ.',
  trackTitle: 'ನಿಮ್ಮ ವಿನಂತಿ', tr1: 'ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ', tr1d: 'ನಿಮ್ಮ ಹತ್ತಿರದ ಸಂಸ್ಥೆ ಮತ್ತು ಸ್ವಯಂಸೇವಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.', tr2: 'ಯಾರೋ ಸಹಾಯಕ್ಕೆ ಬರುತ್ತಿದ್ದಾರೆ', tr2d: 'ಹತ್ತಿರದ ಯಾರಾದರೂ ಒಪ್ಪಿಕೊಳ್ಳಲು ಕಾಯಲಾಗುತ್ತಿದೆ. ಕೆಲವು ನಿಮಿಷ ಬೇಕಾಗಬಹುದು.',
  tr3: 'ಸಹಾಯ ತಲುಪಿದೆ', tr3d: 'ಊಟ ಉಪಯೋಗವಾಗಲಿ ಎಂದು ಆಶಿಸುತ್ತೇವೆ. ಧನ್ಯವಾದ.', cancelReq: 'ವಿನಂತಿ ರದ್ದುಮಾಡಿ', noReqYet: 'ನೀವು ಇನ್ನೂ ಊಟ ಕೇಳಿಲ್ಲ.', accept: 'ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ', meanwhile: 'ಅಲ್ಲಿಯವರೆಗೆ ನಿಮ್ಮ ಹತ್ತಿರದ ಉಚಿತ ಊಟ',
  cancelled: 'ಈ ವಿನಂತಿಯನ್ನು ರದ್ದುಮಾಡಲಾಗಿದೆ.', helperComing: 'ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಬರುತ್ತಿದ್ದಾರೆ', noFoodNear: 'ಈಗ ನಿಮ್ಮ ಹತ್ತಿರ ಉಚಿತ ಊಟ ಇಲ್ಲ. ಕೆಳಗೆ ಸಹಾಯ ಕೇಳಿ ಅಥವಾ ಸಹಾಯವಾಣಿಗೆ ಕರೆ ಮಾಡಿ.',
  nav_track: 'ನನ್ನ ವಿನಂತಿ',
});
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

/* ── Landing ── */
async function loadStart() {
  const [imp, lst] = await Promise.all([api('/api/impact'), api(`/api/listings?status=posted&${locQuery()}`)]);
  if (imp.ok) {
    const m = imp.data.metrics;
    $('startStats').innerHTML = [[m.totalMealsSaved, t('statMeals')], [`${m.totalFoodRescuedKg} kg`, t('statKg')], [m.activeListingsCount, t('statNow')]]
      .map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('');
  }
  if (lst.ok) {
    const list = lst.data.listings.sort((x, y) => x.distanceKm - y.distanceKm).slice(0, 4);
    $('startNow').innerHTML = list.map((l) => `<div class="now-item"><div class="now-ico">${ic('utensils')}</div><div class="now-main"><strong>${esc(l.foodTitle)}</strong><span>${esc(l.donorName)} · ${esc(l.distanceKm)} ${esc(t('km'))}</span></div><span class="badge badge-timer" data-exp2="${esc(l.useBefore)}"></span></div>`).join('')
      || `<div class="empty">${esc(t('noFoodNear'))}</div>`;
    tickExp2();
  }
}

/* ── Find food (no sign-in needed) ── */
const DIET_DOT = { Veg: '#22a45d', 'Non-Veg': '#d0342c', Vegan: '#0f9d8a', Bakery: '#d98a1e' };
const walkMins = (km) => Math.max(1, Math.round((km / 5) * 60));

async function loadNeed() {
  const note = $('needLoc');
  if (gpsBlocked) {
    note.className = 'big-note bad';
    note.innerHTML = `${ic('pin')}<span>${esc(t('allowLoc'))}</span><button class="big-btn" data-loc="1" style="margin-left:auto;min-height:36px">${esc(t('seeThem') === '' ? 'Allow' : 'Allow')}</button>`;
  } else {
    note.className = `big-note ${watchId !== null && gpsAcc ? 'good' : 'wait'}`;
    note.innerHTML = `${ic('pin')}<span>${esc(t('usingLoc'))}${gpsAcc ? ` (±${Math.round(gpsAcc)} m)` : ''}</span>`;
  }
  const [r, dir] = await Promise.all([api(`/api/listings?status=posted&${locQuery()}`), api('/api/directory')]);
  if (r.ok) {
    const list = r.data.listings.sort((x, y) => x.distanceKm - y.distanceKm).slice(0, 10);
    $('needList').innerHTML = list.map((l) => {
      const mins = walkMins(l.distanceKm);
      const nav = `https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}&travelmode=walking&origin=${ngoLocation.lat},${ngoLocation.lng}`;
      const phone = String(l.donorPhone || '').replace(/[^\d+]/g, '');
      const say = `${l.foodTitle}. ${l.quantityMeals} ${t('meals')}. ${l.distanceKm} ${t('km')}. ${mins} ${t('min')}.`;
      return `<div class="need-card">
        <div class="need-emo">${ic('utensils')}<i style="background:${DIET_DOT[l.foodType] || DIET_DOT.Veg}" title="${esc(l.foodType)}"></i></div>
        <div class="need-main"><h3>${esc(l.foodTitle)}</h3><div class="need-sub">${esc(l.donorName)} · ${esc(l.location.address)}</div>
          <div class="need-meta"><span class="pill">${ic('users')}${esc(l.quantityMeals)} ${esc(t('meals'))}</span><span class="pill">${ic('pin')}${esc(l.distanceKm)} ${esc(t('km'))} · ${mins} ${esc(t('min'))}</span><span class="pill timer" data-exp2="${esc(l.useBefore)}"></span></div></div>
        <div class="need-actions"><a class="big-btn go" target="_blank" rel="noopener" href="${nav}">${ic('navigation')}${esc(t('takeMe'))}</a>${phone ? `<a class="big-btn call" href="tel:${esc(phone)}">${ic('phone')}${esc(t('call'))}</a>` : ''}<span class="big-btn say speak" role="button" tabindex="0" data-speak-text="${esc(say)}" title="Listen">${ic('volume')}</span></div>
      </div>`;
    }).join('') || `<div class="big-note wait">${esc(t('noFoodNear'))}</div>`;
    tickExp2();
  }
  if (dir.ok) {
    $('helplines').innerHTML = dir.data.directory.map((h) => {
      const ph = String(h.phone).replace(/[^\d+]/g, '');
      return `<div class="helpline"><div><strong>${esc(h.name)}</strong><span>${esc(h.area)} · ${esc(h.hours)}</span></div><a class="big-btn call" href="tel:${esc(ph)}">${ic('phone')}${esc(h.phone)}</a></div>`;
    }).join('');
  }
}
function tickExp2() {
  document.querySelectorAll('[data-exp2]').forEach((el) => {
    const ms = new Date(el.dataset.exp2) - Date.now();
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    el.textContent = ms <= 0 ? '0' : `${h > 0 ? `${h}h ` : ''}${m}m ${t('left')}`;
    el.classList.toggle('urgent', ms > 0 && ms < 3600000);
  });
}

/* ── Ask for food, then follow the request ── */
let reqPeople = 1;
function openReq() {
  reqPeople = 1;
  document.querySelectorAll('#reqPeople .num-btn').forEach((b) => b.classList.toggle('active', b.dataset.people === '1'));
  $('reqModal').classList.add('active');
}
async function sendReq() {
  const r = await api('/api/requests', { method: 'POST', body: { people: reqPeople, phone: $('reqPhone').value, lat: ngoLocation.lat, lng: ngoLocation.lng } });
  if (!r.ok) return showToast(r.data.error || 'Could not send. Please try again.');
  try { localStorage.setItem('cf_req', r.data.id); } catch (err) { /* ignore */ }
  updateAuthUI();
  $('reqModal').classList.remove('active'); $('reqPhone').value = '';
  showToast(t('tr1'));
  speak(`${t('tr1')}. ${t('tr1d')}`);
  go('track');
}
async function loadTrack() {
  const el = $('trackBody');
  let id = null; try { id = localStorage.getItem('cf_req'); } catch (err) { /* ignore */ }
  const empty = () => { el.innerHTML = `<div class="panel"><h2>${esc(t('trackTitle'))}</h2><p class="muted" style="margin:6px 0 14px">${esc(t('noReqYet'))}</p><button class="btn btn-primary" data-tile="need">${esc(t('ctaFind'))}</button></div>`; };
  if (!id) return empty();
  const r = await api(`/api/requests/${encodeURIComponent(id)}`);
  if (!r.ok) { try { localStorage.removeItem('cf_req'); } catch (err) { /* ignore */ } updateAuthUI(); return; }
  const q = r.data.request;
  const open = q.status === 'open', acc = q.status === 'accepted', helped = q.status === 'helped', cancelled = q.status === 'cancelled', expired = q.status === 'expired';
  const closed = cancelled || expired || helped;
  const dir = expired ? await api('/api/directory') : null;
  const step = (n, done, now, title, desc) => `<div class="track-step ${done ? 'done' : now ? 'now' : ''}"><span class="tdot">${done ? ic('check') : n}</span><div><h4>${esc(title)}</h4><p>${desc}</p></div></div>`;
  const hp = q.acceptedBy;
  const helperDesc = hp ? `<strong>${esc(hp.name)}</strong>${hp.org ? `, ${esc(hp.org)}` : ''} ${esc(t('helperComing'))}.${hp.phone ? ` <a href="tel:${esc(String(hp.phone).replace(/[^\d+]/g, ''))}">${esc(hp.phone)}</a>` : ''}` : esc(t('tr2d'));
  const lst = await api(`/api/listings?status=posted&${locQuery()}`);
  const near = lst.ok ? lst.data.listings.sort((x, y) => x.distanceKm - y.distanceKm).slice(0, 2) : [];
  el.innerHTML = `<div class="two-col"><div class="panel">
      <div class="panel-head"><div><h2>${esc(t('trackTitle'))}</h2><p class="muted">#${esc(q.id.slice(-6).toUpperCase())} · ${esc(q.people)} ${esc(q.people === 1 ? t('person') : t('people'))} · ${esc(timeAgo(q.createdAt))}</p></div>${expired ? `<span class="badge">${esc(t('expiredBadge'))}</span>` : cancelled ? '<span class="badge">Cancelled</span>' : helped ? '<span class="badge badge-posted">Helped</span>' : acc ? '<span class="badge badge-claimed">On the way</span>' : '<span class="badge badge-claimed">Waiting</span>'}</div>
      ${expired ? `<div class="big-note wait">${esc(t('reqExpired'))}</div><div>${dir && dir.ok ? dir.data.directory.map((h) => `<div class="helpline"><div><strong>${esc(h.name)}</strong><span>${esc(h.area)} · ${esc(h.hours)}</span></div><a class="big-btn call" href="tel:${esc(String(h.phone).replace(/[^\d+]/g, ''))}">${ic('phone')}${esc(h.phone)}</a></div>`).join('') : ''}</div>` : cancelled ? `<div class="big-note">${esc(t('cancelled'))}</div>` : `<div class="track-steps">${step(1, true, false, t('tr1'), esc(t('tr1d')))}${step(2, acc || helped, open, t('tr2'), helperDesc)}${step(3, helped, false, t('tr3'), esc(t('tr3d')))}</div>`}
      <div class="action-row" style="margin-top:6px">${(open || acc) ? `<button class="btn btn-danger" data-cancel-req="${esc(q.id)}">${esc(t('cancelReq'))}</button>` : `<button class="btn btn-primary" data-ask="1">${esc(t('askAgain'))}</button><button class="btn btn-ghost" data-dismiss-req="1">${esc(t('dismiss'))}</button>`}</div>
    </div>
    <div class="panel"><h2>${esc(t('meanwhile'))}</h2><div class="mini-list" style="margin-top:8px">${near.map((l) => `<div class="mini"><div><strong>${esc(l.foodTitle)}</strong><small>${esc(l.distanceKm)} ${esc(t('km'))} · ${walkMins(l.distanceKm)} ${esc(t('min'))}</small></div><div class="right"><a class="big-btn go" style="min-height:36px;padding:0 12px" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.location.lat},${l.location.lng}&travelmode=walking">${ic('navigation')}${esc(t('takeMe'))}</a></div></div>`).join('') || `<div class="empty">${esc(t('noFoodNear'))}</div>`}</div></div></div>`;
}

/* ── Donate food wizard ── */
const FOODS = [['utensils', 'f1', 'Steamed Rice, Dal Tadka & Veg Curry', 'Veg'], ['leaf', 'f2', 'Chapati, Sabzi & Jeera Rice', 'Veg'], ['flame', 'f3', 'Biryani & Raita', 'Non-Veg'], ['box', 'f4', 'Bakery & Snacks Packs', 'Bakery']];
const MEAL_CHOICES = [10, 25, 50, 100, 200];
const HOUR_CHOICES = [[1.5, '1½'], [2.5, '2½'], [4, '4']];
const CHECKS = [['c1', 'flame'], ['c2', 'box'], ['c3', 'leaf'], ['c4', 'tag']];
function newGive() { return { step: 1, food: null, meals: null, hours: null, checks: [false, false, false, false], done: false, sending: false }; }
let give = newGive();

function renderGive() {
  const el = $('giveBody');
  if (!currentUser || !['donor', 'admin'].includes(currentUser.role)) {
    el.innerHTML = `<div class="big-note bad">${esc(t('signFirst'))}</div><button class="big-cta cta-green" data-tile="give"><b>${esc(t('signIn'))}</b></button>`;
    return;
  }
  if (give.done) {
    el.innerHTML = `<div class="panel req-done"><div class="now-ico" style="margin:0 auto;width:60px;height:60px">${ic('check')}</div><h3>${esc(t('doneGive'))}</h3><div class="action-row" style="justify-content:center;margin-top:14px"><button class="btn btn-primary" data-give="again">${esc(t('giveMore'))}</button><button class="btn btn-ghost" data-go="mylistings">${esc(navLabel('mylistings', 'My Listings'))}</button></div></div>`;
    return;
  }
  const s = give.step;
  const dots = [1, 2, 3, 4, 5].map((n) => `<i class="${n < s ? 'done' : n === s ? 'now' : ''}"></i>`).join('');
  let body = '';
  const choice = (on, attrs, icon, big, small) => `<button class="choice ${on ? 'on' : ''}" ${attrs}><span class="ci">${ic(icon)}</span><b>${big}</b>${small ? `<small>${small}</small>` : ''}</button>`;
  if (s === 1) body = `<div class="choice-grid">${FOODS.map((f, i) => choice(give.food === i, `data-give="food" data-i="${i}"`, f[0], esc(t(f[1])), '')).join('')}</div>`;
  if (s === 2) body = `<div class="choice-grid">${MEAL_CHOICES.map((n) => choice(give.meals === n, `data-give="meals" data-v="${n}"`, 'users', n, esc(t('people')))).join('')}</div>`;
  if (s === 3) body = `<div class="choice-grid">${HOUR_CHOICES.map(([v, label]) => choice(give.hours === v, `data-give="hours" data-v="${v}"`, 'clock', label, esc(t('hours')))).join('')}</div>`;
  if (s === 4) {
    body = `<div class="choice-grid">${CHECKS.map(([k, icon], i) => choice(give.checks[i], `data-give="check" data-i="${i}"`, icon, esc(t(k)), give.checks[i] ? ic('check') : '')).join('')}</div>`;
    if (give.checks.every(Boolean)) body += `<button class="big-cta cta-green" data-give="next"><b>${esc(t('next'))}</b>${ic('arrow')}</button>`;
  }
  if (s === 5) {
    body = `<div class="panel"><label for="giveWhere">${esc(t('g5'))}</label><input id="giveWhere" class="input big" value="${esc(currentUser.organization || '')}" placeholder="${esc(t('whereHint'))}" />
      <div class="big-note ${gpsAcc ? 'good' : 'wait'}" style="margin:14px 0 0">${ic('pin')}<span>${esc(t('usingLoc'))}${gpsAcc ? ` (±${Math.round(gpsAcc)} m)` : ''}</span></div></div>
      <button class="big-cta cta-green" data-give="send">${ic('send')}<b>${esc(t('sendFood'))}</b></button>`;
  }
  el.innerHTML = `<div class="dots">${dots}</div>
    <div class="start-head"><h2>${esc(t('g' + s))}</h2><span class="speak" role="button" tabindex="0" data-speak="g${s}" title="Listen">${ic('volume')}</span></div>
    ${body}${s > 1 ? `<button class="big-btn back" data-give="back">${esc(t('back'))}</button>` : ''}`;
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
  give.done = true; renderGive();
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
  const accepted = r.status === 'accepted';
  const act = accepted ? `<button class="big-btn done" data-help="${esc(r.id)}">${ic('check')}${esc(t('iHelped'))}</button>` : `<button class="big-btn go" data-accept="${esc(r.id)}">${esc(t('accept'))}</button>`;
  return `<div class="need-card"><div class="need-emo">${ic('users')}</div>
    <div class="need-main"><h3>${esc(r.people)} ${esc(r.people === 1 ? t('person') : t('people'))}</h3><div class="need-meta"><span class="pill">${ic('pin')}${esc(r.distanceKm.toFixed(2))} ${esc(t('km'))}</span><span class="pill">${ic('clock')}${esc(timeAgo(r.createdAt))}</span>${phone ? `<span class="pill">${ic('phone')}${esc(r.phone)}</span>` : ''}${accepted ? `<span class="badge badge-claimed">${esc(r.acceptedBy ? r.acceptedBy.name : '')}</span>` : '<span class="badge badge-posted">Open</span>'}</div></div>
    <div class="need-actions"><a class="big-btn call" target="_blank" rel="noopener" href="${nav}">${ic('navigation')}${esc(t('directions'))}</a>${phone ? `<a class="big-btn call" href="tel:${esc(phone)}">${ic('phone')}${esc(t('call'))}</a>` : ''}${act}</div></div>`;
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
  div.id = 'needsPanel'; div.className = 'panel needs-panel';
  div.innerHTML = `<div class="panel-head"><div><h2>${esc(r.data.peopleWaiting)} ${esc(t('peopleWaiting'))}</h2><p class="muted">${esc(t('reqTitle'))}</p></div><button class="btn btn-primary btn-sm" data-go="requests">${esc(t('seeThem'))}</button></div><div class="need-list">${r.data.requests.slice(0, 3).map(requestCard).join('')}</div>`;
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
  const ac = e.target.closest('[data-accept]');
  if (ac) { api(`/api/requests/${encodeURIComponent(ac.dataset.accept)}/accept`, { method: 'POST', body: {} }).then((r) => { showToast(r.ok ? 'You accepted this request. Please head over.' : (r.data.error || 'Failed')); refreshCurrent(); }); return; }
  const cr = e.target.closest('[data-cancel-req]');
  if (cr) {
    confirmDialog({ title: t('cancelReq') + '?', message: 'Nobody will be sent to help you if you cancel. You can always ask again.', confirmText: t('cancelReq'), cancelText: 'Keep request', danger: true }).then((ok) => {
      if (!ok) return;
      api(`/api/requests/${encodeURIComponent(cr.dataset.cancelReq)}/cancel`, { method: 'POST', body: {} }).then((r) => { showToast(r.ok ? t('cancelled') : (r.data.error || 'Failed')); refreshCurrent(); });
    });
    return;
  }
  if (e.target.closest('[data-dismiss-req]')) { try { localStorage.removeItem('cf_req'); } catch (err) { /* ignore */ } go('start'); updateAuthUI(); return; }
  if (e.target.closest('#reqSend')) return sendReq();
  if (e.target.closest('[data-loc]')) { gpsBlocked = false; startLiveGps(); return; }
  const lc = e.target.closest('[data-lang]'); if (lc) return setLang(lc.dataset.lang);
  const hp = e.target.closest('[data-help]');
  if (hp) {
    api(`/api/requests/${encodeURIComponent(hp.dataset.help)}/help`, { method: 'POST', body: {} }).then((r) => { showToast(r.ok ? 'Marked as helped. Thank you.' : (r.data.error || 'Failed')); refreshCurrent(); });
  }
}, true);

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role="button"].speak')) { e.preventDefault(); e.target.click(); }
});

document.addEventListener('DOMContentLoaded', () => {
  $('closeReqBtn').innerHTML = ic('x');
  $('easyBtn').innerHTML = ic('type');
  document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = ic(el.dataset.icon); });
  $('closeReqBtn').addEventListener('click', () => $('reqModal').classList.remove('active'));
  $('langSelect').addEventListener('change', (e) => setLang(e.target.value));
  $('easyBtn').addEventListener('click', () => setEasy(!document.body.classList.contains('easy')));
  let easy = false; // larger text is opt-in and remembered
  try { const saved = localStorage.getItem('cf_easy'); if (saved !== null) easy = saved === '1'; } catch (e) { /* ignore */ }
  setEasy(easy);
  applyLang();
  setInterval(tickExp2, 30000);
});
