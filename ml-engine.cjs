/**
 * ALACOR S.A.S. – ML Classification Engine
 * TF-IDF vectorization + Cosine Similarity retrieval.
 * Pure Node.js CommonJS — zero external dependencies.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const TRAINING_FILE  = path.join(__dirname, 'training_data.json');
const UNMATCHED_FILE = path.join(__dirname, 'unmatched_queries.json');
const THRESHOLD      = 0.35;   // minimum confidence to return an answer

// ── Spanish stopwords ─────────────────────────────────────────────────────────
const STOPWORDS = new Set([
  'a','al','algo','alguna','algunas','algunos','algún','ante','antes','aunque',
  'bien','cada','cómo','como','con','cual','cuál','cuáles','cuando','cuándo',
  'de','del','desde','donde','dónde','el','ella','ellas','ellos','en','eres',
  'es','eso','esta','estas','este','estos','fue','gran','hay','la','las','le',
  'les','lo','los','mas','más','me','mi','mis','mucho','muchos','muy','nada',
  'no','nos','o','para','pero','por','que','qué','quien','quién','se','si',
  'sí','sin','sobre','solo','sólo','son','su','sus','también','te','tengo',
  'tienen','tienen','todo','todos','tu','tú','un','una','unas','unos','y','yo',
  'hola','buenos','dias','tardes','noches','favor','gracias','ayuda','quiero',
  'busco','necesito','tienen','manejan','venden','cuentan','tienen','cuales',
  'qué','hay','disponible','disponibles','modelos','modelo','tipo','tipos'
]);

// ── Internal state ────────────────────────────────────────────────────────────
let trainingData  = [];   // [ { id, input, answer, category, approved, addedAt } ]
let tfidfVectors  = [];   // parallel array of TF-IDF vectors
let idfWeights    = {};   // global IDF table

// ── Persistence ───────────────────────────────────────────────────────────────
function loadTrainingData() {
  try {
    if (fs.existsSync(TRAINING_FILE)) {
      trainingData = JSON.parse(fs.readFileSync(TRAINING_FILE, 'utf8'));
      buildIndex();
      console.log(`[ML] Loaded ${trainingData.length} training examples across ${getStats().categories} categories.`);
    }
  } catch (e) {
    console.error('[ML] Error loading training_data.json:', e.message);
    trainingData = [];
  }
}

function saveTrainingData() {
  fs.writeFileSync(TRAINING_FILE, JSON.stringify(trainingData, null, 2), 'utf8');
}

function loadUnmatched() {
  try {
    if (fs.existsSync(UNMATCHED_FILE))
      return JSON.parse(fs.readFileSync(UNMATCHED_FILE, 'utf8'));
  } catch (_) {}
  return [];
}

function persistUnmatched(data) {
  fs.writeFileSync(UNMATCHED_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Spanish Stemming Helper ──────────────────────────────────────────────────
function stemToken(word) {
  if (word.length <= 3) return word;
  let stemmed = word;
  if (stemmed.endsWith('ciones')) stemmed = stemmed.slice(0, -6) + 'cion';
  else if (stemmed.endsWith('cion')) stemmed = stemmed;
  else if (stemmed.endsWith('idades')) stemmed = stemmed.slice(0, -6) + 'idad';
  else if (stemmed.endsWith('mente')) stemmed = stemmed.slice(0, -5);
  else if (stemmed.endsWith('es') && stemmed.length > 4) stemmed = stemmed.slice(0, -2);
  else if (stemmed.endsWith('s') && stemmed.length > 3 && !stemmed.endsWith('ss')) stemmed = stemmed.slice(0, -1);
  return stemmed;
}

// ── Text processing ───────────────────────────────────────────────────────────
function tokenize(text) {
  const rawTokens = text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // strip diacritics
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));

  const stems = rawTokens.map(stemToken);
  const bigrams = [];
  for (let i = 0; i < stems.length - 1; i++) {
    bigrams.push(`${stems[i]}_${stems[i + 1]}`);
  }

  return [...stems, ...bigrams];
}

function buildTF(tokens) {
  const freq = {};
  tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
  const total = tokens.length || 1;
  const tf = {};
  Object.keys(freq).forEach(t => { tf[t] = freq[t] / total; });
  return tf;
}

// ── TF-IDF index builder ──────────────────────────────────────────────────────
function buildIndex() {
  const N = trainingData.length;
  if (N === 0) { tfidfVectors = []; idfWeights = {}; return; }

  // Document frequency
  const df = {};
  trainingData.forEach(ex => {
    const unique = new Set(tokenize(ex.input));
    unique.forEach(t => { df[t] = (df[t] || 0) + 1; });
  });

  // IDF with Laplace smoothing
  idfWeights = {};
  Object.keys(df).forEach(t => {
    idfWeights[t] = Math.log((N + 1) / (df[t] + 1)) + 1;
  });

  // Build per-example TF-IDF vectors
  tfidfVectors = trainingData.map(ex => {
    const tokens = tokenize(ex.input);
    const tf     = buildTF(tokens);
    const vec    = {};
    Object.keys(tf).forEach(t => { vec[t] = tf[t] * (idfWeights[t] || 1); });
    return vec;
  });
}

function vectorizeQuery(query) {
  const tokens = tokenize(query);
  const tf     = buildTF(tokens);
  const vec    = {};
  Object.keys(tf).forEach(t => {
    vec[t] = tf[t] * (idfWeights[t] || Math.log(2));   // unknown terms: small weight
  });
  return vec;
}

// ── Cosine similarity ─────────────────────────────────────────────────────────
function cosineSim(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, mA = 0, mB = 0;
  for (const k of keys) {
    const va = a[k] || 0, vb = b[k] || 0;
    dot += va * vb; mA += va * va; mB += vb * vb;
  }
  return (mA > 0 && mB > 0) ? dot / (Math.sqrt(mA) * Math.sqrt(mB)) : 0;
}

// ── Public API ────────────────────────────────────────────────────────────────
function classify(query) {
  if (trainingData.length === 0)
    return { matched: false, score: 0, answer: null, text: null, category: null, exampleId: null };

  const qVec    = vectorizeQuery(query);
  let bestScore = 0;
  let bestIdx   = -1;

  tfidfVectors.forEach((vec, i) => {
    const s = cosineSim(qVec, vec);
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  });

  const pct = Math.round(bestScore * 100);

  if (bestScore >= THRESHOLD && bestIdx >= 0) {
    const ex = trainingData[bestIdx];
    return { matched: true, score: pct, answer: ex.answer, text: ex.answer, category: ex.category, exampleId: ex.id };
  }
  return { matched: false, score: pct, answer: null, text: null, category: null, exampleId: null };
}

function addExample(input, answer, category) {
  const id = `ex_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  trainingData.push({
    id, input: input.trim(), answer: answer.trim(),
    category: category || 'general',
    approved: true,
    addedAt: new Date().toISOString()
  });
  saveTrainingData();
  buildIndex();
  console.log(`[ML] New example added (id=${id}). Total: ${trainingData.length}`);
  return id;
}

function saveUnmatchedQuery(query, sessionId, score) {
  const list = loadUnmatched();
  const norm = query.toLowerCase().trim();
  if (!list.some(u => u.query.toLowerCase().trim() === norm && !u.resolved)) {
    list.unshift({
      id: `umq_${Date.now()}`,
      query: query.trim(),
      sessionId,
      score,
      timestamp: new Date().toISOString(),
      resolved: false
    });
    persistUnmatched(list.slice(0, 300));
  }
}

function getUnmatchedQueries() {
  return loadUnmatched().filter(u => !u.resolved);
}

function resolveUnmatched(id) {
  const list = loadUnmatched();
  const idx  = list.findIndex(u => u.id === id);
  if (idx >= 0) { list[idx].resolved = true; persistUnmatched(list); return true; }
  return false;
}

function getTrainingExamples() {
  return trainingData;
}

function getStats() {
  return {
    totalExamples:   trainingData.length,
    categories:      [...new Set(trainingData.map(e => e.category))].length,
    categoryList:    [...new Set(trainingData.map(e => e.category))],
    unmatchedPending: getUnmatchedQueries().length,
    threshold:       THRESHOLD
  };
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
loadTrainingData();

module.exports = { classify, addExample, saveUnmatchedQuery, getUnmatchedQueries, resolveUnmatched, getStats, getTrainingExamples };
