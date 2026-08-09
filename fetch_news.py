import feedparser
import google.generativeai as genai
import json
import os

# Gemini AI Setup
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-1.5-flash')

# RSS Feeds
RSS_FEEDS = [
    "http://feeds.bbci.co.uk/news/world/rss.xml",
    "https://news.google.com/rss?topic=h&hl=en-IN&gl=IN&ceid=IN:en",
    "https://www.aljazeera.com/xml/rss/all.xml"
]

def generate_full_news(title, summary):
    prompt = f"""
    तुम एक वरिष्ठ पत्रकार हो। नीचे दी गई हैडलाइन और संक्षेप के आधार पर एक विस्तृत, अखबार जैसी पूरी हिंदी खबर (Full Detailed Article) लिखो।
    
    शीर्षक: {title}
    संक्षेप: {summary}
    
    नियम:
    1. खबर 300-400 शब्दों की पूरी विवरण वाली होनी चाहिए।
    2. भाषा शुद्ध और आकर्षक हिंदी अखबार जैसी हो।
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return summary

all_articles = []

for feed_url in RSS_FEEDS:
    feed = feedparser.parse(feed_url)
    for entry in feed.entries[:3]: # हर फीड से टॉप 3 खबरें
        full_hindi_news = generate_full_news(entry.title, entry.summary)
        all_articles.append({
            "title": entry.title,
            "content": full_hindi_news,
            "date": entry.published if 'published' in entry else ""
        })

with open('news_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_articles, f, ensure_ascii=False, indent=2)

print("न्यूज़ सफलता से अपडेट हो गई!")
