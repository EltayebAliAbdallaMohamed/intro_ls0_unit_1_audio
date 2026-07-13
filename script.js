const utterance = new SpeechSynthesisUtterance();
let currentAudioIndex = 0;
let Sentences = [];

// Playlist navigation state
let usePlayListMode = false;
let navIndices = [];
let navPos = 0;

let isSpeaking = false;
let isScrambled = false;

// DOM Elements
const speakEnglishBtn = document.getElementById("speakEnglish");
const speakArabicBtn = document.getElementById("speakArabic");
const speakSelectionBtn = document.getElementById("speakSelection");
const stopBtn = document.getElementById("stop");
const scrambleCheckbox = document.getElementById("scrambleCheckbox");
const speakScrambledCheckbox = document.getElementById("speakScrambledCheckbox");

const q = document.getElementById("q");
const refer_to = document.getElementById("refer_to");
const back_to = document.getElementById("back_to");
const speaker = document.getElementById("speaker");
const keyWords = document.getElementById("keyWords");
const def = document.getElementById("def");
const english = document.getElementById("english");
const arabic = document.getElementById("arabic");
const scrambledText = document.getElementById("scrambledText");
const audio = document.getElementById("audio");
const image = document.getElementById("image");
const illustrationDetails = document.getElementById("illustrations");
const questionBasedOnAudio = document.getElementById("questionBasedOnAudio");
const audioIndexInput = document.getElementById("audioIndex");
const autoPlayCheckbox = document.getElementById("autoPlay");

const playList = document.getElementById("playList");
const usePlayListCheckbox = document.getElementById("usePlayList");

const definitionDetails = document.getElementById("definition");
const englishDetails = document.getElementById("englishDetails");
const arabicDetails = document.getElementById("arabicDetails");
const answer = document.getElementById("answer");
const answerDetails = document.getElementById("answerDetails");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const speakingIndicator = document.getElementById("speakingIndicator");

// Mobile Playlist Filter Elements
let mobilePlaylistInput = null;
let mobilePlaylistSuggestions = null;

// ========== LOAD DATA FROM JSON ==========
async function loadData() {
  try {
    const response = await fetch('Intro_ls0_unit_1_audio.json');
    const data = await response.json();

    // ── NEW: read title from JSON root ──────────────────────────────
    if (data.title) {
      document.title = data.title;
      const titleEl = document.getElementById("lessonTitle");
      if (titleEl) titleEl.textContent = data.title;
    }
    // ───────────────────────────────────────────────────────────────

    Sentences = data.sentences;
    buildDefaultNav();
    displayData();
    initializeMobilePlaylistFilter();
  } catch (error) {
    console.error('Error loading data_01.json:', error);
    alert('Failed to load lesson data. Please check that data_01.json exists.');
  }
}

// ========== MOBILE PLAYLIST FILTER ==========
function initializeMobilePlaylistFilter() {
  // Check if mobile filter already exists
  if (mobilePlaylistInput) return;

  // Create mobile filter container
  const filterContainer = document.createElement("div");
  filterContainer.id = "mobilePlaylistFilter";
  filterContainer.style.cssText = `
    display: none;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 12px;
  `;

  // Create input field
  mobilePlaylistInput = document.createElement("input");
  mobilePlaylistInput.type = "text";
  mobilePlaylistInput.placeholder = "Type word/numbers (e.g., 'hello' or '1,3,5' or '1-5')";
  mobilePlaylistInput.style.cssText = `
    width: 100%;
    padding: 10px;
    border: 2px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
  `;

  // Create suggestions container
  mobilePlaylistSuggestions = document.createElement("div");
  mobilePlaylistSuggestions.id = "mobilePlaylistSuggestions";
  mobilePlaylistSuggestions.style.cssText = `
    margin-top: 8px;
    padding: 8px;
    background: white;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 14px;
    color: #666;
    display: none;
  `;

  // Create apply button
  const applyBtn = document.createElement("button");
  applyBtn.textContent = "Apply Filter";
  applyBtn.style.cssText = `
    width: 100%;
    margin-top: 8px;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
  `;

  // Append elements
  filterContainer.appendChild(mobilePlaylistInput);
  filterContainer.appendChild(mobilePlaylistSuggestions);
  filterContainer.appendChild(applyBtn);

  // Insert after playList element
  const mainElement = document.querySelector("main");
  if (mainElement && playList) {
    mainElement.insertBefore(filterContainer, playList.parentElement);
  } else if (mainElement) {
    mainElement.insertBefore(filterContainer, mainElement.firstChild);
  }

  // Event listeners
  mobilePlaylistInput.addEventListener("input", function () {
    updateMobilePlaylistSuggestions(this.value);
  });

  mobilePlaylistInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      applyMobilePlaylistFilter();
    }
  });

  applyBtn.addEventListener("click", applyMobilePlaylistFilter);

  // Show filter on mobile only
  if (window.innerWidth <= 768) {
    filterContainer.style.display = "block";
  }

  // Handle responsive visibility
  window.addEventListener("resize", function () {
    filterContainer.style.display = window.innerWidth <= 768 ? "block" : "none";
  });
}

