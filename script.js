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

function changeCategory(category) {
    currentCategory = category;
    loadAllPosts();
}

// 🌐 Google News Auto Fetcher
async function fetchGoogleNews() {
    const rssUrl = "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi";
    // CORS Proxy का उपयोग ताकि गूगल न्यूज़ बिना रुके लोड हो
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        const textData = await response.text();
        
        // XML को JSON/Text में पार्स करना
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        
        let newsList = [];
        items.forEach((item, index) => {
            if (index < 15) { // टॉप 15 ताज़ा खबरें
                const title = item.querySelector("title") ? item.querySelector("title").textContent : '';
                const link = item.querySelector("link") ? item.querySelector("link").textContent : '';
                const pubDate = item.querySelector("pubDate") ? new Date(item.querySelector("pubDate").textContent).toLocaleDateString('hi-IN') : '';
                
                newsList.push({
                    title: title,
                    details: 'गूगल न्यूज़ से ताज़ा ऑटोमैटिक अपडेट।',
                    link: link,
                    pubDate: pubDate,
                    type: 'news'
                });
            }
        });
        return newsList;
    } catch (e) {
        console.error("Auto News Fetch Error:", e);
        return [];
    }
}

async function loadAllPosts() {
    const container = document.getElementById('news-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">🔄 ताज़ा ऑटोमैटिक खबरें लोड हो रही हैं...</p>';

    let combinedList = [];

    // 1. आपके एडमिन पैनल से डाली गई पोस्ट्स
    try {
        const snapshot = await db.ref('posts').once('value');
        const adminData = snapshot.val();
        if (adminData) {
            Object.keys(adminData).forEach(key => {
                combinedList.push({ ...adminData[key], isAdmin: true });
            });
            combinedList.reverse(); // नई एडमिन पोस्ट्स सबसे ऊपर
        }
    } catch (err) {
        console.error(err);
    }

    // 2. ऑटोमैटिक Google News (अगर न्यूज़ या All कैटेगरी चुनी हो)
    if (currentCategory === 'all' || currentCategory === 'news') {
        const autoNews = await fetchGoogleNews();
        combinedList = [...combinedList, ...autoNews];
    }

    // स्क्रीन पर दिखाना
    container.innerHTML = '';

    if (combinedList.length > 0) {
        combinedList.forEach(item => {
            if (currentCategory === 'all' || item.type === currentCategory) {
                const card = document.createElement('div');
                card.style.cssText = "background: #fff; padding: 15px; margin: 12px 0; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); border-left: 4px solid #1a237e;";

                let actionBtn = '';
                if (item.link) {
                    actionBtn = `<br><a href="${item.link}" target="_blank" style="display:inline-block; margin-top:10px; background:#1a237e; color:#fff; padding:6px 12px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:12px;">📰 पूरी खबर पढ़ें</a>`;
                } else if (item.pdf) {
                    actionBtn = `<br><a href="${item.pdf}" target="_blank" style="display:inline-block; margin-top:10px; background:#d32f2f; color:#fff; padding:6px 12px; text-decoration:none; border-radius:4px; font-weight:bold; font-size:12px;">📄 PDF / डाउनलोड</a>`;
                }

                card.innerHTML = `
                    <h3 style="margin: 0 0 5px 0; font-size: 16px; color: #111;">${item.title || ''}</h3>
                    <span style="font-size:11px; background:#e8eaf6; color:#1a237e; padding:2px 6px; border-radius:4px; font-weight:bold;">📌 ${(item.type || 'NEWS').toUpperCase()} ${item.pubDate ? '• ' + item.pubDate : ''}</span>
                    <p style="font-size:13px; color:#444; margin-top:8px; line-height:1.5;">${item.details || ''}</p>
                    ${actionBtn}
                `;
                container.appendChild(card);
            }
        });
    } else {
        container.innerHTML = '<p style="text-align:center; padding:30px; color:#777;">कोई अपडेट उपलब्ध नहीं है।</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllPosts();
});
