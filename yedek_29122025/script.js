// Müfredat Verisi
const curriculum = [
    {
        unit: "1. Ünite: Değişen Dünya Dengeleri Karşısında Osmanlı Siyaseti",
        topics: [
            "1595-1700 Yılları Arasındaki Siyasi Gelişmeler",
            "Avrupalı Güçlerin Değişen Denizcilik Stratejileri",
            "1700-1774 Yılları Osmanlı Devletinin Yürüttüğü Rekabet",
            "Zitvatorok ve Karlofça Antlaşmaları"
        ]
    },
    {
        unit: "2. Ünite: Değişim Çağında Avrupa ve Osmanlı",
        topics: [
            "Avrupa'da Aydınlanma Çağı",
            "Osmanlı Devleti'nde Lale Devri ve Yenileşme",
            "Osmanlı Devleti'nde İsyanlar (Patrona Halil vb.)",
            "Matbaanın Gelişi ve Kültürel Etkileri"
        ]
    },
    {
        unit: "3. Ünite: Devrimler Çağında Değişen Devlet-Toplum İlişkileri",
        topics: [
            "Fransız İhtilali ve Milliyetçilik Akımı",
            "Sanayi İnkılabı ve Osmanlı Ekonomisine Etkisi",
            "Nizam-ı Cedid ve Modern Orduya Geçiş",
            "Sened-i İttifak ve Padişah Yetkileri"
        ]
    },
    {
        unit: "4. Ünite: Uluslararası İlişkilerde Denge Stratejisi (1774-1914)",
        topics: [
            "Şark Meselesi ve Denge Politikası",
            "Tanzimat ve Islahat Fermanları",
            "I. ve II. Meşrutiyet Dönemleri",
            "93 Harbi ve Berlin Antlaşması"
        ]
    },
    {
        unit: "5. Ünite: XX. Yüzyılda Değişen Gündelik Hayat",
        topics: [
            "Osmanlı'da Demiryolu ve Telgrafın Yaygınlaşması",
            "Osmanlı'da Nüfus Hareketleri ve Göçler",
            "Modernleşmeyle Değişen Şehir Hayatı",
            "Basın Yayın Hayatının Gelişimi"
        ]
    }
];

let state = {
    apiKey: "",
    currentUnitIndex: 0,
    currentQuestion: "",
    totalScore: 0,
    questionCount: 0,
    selectedModel: "openai/gpt-3.5-turbo"
};

// DOM Elementleri
const els = {
    modal: document.getElementById('api-modal'),
    apiKeyInput: document.getElementById('api-key-input'),
    modelSelect: document.getElementById('model-select'),
    gameContainer: document.getElementById('game-container'),
    unitDisp: document.getElementById('unit-disp'),
    scoreDisp: document.getElementById('score-disp'),
    modelDisp: document.getElementById('model-disp'),
    unitName: document.getElementById('unit-name'),
    topicName: document.getElementById('topic-name'),
    qText: document.getElementById('question-text'),
    ansInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-btn'),
    nextBtn: document.getElementById('next-btn'),
    retryBtn: document.getElementById('retry-btn'),
    resultBox: document.getElementById('result-box'),
    scoreBadge: document.getElementById('score-badge'),
    feedbackText: document.getElementById('feedback-text'),
    loadingBox: document.getElementById('loading-box'),
    loadingText: document.getElementById('loading-text'),
    activeArea: document.getElementById('active-game-area'),
    endScreen: document.getElementById('end-screen')
};

function startGame() {
    const key = els.apiKeyInput.value.trim();
    if (!key) {
        alert("Lütfen bir OpenRouter API anahtarı giriniz.");
        return;
    }
    state.apiKey = key;
    state.selectedModel = els.modelSelect.value;
    
    // Model adını göster
    const modelName = state.selectedModel.split('/')[1] || state.selectedModel;
    els.modelDisp.textContent = modelName;
    
    els.modal.style.display = 'none';
    els.gameContainer.style.display = 'block';
    
    // İlk soruyu üret
    generateQuestion();
}

// --- OPENROUTER API FONKSİYONU ---
async function callOpenRouter(promptText, systemPrompt = "") {
    const url = "https://openrouter.ai/api/v1/chat/completions";
    
    const messages = [];
    
    // Sistem mesajı ekle (eğer varsa)
    if (systemPrompt) {
        messages.push({
            role: "system",
            content: systemPrompt
        });
    }
    
    // Kullanıcı mesajı ekle
    messages.push({
        role: "user",
        content: promptText
    });

    const payload = {
        model: state.selectedModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Tarih Oyunu'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Hatası: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("OpenRouter hatası:", error);
        alert(`OpenRouter ile iletişim kurulurken bir hata oluştu: ${error.message}\nAPI anahtarınızı ve model seçiminizi kontrol edin.`);
        return null;
    }
}

