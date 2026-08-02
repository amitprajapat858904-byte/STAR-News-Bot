// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBnNJxfB51ZEl7jLlJoYpk3fbhJ3tVJvM",
  authDomain: "starnationalinternationa-4e45b.firebaseapp.com",
  projectId: "starnationalinternationa-4e45b",
  storageBucket: "starnationalinternationa-4e45b.firebasestorage.app",
  messagingSenderId: "664854850863",
  appId: "1:664854850863:web:8410bed578bf3a0c0f05da",
  measurementId: "G-9HE77PYBRN"
};const NEWS_RSS_URL = "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/ndtvnews-india-news";

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tag').forEach(el => el.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabName}`);
  if(targetTab) targetTab.classList.add('active');

  if (tabName === 'edu') loadQuestions();
}

async function loadNews() {
  const status = document.getElementById('status');
  const container = document.getElementById('news-container');
  const marquee = document.getElementById('marquee-news');
  
  status.innerText = "⏳ Loading Updates...";
  
  try {
    const res = await fetch(NEWS_RSS_URL);
    const data = await res.json();
    
    if(data.status === "ok") {
      status.innerText = "";
      container.innerHTML = "";
      
      marquee.innerText = data.items.slice(0, 8).map(i => "🔴 " + i.title).join(" | ");

      data.items.slice(0, 6).forEach(item => {
        container.innerHTML += `
          <div class="card">
            <div>
              <span class="card-badge">LIVE NEWS</span>
              <h4 class="card-title">${item.title}</h4>
              <p class="card-desc">${item.description.replace(/<[^>]*>?/gm, '').substring(0, 90)}...</p>
            </div>
            <a href="${item.link}" target="_blank" class="card-link">Read Story ➔</a>
          </div>`;
      });
    }
  } catch(e) { status.innerText = "Network Error!"; }
}

const sampleQuestions = [
  { exam: "neet", q: "मानव शरीर की सबसे बड़ी ग्रंथि कौन सी है?", options: ["यकृत (Liver)", "थायरॉयड", "अग्न्याशय"], ans: "यकृत (Liver)" },
  { exam: "ssc", q: "भारत का राष्ट्रीय खेल कौन सा है?", options: ["हॉकी", "क्रिकेट", "कबड्डी"], ans: "हॉकी" },
  { exam: "gk", q: "हड़प्पा सभ्यता की खोज किस वर्ष हुई थी?", options: ["1921", "1932", "1942"], ans: "1921" }
];

function loadQuestions() {
  const box = document.getElementById('question-box');
  const selectedExam = document.getElementById('exam-select').value;
  box.innerHTML = "";

  const filtered = selectedExam === "all" ? sampleQuestions : sampleQuestions.filter(q => q.exam === selectedExam);
  
  filtered.forEach((q, index) => {
    box.innerHTML += `
      <div class="card" style="margin-bottom:10px;">
        <p style="font-weight:bold;">Q${index+1}: ${q.q}</p>
        <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
          ${q.options.map(opt => `<button style="padding:6px 12px; border:1px solid #ccc; background:#f2f2f2; border-radius:6px; cursor:pointer;" onclick="alert('${opt === q.ans ? '✅ सही!' : '❌ गलत! सही उत्तर: ' + q.ans}')">${opt}</button>`).join('')}
        </div>
      </div>`;
  });
}

function verifyPayment() {
  const utr = document.getElementById('utr-number').value;
  if(utr.length >= 8) alert("✅ Payment UTR Received: " + utr + "\nVIP Membership will activate shortly!");
  else alert("❌ Please enter a valid UTR Number.");
}

function registerReporter(e) {
  e.preventDefault();
  document.getElementById('reporter-success').innerText = "✅ News Submitted Successfully!";
}

window.onload = loadNews;
// Firebase Database से ताज़ा खबरें खींचकर वेबसाइट पर दिखाना
async function loadFirebaseNews() {
  const container = document.getElementById('news-container');
  
  try {
    const snapshot = await db.collection("news").orderBy("timestamp", "desc").get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      container.innerHTML = `
        <div class="card" style="margin-bottom:15px;">
          <div>
            <span class="card-badge" style="background:#059669; color:white;">${data.category}</span>
            <h4 class="card-title">${data.title}</h4>
            <p class="card-desc">${data.description}</p>
          </div>
        </div>
      ` + container.innerHTML; // नई खबर सबसे ऊपर दिखेगी
    });
  } catch (err) {
    console.log("Firebase Load Error: ", err);
  }
}