function updateMobilePlaylistSuggestions(input) {
  if (!input.trim()) {
    mobilePlaylistSuggestions.style.display = "none";
    return;
  }

  const suggestions = [];
  const lowerInput = input.toLowerCase();

  // Check if input is numeric
  const isNumeric = /^[\d,\-\s]*$/.test(input);

  if (isNumeric) {
    suggestions.push("📋 Numbers detected: Will create playlist from: " + input);
  } else {
    // Search for matching keywords
    const matches = [];
    Sentences.forEach((sentence, idx) => {
      if (
        (sentence.english && sentence.english.toLowerCase().includes(lowerInput)) ||
        (sentence.arabic && sentence.arabic.toLowerCase().includes(lowerInput)) ||
        (sentence.keyWord && sentence.keyWord.toLowerCase().includes(lowerInput))
      ) {
        matches.push(idx + 1); // 1-indexed for display
      }
    });

    if (matches.length === 0) {
      suggestions.push("❌ No matches found for: \"" + input + "\"");
    } else {
      suggestions.push("✅ Found in clips: " + matches.join(", "));
    }
  }

  mobilePlaylistSuggestions.innerHTML = suggestions.join("<br>");
  mobilePlaylistSuggestions.style.display = "block";
}

function applyMobilePlaylistFilter() {
  const inputValue = mobilePlaylistInput.value.trim();

  if (!inputValue) {
    alert("Please enter a word, numbers, or range to filter.");
    return;
  }

  // Set the desktop playlist input to the same value
  playList.value = inputValue;

  // Enable playlist mode
  usePlayListCheckbox.checked = true;
  enablePlaylistMode();

  // Clear input
  mobilePlaylistInput.value = "";
  mobilePlaylistSuggestions.style.display = "none";
}

// ========== SCRAMBLE FUNCTION ==========
function scrambleWords(text) {
  const words = text.split(" ");
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.join(" ");
}

function toggleScramble() {
  const englishText = english.textContent.trim();
  if (!englishText) return;

  isScrambled = !isScrambled;
  if (isScrambled) {
    scrambledText.textContent = scrambleWords(englishText);
    scrambledText.style.display = "block";
    englishDetails.open = false;
  } else {
    scrambledText.textContent = "";
    scrambledText.style.display = "none";
    speakScrambledCheckbox.checked = false;
  }
}

scrambleCheckbox.addEventListener("change", toggleScramble);

// ========== SPEAK SCRAMBLED FUNCTION WITH PAUSES ==========
function speakScrambledWithPauses() {
  const scrambledTextContent = document.getElementById("scrambledText").textContent.trim();
  if (!scrambledTextContent) {
    alert("Please scramble the text first before speaking.");
    speakScrambledCheckbox.checked = false;
    return;
  }

  const words = scrambledTextContent.split(" ");
  let wordIndex = 0;

  function speakNextWord() {
    if (wordIndex >= words.length) {
      isSpeaking = false;
      updateSpeakingUI();
      return;
    }

    const word = words[wordIndex];
    const utteranceWord = new SpeechSynthesisUtterance(word);
    utteranceWord.lang = "en-US";
    utteranceWord.rate = 0.8;

    utteranceWord.onstart = function () {
      isSpeaking = true;
      updateSpeakingUI();
    };

    utteranceWord.onend = function () {
      wordIndex++;
      setTimeout(speakNextWord, 500);
    };

    speechSynthesis.speak(utteranceWord);
  }

  speechSynthesis.cancel();
  isSpeaking = true;
  updateSpeakingUI();
  speakNextWord();
}

speakScrambledCheckbox.addEventListener("change", function () {
  if (this.checked) {
    speakScrambledWithPauses();
  } else {
    speechSynthesis.cancel();
    isSpeaking = false;
    updateSpeakingUI();
  }
});

function seqRange(input) {
  let seq = input.split("-")[0];
  seq = seq.split(",").map(Number);

  let rnge = input.split(",").pop();
  const startingRange = rnge.split("-")[0];
  const endingRange = rnge.split("-")[1];

  rnge = range(Number(startingRange), Number(endingRange));
  const combined = [...seq, ...rnge];

  return [...new Set(combined)];
}

