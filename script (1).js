// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBBnNJxfB51ZEl7jLlJoYpk3fbhJ3tVJvM",
  authDomain: "starnationalinternationa-4e45b.firebaseapp.com",
  databaseURL: "https://starnationalinternationa-4e45b-default-rtdb.firebaseio.com",
  projectId: "starnationalinternationa-4e45b",
  storageBucket: "starnationalinternationa-4e45b.firebasestorage.app",
  messagingSenderId: "664854850863",
  appId: "1:664854850863:web:8410bed578bf3a0c0f05da",
  measurementId: "G-9HE77PYBRN"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

let currentCategory = 'all';

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tag').forEach(el => el.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabName}`);
  if(targetTab) targetTab.classList.add('active');

  if (tabName === 'edu') loadQuestions();
}

function changeCategory(category) {
    currentCategory = category;
    loadAllPosts();
}

// ==========================================
// 2. EXPAND / COLLAPSE FUNCTION (पूरी खबर पढ़ें)
// ==========================================
function toggleNewsDetails(id) {
    const fullContentDiv = document.getElementById(`full-news-${id}`);
    const btn = document.getElementById(`btn-news-${id}`);
    
    if (fullContentDiv) {
        if (fullContentDiv.style.display === "none" || fullContentDiv.style.display === "") {
            fullContentDiv.style.display = "block";
            if (btn) btn.innerHTML = "👆 कम पढ़ें";
        } else {
            fullContentDiv.style.display = "none";
            if (btn) btn.innerHTML = "📖 पूरी खबर पढ़ें";
        }
    }
}

// ==========================================
// 3. GOOGLE NEWS AUTO FETCHER
// ==========================================
async function fetchGoogleNews() {
    const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Dhi%26gl%3DIN%26ceid%3DIN%3Ahi';
    try {
        const response = await fetch(RSS_URL);
        const data = await response.json();
        
        let newsList = [];
        if (data.status === 'ok' && data.items) {
            data.items.slice(0, 10).forEach(item => {
                newsList.push({
                    title: item.title,
                    details: 'गूगल न्यूज़ से ताज़ा ऑटोमैटिक अपडेट।',
                    fullContent: item.description ? item.description.replace(/<[^>]*>?/gm, '') : 'पूरी खबर के लिए मूल सोर्स लिंक पर क्लिक करें।',
                    link: item.link,
                    pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString('hi-IN') : '',
                    type: 'news'
                });
            });
        }
        return newsList;
    } catch (e) {
        console.error("Auto News Fetch Error:", e);
        return [];
    }
}