// पेज लोड होते ही Firebase की खबरें दिखाए
window.addEventListener('load', loadFirebaseNews);
// Firebase Database से ताज़ा खबरें खींचकर वेबसाइट पर दिखाना
async function loadFirebaseNews() {
  const container = document.getElementById('news-container');
  if(!container) return;
  
  try {
    const snapshot = await db.collection("news").orderBy("timestamp", "desc").get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      container.innerHTML = `
        <div class="card" style="margin-bottom:15px;">
          <div>
            <span class="card-badge" style="background:#059669; color:white;">${data.category}</span>
            <h4 class="card-title">${data.title}</h4>
            <p class="card-desc">${data.description}</p>
          </div>
        </div>
      ` + container.innerHTML;
    });
  } catch (err) {
    console.log("Firebase Load Error: ", err);
  }
}

window.addEventListener('load', loadFirebaseNews);


// ==========================================
// ऑटोमैटिक हिंदी ताज़ा खबरें लोड करने का कोड
// ==========================================
const API_KEY = '815c4d5ffecb213b1cd3b1e36780c8a6';
const NEWS_URL = `https://gnews.io/api/v4/top-headlines?category=general&lang=hi&country=in&apikey=${API_KEY}`;

async function fetchAutomatedNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    newsContainer.innerHTML = '<p style="text-align:center;">ताज़ा खबरें लोड हो रही हैं...</p>';

    try {
        const response = await fetch(NEWS_URL);
        const data = await response.json();

        if (data.articles && data.articles.length > 0) {
            newsContainer.innerHTML = '';

            data.articles.forEach(article => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';

                newsCard.innerHTML = `
                    <img src="${article.image || 'https://via.placeholder.com/300'}" alt="News Image" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
                    <h3 style="margin: 10px 0;">${article.title}</h3>
                    <p>${article.description || ''}</p>
                    <a href="${article.url}" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">पूरी खबर पढ़ें ➔</a>
                    <hr style="margin: 15px 0; border: 0.5px solid #eee;">
                `;
                newsContainer.appendChild(newsCard);
            });
        }
    } catch (error) {
        console.error("News Load Error:", error);
    }
}

// ऑटोमैटिक फ़ंक्शन चलाएँ
document.addEventListener('DOMContentLoaded', fetchAutomatedNews);


// 100% वर्किंग ऑटोमैटिक हिंदी न्यूज़ कोड (Google News RSS)
async function fetchAutomatedNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    // दैनिक जागरण / गूगल न्यूज़ RSS फीड
    const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Dhi%26gl%3DIN%26ceid%3DIN%3Ahi';

    try {
        const response = await fetch(RSS_URL);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            newsContainer.innerHTML = ''; // "लोड हो रहा है" वाला मैसेज हटाएँ

            data.items.slice(0, 10).forEach(article => {
                const newsCard = document.createElement('div');
                newsCard.className = 'news-card';
                newsCard.style.cssText = "background: #fff; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);";

                newsCard.innerHTML = `
                    <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #333;">${article.title}</h3>
                    <p style="font-size: 12px; color: #777; margin-bottom: 10px;">📅 ${new Date(article.pubDate).toLocaleDateString('hi-IN')}</p>
                    <a href="${article.link}" target="_blank" style="color: #d32f2f; text-decoration: none; font-weight: bold; font-size: 14px;">पूरी खबर पढ़ें ➔</a>
                `;
                newsContainer.appendChild(newsCard);
            });
        } else {
            newsContainer.innerHTML = '<p style="text-align:center;">खबरें लोड नहीं हो सकीं।</p>';
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        newsContainer.innerHTML = '<p style="text-align:center;">नेटवर्क एरर! कृपया दोबारा प्रयास करें।</p>';
    }
}

document.addEventListener('DOMContentLoaded', fetchAutomatedNews);