// ========== LOOKUP TEXT FUNCTION ==========
function lookupText(txt) {
  const numScripts = [];
  const re = new RegExp(`\\b${txt}\\b`);

  for (const [i, sentence] of Sentences.entries()) {
    if (re.test(sentence.english.toLowerCase())) {
      numScripts.push(i);
    }
  }
  
  if (numScripts.length === 0) {
    alert("There aren't any scripts that contain this keyword ");
    return "alert";
  }

  return numScripts;
}

// ========== PLAYLIST MODE FUNCTIONS ==========
function buildDefaultNav() {
  navIndices = Array.from({ length: Sentences.length }, (_, i) => i);
  navPos = currentAudioIndex;
  usePlayListMode = false;
}

function range(start, end) {
  return Array.from(
    { length: end - start + 1 },
    (_, i) => start + i
  );
}

function parsePlayListInput(text) {
  const indices = [];
  const seen = new Set();

  if (!text) return [];
  else if (text.includes("-") && text.includes(",")) {
    return seqRange(text);
  } else if (text.includes("-")) {
    var tokens = text.split("-").map(t => t.trim()).filter(Boolean);

    let start = parseInt(tokens[0], 10);
    if (start === 0) {
      start = 1;
    }
    let end = parseInt(tokens[1], 10);

    if (start > end || start === end) {
      alert("the starting range shouldn't be smaller or equal than the end parameter, recheck the provided range");
      return 'alert';
    }

    return range(start - 1, end - 1);
  } else if (text.includes(",")) {
    var tokens = text.split(",").map(t => t.trim()).filter(Boolean);

    tokens.forEach(tok => {
      const n = parseInt(tok, 10);
      if (!Number.isFinite(n)) return;

      const idx = n - 1;
      if (idx < 0 || idx >= Sentences.length) return;

      if (!seen.has(idx)) {
        seen.add(idx);
        indices.push(idx);
      }
    });

    return indices;
  } else if (typeof text === "string") {
    console.log("got a string");
    return lookupText(text.toLowerCase());
  }
}

function enablePlaylistMode() {
  const indices = parsePlayListInput(playList.value);

  if (indices.length === 0 || indices === 'alert') {
    usePlayListCheckbox.checked = false;
    alert("Playlist is empty or invalid. Enter numbers like: 1, 3, 5");
    return;
  }

  usePlayListMode = true;
  navIndices = indices;

  const currentInList = navIndices.indexOf(currentAudioIndex);
  navPos = currentInList >= 0 ? currentInList : 0;

  displayData();
}

function disablePlaylistMode() {
  buildDefaultNav();
  displayData();
}

usePlayListCheckbox.addEventListener("change", function () {
  if (usePlayListCheckbox.checked) {
    enablePlaylistMode();
  } else {
    disablePlaylistMode();
  }
});

playList.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && usePlayListCheckbox.checked) {
    enablePlaylistMode();
  }
});

// ========== SPEAK BUTTONS ==========
speakEnglishBtn.addEventListener("click", function () {
  const s = Sentences[currentAudioIndex];
  if (s && s.english && s.english.trim()) {
    const cleanedText = s.english.replace(/<br\s*\/?>/gi, " ");
    utterance.text = cleanedText;
    utterance.lang = "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    isSpeaking = true;
    updateSpeakingUI();
    utterance.onend = function () {
      isSpeaking = false;
      updateSpeakingUI();
    };
  }
});

speakArabicBtn.addEventListener("click", function () {
  const s = Sentences[currentAudioIndex];
  if (s && s.arabic && s.arabic.trim()) {
    const cleanedText = s.arabic.replace(/<br\s*\/?>/gi, " ");
    utterance.text = cleanedText;
    utterance.lang = "ar-SA";
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    isSpeaking = true;
    updateSpeakingUI();
    utterance.onend = function () {
      isSpeaking = false;
      updateSpeakingUI();
    };
  }
});

speakSelectionBtn.addEventListener("click", function () {
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) return;

  utterance.text = selectedText;
  utterance.lang = "en-US";
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  isSpeaking = true;
  updateSpeakingUI();
  utterance.onend = function () {
    isSpeaking = false;
    updateSpeakingUI();
  };
});

stopBtn.addEventListener("click", function () {
  speechSynthesis.cancel();
  isSpeaking = false;
  updateSpeakingUI();
});

// ========== NAVIGATION ==========
function updateButtonState() {
  prevBtn.disabled = navPos === 0;
  nextBtn.disabled = navPos === navIndices.length - 1;
}