// ==========================================
// 4. LOAD ALL POSTS (Firebase + Auto News)
// ==========================================
async function loadAllPosts() {
    const container = document.getElementById('news-container');
    const marquee = document.getElementById('marquee-news');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">🔄 ताज़ा ऑटोमैटिक खबरें लोड हो रही हैं...</p>';

    let combinedList = [];

    // 1. Firebase (एडमिन + AI Bot) की खबरें
    try {
        const snapshot = await db.ref('posts').once('value');
        const adminData = snapshot.val();
        if (adminData) {
            Object.keys(adminData).forEach(key => {
                combinedList.push({ ...adminData[key], id: key });
            });
            combinedList.reverse();
        }
    } catch (err) {
        console.error("Firebase Load Error:", err);
    }

    // 2. गूगल न्यूज़ ऑटोमैटिक
    if (currentCategory === 'all' || currentCategory === 'news') {
        const autoNews = await fetchGoogleNews();
        combinedList = [...combinedList, ...autoNews];
    }

    // Marquee में ताज़ा खबरें दिखाना
    if (marquee && combinedList.length > 0) {
        marquee.innerText = combinedList.slice(0, 8).map(i => "🔴 " + i.title).join(" | ");
    }

    // स्क्रीन पर दिखाना
    container.innerHTML = '';

    if (combinedList.length > 0) {
        combinedList.forEach((item, index) => {
            if (currentCategory === 'all' || item.type === currentCategory) {
                const card = document.createElement('div');
                card.style.cssText = "background: #fff; padding: 15px; margin: 12px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border-left: 4px solid #1a237e;";

                const uniqueId = item.id || `news-idx-${index}`;
                const fullText = item.fullContent || item.content || item.details || '';
                const shortSummary = item.details || item.title || '';

                let readMoreToggleBtn = '';
                if (fullText && fullText.length > 40) {
                    readMoreToggleBtn = `
                        <button id="btn-news-${uniqueId}" onclick="toggleNewsDetails('${uniqueId}')" style="background:#1a237e; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; font-size:12px; cursor:pointer; margin-top:8px;">
                            📖 पूरी खबर पढ़ें
                        </button>
                    `;
                }

                let externalLinkBtn = '';
                if (item.link) {
                    externalLinkBtn = `<a href="${item.link}" target="_blank" style="display:inline-block; margin-top:8px; margin-left:6px; background:#333; color:#fff; padding:6px 12px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:12px;">🔗 मूल सोर्स</a>`;
                } else if (item.pdf) {
                    externalLinkBtn = `<a href="${item.pdf}" target="_blank" style="display:inline-block; margin-top:8px; margin-left:6px; background:#d32f2f; color:#fff; padding:6px 12px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:12px;">📄 PDF / डाउनलोड</a>`;
                }

                card.innerHTML = `
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111;">${item.title || ''}</h3>
                    <span style="font-size:11px; background:#e8eaf6; color:#1a237e; padding:2px 6px; border-radius:4px; font-weight:bold;">📌 ${(item.type || 'NEWS').toUpperCase()} ${item.pubDate ? '• ' + item.pubDate : ''}</span>
                    
                    <p style="font-size:13px; color:#444; margin-top:8px; line-height:1.5;">${shortSummary}</p>
                    
                    <div id="full-news-${uniqueId}" style="display:none; margin-top:10px; padding:10px; background:#f9f9f9; border-radius:6px; border-top:1px solid #eee; font-size:14px; color:#222; line-height:1.6;">
                        ${fullText}
                    </div>

                    <div style="margin-top:5px;">
                        ${readMoreToggleBtn}
                        ${externalLinkBtn}
                    </div>
                `;
                container.appendChild(card);
            }
        });
    } else {
        container.innerHTML = '<p style="text-align:center; padding:30px; color:#777;">कोई अपडेट उपलब्ध नहीं है।</p>';
    }
}

// ==========================================
// 5. QUIZ / EDUCATIONAL QUESTIONS
// ==========================================
const sampleQuestions = [
  { exam: "neet", q: "मानव शरीर की सबसे बड़ी ग्रंथि कौन सी है?", options: ["यकृत (Liver)", "थायरॉयड", "अग्न्याशय"], ans: "यकृत (Liver)" },
  { exam: "ssc", q: "भारत का राष्ट्रीय खेल कौन सा है?", options: ["हॉकी", "क्रिकेट", "कबड्डी"], ans: "हॉकी" },
  { exam: "gk", q: "हड़प्पा सभ्यता की खोज किस वर्ष हुई थी?", options: ["1921", "1932", "1942"], ans: "1921" }
];

function loadQuestions() {
  const box = document.getElementById('question-box');
  const select = document.getElementById('exam-select');
  if (!box) return;
  
  const selectedExam = select ? select.value : "all";
  box.innerHTML = "";

  const filtered = selectedExam === "all" ? sampleQuestions : sampleQuestions.filter(q => q.exam === selectedExam);
  
  filtered.forEach((q, index) => {
    box.innerHTML += `
      <div class="card" style="background:#fff; padding:12px; margin-bottom:10px; border-radius:8px;">
        <p style="font-weight:bold; margin:0;">Q${index+1}: ${q.q}</p>
        <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
          ${q.options.map(opt => `<button style="padding:6px 12px; border:1px solid #ccc; background:#f2f2f2; border-radius:6px; cursor:pointer;" onclick="alert('${opt === q.ans ? '✅ सही!' : '❌ गलत! सही उत्तर: ' + q.ans}')">${opt}</button>`).join('')}
        </div>
      </div>`;
  });
}

function verifyPayment() {
  const utr = document.getElementById('utr-number').value;
  if(utr && utr.length >= 8) alert("✅ Payment UTR Received: " + utr + "\nVIP Membership will activate shortly!");
  else alert("❌ Please enter a valid UTR Number.");
}

function registerReporter(e) {
  e.preventDefault();
  const msg = document.getElementById('reporter-success');
  if (msg) msg.innerText = "✅ News Submitted Successfully!";
}

// ==========================================
// 6. INITIAL LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadAllPosts();
});
          