// --- SORU OLUŞTURMA ---
async function generateQuestion() {
    // UI Sıfırlama
    els.activeArea.style.opacity = "0.5";
    els.activeArea.style.pointerEvents = "none";
    els.loadingBox.style.display = "block";
    els.loadingText.textContent = "Müfredata uygun soru hazırlanıyor...";
    els.resultBox.style.display = "none";
    els.ansInput.value = "";
    els.submitBtn.style.display = "inline-block";
    els.nextBtn.style.display = "none";
    els.retryBtn.style.display = "none";

    const currentUnit = curriculum[state.currentUnitIndex];
    // Rastgele bir alt konu seç
    const randomTopic = currentUnit.topics[Math.floor(Math.random() * currentUnit.topics.length)];

    // Prompt
    const prompt = `
    Sen bir Tarih öğretmenisin. Aşağıdaki konu hakkında lise 11. sınıf seviyesinde, kolay seviyede, düşündürücü, ezberden ziyade yoruma ve bilgiye dayalı TEK BİR soru hazırla.
    
    Ünite: ${currentUnit.unit}
    Konu: ${randomTopic}
    
    Çıktı formatı SADECE soru metni olsun. Başka bir şey yazma.
    `;

    const questionText = await callOpenRouter(prompt, "Sen bir Tarih öğretmenisin. Öğrencilere tarihi olayların nedenlerini, sonuçlarını ve bağlamlarını anlamalarına yardımcı olacak kolay seviye sorular hazırlarsın.");
    
    if (!questionText) {
        alert("Soru oluşturulamadı. Lütfen tekrar deneyin.");
        els.loadingBox.style.display = "none";
        els.activeArea.style.opacity = "1";
        els.activeArea.style.pointerEvents = "all";
        return;
    }
    
    // State Güncelleme
    state.currentQuestion = questionText;
    
    // UI Güncelleme
    els.loadingBox.style.display = "none";
    els.activeArea.style.opacity = "1";
    els.activeArea.style.pointerEvents = "all";
    
    els.unitDisp.textContent = state.currentUnitIndex + 1;
    els.unitName.textContent = currentUnit.unit;
    els.topicName.textContent = "Konu: " + randomTopic;
    els.qText.textContent = questionText;
}

// --- CEVAP DEĞERLENDİRME ---
async function submitAnswer() {
    const answer = els.ansInput.value.trim();
    if (answer.length < 5) {
        alert("Lütfen daha kapsamlı bir cevap yazınız (en az 5 karakter).");
        return;
    }

    // UI Güncelleme
    els.submitBtn.disabled = true;
    els.submitBtn.textContent = "Değerlendiriliyor...";
    els.ansInput.disabled = true;
    
    const systemPrompt = "Sen bir Tarih öğretmenisin. Öğrencilerin cevaplarını adil ve eğitici bir şekilde değerlendirir, yapıcı geri bildirim verirsin.";
    
    const prompt = `
    Bağlam: 11. Sınıf Tarih Dersi.
    Soru: "${state.currentQuestion}"
    Öğrenci Cevabı: "${answer}"

    Görevin:
    1. Cevabı tarihsel doğruluk, kapsam ve yeterlilik açısından 1 ile 10 arasında puanla.
    2. Öğrenciye hitaben kısa, eğitici ve yapıcı bir geri bildirim yaz. Cevap yanlışsa doğrusunu kısaca anlat.
    3. Eksik bilgileri tamamla, yanlış anlaşılmaları düzelt.
    
    Cevabını MUTLAKA aşağıdaki JSON formatında ver:
    {
        "score": 0,
        "feedback": "..."
    }
    
    Lütfen sadece JSON formatında cevap ver, başka hiçbir şey yazma.
    `;

    try {
        let aiResponse = await callOpenRouter(prompt, systemPrompt);
        
        if (!aiResponse) {
            throw new Error("Değerlendirme yapılamadı");
        }
        
        // Markdown temizliği
        aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const result = JSON.parse(aiResponse);
        
        showResult(result.score, result.feedback);

    } catch (e) {
        console.error("Değerlendirme hatası", e);
        alert("Değerlendirme sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        els.submitBtn.disabled = false;
        els.submitBtn.textContent = "Cevabı Gönder";
        els.ansInput.disabled = false;
    }
}

function showResult(score, feedback) {
    els.resultBox.style.display = "block";
    els.feedbackText.textContent = feedback;
    els.scoreBadge.textContent = `${score} / 10`;

    // Renklendirme
    if (score >= 5) {
        els.scoreBadge.style.backgroundColor = "var(--success)";
        els.nextBtn.style.display = "inline-block";
        els.submitBtn.style.display = "none";
        
        // Puanı kaydet
        state.totalScore += parseInt(score);
        state.questionCount++;
        els.scoreDisp.textContent = state.totalScore;

    } else {
        els.scoreBadge.style.backgroundColor = "var(--warning)";
        els.retryBtn.style.display = "inline-block";
        els.submitBtn.style.display = "none";
        els.feedbackText.innerHTML += "<br><br><strong>Puanın 5'in altında olduğu için yeni bir soru ile tekrar denemelisin.</strong>";
    }
    
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = "Cevabı Gönder";
    els.ansInput.disabled = false;
}

function nextStage() {
    state.currentUnitIndex++;
    
    if (state.currentUnitIndex >= curriculum.length) {
        endGame();
    } else {
        generateQuestion();
    }
}

function endGame() {
    els.gameContainer.style.display = 'none';
    els.endScreen.style.display = 'block';
    
    const avg = state.questionCount > 0 ? (state.totalScore / state.questionCount).toFixed(1) : 0;
    const msg = document.getElementById('final-score-text');
    
    msg.innerHTML = `Toplam Puan: ${state.totalScore} <br> Ortalama Başarı: ${avg}/10 <br> Kullanılan Model: ${state.selectedModel}`;
}

// Model seçimi değiştiğinde
els.modelSelect.addEventListener('change', function() {
    state.selectedModel = this.value;
});

// Enter tuşu ile cevap gönderme
els.ansInput.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        submitAnswer();
    }
});