function displayData() {
  if (navPos < 0) navPos = 0;
  if (navPos > navIndices.length - 1) navPos = navIndices.length - 1;

  currentAudioIndex = navIndices[navPos];
  const s = Sentences[currentAudioIndex];

  q.textContent =
    (navPos + 1) + "/" + navIndices.length +
    " (Clip " + (currentAudioIndex + 1) + "/" + Sentences.length + ")";

  refer_to.textContent = s.refer_to || "";
  back_to.textContent = s.back_to || "";

  const referToContainer = document.getElementById("refer_to_container");
  const backToContainer = document.getElementById("back_to_container");

  referToContainer.style.display = s.refer_to && s.refer_to.trim() ? "block" : "none";
  backToContainer.style.display = s.back_to && s.back_to.trim() ? "block" : "none";

  keyWords.innerHTML = s.keyWord || "";
  speaker.innerHTML = s.speaker || "";
  def.innerHTML = s.definition || "";
  english.innerHTML = s.english || "";
  arabic.innerHTML = s.arabic || "";
  audio.src = s.audio || "";
  audio.load();
  answer.innerHTML = s.answer || "";

  scrambledText.textContent = "";
  isScrambled = false;
  scrambleCheckbox.checked = false;
  speakScrambledCheckbox.checked = false;
  scrambledText.style.display = "none";

  questionBasedOnAudio.innerHTML = s.audioQuestion && s.audioQuestion.trim()
    ? "<details aria-label='Audio question'><summary>Question</summary>" + s.audioQuestion + "</details>"
    : "";

  answerDetails.style.display = s.answer && s.answer.trim() ? "block" : "none";
  definitionDetails.style.display = s.definition && s.definition.trim() ? "block" : "none";
  englishDetails.style.display = s.english && s.english.trim() ? "block" : "none";
  arabicDetails.style.display = s.arabic && s.arabic.trim() ? "block" : "none";

  if (s.Image && s.Image.trim() !== "" && s.Image !== ".jpg") {
    image.src = s.Image;
    image.style.display = "block";
    illustrationDetails.style.display = "block";
    illustrationDetails.open = false;
  } else {
    image.removeAttribute("src");
    image.style.display = "none";
    illustrationDetails.style.display = "none";
  }

  updateButtonState();
}

function resetDetails() {
  definitionDetails.open = false;
  englishDetails.open = false;
  arabicDetails.open = false;
  answerDetails.open = false;
  illustrationDetails.open = false;
}

function scrollToTop() {
  document.querySelector("main").scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function nextSentence() {
  speechSynthesis.cancel();
  isSpeaking = false;

  if (navPos < navIndices.length - 1) {
    navPos++;
    displayData();
    resetDetails();
    scrollToTop();
    if (autoPlayCheckbox.checked) {
      audio.play().catch(function () {});
    }
  }
}

function prevSentence() {
  speechSynthesis.cancel();
  isSpeaking = false;

  if (navPos > 0) {
    navPos--;
    displayData();
    resetDetails();
    scrollToTop();
    if (autoPlayCheckbox.checked) {
      audio.play().catch(function () {});
    }
  }
}

nextBtn.addEventListener("click", nextSentence);
prevBtn.addEventListener("click", prevSentence);

document.getElementById("search").addEventListener("click", function () {
  const entered = parseInt(audioIndexInput.value, 10);
  if (!Number.isFinite(entered)) {
    alert("Enter a valid number.");
    return;
  }

  const idx = entered - 1;

  if (idx < 0 || idx >= Sentences.length) {
    alert("Enter a number between 1 and " + Sentences.length);
    return;
  }

  if (usePlayListCheckbox.checked) {
    const pos = navIndices.indexOf(idx);
    if (pos === -1) {
      alert("That clip is not in your playlist subset.");
      return;
    }
    navPos = pos;
    displayData();
  } else {
    navPos = idx;
    displayData();
  }
});

audioIndexInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    document.getElementById("search").click();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") nextSentence();
  if (e.key === "ArrowLeft") prevSentence();
});

function updateSpeakingUI() {
  if (isSpeaking) {
    speakingIndicator.classList.add("active");
  } else {
    speakingIndicator.classList.remove("active");
  }
}

// Initialize
let touchStartX = 0;

document.addEventListener("touchstart", function (e) {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener("touchend", function (e) {
  const touchEndX = e.changedTouches[0].screenX;

  if (touchEndX < touchStartX - 50) {
    nextSentence();
  }

  if (touchEndX > touchStartX + 50) {
    prevSentence();
  }
});

loadData();
