const https = require('https');

// 1. आपकी सेटिंग्स
const GEMINI_API_KEY = "AQ.Ab8RN6LIzpMCDMgUd9YbFM5x9q4dP-8WxORcCh21bSJKGqL0fg";
const FIREBASE_DB_URL = "https://starnationalinternationa-4e45b-default-rtdb.firebaseio.com/posts.json";

// RSS Feed URL (Google News Hindi)
const RSS_URL = "https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi";

// Helper function to make HTTP requests
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Helper to push to Firebase
function postToFirebase(postData) {
    return new Promise((resolve, reject) => {
        const dataString = JSON.stringify(postData);
        const url = new URL(FIREBASE_DB_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(dataString)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        });
        req.on('error', reject);
        req.write(dataString);
        req.end();
    });
}

// Helper to call Gemini AI
function summarizeWithGemini(newsTitle) {
    return new Promise((resolve, reject) => {
        const prompt = `इस खबर के आधार पर छात्रों/प्रतियोगी परीक्षा के उम्मीदवारों के लिए 3-4 लाइनों में एक बहुत ही आकर्षक और आसान हिंदी में संक्षेप (Summary) लिखें: "${newsTitle}"`;
        const postData = JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    const aiText = json.candidates[0].content.parts[0].text;
                    resolve(aiText.trim());
                } catch (e) {
                    resolve("ताज़ा खबर - देश दुनिया की ताज़ा अपडेट।");
                }
            });
        });
        req.on('error', () => resolve("ताज़ा खबर - देश दुनिया की ताज़ा अपडेट।"));
        req.write(postData);
        req.end();
    });
}

async function runAutoNews() {
    console.log("🔍 Fetching Google News...");
    try {
        const xmlData = await fetchUrl(RSS_URL);
        
        // Simple RegEx to extract titles
        const matches = [...xmlData.matchAll(/<title>(.*?)<\/title>/g)];
        if (matches.length > 1) {
            // Pick top 2 news items
            for (let i = 1; i <= 2; i++) {
                let rawTitle = matches[i][1].replace("<![CDATA[", "").replace("]]>", "").trim();
                console.log(`🤖 AI Processing: ${rawTitle}`);

                // Generate AI Summary
                const aiSummary = await summarizeWithGemini(rawTitle);

                const newPost = {
                    title: rawTitle,
                    details: "✨ [AI न्यूज़ बुलेटिन]\n" + aiSummary,
                    type: "news",
                    pubDate: new Date().toLocaleDateString('hi-IN'),
                    source: "Auto-AI"
                };

                await postToFirebase(newPost);
                console.log("✅ Post successfully uploaded to Firebase!");
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

runAutoNews();
