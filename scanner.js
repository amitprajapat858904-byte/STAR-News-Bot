// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBnNJxfB51ZEl7jLlJoYpk3fbhJ3tVJvM",
  authDomain: "starnationalinternationa-4e45b.firebaseapp.com",
  databaseURL: "https://starnationalinternationa-4e45b-default-rtdb.firebaseio.com",
  projectId: "starnationalinternationa-4e45b",
  storageBucket: "starnationalinternationa-4e45b.firebasestorage.app",
  messagingSenderId: "664854850863",
  appId: "1:664854850863:web:8410bed578bf3a0c0f05da"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const video = document.getElementById('webcam');
const status = document.getElementById('status');
const resultBox = document.getElementById('result-box');
const outputText = document.getElementById('output-text');

let isScanning = false;

// 1. कैमरा एक्सेस शुरू करना
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" } // बैक कैमरा
        });
        video.srcObject = stream;
        status.innerText = "🟢 पन्ने को फ्रेम में रोककर रखें...";
        
        // हर 3 सेकंड में ऑटो-स्कैन फ्रेम कैप्चर करेगा
        setInterval(captureAndScan, 3500);
    } catch (err) {
        status.innerText = "❌ कैमरा एक्सेस एरर! कृपया अनुमति (Permission) दें।";
    }
}

// 2. ऑटोमैटिक स्क्रीन फ्रेम कैप्चर और OCR स्कैन
async function captureAndScan() {
    if (isScanning || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    isScanning = true;
    status.innerText = "⚡ AI पन्ना स्कैन कर रहा है...";

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        // Tesseract OCR से हिंदी/इंग्लिश टेक्स्ट रीड करना
        const result = await Tesseract.recognize(canvas, 'hin+eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    status.innerText = `🔍 स्कैनिंग... ${Math.round(m.progress * 100)}%`;
                }
            }
        });

        const rawText = result.data.text.trim();

        // अगर पन्ने पर 15 शब्दों से ज़्यादा टेक्स्ट मिला
        if (rawText.length > 30) {
            status.innerText = "✨ पैराग्राफ़ तैयार किया जा रहा है...";
            
            // टेक्स्ट को साफ़ और पैराग्राफ़ फॉर्मेट में बदलना
            const formattedText = cleanAndFormatText(rawText);
            
            // Firebase में सीधे अपलोड करना
            await uploadToFirebase(formattedText);
            
            outputText.innerText = formattedText;
            resultBox.style.display = 'block';
            status.innerText = "✅ सफ़लतापूर्वक वेबसाइट पर अपलोड हो गया!";
            
            // 5 सेकंड का पॉज ताकि एक ही पन्ना बार-बार अपलोड न हो
            setTimeout(() => { isScanning = false; status.innerText = "🟢 अगला पन्ना फ्रेम में लाएँ..."; }, 5000);
        } else {
            isScanning = false;
            status.innerText = "🟢 पन्ने को साफ़ और स्थिर रखें...";
        }
    } catch (err) {
        console.error(err);
        isScanning = false;
        status.innerText = "🔴 स्कैनिंग में त्रुटि, दोबारा प्रयास करें...";
    }
}

// 3. पैराग्राफ़ और फॉर्मेटिंग साफ़ करने का फ़ंक्शन
function cleanAndFormatText(text) {
    let clean = text.replace(/\n\s*\n/g, '\n\n'); // पैराग्राफ़ ब्रेक
    clean = clean.replace(/[\t]/g, ' ');
    return clean;
}

// 4. Firebase में सेव करना
async function uploadToFirebase(textContent) {
    const newPostRef = db.ref('posts').push();
    const firstLine = textContent.split('\n')[0].substring(0, 50) + "...";
    
    await newPostRef.set({
        title: firstLine || "किताब से ऑटो-स्कैन अपडेट",
        details: textContent.substring(0, 100) + "...",
        fullContent: textContent,
        type: 'book_notes',
        pubDate: new Date().toLocaleDateString('hi-IN')
    });
}

// पेज लोड होते ही कैमरा स्टार्ट
window.onload = startCamera;
