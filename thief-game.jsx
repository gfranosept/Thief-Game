import { useState, useEffect, useCallback, useRef } from “react”;

// ─ CONSTANTS ─────────────────────────────────────────────────────────────────
var MAX_LIFE = 8;
var MAX_SANITY = 10;
var SANITARIUM_COST = 10;
var ALL_CHARS = [
“THE SINNER”,“THE HUNTER”,“THE CLAIRVOYANT”,“THE DOCTOR”,
“THE UNSTABLE”,“THE AGENT”,“THE BOTANIST”,“THE LAWYER”,
“THE SELLER”,“THE PAINTER”,“THE VAMPIRE”,“THE UNDERTAKER”,
“THE AFTERIMAGE”,“THE LOVERMAN”,“THE ILLUSIONIST”
];
var INSANITY_LIST = [“Lavish”,“Masochist”,“Conceit”,“Boast”];
var INSANITY_DESC = {
Lavish:    “Discard 2 coins every coin room turn.”,
Masochist: “Masacree deals 4 damage instead of 2.”,
Conceit:   “Take nothing from coin rooms.”,
Boast:     “Cannot use active skills.”
};
var CHAR_INFO = {
“THE SINNER”:      { icon:“⍜”,  tag:“Greed made flesh.”,                    color:”#7a3a4a” },
“THE HUNTER”:      { icon:“⌖”,  tag:“Every kill is a payday.”,              color:”#5a7a2a” },
“THE CLAIRVOYANT”: { icon:“ꀦ”,  tag:“She sees what walls hide.”,            color:”#2a4a7a” },
“THE DOCTOR”:      { icon:“⚕”,  tag:“First do no harm. Then collect coins.”,color:”#4a7a6a” },
“THE UNSTABLE”:    { icon:“☽”,  tag:“Two souls. One body. No mercy.”,       color:”#6a2a7a” },
“THE AGENT”:       { icon:“⌬”,  tag:“Watch everything. Trust no one.”,      color:”#2a2a5a” },
“THE BOTANIST”:    { icon:“⚘”,  tag:“She doesn’t attack. She just gardens.”,color:”#2a5a2a” },
“THE LAWYER”:      { icon:“⊜”,  tag:“Every deal has fine print.”,           color:”#7a6a2a” },
“THE SELLER”:      { icon:“✦”,  tag:“Everything has a price.”,              color:”#7a5a1a” },
“THE PAINTER”:     { icon:“ꃳ”,  tag:“Any face. Any power.”,                 color:”#7a2a9a” },
“THE VAMPIRE”:     { icon:“♱”,  tag:“The blood remembers everything.”,      color:”#8a1a2a” },
“THE UNDERTAKER”:  { icon:“⌂”,  tag:“Every death is an opportunity.”,       color:”#4a3a6a” },
“THE AFTERIMAGE”:  { icon:“∰”, tag:“You saw them. But were they there?”,   color:”#2a6a8a” },
“THE LOVERMAN”:    { icon:“⚭”,  tag:“Love is the deadliest curse.”,         color:”#cc4477” },
“THE ILLUSIONIST”: { icon:“◬”,  tag:“Nothing you see is real.”,             color:”#7a6a3a” }
};
var HOW_TO = [
{ title:“THE MANSION”,    icon:“⊜”, text:“The game takes place in a Mansion filled with rooms. Each room hides coins or a Guardian. Rooms are randomly arranged each game - nobody knows what’s behind any door.” },
{ title:“TAKING TURNS”,   icon:“◆”, text:“Players take turns opening one room per turn. Select a room on the grid then confirm. Some skills allow extra actions before opening.” },
{ title:“COINS”,          icon:“✦”, text:“Opening a coin room earns 1 coin. Most coins at game end wins. Coins only transfer to your wallet if you survive the game.” },
{ title:“GUARDIANS”,      icon:“ᛏ”, text:“Two types lurk inside:\n\nᛏ Masacree Guardian - hurls an axe. You lose 2 Life (or 4 with Masochist insanity).\n\n꩜ Dimensional Guardian - haunts your mind. Sanity +2.” },
{ title:“LIFE ESSENCE”,   icon:“HP”, text:“Every player starts with 8 Life. If it reaches zero you die - all coins are lost. In 1v1, the game ends immediately when either player dies.” },
{ title:“SANITY”,         icon:“ꀦ”, text:“Sanity starts at 0 and rises from Dimensional Guardians. At 10 you get a random Insanity:\n\n- Lavish - lose 2 coins per coin room\n- Masochist - double axe damage\n- Conceit - take nothing from coin rooms\n- Boast - cannot use active skills\n\nInsanity persists between games until cleansed.” },
{ title:“SANITARIUM”,     icon:“⚕”, text:“Access from the main menu via your Profile. Costs 10 coins to perform Cleansing Soul and remove insanity. Insanity carries into your next game if not cleansed.” },
{ title:“BANNING & PICKING”,icon:“ꃳ”, text:“Before each game, players ban characters in turns. Then pick in order. You can ban any character - but can only pick characters you own.” },
{ title:“WIN CONDITION”,  icon:“✦”, text:“Game ends when all rooms are opened or all but one player are dead. Most coins wins. VS AI: game ends the moment you or all opponents die.” }
];
var CHAR_SKILLS = {
“THE SINNER”: [
{ name:“Unsatisfied Desire”, type:“Φ”, limit:“∞”, desc:“When The Sinner opens a coin room, he opens another immediately. Chain continues until a non-coin room - or Conceit blocks the reward.” }
],
“THE HUNTER”: [
{ name:“Hunting Trophy”,  type:“Φ”, limit:“∞”, desc:“Every Guardian kill earns +2 coins. Always active.” },
{ name:“Eyes on Prey”,    type:“Φ”, limit:“4”,  desc:“Nullifies all damage from Guardian encounters. When exhausted, Hunter takes normal damage but Trophy still fires.” }
],
“THE CLAIRVOYANT”: [
{ name:“Third Eyes”,  type:“Φ”, limit:“1”, desc:“On first Guardian encounter, reveals 6 other Guardian rooms - visible to Clairvoyant only.” },
{ name:“Mind Havoc”,  type:“Δ”, limit:“2”, desc:“Seize control of 3 players. Assign each a room to open. They are helpless. Controlled players passives still fire.” }
],
“THE DOCTOR”: [
{ name:“Care Pack”,     type:“Φ”, limit:“1”, desc:“Auto-triggers when Doctor Life drops to 2. Restores to full. Bound to Oath takes priority.” },
{ name:“Self-Therapy”,  type:“Δ”, limit:“1”, desc:“Resets sanity to 0 and clears insanity. Immune to next Dimensional Guardian. Costs a turn.” },
{ name:“Bound to Oath”, type:“Φ”, limit:“3”, desc:“When any other player hits exactly 2 Life, they get +2 Life but must pay 1 coin. No coin = no trigger.” }
],
“THE UNSTABLE”: [
{ name:“Soul Switching”, type:“Φ”, limit:“∞”, desc:”[Emily] Encountering a Guardian instantly shifts to [Maria]. [Maria] Immune to all Guardians. +2 Sanity per turn from herself only. After 2 coin rooms in Maria mode, reverts to Emily with Sanity -5.” }
],
“THE AGENT”: [
{ name:“Spy Camera”,             type:“Δ”, limit:“1”, desc:“Install cameras in 5 rooms. Contents revealed to Agent only. Rooms show [LIVE] status.” },
{ name:“Trap Wire Bomb”,         type:“Δ”, limit:“1”, desc:“Plant a bomb in any room. Anyone who opens it - including yourself - loses 7 Life.” },
{ name:“Eliminate All Evidence”, type:“Φ”, limit:“∞”, desc:“When a player dies in a Live room, all their coins transfer to The Agent.” }
],
“THE BOTANIST”: [
{ name:“Conium Maculatum”, type:“Φ”, limit:“∞”, desc:“On Guardian encounter, spreads poison to adjacent rooms. Poison stacks up to 2 (max -4 damage). Clears after one victim. Poison is invisible. Botanist immune to her own poison only.” }
],
“THE LAWYER”: [
{ name:“Inter-Dimention Negotiator”, type:“Φ”, limit:“3”, desc:“On Dimensional encounter a popup appears: Negotiate (block sanity, use 1 charge) or Refuse (take +2 sanity, keep charge).” },
{ name:“Fake Justice”,               type:“Δ”, limit:“1”, desc:“Mark a player. At 4 or below Life they inherit all players sanity and get +5 Life. At game end they owe 5 coins. Contract survives their death. Lawyer death voids the mark.” }
],
“THE SELLER”: [
{ name:“Supplies”,    type:“Φ”, limit:“1”, desc:“Starts with 7 bonus coins and +3 max Life.” },
{ name:“Soul Trader”, type:“Δ”, limit:“∞”, desc:“1 Coin = 2 Life. 1 Life = 2 Coins. Seller chooses who trades. Seller coins floored at 0. End game: if coins >= 7, exactly 7 are deducted.” }
],
“THE PAINTER”: [
{ name:“Make-Up Box”, type:“Φ”, limit:“∞”, desc:“Collect one box from every coin room opened.” },
{ name:“Disguise”,    type:“Δ”, limit:“1”, desc:“Requires 5 boxes. Fully copy a living character - all skills fresh. +1 Sanity per turn while disguised.” },
{ name:“Drop Mask”,   type:“Δ”, limit:“1”, desc:“End disguise immediately. Stops sanity drain. Loses borrowed skills. No refund.” }
],
“THE VAMPIRE”: [
{ name:“Sanguinis Odium”,       type:“Φ”, limit:“∞”, desc:“The Vampire smells blood. Any player struck by the Masacree Guardian has all their stats permanently revealed to The Vampire.” },
{ name:“Curse of the Immortal”, type:“Φ”, limit:“∞”, desc:“All HP damage is nullified. The Vampire cannot lose Life. But mind is fragile: every time Sanity would increase, it increases by 1 extra.” },
{ name:“Red-Out Massacre”,      type:“Δ”, limit:“1”, desc:“Requires 6+ Coins, 6+ HP, 6+ Sanity. Damage = total Masacree rooms opened divided by living opponents. Hits all opponents only.” }
],
“THE UNDERTAKER”: [
{ name:“Proper Burial”, type:“Δ”, limit:“1”, desc:“Activate to begin collecting all coins from every player who dies from this point forward. Costs a turn.” },
{ name:“EX-Saint”,      type:“Δ”, limit:“3”, desc:“Bless a target player (or yourself). They take no Sanity damage from the next Dimensional Guardian they hit.” },
{ name:“Raise!”,        type:“Δ”, limit:“1”, desc:“Choose a dead player. Revive their corpse for 2 of their turns. Undertaker controls it: opens doors, gains nothing. Then the corpse disappears again.” }
],
“THE AFTERIMAGE”: [
{ name:“Quantum Overload Tunneling”, type:“Δ”, limit:“1”, desc:“Move at quantum speed through 8 rooms at once. Take all coins, damage and sanity silently - nothing appears in the log. Doors remain visually closed but contents are gone. Cannot be traced.” },
{ name:“Misdirection”,               type:“Δ”, limit:“1”, desc:“Rearrange up to 3 rooms - move their contents into 1 target room. The target room stacks all moved contents. Emptied source rooms become empty. Planted bombs cannot be moved.” },
{ name:“Butterfly Effect”,           type:“Φ”, limit:“∞”, desc:“When any opponent at 3, 2 or 1 HP opens a room emptied by Quantum Overload Tunneling, they are struck by quantum residue: +4 Sanity.” }
],
“THE LOVERMAN”: [
{ name:“The Loverman Oath”,       type:“Δ”, limit:“1”,  desc:“Choose a player to swear your heart to. A prompt appears for them: Accept, Reject, or Hang. Each response triggers a different permanent state.” },
{ name:“Devastated”,              type:“Φ”, limit:“1”,  desc:”[Tower state] On rejection: all players in the arena instantly gain +5 Sanity.” },
{ name:“Gate of Despair”,         type:“Φ”, limit:“∞”,  desc:”[Tower state] Every time any opponent opens a Dimensional Guardian room, their sanity spreads to ALL players except The Loverman.” },
{ name:“Lovestruck”,              type:“Φ”, limit:“1”,  desc:”[Lovers state] On acceptance: remove all insanity from the accepted player and reset ALL player sanity bars to 0.” },
{ name:“Till death do us a part”, type:“Φ”, limit:“∞”,  desc:”[Lovers state] Loverman and partner share all damage and coins equally. Unless BOTH reach 1 HP simultaneously, each shields the other from death. If both hit 0/1 at same time, they die together.” },
{ name:“The Promised Happy End”,  type:“Φ”, limit:“∞”,  desc:”[Hangman state] Drain 1 HP from the hung player at the start of each of their turns. Give it to The Loverman.” }
],
“THE ILLUSIONIST”: [
{ name:“Fake Death”,               type:“Φ”, limit:“1”, desc:“When HP first hits 0, The Illusionist fakes death. Remains hidden - cannot take turns but can see all logs and stats. Reactivates as last player standing.” },
{ name:“Do you believe in reality?”,type:“Δ”, limit:“3”, desc:“All skills and actions targeting The Illusionist are redirected back to the caster instead. Loverman’s Oath bypasses this shield.” }
]
};

// ─ HELPERS ───────────────────────────────────────────────────────────────────
function getRoomCount(n) {
if (n === 2) return 40;
if (n === 3) return 45;
if (n === 4) return 50;
if (n === 5) return 55;
return 60;
}
function shuffle(arr) {
var a = arr.slice();
for (var i = a.length - 1; i > 0; i–) {
var j = Math.floor(Math.random() * (i + 1));
var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
}
return a;
}
function genRooms(n) {
var total = getRoomCount(n);
var mas   = Math.floor(total * 0.23);
var dim   = Math.floor(total * 0.23);
var coins = total - mas - dim;
var arr = [];
for (var i = 0; i < coins; i++) arr.push(“coins”);
for (var i = 0; i < mas; i++)   arr.push(“masacree”);
for (var i = 0; i < dim; i++)   arr.push(“dimensional”);
arr = shuffle(arr);
return arr.map(function(type, idx) {
return { id: idx + 1, type: type, opened: false, poison: 0, poisonOwner: -1, emptied: false, stackedContents: null };
});
}
function rollInsanity() {
return INSANITY_LIST[Math.floor(Math.random() * INSANITY_LIST.length)];
}

function makePlayer(name, char, id, isHuman, startInsanity) {
var p = {
id: id, name: name, character: char, isHuman: isHuman,
life: MAX_LIFE, sanity: 0, coins: 0,
insanity: startInsanity || null,
alive: true, skills: {}, immune: false, revealed: {},
disguisedAs: null, persona: null, mariaCoins: 0,
spyCamRooms: [], bombRoom: -1, fakeJusticeTarget: -1,
coloringBoxes: 0, deathCause: null, deathRoom: -1,
sellerCursed: false, fakeJusticePaid: 0, fakeJusticeCollected: 0,
vampireBloodSeen: {},
properBurialActive: false,
exSaintBlessed: false,
raisedCorpse: null,
quantumRooms: [],
lovermanState: null,
lovermanTarget: -1,
loveBondPartner: -1,
loveMarkStatus: null,
devastatedFired: false,
lovestuckFired: false,
fakeDead: false,
illusionistShield: 0
};
if (char === “THE SELLER”)      { p.coins = 7; p.life = MAX_LIFE + 3; }
if (char === “THE HUNTER”)      { p.skills[“Eyes on Prey”] = 4; }
if (char === “THE UNSTABLE”)    { p.persona = “Emily”; }
if (char === “THE CLAIRVOYANT”) { p.skills[“Third Eyes”] = 1; p.skills[“Mind Havoc”] = 2; }
if (char === “THE DOCTOR”)      { p.skills[“Care Pack”] = 1; p.skills[“Self-Therapy”] = 1; p.skills[“Bound to Oath”] = 3; }
if (char === “THE AGENT”)       { p.skills[“Spy Camera”] = 1; p.skills[“Trap Wire Bomb”] = 1; }
if (char === “THE LAWYER”)      { p.skills[“Fake Justice”] = 1; p.skills[“Negotiator”] = 3; }
if (char === “THE PAINTER”)     { p.skills[“Disguise”] = 1; p.skills[“Drop Mask”] = 1; }
if (char === “THE VAMPIRE”)     { p.skills[“Red-Out Massacre”] = 1; }
if (char === “THE UNDERTAKER”)  { p.skills[“Proper Burial”] = 1; p.skills[“EX-Saint”] = 3; p.skills[“Raise!”] = 1; }
if (char === “THE AFTERIMAGE”)  { p.skills[“Quantum Overload Tunneling”] = 1; p.skills[“Misdirection”] = 1; }
if (char === “THE LOVERMAN”)    { p.skills[“The Loverman Oath”] = 1; }
if (char === “THE ILLUSIONIST”) { p.skills[“Fake Death”] = 1; p.illusionistShield = 3; }
if (!isHuman && Math.random() < 0.25) {
p.insanity = rollInsanity(); p.sanity = MAX_SANITY;
}
return p;
}

function effChar(p) { return p.disguisedAs || p.character; }

function resolveTarget(targetIdx, casterIdx, players, bypassShield) {
if (bypassShield) return targetIdx;
var t = players[targetIdx];
if (t && t.character === “THE ILLUSIONIST” && t.illusionistShield > 0 && !t.fakeDead) {
return casterIdx;
}
return targetIdx;
}

function aiRoom(player, rooms) {
var open = rooms.filter(function(r) { return !r.opened && !r.emptied; });
if (!open.length) open = rooms.filter(function(r) { return !r.opened; });
if (!open.length) return -1;
var rev  = player.revealed;
var safe = open.filter(function(r) { return rev[r.id] === “coins”; });
if (safe.length) return safe[Math.floor(Math.random() * safe.length)].id;
var unk  = open.filter(function(r) { return !rev[r.id]; });
var pool = unk.length ? unk : open;
return pool[Math.floor(Math.random() * pool.length)].id;
}

// ─ PROFILE STORE ─────────────────────────────────────────────────────────────
function useProfiles() {
var init = {};
var state = useState(init);
var profiles = state[0]; var setProfiles = state[1];
function get(name) { return profiles[name] || { name: name, coins: 0, insanity: null, avatar: “◑” }; }
function save(name, data) {
var cur = get(name); var next = {};
for (var k in cur) next[k] = cur[k];
for (var k in data) next[k] = data[k];
setProfiles(function(p) { var np = {}; for (var k in p) np[k] = p[k]; np[name] = next; return np; });
}
function addCoins(name, amt) { var p = get(name); save(name, { coins: (p.coins || 0) + amt }); }
function setIns(name, ins)   { save(name, { insanity: ins }); }
function cleanse(name) {
var p = get(name);
if ((p.coins || 0) < SANITARIUM_COST) return false;
save(name, { insanity: null, coins: p.coins - SANITARIUM_COST }); return true;
}
return { get: get, save: save, addCoins: addCoins, setIns: setIns, cleanse: cleanse };
}

// ─ STYLES ────────────────────────────────────────────────────────────────────
var C = {
bg:”#131018”, gold:”#c4896a”, dim:”#5a5070”, dark:”#1e1828”,
red:”#7a3a4a”, purple:”#6a2a7a”, green:”#2a5a2a”, blue:”#2a4a7a”,
afterimage:”#2a6a8a”, loverman:”#cc4477”, illusionist:”#7a6a3a”
};
var base = {
root:    { minHeight:“100vh”, background:C.bg, color:”#c4896a”, fontFamily:“Georgia, serif”, display:“flex”, flexDirection:“column” },
center:  { display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, flex:1, padding:20, gap:16 },
card:    { background:”#130f18”, border:“1px solid #2a2238”, borderRadius:6, padding:“12px 14px” },
input:   { background:”#130f18”, border:“1px solid #2a2238”, borderRadius:4, color:”#c4896a”, padding:“8px 12px”, fontSize:13, outline:“none”, width:“100%”, boxSizing:“border-box”, fontFamily:“Georgia, serif” },
btn:     { background:”#c4896a”, color:”#131018”, border:“none”, borderRadius:4, padding:“10px 24px”, fontSize:12, fontWeight:“bold”, letterSpacing:2, cursor:“pointer”, fontFamily:“Georgia, serif” },
ghost:   { background:“transparent”, border:“1px solid #2a2238”, color:”#5a5070”, borderRadius:4, padding:“8px 18px”, fontSize:11, cursor:“pointer”, letterSpacing:1, fontFamily:“Georgia, serif” },
small:   { background:”#130f18”, border:“1px solid #221c2e”, color:”#c4896a”, borderRadius:3, padding:“4px 8px”, fontSize:10, cursor:“pointer”, fontFamily:“Georgia, serif” },
logo:    { fontSize:40, letterSpacing:14, color:”#c4896a”, textShadow:“0 0 40px rgba(201,168,76,0.4)”, textAlign:“center” },
sub:     { fontSize:11, color:”#3a3448”, letterSpacing:3, textAlign:“center” },
divider: { height:1, background:“linear-gradient(to right, transparent, #2a2238, transparent)”, margin:“8px 0” },
tag:     { fontSize:8, letterSpacing:3, color:”#2a2238”, textTransform:“uppercase”, paddingBottom:6, borderBottom:“1px solid #1e1828”, marginBottom:8 }
};

// ─ CHARACTER CONFIG ───────────────────────────────────────────────────────────
var CHARS = {
“THE SINNER”:      { glyph:“⍜”, color:”#cc2222”, color2:”#f0c040”, shardBehavior:“spiral”,  label:“Greed made flesh.” },
“THE HUNTER”:      { glyph:“⌖”, color:”#88bb33”, color2:”#ccff66”, shardBehavior:“shoot”,   label:“Every kill is a payday.” },
“THE CLAIRVOYANT”: { glyph:“ꀦ”, color:”#4488ee”, color2:”#aaccff”, shardBehavior:“orbit”,   label:“She sees what walls hide.” },
“THE DOCTOR”:      { glyph:“⚕”, color:”#44bbaa”, color2:”#aaffee”, shardBehavior:“float”,   label:“First do no harm.” },
“THE UNSTABLE”:    { glyph:“☽”, color:”#aa44cc”, color2:”#ffaaff”, shardBehavior:“split”,   label:“Two souls. One body.” },
“THE AGENT”:       { glyph:“⌬”, color:”#5588aa”, color2:”#88ccee”, shardBehavior:“grid”,    label:“Watch everything.” },
“THE BOTANIST”:    { glyph:“⚘”, color:”#44aa44”, color2:”#88ff88”, shardBehavior:“drift”,   label:“She just gardens.” },
“THE LAWYER”:      { glyph:“⊜”, color:”#bbaa33”, color2:”#ffee88”, shardBehavior:“fall”,    label:“Every deal has fine print.” },
“THE SELLER”:      { glyph:“✦”, color:”#ddaa22”, color2:”#ffdd44”, shardBehavior:“explode”, label:“Everything has a price.” },
“THE PAINTER”:     { glyph:“ꃳ”, color:”#9944cc”, color2:”#ee88ff”, shardBehavior:“scatter”, label:“Any face. Any power.” },
“THE VAMPIRE”:     { glyph:“♱”, color:”#cc2244”, color2:”#ff6688”, shardBehavior:“spiral”,  label:“The blood remembers.” },
“THE UNDERTAKER”:  { glyph:“⌂”, color:”#6644aa”, color2:”#aa88ff”, shardBehavior:“fall”,    label:“Every death is an opportunity.” },
“THE AFTERIMAGE”:  { glyph:“∰”, color:”#2a9acc”, color2:”#88ddff”, shardBehavior:“scatter”, label:“You saw them. But were they there?” },
“THE LOVERMAN”:    { glyph:“⚭”,  color:”#cc4477”, color2:”#ff88aa”, shardBehavior:“spiral”,  label:“Love is the deadliest curse.” },
“THE ILLUSIONIST”: { glyph:“◬”,  color:”#aa9933”, color2:”#eedd77”, shardBehavior:“scatter”, label:“Nothing you see is real.” }
};

// ─ SHARD GENERATOR ───────────────────────────────────────────────────────────
function buildShards(glyph, color, W, H, behavior) {
var off = document.createElement(“canvas”);
off.width = W; off.height = H;
var ctx = off.getContext(“2d”);
var fontSize = Math.floor(W * 0.55);
ctx.font = “bold “ + fontSize + “px Georgia, serif”;
ctx.textAlign = “center”; ctx.textBaseline = “middle”;
ctx.fillStyle = “#ffffff”; ctx.fillText(glyph, W/2, H/2);
var imgData = ctx.getImageData(0, 0, W, H); var data = imgData.data;
var shards = []; var step = 3;
for (var y = 0; y < H; y += step) {
for (var x = 0; x < W; x += step) {
var idx = (y * W + x) * 4;
if (data[idx + 3] > 60) shards.push(buildShard(x, y, W, H, behavior, color));
}
}
return shards;
}
function buildShard(tx, ty, W, H, behavior, color) {
var cx = W/2, cy = H/2;
var dx = tx - cx, dy = ty - cy;
var angle = Math.atan2(dy, dx);
var sx, sy;
if (behavior === “spiral”) {
var r = 60 + Math.random()*60; var a = angle + (Math.random()-0.5)*1.5;
sx = cx + Math.cos(a)*r; sy = cy + Math.sin(a)*r;
} else if (behavior === “shoot”) {
sx = tx + (Math.random()-0.5)*W*0.8; sy = ty + (Math.random()-0.5)*H*0.8;
} else if (behavior === “orbit”) {
var r2 = 50 + Math.random()*70;
sx = cx + Math.cos(angle+Math.PI)*r2; sy = cy + Math.sin(angle+Math.PI)*r2;
} else if (behavior === “split”) {
sx = tx > cx ? tx+40+Math.random()*60 : tx-40-Math.random()*60;
sy = ty + (Math.random()-0.5)*40;
} else if (behavior === “grid”) {
sx = Math.round(tx/20)*20+(Math.random()-0.5)*8; sy = Math.round(ty/20)*20+(Math.random()-0.5)*8;
} else if (behavior === “drift”) {
sx = tx+(Math.random()-0.5)*30; sy = ty-20-Math.random()*60;
} else if (behavior === “fall”) {
sx = tx+(Math.random()-0.5)*20; sy = -20-Math.random()*60;
} else if (behavior === “explode”) {
var r3 = 40+Math.random()*80; sx = cx+Math.cos(angle)*r3; sy = cy+Math.sin(angle)*r3;
} else if (behavior === “scatter”) {
sx = Math.random()*W; sy = Math.random()*H;
} else {
sx = tx+(Math.random()-0.5)*W*0.6; sy = ty+(Math.random()-0.5)*H*0.6;
}
return {
tx:tx, ty:ty, x:sx, y:sy, sx:sx, sy:sy,
size:0.8+Math.random()*0.8, alpha:0, phase:Math.random(),
delay:Math.random()*0.4, speed:0.008+Math.random()*0.006,
rot:(Math.random()-0.5)*180, shimmer:Math.random()*Math.PI*2,
shimmerSpeed:0.04+Math.random()*0.03
};
}

// ─ HOLOGRAM COMPONENT ────────────────────────────────────────────────────────
// loopAnim=true (default): assemble->hold->dissolve->restart forever
// loopAnim=false: assemble->hold->dissolve->call onDone once
function HologramCard({ character, size, onDone, loopAnim }) {
var W = size || 220; var H = size || 220;
var canvasRef = useRef(null);
var stateRef  = useRef({ shards:[], progress:0, phase:“assemble”, hold:0 });
var animRef   = useRef(null);
var cfg = CHARS[character];
var shouldLoop = (loopAnim !== false);
useEffect(function() {
if (!cfg) return;
var canvas = canvasRef.current; if (!canvas) return;
var ctx = canvas.getContext(“2d”);
var st  = stateRef.current;
st.shards = buildShards(cfg.glyph, cfg.color, W, H, cfg.shardBehavior);
st.progress = 0; st.phase = “assemble”; st.hold = 0;
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function lerp(a,b,t) { return a+(b-a)*t; }
function tick() {
ctx.clearRect(0, 0, W, H);
var shards = st.shards; var prog = easeInOut(Math.min(1, st.progress));
for (var i = 0; i < shards.length; i++) {
var s = shards[i]; s.shimmer += s.shimmerSpeed;
var ep = Math.max(0, Math.min(1, (prog-s.delay)/(1-s.delay)));
ep = easeInOut(ep);
if (st.phase === “assemble”) {
s.x = lerp(s.sx,s.tx,ep); s.y = lerp(s.sy,s.ty,ep);
s.alpha = ep*(0.7+Math.sin(s.shimmer)*0.3);
} else if (st.phase === “hold”) {
s.x = s.tx+Math.sin(s.shimmer*0.5)*1.5; s.y = s.ty+Math.cos(s.shimmer*0.7)*1.5;
s.alpha = 0.7+Math.sin(s.shimmer)*0.3;
} else {
s.x = lerp(s.tx,s.sx,ep); s.y = lerp(s.ty,s.sy,ep);
s.alpha = (1-ep)*(0.7+Math.sin(s.shimmer)*0.3);
}
ctx.save(); ctx.globalAlpha = Math.max(0,s.alpha)*(Math.floor(s.y)%4<2?1:0.55);
var colorT = s.x/W;
var r=parseInt(cfg.color.slice(1,3),16),g=parseInt(cfg.color.slice(3,5),16),b=parseInt(cfg.color.slice(5,7),16);
var r2=parseInt(cfg.color2.slice(1,3),16),g2=parseInt(cfg.color2.slice(3,5),16),b2=parseInt(cfg.color2.slice(5,7),16);
var col=“rgb(”+Math.round(r+(r2-r)*colorT)+”,”+Math.round(g+(g2-g)*colorT)+”,”+Math.round(b+(b2-b)*colorT)+”)”;
ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=6;
ctx.translate(s.x,s.y); ctx.rotate((s.rot*(1-prog))*Math.PI/180);
ctx.fillRect(-s.size/2,-s.size/2,s.size,s.size); ctx.restore();
}
if (Math.random()>0.97) { ctx.fillStyle=“rgba(255,255,255,0.03)”; ctx.fillRect(0,Math.random()*H,W,2); }
if (st.phase===“assemble”) {
st.progress+=0.035;
if (st.progress>=1) { st.phase=“hold”; st.hold=0; st.progress=0; }
} else if (st.phase===“hold”) {
st.hold++;
if (st.hold>18) { st.phase=“dissolve”; st.progress=0; }
} else {
st.progress+=0.035;
if (st.progress>=1) {
cancelAnimationFrame(animRef.current);
if (!shouldLoop) { if (onDone) onDone(); return; }
st.phase=“assemble”; st.progress=0; st.hold=0;
st.shards = buildShards(cfg.glyph, cfg.color, W, H, cfg.shardBehavior);
animRef.current = requestAnimationFrame(tick);
return;
}
}
animRef.current = requestAnimationFrame(tick);
}
animRef.current = requestAnimationFrame(tick);
return function() { cancelAnimationFrame(animRef.current); };
}, [character, shouldLoop]);
return React.createElement(“canvas”, { ref:canvasRef, width:W, height:H, style:{ display:“block” } });
}

// ─ DOOR ANIMATION ─────────────────────────────────────────────────────────────
function DoorAnimation({ roomType, roomId, onComplete }) {
var canvasRef = useRef(null); var animRef = useRef(null);
var stateRef  = useRef({ phase:“tremble”, frame:0, shards:[] });
var ROOM_CFG = {
coins:       { color:”#f0c040”, color2:”#c4896a”, glyph:“✦”, label:“A COIN AWAITS” },
masacree:    { color:”#cc2233”, color2:”#ff4455”, glyph:“ᛏ”, label:“MASACREE GUARDIAN” },
dimensional: { color:”#3a6acc”, color2:”#88aaff”, glyph:”꩜”, label:“DIMENSIONAL GUARDIAN” },
unknown:     { color:”#c4896a”, color2:”#5a5070”, glyph:“◆”, label:”…” }
};
var cfg = ROOM_CFG[roomType] || ROOM_CFG.unknown;
useEffect(function() {
var canvas = canvasRef.current; if (!canvas) return;
var ctx = canvas.getContext(“2d”); var W = canvas.width, H = canvas.height;
var st  = stateRef.current;
function buildDoorShards() {
var off = document.createElement(“canvas”); off.width=W; off.height=H;
var octx = off.getContext(“2d”);
octx.font=“bold “+Math.floor(W*0.42)+“px Georgia, serif”;
octx.textAlign=“center”; octx.textBaseline=“middle”;
octx.fillStyle=”#ffffff”; octx.fillText(cfg.glyph,W/2,H/2-20);
var imgData=octx.getImageData(0,0,W,H); var data=imgData.data; var shards=[];
for (var y=0;y<H;y+=5) {
for (var x=0;x<W;x+=5) {
if (data[(y*W+x)*4+3]>60) {
var angle=Math.atan2(y-H/2,x-W/2); var dist=60+Math.random()*100;
shards.push({ tx:x,ty:y,x:W/2+Math.cos(angle)*dist,y:H/2+Math.sin(angle)*dist,sx:W/2+Math.cos(angle)*dist,sy:H/2+Math.sin(angle)*dist,size:2.5+Math.random()*2,alpha:0,delay:Math.random()*0.35,shimmer:Math.random()*Math.PI*2,rot:(Math.random()-0.5)*90 });
}
}
}
return shards;
}
function easeOut(t) { return 1-(1-t)*(1-t); }
function lerp(a,b,t) { return a+(b-a)*t; }
function drawDoor(shake, crackAmt) {
ctx.fillStyle=”#0a0806”; ctx.fillRect(0,0,W,H);
var sx=shake?(Math.random()-0.5)*8:0; var sy=shake?(Math.random()-0.5)*4:0;
ctx.save(); ctx.translate(W/2+sx,H/2+sy);
var dw=W*0.6,dh=H*0.7;
ctx.fillStyle=”#1a1525”; ctx.beginPath(); ctx.roundRect(-dw/2,-dh/2,dw,dh,4); ctx.fill();
ctx.shadowColor=cfg.color; ctx.shadowBlur=10+crackAmt*40; ctx.strokeStyle=cfg.color; ctx.lineWidth=2; ctx.globalAlpha=0.4+crackAmt*0.6;
ctx.beginPath(); ctx.roundRect(-dw/2,-dh/2,dw,dh,4); ctx.stroke();
ctx.globalAlpha=0.3+crackAmt*0.2; ctx.strokeStyle=cfg.color; ctx.lineWidth=1; ctx.shadowBlur=4;
ctx.strokeRect(-dw/2+10,-dh/2+12,dw-20,dh*0.42-6); ctx.strokeRect(-dw/2+10,-dh/2+dh*0.42+6,dw-20,dh*0.55-12);
if (crackAmt>0) {
ctx.globalAlpha=crackAmt;
var grad=ctx.createLinearGradient(-dw*0.05,0,dw*0.05,0);
grad.addColorStop(0,“transparent”); grad.addColorStop(0.5,cfg.color); grad.addColorStop(1,“transparent”);
ctx.fillStyle=grad; ctx.shadowColor=cfg.color; ctx.shadowBlur=20;
ctx.fillRect(-dw*0.05*crackAmt,-dh/2,dw*0.1*crackAmt,dh);
}
ctx.globalAlpha=1-crackAmt; ctx.fillStyle=cfg.color; ctx.shadowBlur=8;
ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
ctx.beginPath(); ctx.moveTo(-3,6); ctx.lineTo(3,6); ctx.lineTo(2.5,13); ctx.lineTo(-2.5,13); ctx.closePath(); ctx.fill();
ctx.restore();
ctx.globalAlpha=0.35; ctx.fillStyle=cfg.color; ctx.font=“10px Georgia”; ctx.textAlign=“center”;
ctx.fillText(“ROOM “+roomId,W/2,H*0.1); ctx.globalAlpha=1;
}
function drawReveal(progress) {
ctx.fillStyle=”#0a0806”; ctx.fillRect(0,0,W,H);
var shards=st.shards;
for (var i=0;i<shards.length;i++) {
var s=shards[i]; s.shimmer+=0.06;
var ep=easeOut(Math.max(0,Math.min(1,(progress-s.delay)/(1-s.delay))));
s.x=lerp(s.sx,s.tx,ep); s.y=lerp(s.sy,s.ty,ep); s.alpha=ep*(0.8+Math.sin(s.shimmer)*0.2);
ctx.save(); ctx.globalAlpha=Math.max(0,s.alpha);
ctx.translate(s.x,s.y); ctx.rotate(s.rot*(1-ep)*Math.PI/180);
ctx.fillStyle=ep>0.5?cfg.color:cfg.color2; ctx.shadowColor=cfg.color; ctx.shadowBlur=8;
ctx.fillRect(-s.size/2,-s.size/2,s.size,s.size); ctx.restore();
}
ctx.save();
for (var ly=0;ly<H;ly+=4) { ctx.globalAlpha=0.06; ctx.fillStyle=”#000000”; ctx.fillRect(0,ly,W,2); }
ctx.restore();
if (progress>0.6) {
ctx.globalAlpha=(progress-0.6)/0.4; ctx.fillStyle=cfg.color; ctx.shadowColor=cfg.color; ctx.shadowBlur=10;
ctx.font=“bold 12px Georgia”; ctx.textAlign=“center”; ctx.fillText(cfg.label,W/2,H*0.85);
}
ctx.globalAlpha=1;
}
var frameCount=0;
function loop() {
frameCount++;
if (st.phase===“tremble”) {
var crack=Math.max(0,(frameCount-8)/18);
drawDoor(frameCount>6,Math.min(1,crack));
if (frameCount>32) { st.phase=“reveal”; st.shards=buildDoorShards(); frameCount=0; }
} else {
drawReveal(Math.min(1,frameCount/42));
if (frameCount>58) { cancelAnimationFrame(animRef.current); if (onComplete) setTimeout(onComplete,60); return; }
}
animRef.current=requestAnimationFrame(loop);
}
animRef.current=requestAnimationFrame(loop);
return function() { cancelAnimationFrame(animRef.current); };
}, [roomType, roomId]);
return React.createElement(“canvas”, { ref:canvasRef, width:300, height:340, style:{ borderRadius:8, display:“block” } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─ RAVEN CAROUSEL ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

var RAVEN = {
bg0:      “#07060b”,
bg1:      “#0a0a0f”,
bg2:      “#0d0b14”,
bg3:      “#12101a”,
surface:  “#0f0d18”,
border:   “#1a1728”,
borderLit:”#2a1a28”,
red0:     “#4a0008”,
red1:     “#8b0000”,
red2:     “#c0392b”,
red3:     “#ff2a2a”,
redGlow:  “rgba(192,57,43,0.55)”,
redSoft:  “rgba(139,0,0,0.22)”,
violet:   “#1a1428”,
indigo:   “#1a1a2e”,
teal:     “#0f1a1f”,
textDim:  “#4a4460”,
textMid:  “#7a6a8a”,
textLit:  “#c4b8d8”,
gold:     “#c4896a”
};

// Inline keyframes injected once
var ravenStyleInjected = false;
function injectRavenStyles() {
if (ravenStyleInjected) return;
ravenStyleInjected = true;
var style = document.createElement(“style”);
style.textContent = [
“@keyframes ravenRingPulse {”,
“  0%   { box-shadow: 0 0 0 0 rgba(192,57,43,0.0), inset 0 0 18px rgba(192,57,43,0.3); }”,
“  50%  { box-shadow: 0 0 28px 6px rgba(192,57,43,0.5), inset 0 0 28px rgba(192,57,43,0.5); }”,
“  100% { box-shadow: 0 0 0 0 rgba(192,57,43,0.0), inset 0 0 18px rgba(192,57,43,0.3); }”,
“}”,
“@keyframes ravenSlideIn {”,
“  from { opacity:0; transform: translateY(12px); }”,
“  to   { opacity:1; transform: translateY(0); }”,
“}”,
“@keyframes ravenBanFade {”,
“  from { opacity:1; filter: grayscale(0); }”,
“  to   { opacity:0.22; filter: grayscale(1) brightness(0.4); }”,
“}”,
“.raven-card-center { animation: ravenRingPulse 2.4s ease-in-out infinite; }”,
“.raven-slide-in { animation: ravenSlideIn 0.32s ease-out forwards; }”,
“.raven-ban-fade { animation: ravenBanFade 0.4s ease forwards; }”
].join(”\n”);
document.head.appendChild(style);
}

// ─ PER-CHARACTER SELECT EFFECT ───────────────────────────────────────────────
var SELECT_FX = {
“THE SINNER”:      { type:“coin_burst”,   color:”#f0c040”, color2:”#cc2222” },
“THE HUNTER”:      { type:“crosshair”,    color:”#88bb33”, color2:”#ccff66” },
“THE CLAIRVOYANT”: { type:“eye_rings”,    color:”#4488ee”, color2:”#aaccff” },
“THE DOCTOR”:      { type:“pulse_cross”,  color:”#44bbaa”, color2:”#aaffee” },
“THE UNSTABLE”:    { type:“split_souls”,  color:”#aa44cc”, color2:”#ffaaff” },
“THE AGENT”:       { type:“scan_grid”,    color:”#5588aa”, color2:”#88ccee” },
“THE BOTANIST”:    { type:“spore_drift”,  color:”#44aa44”, color2:”#88ff88” },
“THE LAWYER”:      { type:“scale_drop”,   color:”#bbaa33”, color2:”#ffee88” },
“THE SELLER”:      { type:“coin_burst”,   color:”#ddaa22”, color2:”#ffdd44” },
“THE PAINTER”:     { type:“ink_splash”,   color:”#9944cc”, color2:”#ee88ff” },
“THE VAMPIRE”:     { type:“blood_drip”,   color:”#cc2244”, color2:”#ff6688” },
“THE UNDERTAKER”:  { type:“smoke_rise”,   color:”#6644aa”, color2:”#aa88ff” },
“THE AFTERIMAGE”:  { type:“quantum_scan”, color:”#2a9acc”, color2:”#88ddff” },
“THE LOVERMAN”:    { type:“heart_pulse”,  color:”#cc4477”, color2:”#ff88aa” },
“THE ILLUSIONIST”: { type:“mirror_shatter”,color:”#aa9933”,color2:”#eedd77” }
};

function SelectFxCanvas({ character, W, H }) {
var canvasRef = useRef(null);
var animRef   = useRef(null);
var fx = SELECT_FX[character] || { type:“coin_burst”, color:”#c4896a”, color2:”#ffffff” };
useEffect(function() {
var canvas = canvasRef.current; if (!canvas) return;
var ctx = canvas.getContext(“2d”);
var frame = 0;
var cx = W/2; var cy = H/2;
var maxFrames = 52;

// Pre-build particles based on type
var particles = [];
function initParticles() {
if (fx.type === “coin_burst”) {
for (var i = 0; i < 28; i++) {
var a = (i/28)*Math.PI*2; var spd = 1.2+Math.random()*2.5;
particles.push({ x:cx, y:cy, vx:Math.cos(a)*spd, vy:Math.sin(a)*spd, life:0, size:2+Math.random()*2.5, col: i%3===0?fx.color2:fx.color, spin:Math.random()*Math.PI*2 });
}
} else if (fx.type === “crosshair”) {
// 4 lines snap outward from center
particles.push({ type:“line”, angle:0,       len:0, maxLen:W*0.45 });
particles.push({ type:“line”, angle:Math.PI, len:0, maxLen:W*0.45 });
particles.push({ type:“line”, angle:Math.PI/2,  len:0, maxLen:H*0.45 });
particles.push({ type:“line”, angle:-Math.PI/2, len:0, maxLen:H*0.45 });
// tick marks
for (var t = 0; t < 8; t++) { var ta = (t/8)*Math.PI*2; particles.push({ type:“tick”, angle:ta, r:0, maxR:W*0.38, alpha:0 }); }
} else if (fx.type === “eye_rings”) {
for (var r = 0; r < 4; r++) { particles.push({ type:“ring”, r:0, maxR:12+r*18, alpha:1, speed:3+r*1.5 }); }
for (var s = 0; s < 16; s++) { var sa=(s/16)*Math.PI*2; particles.push({ type:“star”, x:cx+Math.cos(sa)*30, y:cy+Math.sin(sa)*30, vx:Math.cos(sa)*1.8, vy:Math.sin(sa)*1.8, alpha:0, size:1+Math.random() }); }
} else if (fx.type === “blood_drip”) {
for (var d = 0; d < 18; d++) { particles.push({ x:cx+(Math.random()-0.5)*W*0.7, y:cy-(Math.random()*H*0.3), vy:1.5+Math.random()*3, size:1.5+Math.random()*3, alpha:0, life:Math.random()*0.5 }); }
} else if (fx.type === “heart_pulse”) {
for (var p = 0; p < 5; p++) { particles.push({ type:“ring”, r:0, maxR:20+p*14, alpha:0.9, delay:p*4, speed:2.5 }); }
} else if (fx.type === “smoke_rise”) {
for (var sm = 0; sm < 20; sm++) { particles.push({ x:cx+(Math.random()-0.5)*W*0.4, y:H*0.8, vy:-(0.8+Math.random()*1.8), vx:(Math.random()-0.5)*0.6, size:3+Math.random()*5, alpha:0, life:Math.random()*0.4 }); }
} else if (fx.type === “quantum_scan”) {
// horizontal scan lines sweep down
for (var ql = 0; ql < 12; ql++) { particles.push({ y:-ql*8, speed:3+Math.random()*2, alpha:0.6+Math.random()*0.4, width:W }); }
} else if (fx.type === “split_souls”) {
for (var ss2 = 0; ss2 < 24; ss2++) { var sside = ss2%2===0?-1:1; particles.push({ x:cx, y:cy+(Math.random()-0.5)*H*0.5, vx:sside*(1.5+Math.random()*2.5), vy:(Math.random()-0.5)*1.5, size:1+Math.random()*2, alpha:0, col:ss2%2===0?fx.color:fx.color2 }); }
} else if (fx.type === “scan_grid”) {
// grid dots reveal
for (var gx = 0; gx < 6; gx++) { for (var gy = 0; gy < 8; gy++) { particles.push({ x:(gx+0.5)*(W/6), y:(gy+0.5)*(H/8), alpha:0, delay:Math.floor(Math.random()*20), size:1.5 }); } }
} else if (fx.type === “spore_drift”) {
for (var sp = 0; sp < 30; sp++) { var sa2=(Math.random())*Math.PI*2; particles.push({ x:cx, y:cy, vx:Math.cos(sa2)*(0.5+Math.random()*2), vy:Math.sin(sa2)*(0.5+Math.random()*2)-1, size:1+Math.random()*1.5, alpha:0, life:Math.random()*0.3 }); }
} else if (fx.type === “scale_drop”) {
// two arcs fall from top
for (var sc = 0; sc < 2; sc++) { var sx2 = sc===0?cx-20:cx+20; particles.push({ type:“arc”, x:sx2, y:-10, vy:2.5+sc*0.5, alpha:0, side:sc }); }
for (var sc2 = 0; sc2 < 16; sc2++) { particles.push({ x:cx+(Math.random()-0.5)*W*0.6, y:-10-Math.random()*20, vy:1.5+Math.random()*2.5, size:1.5, alpha:0 }); }
} else if (fx.type === “ink_splash”) {
for (var ink = 0; ink < 32; ink++) { var ia=(ink/32)*Math.PI*2+(Math.random()-0.5)*0.6; var ir=10+Math.random()*40; particles.push({ x:cx+Math.cos(ia)*4, y:cy+Math.sin(ia)*4, vx:Math.cos(ia)*(1.5+Math.random()*3), vy:Math.sin(ia)*(1.5+Math.random()*3), size:1+Math.random()*3, alpha:0, col:ink%4===0?fx.color2:fx.color }); }
} else if (fx.type === “mirror_shatter”) {
for (var ms = 0; ms < 20; ms++) { var ma=Math.random()*Math.PI*2; var mr=5+Math.random()*35; particles.push({ x:cx+Math.cos(ma)*mr, y:cy+Math.sin(ma)*mr, vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3-1, size:2+Math.random()*3, alpha:0, rot:Math.random()*Math.PI }); }
} else if (fx.type === “pulse_cross”) {
for (var pc = 0; pc < 4; pc++) { particles.push({ type:“ring”, r:0, maxR:10+pc*16, alpha:1, delay:pc*3, speed:3 }); }
for (var pc2 = 0; pc2 < 12; pc2++) { var pca=(pc2/12)*Math.PI*2; particles.push({ type:“dot”, x:cx, y:cy, vx:Math.cos(pca)*2.2, vy:Math.sin(pca)*2.2, alpha:0, size:1.5 }); }
}
}
initParticles();

function drawFrame() {
ctx.clearRect(0, 0, W, H);
var t = frame / maxFrames;

if (fx.type === “coin_burst” || fx.type === “ink_splash”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.life += 0.04; p.x += p.vx; p.y += p.vy; p.vy += 0.06;
var a = Math.max(0, 1-p.life*1.2);
ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = p.col || fx.color;
ctx.shadowColor = p.col || fx.color; ctx.shadowBlur = 4;
ctx.translate(p.x, p.y); if (p.spin!==undefined) ctx.rotate(p.spin+frame*0.15);
ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
ctx.restore();
}
} else if (fx.type === “crosshair”) {
ctx.strokeStyle = fx.color; ctx.lineWidth = 1.5; ctx.shadowColor = fx.color; ctx.shadowBlur = 8;
for (var i = 0; i < particles.length; i++) {
var p = particles[i];
if (p.type === “line”) {
p.len = Math.min(p.maxLen, p.len + p.maxLen/14);
ctx.save(); ctx.globalAlpha = 0.85; ctx.beginPath();
ctx.moveTo(cx, cy); ctx.lineTo(cx+Math.cos(p.angle)*p.len, cy+Math.sin(p.angle)*p.len);
ctx.stroke(); ctx.restore();
} else if (p.type === “tick”) {
p.r = Math.min(p.maxR, p.r + p.maxR/14); p.alpha = Math.min(1, p.alpha+0.1);
ctx.save(); ctx.globalAlpha = p.alpha*0.7;
var tx2=cx+Math.cos(p.angle)*p.r; var ty2=cy+Math.sin(p.angle)*p.r;
ctx.fillStyle=fx.color2; ctx.beginPath(); ctx.arc(tx2,ty2,1.5,0,Math.PI*2); ctx.fill(); ctx.restore();
}
}
} else if (fx.type === “eye_rings” || fx.type === “heart_pulse” || fx.type === “pulse_cross”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i];
if (p.type === “ring”) {
if (frame >= (p.delay||0)) { p.r += p.speed; }
var a2 = Math.max(0, 1 - p.r/p.maxR);
if (a2 > 0) {
ctx.save(); ctx.globalAlpha = a2*0.8; ctx.strokeStyle = fx.color; ctx.lineWidth = 1.5;
ctx.shadowColor = fx.color; ctx.shadowBlur = 10;
ctx.beginPath(); ctx.arc(cx, cy, p.r, 0, Math.PI*2); ctx.stroke(); ctx.restore();
}
} else if (p.type === “star” || p.type === “dot”) {
p.x += p.vx; p.y += p.vy; p.alpha = Math.min(1, p.alpha+0.08);
var fa = Math.max(0, p.alpha - t*1.4);
ctx.save(); ctx.globalAlpha = fa; ctx.fillStyle = fx.color2; ctx.shadowColor = fx.color; ctx.shadowBlur=6;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
}
} else if (fx.type === “blood_drip”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.life += 0.04; if (p.life < 0.3) continue;
p.y += p.vy; p.alpha = Math.min(0.9, p.alpha+0.06);
var fa2 = Math.max(0, p.alpha - Math.max(0,t-0.5)*3);
ctx.save(); ctx.globalAlpha = fa2; ctx.fillStyle = fx.color; ctx.shadowColor = fx.color; ctx.shadowBlur=8;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
// drip tail
ctx.beginPath(); ctx.moveTo(p.x, p.y-p.size); ctx.lineTo(p.x, p.y-p.size-p.vy*3); ctx.lineWidth=p.size*0.7; ctx.strokeStyle=fx.color; ctx.stroke();
ctx.restore();
}
} else if (fx.type === “smoke_rise”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.life += 0.025; if (p.life < 0.2) continue;
p.x += p.vx; p.y += p.vy; p.size += 0.06; p.alpha = Math.min(0.5, p.alpha+0.04);
var fa3 = Math.max(0, p.alpha - Math.max(0,t-0.4)*2);
ctx.save(); ctx.globalAlpha = fa3; ctx.fillStyle = fx.color;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
} else if (fx.type === “quantum_scan”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.y += p.speed;
if (p.y > 0 && p.y < H) {
ctx.save(); ctx.globalAlpha = p.alpha*(1-t); ctx.fillStyle = fx.color;
ctx.fillRect(0, p.y, p.width, 1.5); ctx.restore();
// random bright dots along the line
for (var d2 = 0; d2 < 6; d2++) {
ctx.save(); ctx.globalAlpha = p.alpha*(1-t)*0.8; ctx.fillStyle = fx.color2;
ctx.fillRect(Math.random()*W, p.y, 2, 2); ctx.restore();
}
}
}
} else if (fx.type === “split_souls”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha = Math.min(0.9, p.alpha+0.08);
var fa4 = Math.max(0, p.alpha - t*1.3);
ctx.save(); ctx.globalAlpha = fa4; ctx.fillStyle = p.col || fx.color; ctx.shadowColor = p.col||fx.color; ctx.shadowBlur=5;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
} else if (fx.type === “scan_grid”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; if (frame < p.delay) continue;
p.alpha = Math.min(1, p.alpha+0.15);
var fa5 = Math.max(0, p.alpha*(1-t));
ctx.save(); ctx.globalAlpha = fa5; ctx.fillStyle = fx.color; ctx.shadowColor=fx.color2; ctx.shadowBlur=6;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
} else if (fx.type === “spore_drift”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.life += 0.03; if (p.life < 0.2) continue;
p.x += p.vx; p.y += p.vy; p.alpha = Math.min(0.8, p.alpha+0.06);
var fa6 = Math.max(0, p.alpha - t*1.2);
ctx.save(); ctx.globalAlpha = fa6; ctx.fillStyle = fx.color; ctx.shadowColor=fx.color; ctx.shadowBlur=5;
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.restore();
}
} else if (fx.type === “scale_drop”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.y += p.vy||2; p.alpha = Math.min(0.9, (p.alpha||0)+0.07);
var fa7 = Math.max(0, p.alpha - t*1.3);
ctx.save(); ctx.globalAlpha = fa7; ctx.fillStyle = fx.color; ctx.shadowColor=fx.color; ctx.shadowBlur=6;
if (p.type === “arc”) {
ctx.strokeStyle=fx.color; ctx.lineWidth=2;
ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI); ctx.stroke();
} else {
ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
}
ctx.restore();
}
} else if (fx.type === “mirror_shatter”) {
for (var i = 0; i < particles.length; i++) {
var p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha = Math.min(0.9, p.alpha+0.07);
var fa8 = Math.max(0, p.alpha - t*1.2);
ctx.save(); ctx.globalAlpha = fa8; ctx.fillStyle = fx.color; ctx.shadowColor=fx.color2; ctx.shadowBlur=8;
ctx.translate(p.x, p.y); ctx.rotate(p.rot + frame*0.1);
ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.4); ctx.restore();
}
}

frame++;
if (frame < maxFrames) { animRef.current = requestAnimationFrame(drawFrame); }
else { ctx.clearRect(0,0,W,H); }
}
animRef.current = requestAnimationFrame(drawFrame);
return function() { cancelAnimationFrame(animRef.current); };
}, [character]);
return React.createElement(“canvas”, {
ref: canvasRef, width: W, height: H,
style: { position:“absolute”, top:0, left:0, pointerEvents:“none” }
});
}

// ── Single carousel card ──────────────────────────────────────────────────────
// showHolo: true = render HologramCard canvas instead of unicode icon (center only)
// onHoloDone: callback when hologram dissolve finishes (used for confirm-with-animation)
function CarouselCard({ charName, position, isBanned, isSelected, onClick, showHolo, onHoloDone }) {
injectRavenStyles();
var inf  = CHAR_INFO[charName];

var isCenter = position === “center”;
var isNear   = position === “left1” || position === “right1”;

var scale   = isCenter ? 1 : isNear ? 0.72 : 0.52;
var zIndex  = isCenter ? 10 : isNear ? 6 : 3;
var opacity = isBanned ? 0.22 : isCenter ? 1 : isNear ? 0.65 : 0.4;

var translateX = 0;
if (position === “left1”)  translateX = -82;
if (position === “left2”)  translateX = -148;
if (position === “right1”) translateX = 82;
if (position === “right2”) translateX = 148;

var cardW = 148;
var cardH = 196;

var accentR = parseInt((inf.color || “#666”).slice(1,3), 16);
var accentG = parseInt((inf.color || “#666”).slice(3,5), 16);
var accentB = parseInt((inf.color || “#666”).slice(5,7), 16);
var dimAccent  = “rgb(”+(Math.floor(accentR*0.55))+”,”+(Math.floor(accentG*0.55))+”,”+(Math.floor(accentB*0.55))+”)”;
var glowAccent = “rgba(”+(Math.floor(accentR*0.7))+”,”+(Math.floor(accentG*0.7))+”,”+(Math.floor(accentB*0.7))+”,0.35)”;

var cardStyle = {
position: “absolute”,
width: cardW,
height: cardH,
left: “50%”,
top: “50%”,
marginLeft: -(cardW/2),
marginTop: -(cardH/2),
transform: “translateX(”+translateX+“px) scale(”+scale+”)”,
transformOrigin: “center center”,
zIndex: zIndex,
opacity: opacity,
transition: “transform 0.35s cubic-bezier(0.34,1.28,0.64,1), opacity 0.3s ease”,
cursor: isBanned ? “not-allowed” : “pointer”,
borderRadius: 10,
background: isCenter
? “linear-gradient(160deg, “+RAVEN.bg3+” 0%, “+RAVEN.bg2+” 50%, “+RAVEN.bg1+” 100%)”
: “linear-gradient(160deg, “+RAVEN.bg2+” 0%, “+RAVEN.bg1+” 100%)”,
border: isCenter
? “1.5px solid “ + RAVEN.red2
: isNear
? “1px solid “ + RAVEN.borderLit
: “1px solid “ + RAVEN.border,
boxSizing: “border-box”,
overflow: “hidden”,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
justifyContent: “center”,
padding: “0 8px 12px 8px”
};

return React.createElement(“div”, {
style: cardStyle,
className: isCenter ? “raven-card-center” : “”,
onClick: isBanned ? null : onClick
},
// Iridescent raven bg
React.createElement(“div”, { style:{
position:“absolute”, top:0, left:0, right:0, bottom:0, borderRadius:10,
background: isCenter
? “radial-gradient(ellipse at 30% 20%, rgba(26,20,40,0.9) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(15,26,31,0.6) 0%, transparent 50%)”
: “radial-gradient(ellipse at 50% 30%, rgba(20,16,32,0.8) 0%, transparent 70%)”,
pointerEvents: “none”
}}),

// Red top border glow
isCenter && React.createElement(“div”, { style:{
position:“absolute”, top:0, left:“15%”, right:“15%”, height:2,
background:“linear-gradient(90deg, transparent, “+RAVEN.red2+”, transparent)”,
borderRadius:2, boxShadow:“0 0 12px “+RAVEN.red2
}}),

// Icon area — hologram canvas for center, plain icon for sides
React.createElement(“div”, { style:{
position:“relative”, width:“100%”, display:“flex”,
alignItems:“center”, justifyContent:“center”,
height: isCenter ? 112 : 70,
marginBottom: 2, marginTop: isCenter ? 6 : 6,
flexShrink: 0
}},
isCenter
? React.createElement(HologramCard, {
key: charName + (onHoloDone ? “-dissolve” : “-loop”),
character: charName,
size: 100,
loopAnim: onHoloDone ? false : true,
onDone: onHoloDone || null
})
: React.createElement(“span”, { style:{
fontSize: isNear ? 32 : 24,
color: dimAccent,
display:“block”, lineHeight:1, position:“relative”, zIndex:2,
transform: charName === “THE VAMPIRE” ? “rotate(180deg)” : “none”,
filter: isBanned ? “grayscale(1)” : “none”
}}, inf.icon)
),

// Name
React.createElement(“div”, { style:{
fontSize: isCenter ? 9 : isNear ? 7.5 : 6.5,
fontWeight:“bold”,
color: isCenter ? RAVEN.textLit : RAVEN.textDim,
letterSpacing: isCenter ? 2 : 1,
textAlign:“center”,
marginTop: isCenter ? 4 : “auto”,
lineHeight: 1.3,
textTransform:“uppercase”,
filter: isBanned ? “grayscale(1)” : “none”
}}, charName),

// Tag line — center only
isCenter && React.createElement(“div”, { style:{
fontSize: 8,
color: RAVEN.textMid,
fontStyle:“italic”,
textAlign:“center”,
marginTop: 3,
lineHeight: 1.4,
padding:“0 4px”
}}, ‘”’ + inf.tag + ‘”’),

// BANNED overlay
isBanned && React.createElement(“div”, { style:{
position:“absolute”, top:0, left:0, right:0, bottom:0, borderRadius:10,
display:“flex”, alignItems:“center”, justifyContent:“center”,
background:“rgba(7,6,11,0.65)”
}},
React.createElement(“div”, { style:{
fontSize: isCenter ? 11 : 8,
color: RAVEN.red1,
letterSpacing: 2,
fontWeight:“bold”,
textTransform:“uppercase”,
border:“1px solid “+RAVEN.red0,
padding:“2px 8px”,
borderRadius:2,
background:“rgba(10,0,0,0.8)”
}}, “BANNED”)
),

// Selected highlight ring
isSelected && !isBanned && React.createElement(“div”, { style:{
position:“absolute”, top:0, left:0, right:0, bottom:0, borderRadius:10,
border:“2px solid “+RAVEN.red3,
boxShadow:“0 0 20px “+RAVEN.red2+”, 0 0 0 0 transparent”,
pointerEvents:“none”
}}),

// Per-character dramatic select effect — fires once on selection
isSelected && !isBanned && React.createElement(SelectFxCanvas, {
key: charName + “-fx-” + (isSelected ? “1” : “0”),
character: charName,
W: cardW,
H: cardH
})
);
}

// ── The main carousel component ───────────────────────────────────────────────
function CharCarousel({ chars, banned, onSelect, mode, actionLabel }) {
injectRavenStyles();

var cs  = useState(0);     var centerIdx  = cs[0];  var setCenterIdx  = cs[1];
var hs  = useState(false); var animating  = hs[0];  var setAnimating  = hs[1];
var ss  = useState(-1);    var selected   = ss[0];  var setSelected   = ss[1];
var cfs = useState(false); var confirming = cfs[0]; var setConfirming = cfs[1];

var total = chars.length;

function navigate(dir) {
if (animating || confirming) return;
setSelected(-1);
setAnimating(true);
setCenterIdx(function(prev) {
var next = (prev + dir + total) % total;
return next;
});
setTimeout(function() { setAnimating(false); }, 360);
}

function getPosition(charIdx) {
var diff = charIdx - centerIdx;
if (diff > total/2) diff -= total;
if (diff < -total/2) diff += total;
if (diff === 0) return “center”;
if (diff === -1 || diff === total-1) return “left1”;
if (diff === -2 || diff === total-2) return “left2”;
if (diff === 1) return “right1”;
if (diff === 2) return “right2”;
return null;
}

function handleCardClick(idx) {
if (confirming) return;
if (banned.indexOf(chars[idx]) >= 0) return;
if (idx !== centerIdx) {
var diff = idx - centerIdx;
if (diff > total/2) diff -= total;
if (diff < -total/2) diff += total;
navigate(diff > 0 ? 1 : -1);
} else {
setSelected(idx);
}
}

function handleConfirm() {
if (selected < 0 || confirming) return;
setConfirming(true);
}

function handleHoloDone() {
var charToSelect = chars[selected];
setConfirming(false);
setSelected(-1);
if (onSelect) onSelect(charToSelect);
}

var centerChar   = chars[centerIdx];
var centerSkills = CHAR_SKILLS[centerChar] || [];
var dotChars     = chars;

return React.createElement(“div”, { style:{
display:“flex”, flexDirection:“column”, alignItems:“center”,
width:“100%”, flex:1, userSelect:“none”,
background:“linear-gradient(180deg, “+RAVEN.bg0+” 0%, “+RAVEN.bg1+” 40%, “+RAVEN.bg0+” 100%)”
}},

// Carousel viewport
React.createElement(“div”, { style:{
position:“relative”,
width:“100%”, height: 220,
display:“flex”, alignItems:“center”, justifyContent:“center”,
overflow:“hidden”,
flexShrink: 0
}},
// Ambient background glow
React.createElement(“div”, { style:{
position:“absolute”,
width:180, height:180,
borderRadius:“50%”,
background:“radial-gradient(circle, rgba(139,0,0,0.08) 0%, transparent 70%)”,
pointerEvents:“none”, zIndex:1
}}),

// Render all cards that have a valid position
chars.map(function(c, idx) {
var pos = getPosition(idx);
if (!pos) return null;
var isPos = pos === “center”;
return React.createElement(CarouselCard, {
key: c,
charName: c,
position: pos,
isBanned: banned.indexOf(c) >= 0,
isSelected: selected === idx,
onClick: function() { handleCardClick(idx); },
showHolo: isPos,
onHoloDone: (isPos && confirming && selected === idx) ? handleHoloDone : null
});
}),

// Left nav arrow
React.createElement(“button”, {
style:{
position:“absolute”, left: 6, top:“50%”,
transform:“translateY(-50%)”,
zIndex:20, background:“transparent”,
border:“1px solid “+RAVEN.border,
color:RAVEN.textMid,
width:28, height:40, borderRadius:4,
cursor:“pointer”, fontSize:14,
display:“flex”, alignItems:“center”, justifyContent:“center”
},
onClick: function() { navigate(-1); }
}, React.createElement(“span”, { style:{ lineHeight:1 } }, “<”)),

// Right nav arrow
React.createElement(“button”, {
style:{
position:“absolute”, right: 6, top:“50%”,
transform:“translateY(-50%)”,
zIndex:20, background:“transparent”,
border:“1px solid “+RAVEN.border,
color:RAVEN.textMid,
width:28, height:40, borderRadius:4,
cursor:“pointer”, fontSize:14,
display:“flex”, alignItems:“center”, justifyContent:“center”
},
onClick: function() { navigate(1); }
}, React.createElement(“span”, { style:{ lineHeight:1 } }, “>”))
),

// Dot strip (tier indicators like the reference image)
React.createElement(“div”, { style:{
display:“flex”, gap:5, alignItems:“center”,
justifyContent:“center”, marginTop:4, flexWrap:“wrap”,
padding:“0 20px”, maxWidth:320
}},
dotChars.map(function(c, idx) {
var isCtr = idx === centerIdx;
var isBnd = banned.indexOf(c) >= 0;
return React.createElement(“div”, {
key:c,
onClick: function() { if (!isBnd) { setCenterIdx(idx); setSelected(-1); } },
style:{
width: isCtr ? 10 : 6,
height: isCtr ? 10 : 6,
borderRadius:“50%”,
background: isBnd ? RAVEN.red0 : isCtr ? RAVEN.red2 : RAVEN.bg3,
border:“1px solid “+(isBnd ? RAVEN.red0 : isCtr ? RAVEN.red2 : RAVEN.borderLit),
boxShadow: isCtr ? “0 0 8px “+RAVEN.red2 : “none”,
cursor: isBnd ? “default” : “pointer”,
transition:“all 0.2s”
}
});
})
),

// Info panel for center character
React.createElement(“div”, { style:{
width:“100%”, maxWidth:340,
padding:“10px 16px 4px 16px”,
boxSizing:“border-box”
}, className:“raven-slide-in”, key:centerChar},

// Skills preview (1-2 lines)
centerSkills.length > 0 && React.createElement(“div”, { style:{
background:RAVEN.bg2,
border:“1px solid “+RAVEN.border,
borderLeft:“2px solid “+RAVEN.red1,
borderRadius:4,
padding:“8px 10px”,
marginBottom:8
}},
React.createElement(“div”, { style:{ fontSize:8, color:RAVEN.red1, letterSpacing:2, marginBottom:5 } }, “ABILITIES”),
centerSkills.slice(0,2).map(function(sk, i) {
return React.createElement(“div”, { key:i, style:{
display:“flex”, alignItems:“flex-start”, gap:6, marginBottom:4
}},
React.createElement(“span”, { style:{
fontSize:7, color: sk.type===“Δ” ? RAVEN.gold : “#7ec8e3”,
background:RAVEN.bg1, border:“1px solid “+RAVEN.border,
borderRadius:2, padding:“1px 4px”, flexShrink:0, marginTop:1
}}, sk.type),
React.createElement(“div”, null,
React.createElement(“div”, { style:{ fontSize:9, color:RAVEN.textMid, fontWeight:“bold” } }, sk.name),
React.createElement(“div”, { style:{ fontSize:8, color:RAVEN.textDim, fontStyle:“italic”, lineHeight:1.4, marginTop:1 } },
sk.desc.length > 72 ? sk.desc.slice(0,72)+”…” : sk.desc
)
)
);
}),
centerSkills.length > 2 && React.createElement(“div”, { style:{ fontSize:7, color:RAVEN.textDim, marginTop:2 } },
“+ “+(centerSkills.length-2)+” more”
)
)
),

// Action button
React.createElement(“div”, { style:{
width:“100%”, maxWidth:340,
padding:“0 16px 12px 16px”,
boxSizing:“border-box”
}},
selected >= 0 && banned.indexOf(chars[selected]) < 0
? React.createElement(“button”, {
style:{
width:“100%”, padding:“12px”,
background: confirming
? “linear-gradient(135deg, #2a0008 0%, #1a0005 100%)”
: “linear-gradient(135deg, “+RAVEN.red1+” 0%, “+RAVEN.red0+” 100%)”,
border:“1px solid “+(confirming ? RAVEN.red1 : RAVEN.red2),
borderRadius:5, color: confirming ? RAVEN.red1 : “#f0d0d0”,
fontSize:11, fontWeight:“bold”, letterSpacing:3,
cursor: confirming ? “default” : “pointer”,
fontFamily:“Georgia, serif”,
boxShadow: confirming ? “none” : “0 0 16px “+RAVEN.redGlow,
transition:“all 0.2s”
},
disabled: confirming,
onClick: handleConfirm
}, confirming ? “…” : (actionLabel || “CONFIRM”))
: React.createElement(“div”, {
style:{
width:“100%”, padding:“12px”,
background:RAVEN.bg2,
border:“1px solid “+RAVEN.border,
borderRadius:5, color:RAVEN.textDim,
fontSize:10, letterSpacing:2,
textAlign:“center”, fontFamily:“Georgia, serif”
}
}, banned.indexOf(centerChar) >= 0 ? “ALREADY BANNED” : “TAP CARD TO SELECT”)
)
);
}

// ─ ROOT ───────────────────────────────────────────────────────────────────────
export default function App() {
var s = useState(“HOME”); var screen = s[0]; var setScreen = s[1];
var g = useState(null);   var gameConfig = g[0]; var setGameConfig = g[1];
var store = useProfiles();
function startGame(cfg) { setGameConfig(cfg); setScreen(“GAME”); }
function exitGame()      { setGameConfig(null); setScreen(“HOME”); }
if (screen === “HOME”)    return React.createElement(Home,       { go: setScreen });
if (screen === “HOW_TO”)  return React.createElement(HowToPlay,  { back: function() { setScreen(“HOME”); } });
if (screen === “CHARS”)   return React.createElement(CharSheets, { back: function() { setScreen(“HOME”); } });
if (screen === “PROFILE”) return React.createElement(Profile,    { store: store, back: function() { setScreen(“HOME”); } });
if (screen === “VS_AI”)   return React.createElement(VsAISetup,  { store: store, back: function() { setScreen(“HOME”); }, start: startGame });
if (screen === “ONLINE”)  return React.createElement(OnlineSetup,{ store: store, back: function() { setScreen(“HOME”); }, start: startGame });
if (screen === “GAME”)    return React.createElement(Game,       { cfg: gameConfig, store: store, exit: exitGame });
return null;
}

// ─ HOME ───────────────────────────────────────────────────────────────────────
function Home({ go }) {
return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style: base.center },
React.createElement(“div”, { style: base.logo }, “* THIEF *”),
React.createElement(“div”, { style: base.sub }, “Enter the Mansion. Collect the coins. Survive.”),
React.createElement(“div”, { style: base.divider }),
React.createElement(“div”, { style:{ display:“flex”, gap:12, flexWrap:“wrap”, justifyContent:“center” } },
React.createElement(“button”, { style: base.btn,   onClick: function() { go(“VS_AI”); }  }, “VS AI”),
React.createElement(“button”, { style: base.ghost, onClick: function() { go(“ONLINE”); } }, “ONLINE”)
),
React.createElement(“div”, { style:{ display:“flex”, gap:8, flexWrap:“wrap”, justifyContent:“center”, marginTop:8 } },
React.createElement(“button”, { style: base.ghost, onClick: function() { go(“HOW_TO”); }  }, “How to Play”),
React.createElement(“button”, { style: base.ghost, onClick: function() { go(“CHARS”); }   }, “Characters”),
React.createElement(“button”, { style: base.ghost, onClick: function() { go(“PROFILE”); } }, “Profile”)
),
React.createElement(“div”, { style:{ fontSize:9, color:”#221c2e”, letterSpacing:2, marginTop:16 } }, “(c) THIEF OFFICIAL 2022”)
)
)
);
}

// ─ HOW TO PLAY ────────────────────────────────────────────────────────────────
function HowToPlay({ back }) {
var s = useState(0); var idx = s[0]; var setIdx = s[1];
var ch = HOW_TO[idx];
return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, padding:“10px 16px”, borderBottom:“1px solid #1e1828”, gap:12 } },
React.createElement(“button”, { style: base.ghost, onClick: back }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center”, fontSize:12, letterSpacing:3, color:”#c4896a” } }, “HOW TO PLAY”)
),
React.createElement(“div”, { style:{ display:“flex”, flex:1, overflow:“hidden” } },
React.createElement(“div”, { style:{ width:140, borderRight:“1px solid #1e1828”, overflowY:“auto”, padding:“8px 0” } },
HOW_TO.map(function(h, i) {
return React.createElement(“div”, { key:i, style:{ padding:“8px 12px”, cursor:“pointer”, borderLeft:“2px solid “+(idx===i?”#c4896a”:“transparent”), background:idx===i?“rgba(201,168,76,0.05)”:“transparent” }, onClick: function() { setIdx(i); } },
React.createElement(“div”, { style:{ fontSize:16 } }, h.icon),
React.createElement(“div”, { style:{ fontSize:8, color:idx===i?”#c4896a”:”#3a3448”, letterSpacing:1, marginTop:2 } }, h.title)
);
})
),
React.createElement(“div”, { style:{ flex:1, overflowY:“auto”, padding:“20px 20px” } },
React.createElement(“div”, { style:{ fontSize:20, color:”#c4896a”, marginBottom:8 } }, ch.icon+” “+ch.title),
React.createElement(“div”, { style: base.divider }),
React.createElement(“div”, { style:{ fontSize:14, color:”#8a7a9a”, lineHeight:1.9, whiteSpace:“pre-line”, marginTop:12, fontStyle:“italic” } }, ch.text),
React.createElement(“div”, { style:{ display:“flex”, justifyContent:“space-between”, marginTop:24 } },
React.createElement(“button”, { style: base.ghost, onClick: function() { if (idx>0) setIdx(idx-1); } }, “Prev”),
React.createElement(“button”, { style: base.ghost, onClick: function() { if (idx<HOW_TO.length-1) setIdx(idx+1); } }, “Next”)
)
)
)
)
);
}

// ─ CHARACTER SHEETS ───────────────────────────────────────────────────────────
function CharSheets({ back }) {
var s = useState(ALL_CHARS[0]); var active = s[0]; var setActive = s[1];
var info   = CHAR_INFO[active];
var skills = CHAR_SKILLS[active];
return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, padding:“10px 16px”, borderBottom:“1px solid #1e1828”, gap:12 } },
React.createElement(“button”, { style: base.ghost, onClick: back }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center”, fontSize:12, letterSpacing:3, color:”#c4896a” } }, “CHARACTER DOSSIERS”)
),
React.createElement(“div”, { style:{ display:“flex”, flex:1, overflow:“hidden” } },
React.createElement(“div”, { style:{ width:130, borderRight:“1px solid #1e1828”, overflowY:“auto”, padding:“8px 0” } },
ALL_CHARS.map(function(c) {
var inf = CHAR_INFO[c];
return React.createElement(“div”, { key:c, style:{ padding:“8px 10px”, cursor:“pointer”, borderLeft:“2px solid “+(active===c?inf.color:“transparent”), background:active===c?inf.color+“11”:“transparent” }, onClick: function() { setActive(c); } },
React.createElement(“div”, { style:{ fontSize:18 } }, inf.icon),
React.createElement(“div”, { style:{ fontSize:7, color:active===c?inf.color:”#3a3448”, letterSpacing:1, marginTop:2 } }, c)
);
})
),
React.createElement(“div”, { style:{ flex:1, overflowY:“auto”, padding:“20px” } },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, gap:10, marginBottom:12 } },
React.createElement(“div”, { style:{ width:64, height:64, display:“flex”, alignItems:“center”, justifyContent:“center”, background:”#0f0c08”, borderRadius:6, border:“1px solid “+info.color+“33”, flexShrink:0 } },
React.createElement(“span”, { style:{ fontSize:34, color:info.color, textShadow:“0 0 16px “+info.color+“66”, display:“inline-block”, transform: active===“THE VAMPIRE”?“rotate(180deg)”:“none” } }, info.icon)
),
React.createElement(“div”, { style:{ flex:1, minWidth:0 } },
React.createElement(“div”, { style:{ fontSize:15, color:info.color, letterSpacing:1, wordBreak:“break-word” } }, active),
React.createElement(“div”, { style:{ fontSize:11, color:”#5a5070”, fontStyle:“italic”, marginTop:2 } }, ‘”’+info.tag+’”’)
)
),
React.createElement(“div”, { style: base.divider }),
React.createElement(“div”, { style:{ fontSize:9, color:”#3a3448”, letterSpacing:2, margin:“12px 0 8px” } }, “SPECIALISATIONS”),
skills.map(function(sk, i) {
return React.createElement(“div”, { key:i, style:{ background:“rgba(0,0,0,0.4)”, border:“1px solid “+info.color+“33”, borderLeft:“3px solid “+info.color, borderRadius:“0 4px 4px 0”, padding:“10px 12px”, marginBottom:10 } },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, gap:6, marginBottom:4, flexWrap:“wrap” } },
React.createElement(“span”, { style:{ fontSize:11, color:info.color, fontWeight:“bold” } }, sk.name),
React.createElement(“span”, { style:{ fontSize:9, color:sk.type===“Δ”?”#c4896a”:”#7ec8e3”, background:”#111”, border:“1px solid #333”, borderRadius:2, padding:“1px 5px” } }, sk.type),
React.createElement(“span”, { style:{ fontSize:9, color:”#3a3448”, background:”#131018”, border:“1px solid #1e1828”, borderRadius:2, padding:“1px 5px” } }, “x”+sk.limit)
),
React.createElement(“div”, { style:{ fontSize:12, color:”#7a6a4a”, lineHeight:1.7, fontStyle:“italic” } }, sk.desc)
);
}),
React.createElement(“div”, { style:{ fontSize:10, color:”#2a2238”, fontStyle:“italic”, textAlign:“center”, marginTop:16 } }, “Delta = Cast (costs turn) . Phi = Passive (auto-triggers)”)
)
)
)
);
}

// ─ PROFILE ───────────────────────────────────────────────────────────────────
var AVATARS = [“◑”,”†”,“ꀦ”,“⍜”,“⚘”,“⊜”,“✦”,“⚕”,“◆”,“☽”,“⌖”,“⌬”,“♱”,“⌂”,“∰”,“⚭”,“◬”];
function Profile({ store, back }) {
var n = useState(””); var name = n[0]; var setName = n[1];
var l = useState(null); var loaded = l[0]; var setLoaded = l[1];
function load() { if (!name.trim()) return; setLoaded(store.get(name.trim())); }
function setAv(a) { store.save(name, { avatar: a }); setLoaded(store.get(name)); }
function doClean() { var ok = store.cleanse(name); if (ok) setLoaded(store.get(name)); else alert(“Not enough coins! Need 10.”); }
return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, padding:“10px 16px”, borderBottom:“1px solid #1e1828”, gap:12 } },
React.createElement(“button”, { style: base.ghost, onClick: back }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center”, fontSize:12, letterSpacing:3, color:”#c4896a” } }, “PROFILE”)
),
React.createElement(“div”, { style:{ maxWidth:480, margin:“0 auto”, padding:20, width:“100%”, display:“flex”, flexDirection:“column”, gap:12 } },
React.createElement(“div”, { style:{ display:“flex”, gap:8 } },
React.createElement(“input”, { style: base.input, value: name, placeholder:“Enter your name”, onChange: function(e) { setName(e.target.value); } }),
React.createElement(“button”, { style: base.btn, onClick: load }, “LOAD”)
),
loaded && React.createElement(“div”, { style:{ display:“flex”, flexDirection:“column”, gap:10 } },
React.createElement(“div”, { style:{ …base.card, textAlign:“center” } },
React.createElement(“div”, { style:{ fontSize:48 } }, loaded.avatar || “◑”),
React.createElement(“div”, { style:{ fontSize:18, color:”#c4896a”, marginTop:4 } }, loaded.name),
React.createElement(“div”, { style:{ fontSize:13, color:”#5a5070”, marginTop:2 } }, “✦ “+(loaded.coins||0)+” coins”),
loaded.insanity && React.createElement(“div”, { style:{ background:”#0e0825”, border:“1px solid #2a1a4a”, borderRadius:4, padding:“8px”, marginTop:10 } },
React.createElement(“div”, { style:{ fontSize:10, color:”#c084fc”, fontWeight:“bold” } }, “AFFLICTION: “+loaded.insanity),
React.createElement(“div”, { style:{ fontSize:11, color:”#5a4a7a”, fontStyle:“italic”, marginTop:2 } }, INSANITY_DESC[loaded.insanity]),
React.createElement(“button”, { style:{ …base.btn, marginTop:8, width:“100%”, fontSize:10 }, onClick: doClean }, “Cleansing Soul - 10 coins”)
),
!loaded.insanity && React.createElement(“div”, { style:{ fontSize:11, color:”#2a3a2a”, fontStyle:“italic”, marginTop:6 } }, “Mind is clear.”)
),
React.createElement(“div”, { style: base.card },
React.createElement(“div”, { style: base.tag }, “CHOOSE AVATAR”),
React.createElement(“div”, { style:{ display:“flex”, flexWrap:“wrap”, gap:8, justifyContent:“center” } },
AVATARS.map(function(a) {
return React.createElement(“div”, { key:a, style:{ fontSize:22, cursor:“pointer”, padding:6, borderRadius:4, border:“1px solid “+(loaded.avatar===a?”#c4896a”:”#1e1828”), background:loaded.avatar===a?”#1e1828”:“transparent” }, onClick: function() { setAv(a); } }, a);
})
)
)
)
)
)
);
}

// ─ VS AI SETUP ────────────────────────────────────────────────────────────────
function VsAISetup({ store, back, start }) {
var st = useState(“COUNT”); var step = st[0]; var setStep = st[1];
var ac = useState(1); var aiCount = ac[0]; var setAiCount = ac[1];
var pn = useState(“Player”); var pname = pn[0]; var setPname = pn[1];
var bc = useState([]); var banned = bc[0]; var setBanned = bc[1];
var total = aiCount + 1;

function doBan(c) {
var bans = banned.concat([c]);
while (bans.length < total) {
var avail = ALL_CHARS.filter(function(x) { return bans.indexOf(x) === -1; });
if (!avail.length) break;
bans = bans.concat([avail[Math.floor(Math.random()*avail.length)]]);
}
setBanned(bans); setStep(“PICK”);
}

function doPick(c) {
var prof = store.get(pname); var taken = [c]; var aipicks = [];
for (var i = 0; i < aiCount; i++) {
var avail = ALL_CHARS.filter(function(x) { return banned.indexOf(x)===-1 && taken.indexOf(x)===-1; });
var p = avail[Math.floor(Math.random()*avail.length)];
aipicks.push(p); taken.push(p);
}
var players = [{ name:pname, char:c, isHuman:true, insanity:prof.insanity }];
for (var i = 0; i < aipicks.length; i++) players.push({ name:“AI “+(i+1), char:aipicks[i], isHuman:false, insanity:null });
start({ mode:“VS_AI”, players:players, total:total });
}

if (step === “COUNT”) return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, padding:“10px 16px”, borderBottom:“1px solid #1e1828”, gap:12 } },
React.createElement(“button”, { style: base.ghost, onClick: back }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center”, fontSize:12, letterSpacing:3, color:”#c4896a” } }, “VS AI”)
),
React.createElement(“div”, { style: base.center },
React.createElement(“div”, { style:{ fontSize:12, color:”#3a3448”, letterSpacing:2 } }, “HOW MANY AI OPPONENTS?”),
React.createElement(“div”, { style:{ display:“flex”, gap:10, flexWrap:“wrap”, justifyContent:“center” } },
[1,2,3,4].map(function(n) {
return React.createElement(“div”, { key:n, style:{ width:80, padding:“12px 8px”, borderRadius:5, cursor:“pointer”, textAlign:“center”, border:“1px solid “+(aiCount===n?”#c4896a”:”#221c2e”), background:aiCount===n?”#1e1828”:”#130f18”, color:aiCount===n?”#c4896a”:”#3a3448” }, onClick: function() { setAiCount(n); } },
React.createElement(“div”, { style:{ fontSize:20, fontWeight:“bold” } }, “1v”+n),
React.createElement(“div”, { style:{ fontSize:9, marginTop:2 } }, n+” AI”+(n>1?“s”:””))
);
})
),
React.createElement(“input”, { style:{ …base.input, maxWidth:280, textAlign:“center” }, value:pname, placeholder:“Your name”, onChange: function(e) { setPname(e.target.value); } }),
React.createElement(“button”, { style: base.btn, onClick: function() { setBanned([]); setStep(“BAN”); } }, “START BANNING”)
)
)
);

// ── BAN STEP — Carousel ────────────────────────────────────────────────────
var availBan = ALL_CHARS.filter(function(c) { return banned.indexOf(c)===-1; });
if (step === “BAN”) return (
React.createElement(“div”, { style:{ …base.root, background:RAVEN.bg0 } },
// Header
React.createElement(“div”, { style:{
display:“flex”, alignItems:“center”,
padding:“10px 16px”,
borderBottom:“1px solid “+RAVEN.border,
background:RAVEN.bg1, gap:12, flexShrink:0
} },
React.createElement(“button”, { style: base.ghost, onClick: function() { setStep(“COUNT”); } }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center” } },
React.createElement(“div”, { style:{ fontSize:11, letterSpacing:4, color:RAVEN.red2 } }, “BAN PHASE”),
React.createElement(“div”, { style:{ fontSize:9, color:RAVEN.textDim, marginTop:2 } }, “Choose a character to banish”)
)
),
// Banned chips
banned.length > 0 && React.createElement(“div”, { style:{
display:“flex”, flexWrap:“wrap”, gap:4, padding:“6px 14px”,
background:RAVEN.bg1, borderBottom:“1px solid “+RAVEN.border,
flexShrink:0
} },
banned.map(function(c) {
return React.createElement(“span”, { key:c, style:{
fontSize:8, color:RAVEN.red1,
border:“1px solid “+RAVEN.red0,
borderRadius:2, padding:“2px 7px”,
background:“rgba(74,0,8,0.3)”
} }, c);
})
),
// Carousel — pass ALL_CHARS so carousel always has full set; visually flag banned
React.createElement(“div”, { style:{ flex:1, display:“flex”, overflow:“hidden” } },
React.createElement(CharCarousel, {
chars: ALL_CHARS,
banned: banned,
onSelect: doBan,
mode: “ban”,
actionLabel: “BAN THIS CHARACTER”
})
)
)
);

// ── PICK STEP — Carousel ───────────────────────────────────────────────────
var availPick = ALL_CHARS.filter(function(c) { return banned.indexOf(c)===-1; });
return (
React.createElement(“div”, { style:{ …base.root, background:RAVEN.bg0 } },
// Header
React.createElement(“div”, { style:{
display:“flex”, alignItems:“center”,
padding:“10px 16px”,
borderBottom:“1px solid “+RAVEN.border,
background:RAVEN.bg1, gap:12, flexShrink:0
} },
React.createElement(“button”, { style: base.ghost, onClick: function() { setStep(“BAN”); } }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center” } },
React.createElement(“div”, { style:{ fontSize:11, letterSpacing:4, color:RAVEN.gold } }, “CHOOSE YOUR CHARACTER”),
React.createElement(“div”, { style:{ fontSize:9, color:RAVEN.textDim, marginTop:2 } }, “AI picks after you”)
)
),
// Banned reference chips
banned.length > 0 && React.createElement(“div”, { style:{
display:“flex”, flexWrap:“wrap”, gap:4, padding:“5px 14px”,
background:RAVEN.bg1, borderBottom:“1px solid “+RAVEN.border,
flexShrink:0
} },
React.createElement(“span”, { style:{ fontSize:7, color:RAVEN.textDim, marginRight:4, alignSelf:“center” } }, “BANNED:”),
banned.map(function(c) {
return React.createElement(“span”, { key:c, style:{
fontSize:8, color:RAVEN.textDim,
border:“1px solid “+RAVEN.border,
borderRadius:2, padding:“2px 7px”
} }, c);
})
),
React.createElement(“div”, { style:{ flex:1, display:“flex”, overflow:“hidden” } },
React.createElement(CharCarousel, {
chars: availPick,
banned: [],
onSelect: doPick,
mode: “pick”,
actionLabel: “ENTER THE MANSION”
})
)
)
);
}

// ─ ONLINE SETUP ───────────────────────────────────────────────────────────────
function OnlineSetup({ store, back, start }) {
var st  = useState(“COUNT”); var step   = st[0]; var setStep   = st[1];
var pc  = useState(2);       var pcount = pc[0]; var setPcount = pc[1];
var ns  = useState([“Player 1”,“Player 2”,“Player 3”,“Player 4”,“Player 5”]); var names = ns[0]; var setNames = ns[1];
var bc  = useState([]);      var banned   = bc[0]; var setBanned   = bc[1];
var bcc = useState(0);       var banCount = bcc[0]; var setBanCount = bcc[1];
var cp  = useState(0);       var cpp      = cp[0]; var setCpp      = cp[1];
var pk  = useState({});      var picked   = pk[0]; var setPicked   = pk[1];

function doBan(c) {
var nb = banned.concat([c]); var nc = banCount+1;
setBanned(nb); setBanCount(nc);
if (nc<pcount) setCpp((cpp+1)%pcount);
else { setCpp(0); setPicked({}); setStep(“PICK”); }
}

function doPick(c) {
var np = {}; for (var k in picked) np[k]=picked[k]; np[cpp]=c;
setPicked(np);
if (Object.keys(np).length<pcount) {
var nx=(cpp+1)%pcount;
while (np[nx]!==undefined) nx=(nx+1)%pcount;
setCpp(nx);
} else {
var players = names.slice(0,pcount).map(function(nm,i) {
var prof=store.get(nm);
return { name:nm, char:np[i], isHuman:true, insanity:prof.insanity };
});
start({ mode:“ONLINE”, players:players, total:pcount });
}
}

if (step===“COUNT”) return (
React.createElement(“div”, { style: base.root },
React.createElement(“div”, { style:{ display:“flex”, alignItems:“center”, padding:“10px 16px”, borderBottom:“1px solid #1e1828”, gap:12 } },
React.createElement(“button”, { style: base.ghost, onClick: back }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center”, fontSize:12, letterSpacing:3, color:”#c4896a” } }, “ONLINE MULTIPLAYER”)
),
React.createElement(“div”, { style: base.center },
React.createElement(“div”, { style:{ fontSize:12, color:”#3a3448”, letterSpacing:2 } }, “NUMBER OF PLAYERS”),
React.createElement(“div”, { style:{ display:“flex”, gap:10, flexWrap:“wrap”, justifyContent:“center” } },
[2,3,4,5].map(function(n) {
return React.createElement(“div”, { key:n, style:{ width:70, padding:“12px 8px”, borderRadius:5, cursor:“pointer”, textAlign:“center”, border:“1px solid “+(pcount===n?”#7ec8e3”:”#221c2e”), background:pcount===n?”#06151a”:”#130f18”, color:pcount===n?”#7ec8e3”:”#3a3448” }, onClick: function() { setPcount(n); } },
React.createElement(“div”, { style:{ fontSize:20, fontWeight:“bold” } }, n)
);
})
),
React.createElement(“div”, { style:{ display:“flex”, flexDirection:“column”, gap:6, width:“100%”, maxWidth:300 } },
names.slice(0,pcount).map(function(nm,i) {
return React.createElement(“input”, { key:i, style: base.input, value:nm, placeholder:“Player “+(i+1), onChange: function(e) { var a=names.slice(); a[i]=e.target.value; setNames(a); } });
})
),
React.createElement(“button”, { style:{ …base.btn, background:”#5a8a9a”, color:”#080808” }, onClick: function() { setBanned([]); setBanCount(0); setCpp(0); setStep(“BAN”); } }, “START BANNING”)
)
)
);

// ── BAN STEP ───────────────────────────────────────────────────────────────
var availBan = ALL_CHARS.filter(function(c) { return banned.indexOf(c)===-1; });
if (step===“BAN”) return (
React.createElement(“div”, { style:{ …base.root, background:RAVEN.bg0 } },
React.createElement(“div”, { style:{
display:“flex”, alignItems:“center”,
padding:“10px 16px”,
borderBottom:“1px solid “+RAVEN.border,
background:RAVEN.bg1, gap:12, flexShrink:0
} },
React.createElement(“button”, { style: base.ghost, onClick: function() { setStep(“COUNT”); } }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center” } },
React.createElement(“div”, { style:{ fontSize:11, letterSpacing:4, color:RAVEN.red2 } }, names[cpp]+”’s BAN”),
React.createElement(“div”, { style:{ fontSize:9, color:RAVEN.textDim, marginTop:2 } }, (banCount+1)+”/”+pcount)
)
),
banned.length > 0 && React.createElement(“div”, { style:{
display:“flex”, flexWrap:“wrap”, gap:4, padding:“6px 14px”,
background:RAVEN.bg1, borderBottom:“1px solid “+RAVEN.border, flexShrink:0
} },
banned.map(function(c) {
return React.createElement(“span”, { key:c, style:{
fontSize:8, color:RAVEN.red1, border:“1px solid “+RAVEN.red0,
borderRadius:2, padding:“2px 7px”, background:“rgba(74,0,8,0.3)”
} }, c);
})
),
React.createElement(“div”, { style:{ flex:1, display:“flex”, overflow:“hidden” } },
React.createElement(CharCarousel, {
chars: ALL_CHARS,
banned: banned,
onSelect: doBan,
mode: “ban”,
actionLabel: “BAN THIS CHARACTER”
})
)
)
);

// ── PICK STEP ──────────────────────────────────────────────────────────────
var availPick = ALL_CHARS.filter(function(c) { return banned.indexOf(c)===-1 && Object.values(picked).indexOf(c)===-1; });
return (
React.createElement(“div”, { style:{ …base.root, background:RAVEN.bg0 } },
React.createElement(“div”, { style:{
display:“flex”, alignItems:“center”,
padding:“10px 16px”,
borderBottom:“1px solid “+RAVEN.border,
background:RAVEN.bg1, gap:12, flexShrink:0
} },
React.createElement(“button”, { style: base.ghost, onClick: function() { setStep(“BAN”); } }, “Back”),
React.createElement(“div”, { style:{ flex:1, textAlign:“center” } },
React.createElement(“div”, { style:{ fontSize:11, letterSpacing:4, color:RAVEN.gold } }, names[cpp]+”’s PICK”),
React.createElement(“div”, { style:{ fontSize:9, color:RAVEN.textDim, marginTop:2 } }, (Object.keys(picked).length+1)+”/”+pcount)
)
),
// Picked summary
Object.keys(picked).length > 0 && React.createElement(“div”, { style:{
display:“flex”, flexWrap:“wrap”, gap:4, padding:“5px 14px”,
background:RAVEN.bg1, borderBottom:“1px solid “+RAVEN.border, flexShrink:0
} },
Object.entries(picked).map(function(e) {
return React.createElement(“span”, { key:e[0], style:{
fontSize:8, color:”#4caf50”, border:“1px solid #1a3a1a”,
borderRadius:2, padding:“2px 7px”
} }, names[e[0]]+”: “+e[1]);
})
),
React.createElement(“div”, { style:{ flex:1, display:“flex”, overflow:“hidden” } },
React.createElement(CharCarousel, {
chars: availPick,
banned: [],
onSelect: doPick,
mode: “pick”,
actionLabel: “CLAIM THIS CHARACTER”
})
)
)
);
}

// ─ GAME ───────────────────────────────────────────────────────────────────────
function Game({ cfg, store, exit }) {
var isAI   = cfg.mode === “VS_AI”;
var PCOUNT = cfg.total;
var initP  = cfg.players.map(function(p, i) { return makePlayer(p.name, p.char, i, p.isHuman, p.insanity); });

var ps  = useState(initP);  var players  = ps[0];  var setPlayers  = ps[1];
var rs  = useState(function() { return genRooms(PCOUNT); }); var rooms = rs[0]; var setRooms = rs[1];
var ts  = useState(0);      var turn     = ts[0];  var setTurn     = ts[1];
var ls  = useState([]);     var log      = ls[0];  var setLog      = ls[1];
var sel = useState(-1);     var selRoom  = sel[0]; var setSelRoom  = sel[1];
var ph  = useState(“PLAY”); var phase    = ph[0];  var setPhase    = ph[1];
var ws  = useState([]);     var winners  = ws[0];  var setWinners  = ws[1];
var ms  = useState(null);   var modal    = ms[0];  var setModal    = ms[1];
var ait = useState(false);  var aiThink  = ait[0]; var setAiThink  = ait[1];
var nt  = useState(””);     var notif    = nt[0];  var setNotif    = nt[1];
var mc  = useState(0);      var masacreeCount = mc[0]; var setMasacreeCount = mc[1];
var rc  = useState(null);   var raisedCorpse  = rc[0]; var setRaisedCorpse  = rc[1];

var humanIdx = isAI ? 0 : -1;
var aiRef    = useRef(null);

var addLog = useCallback(function(msg, type) {
setLog(function(prev) {
return prev.slice(-80).concat([{ msg:msg, type:type||“info”, id:Date.now()+Math.random() }]);
});
}, []);

var isMyTurn = isAI ? (players[turn] && players[turn].isHuman) : true;

useEffect(function() {
if (phase !== “PLAY” || !isAI) return;
var cp = players[turn];
if (!cp || cp.isHuman || !cp.alive || cp.fakeDead) return;
setAiThink(true);
aiRef.current = setTimeout(function() {
setAiThink(false);
doAiTurn(players, rooms, masacreeCount);
}, 1200);
return function() { clearTimeout(aiRef.current); };
}, [turn, phase]);

function nextTurn(P, from) {
var base2 = from !== undefined ? from : turn;
var next  = (base2+1) % PCOUNT;
var tries = 0;
while (tries < PCOUNT) {
var np = P[next];
if (np && np.alive && !np.fakeDead) break;
next = (next+1) % PCOUNT; tries++;
}
var realAlive = P.filter(function(p) { return p.alive && !p.fakeDead; });
if (realAlive.length <= 1) {
var newP2 = P.map(function(p) { return Object.assign({}, p); });
var revived = false;
for (var ri = 0; ri < newP2.length; ri++) {
if (newP2[ri].fakeDead) {
newP2[ri].fakeDead = false;
newP2[ri].life = 1;
addLog(“◬ The Illusionist reappears - last standing!”, “event”);
revived = true;
break;
}
}
if (revived) {
setPlayers(newP2);
checkEnd(newP2, rooms);
return;
}
}
setTurn(next);
if (!isAI || (P[next] && P[next].isHuman)) addLog(“◆ “ + P[next].name + “’s turn -”, “turn”);
applyHangmanDrain(next, P, rooms);
}

function applyHangmanDrain(turnIdx, P, R) {
var lmIdx = -1;
for (var i = 0; i < P.length; i++) {
if (P[i].character === “THE LOVERMAN” && P[i].lovermanState === “Hangman” && P[i].alive) { lmIdx = i; break; }
}
if (lmIdx < 0) return;
var lm = P[lmIdx];
var tgt = lm.lovermanTarget;
if (tgt !== turnIdx) return;
var newP = P.map(function(p) { return Object.assign({}, p); });
var hung  = Object.assign({}, newP[tgt]);
var lmNew = Object.assign({}, newP[lmIdx]);
hung.life  = Math.max(0, hung.life - 1);
lmNew.life = Math.min(MAX_LIFE + 3, lmNew.life + 1);
addLog(“⚭ Promised Happy End - “ + hung.name + “ -1 HP, Loverman +1 HP”, “event”);
if (hung.life <= 0) {
hung.alive = false;
if (!hung.deathCause) { hung.deathCause = “The Promised Happy End”; hung.deathRoom = -1; }
hung.coins = 0;
addLog(”† “ + hung.name + “ drained by Loverman.”, “event”);
}
newP[tgt]   = hung;
newP[lmIdx] = lmNew;
setPlayers(newP);
checkEnd(newP, R);
}

function checkEnd(P, R) {
var allOpen = R.every(function(r) { return r.opened || r.emptied; });
if (isAI) {
var human = P[humanIdx];
if (!human || (!human.alive && !human.fakeDead)) { endGame(P); return true; }
var anyAiAlive = P.some(function(p) { return !p.isHuman && p.alive && !p.fakeDead; });
if (!anyAiAlive) { endGame(P); return true; }
}
var alive = P.filter(function(p) { return p.alive && !p.fakeDead; });
if (alive.length <= 1 || allOpen) { endGame(P); return true; }
return false;
}

function endGame(P) {
var final = P.map(function(p) { return Object.assign({}, p); });
for (var i = 0; i < final.length; i++) {
if (final[i].fakeDead) { final[i].fakeDead = false; final[i].alive = true; }
}
for (var i = 0; i < final.length; i++) {
if (final[i].character === “THE SELLER” && final[i].alive && final[i].coins >= 7) {
final[i].sellerCursed = true; final[i].coins -= 7;
}
}
var li = -1;
for (var i = 0; i < final.length; i++) {
if (final[i].character === “THE LAWYER” && final[i].alive && final[i].fakeJusticeTarget >= 0) { li = i; break; }
}
if (li >= 0) {
var ti2 = final[li].fakeJusticeTarget;
if (final[ti2] && final[ti2].alive) {
final[ti2].fakeJusticePaid = 5; final[ti2].coins = Math.max(0, final[ti2].coins - 5);
final[li].fakeJusticeCollected = 5; final[li].coins += 5;
}
}
if (isAI) {
var h = final[humanIdx];
if (h) { if (h.alive) store.addCoins(h.name, h.coins); store.setIns(h.name, h.insanity); }
}
if (!isAI) { setPhase(“ONLINE_END”); return; }
final.sort(function(a, b) { return b.coins - a.coins; });
setWinners(final); setPhase(“END”);
addLog(”† Game over!”, “system”);
}

function doAiTurn(P, R, mCount) {
var cp = P[turn];
if (!cp || !cp.alive || cp.fakeDead) { nextTurn(P); return; }
if (cp.character === “THE LOVERMAN” && (cp.skills[“The Loverman Oath”] || 0) > 0 && cp.insanity !== “Boast”) {
var targets = P.filter(function(p,i) { return i !== turn && p.alive && !p.fakeDead; });
if (targets.length > 0) {
var tgt = targets[Math.floor(Math.random()*targets.length)];
var tgtIdx = -1;
for (var i = 0; i < P.length; i++) { if (P[i].id === tgt.id) { tgtIdx = i; break; } }
if (tgtIdx >= 0) { execLovermanOath(tgtIdx, P, R); return; }
}
}
if (cp.character === “THE VAMPIRE” && (cp.skills[“Red-Out Massacre”]||0) > 0) {
if (cp.coins>=6 && cp.life>=6 && cp.sanity>=6 && mCount>=3) {
addLog(“♱ “+cp.name+” unleashes Red-Out!”, “event”);
execRedOut(P, R, mCount); return;
}
}
if (cp.character === “THE UNDERTAKER”) {
if ((cp.skills[“Proper Burial”]||0)>0 && !cp.properBurialActive && cp.insanity!==“Boast”) {
var newP2=P.map(function(p){return Object.assign({},p);});
var cpU=Object.assign({},newP2[turn]);
cpU.skills[“Proper Burial”]=0; cpU.properBurialActive=true;
newP2[turn]=cpU; setPlayers(newP2);
addLog(“⌂ “+cp.name+” activates Proper Burial.”,“event”);
nextTurn(newP2); return;
}
if ((cp.skills[“EX-Saint”]||0)>0 && cp.insanity!==“Boast” && cp.sanity>=6) {
var newP3=P.map(function(p){return Object.assign({},p);});
var cpE=Object.assign({},newP3[turn]);
cpE.skills[“EX-Saint”]=cpE.skills[“EX-Saint”]-1; cpE.exSaintBlessed=true;
newP3[turn]=cpE; setPlayers(newP3);
addLog(“⌂ “+cp.name+” blesses themselves with EX-Saint.”,“event”);
nextTurn(newP3); return;
}
if ((cp.skills[“Raise!”]||0)>0 && cp.insanity!==“Boast”) {
var deadOnes=P.filter(function(p){return !p.alive && !p.fakeDead;});
if (deadOnes.length>0) {
var corpseIdx=-1;
for (var i=0;i<P.length;i++) { if (!P[i].alive && !P[i].fakeDead) { corpseIdx=i; break; } }
var newP4=P.map(function(p){return Object.assign({},p);});
var cpR=Object.assign({},newP4[turn]);
cpR.skills[“Raise!”]=0; newP4[turn]=cpR; setPlayers(newP4);
var corpseInfo2={ playerIdx:corpseIdx, turnsLeft:2 };
setRaisedCorpse(corpseInfo2);
addLog(“⌂ “+cp.name+” raises “+P[corpseIdx].name+”!”,“event”);
var cRid=aiRoom(P[corpseIdx],R);
if (cRid<0) { setRaisedCorpse(null); nextTurn(newP4); return; }
execRaisedCorpseTurn(cRid, corpseInfo2, newP4, R); return;
}
}
}
var rid=aiRoom(cp,R);
if (rid<0) { nextTurn(P); return; }
setNotif(cp.name+” opens Room “+rid+”…”);
setTimeout(function(){setNotif(””);},900);
openRoomLogic(rid, P, R, mCount);
}

function execLovermanOath(tgtIdx, P, R) {
var newP = P.map(function(p) { return Object.assign({}, p); });
var lm   = Object.assign({}, newP[turn]);
lm.skills[“The Loverman Oath”] = 0;
lm.lovermanTarget = tgtIdx;
newP[turn] = lm;
setPlayers(newP);
var target = newP[tgtIdx];
if (!target.isHuman) {
var decision;
if (target.life <= 4) decision = “accept”;
else if (target.life <= 6) decision = “hang”;
else decision = “reject”;
applyOathDecision(decision, tgtIdx, newP, R);
} else {
setModal({
type: “LOVERMAN_OATH”,
targetIdx: tgtIdx,
loverIdx: turn,
loverName: lm.name,
onDecide: function(decision) {
setModal(null);
applyOathDecision(decision, tgtIdx, players, rooms);
}
});
}
}

function applyOathDecision(decision, tgtIdx, P, R) {
var newP = P.map(function(p) { return Object.assign({}, p); });
var lm   = Object.assign({}, newP[turn]);
var tgt  = Object.assign({}, newP[tgtIdx]);
if (decision === “reject”) {
lm.lovermanState = “Tower”;
tgt.loveMarkStatus = “rejected”;
addLog(“⚭ “+tgt.name+” rejected the oath. Tower state.”, “event”);
if (!lm.devastatedFired) {
lm.devastatedFired = true;
addLog(“⚭ Devastated! All players +5 Sanity.”, “event”);
for (var i = 0; i < newP.length; i++) {
var pp = Object.assign({}, newP[i]);
pp.sanity = Math.min(MAX_SANITY, pp.sanity + 5);
if (pp.sanity >= MAX_SANITY && !pp.insanity) { pp.insanity = rollInsanity(); addLog(“◌ “+pp.name+” INSANITY: [”+pp.insanity+”]!”, “event”); }
newP[i] = pp;
}
}
} else if (decision === “accept”) {
lm.lovermanState = “Lovers”;
tgt.loveMarkStatus = “accepted”;
tgt.loveBondPartner = turn;
lm.loveBondPartner  = tgtIdx;
addLog(“⚭ “+tgt.name+” accepted the oath. Lovers state.”, “event”);
if (!lm.lovestuckFired) {
lm.lovestuckFired = true;
tgt.insanity = null;
addLog(“⚭ Lovestruck! All sanity bars reset to 0.”, “event”);
for (var i = 0; i < newP.length; i++) {
newP[i] = Object.assign({}, newP[i], { sanity: 0 });
}
}
} else {
lm.lovermanState = “Hangman”;
tgt.loveMarkStatus = “hanging”;
addLog(“⚭ “+tgt.name+” hung the decision. Hangman state.”, “event”);
}
newP[turn]    = lm;
newP[tgtIdx]  = tgt;
setPlayers(newP);
if (!checkEnd(newP, R)) nextTurn(newP);
}

function spreadGateOfDespair(sanGained, openingPlayerIdx, P) {
var lmIdx = -1;
for (var i = 0; i < P.length; i++) {
if (P[i].character === “THE LOVERMAN” && P[i].lovermanState === “Tower” && P[i].alive) { lmIdx = i; break; }
}
if (lmIdx < 0 || lmIdx === openingPlayerIdx) return P;
if (sanGained <= 0) return P;
addLog(“⚭ Gate of Despair spreads sanity to all!”, “event”);
var newP = P.map(function(p) { return Object.assign({}, p); });
for (var i = 0; i < newP.length; i++) {
if (i === lmIdx) continue;
var pp = Object.assign({}, newP[i]);
pp.sanity = Math.min(MAX_SANITY, pp.sanity + sanGained);
if (pp.sanity >= MAX_SANITY && !pp.insanity) {
pp.insanity = rollInsanity();
addLog(“◌ “+pp.name+” INSANITY: [”+pp.insanity+”]!”, “event”);
}
newP[i] = pp;
}
return newP;
}

function checkLoveBond(newP) {
var lmIdx = -1;
for (var i = 0; i < newP.length; i++) {
if (newP[i].character === “THE LOVERMAN” && newP[i].lovermanState === “Lovers” && newP[i].alive) { lmIdx = i; break; }
}
if (lmIdx < 0) return newP;
var partnerIdx = newP[lmIdx].loveBondPartner;
if (partnerIdx < 0 || !newP[partnerIdx] || !newP[partnerIdx].alive) return newP;
var lm  = Object.assign({}, newP[lmIdx]);
var pt  = Object.assign({}, newP[partnerIdx]);
var totalCoins = lm.coins + pt.coins;
var eachCoins  = Math.floor(totalCoins / 2);
lm.coins = eachCoins; pt.coins = totalCoins - eachCoins;
if (lm.life <= 0 && pt.life <= 0) {
lm.alive = false; pt.alive = false;
if (!lm.deathCause) { lm.deathCause = “Till death do us a part”; lm.deathRoom = -1; }
if (!pt.deathCause) { pt.deathCause = “Till death do us a part”; pt.deathRoom = -1; }
lm.coins = 0; pt.coins = 0;
addLog(“⚭ Both bonded souls perish together.”, “event”);
} else if (lm.life <= 0 && pt.life > 1) {
lm.life = 1;
addLog(“⚭ Bond shields Loverman from death – 1 HP.”, “event”);
} else if (pt.life <= 0 && lm.life > 1) {
pt.life = 1;
addLog(“⚭ Bond shields “+pt.name+” from death – 1 HP.”, “event”);
}
newP[lmIdx]      = lm;
newP[partnerIdx] = pt;
return newP;
}

function execRedOut(P, R, mCount) {
var newP = P.map(function(p) { return Object.assign({}, p); });
var cp   = Object.assign({}, newP[turn]);
cp.skills[“Red-Out Massacre”] = 0;
var livingOpponents = newP.filter(function(p,i) { return i!==turn && p.alive && !p.fakeDead; });
if (livingOpponents.length===0) { newP[turn]=cp; setPlayers(newP); nextTurn(newP); return; }
var dmgEach = Math.floor(mCount/livingOpponents.length);
if (dmgEach<1) dmgEach=1;
addLog(“♱ Red-Out! “+mCount+” blood = “+dmgEach+” dmg each opponent”,“event”);
for (var i=0;i<newP.length;i++) {
if (i===turn||!newP[i].alive||newP[i].fakeDead) continue;
var actualTarget = resolveTarget(i, turn, newP, false);
var target = Object.assign({}, newP[actualTarget]);
target.life = Math.max(0, target.life-dmgEach);
if (target.life<=0) {
if (target.character===“THE ILLUSIONIST” && (target.skills[“Fake Death”]||0)>0) {
target.fakeDead=true; target.skills[“Fake Death”]=0; target.life=0;
addLog(“◬ “+target.name+” fakes death!”,“event”);
} else {
target.alive=false;
if (!target.deathCause) { target.deathCause=“Red-Out Massacre”; target.deathRoom=-1; }
target.coins=0;
addLog(”† “+target.name+” dies from Red-Out!”,“event”);
}
}
newP[actualTarget]=target;
}
newP[turn]=cp; newP=checkLoveBond(newP);
setPlayers(newP); setRooms(R);
if (!checkEnd(newP,R)) nextTurn(newP);
}

function execRaisedCorpseTurn(roomId, corpseInfo, P, R) {
var ri=roomId-1;
var newR=R.map(function(r){return Object.assign({},r);});
if (newR[ri].opened) { endRaisedTurn(corpseInfo,P,R); return; }
newR[ri].opened=true;
addLog(“⌂ Corpse of “+P[corpseInfo.playerIdx].name+” opens Room “+roomId+” - nothing gained.”,“event”);
var newTurnsLeft=corpseInfo.turnsLeft-1;
if (newTurnsLeft<=0) {
setRaisedCorpse(null); addLog(“⌂ Corpse returns to the grave.”,“event”);
setRooms(newR); nextTurn(P);
} else {
setRaisedCorpse({playerIdx:corpseInfo.playerIdx,turnsLeft:newTurnsLeft});
setRooms(newR);
setModal({type:“RAISE_CORPSE_TURN”,corpseInfo:{playerIdx:corpseInfo.playerIdx,turnsLeft:newTurnsLeft},rooms:newR,players:P});
}
}
function endRaisedTurn(corpseInfo,P,R) {
var newTurnsLeft=corpseInfo.turnsLeft-1;
if (newTurnsLeft<=0) {
setRaisedCorpse(null); addLog(“⌂ Corpse returns to the grave.”,“event”); nextTurn(P);
} else {
setRaisedCorpse({playerIdx:corpseInfo.playerIdx,turnsLeft:newTurnsLeft});
setModal({type:“RAISE_CORPSE_TURN”,corpseInfo:{playerIdx:corpseInfo.playerIdx,turnsLeft:newTurnsLeft},rooms:R,players:P});
}
}

function execQuantumOverload(pickedRoomIds, P, R) {
var newR=R.map(function(r){return Object.assign({},r);});
var newP=P.map(function(p){return Object.assign({},p);});
var cp=Object.assign({},newP[turn]);
cp.skills[“Quantum Overload Tunneling”]=0;
var totalCoins=0,totalDmg=0,totalSan=0,bombHit=false,newMCount=masacreeCount;
var quantumRooms=(cp.quantumRooms||[]).slice();
for (var qi=0;qi<pickedRoomIds.length;qi++) {
var rid2=pickedRoomIds[qi]; var ri2=rid2-1; var room=newR[ri2];
if (room.opened||room.emptied) continue;
newR[ri2]=Object.assign({},room,{emptied:true}); quantumRooms.push(rid2);
var agIdx2=-1;
for (var ai=0;ai<newP.length;ai++) { if (newP[ai].character===“THE AGENT”&&newP[ai].alive){agIdx2=ai;break;} }
if (agIdx2>=0&&newP[agIdx2].bombRoom===rid2) {
totalDmg+=7; bombHit=true;
var agBomb=Object.assign({},newP[agIdx2]); agBomb.bombRoom=-1; newP[agIdx2]=agBomb;
}
var contents=room.stackedContents?room.stackedContents:[room.type];
for (var ci=0;ci<contents.length;ci++) {
var ct=contents[ci];
if (ct===“coins”) { if (cp.insanity!==“Conceit”) totalCoins+=1; }
else if (ct===“masacree”) { if (cp.character!==“THE VAMPIRE”) totalDmg+=cp.insanity===“Masochist”?4:2; newMCount+=1; }
else if (ct===“dimensional”) { if (!cp.immune) totalSan+=cp.character===“THE VAMPIRE”?3:2; }
}
}
cp.coins=Math.max(0,cp.coins+totalCoins);
cp.life=Math.max(0,cp.life-totalDmg);
cp.sanity=Math.min(MAX_SANITY,cp.sanity+totalSan);
if (cp.insanity===“Lavish”&&totalCoins>0) cp.coins=Math.max(0,cp.coins-2);
cp.quantumRooms=quantumRooms;
if (cp.sanity>=MAX_SANITY&&!cp.insanity) { cp.insanity=rollInsanity(); addLog(“∰ Afterimage fractures - [”+cp.insanity+”]!”,“event”); }
if (cp.life<=0) {
cp.alive=false; if (!cp.deathCause){cp.deathCause=“Quantum Overload backlash”;cp.deathRoom=-1;} cp.coins=0;
}
newP[turn]=cp; setMasacreeCount(newMCount);
var summary=“∰ Quantum Overload - “+pickedRoomIds.length+” rooms traversed.”;
if (bombHit) summary+=” [BOMB triggered!]”;
addLog(summary,“event”);
setPlayers(newP); setRooms(newR); setModal(null);
if (!checkEnd(newP,newR)) nextTurn(newP);
}

function execMisdirection(sourceIds, destId, P, R) {
var newR=R.map(function(r){return Object.assign({},r);});
var newP=P.map(function(p){return Object.assign({},p);});
var cp=Object.assign({},newP[turn]); cp.skills[“Misdirection”]=0;
var gathered=[];
for (var si=0;si<sourceIds.length;si++) {
var srid=sourceIds[si]; var sr=newR[srid-1];
if (sr.opened||sr.emptied) continue;
var srContents=sr.stackedContents?sr.stackedContents.slice():[sr.type];
for (var ci2=0;ci2<srContents.length;ci2++) gathered.push(srContents[ci2]);
newR[srid-1]=Object.assign({},sr,{type:“empty”,emptied:true,stackedContents:null});
}
var dr=newR[destId-1];
if (!dr.opened&&!dr.emptied) {
var destContents=dr.stackedContents?dr.stackedContents.slice():[dr.type];
for (var gi=0;gi<gathered.length;gi++) destContents.push(gathered[gi]);
newR[destId-1]=Object.assign({},dr,{stackedContents:destContents});
}
newP[turn]=cp; addLog(“∰ Misdirection - “+sourceIds.length+” rooms moved into Room “+destId+”.”,“event”);
setPlayers(newP); setRooms(newR); setModal(null); nextTurn(newP);
}

function openRoomLogic(roomId, P, R, mCount) {
var mCountVal=mCount!==undefined?mCount:masacreeCount;
var ri=roomId-1;
var newR=R.map(function(r){return Object.assign({},r);});
if (newR[ri].opened) return;
var newP=P.map(function(p){return Object.assign({},p);});
var cp=Object.assign({},newP[turn]);
if (!cp.alive||cp.fakeDead) { nextTurn(newP); return; }
var extra=false; var ec=effChar(cp);
newR[ri].opened=true;
if (ec!==“THE AFTERIMAGE”&&newR[ri].emptied&&cp.life<=3&&cp.life>0) {
var hasAfterimage=false;
for (var bfi=0;bfi<newP.length;bfi++) { if (newP[bfi].character===“THE AFTERIMAGE”&&newP[bfi].alive){hasAfterimage=true;break;} }
if (hasAfterimage) {
cp.sanity=Math.min(MAX_SANITY,cp.sanity+4);
addLog(“∰ Butterfly Effect! “+cp.name+” struck – Sanity +4!”,“event”);
if (cp.sanity>=MAX_SANITY&&!cp.insanity){cp.insanity=rollInsanity();addLog(“◌ INSANITY: [”+cp.insanity+”]!”,“event”);}
newP[turn]=cp; setPlayers(newP); setRooms(newR); setSelRoom(-1);
if (!checkEnd(newP,newR)) nextTurn(newP); return;
}
}
if (newR[ri].emptied) {
addLog(“◆ Room “+roomId+” – empty. The Afterimage was here.”,“event”);
newP[turn]=cp; setPlayers(newP); setRooms(newR); setSelRoom(-1);
if (!checkEnd(newP,newR)) nextTurn(newP); return;
}
var agIdx=-1;
for (var i=0;i<newP.length;i++){if(newP[i].character===“THE AGENT”&&newP[i].alive){agIdx=i;break;}}
var ag=agIdx>=0?Object.assign({},newP[agIdx]):null;
if (ag&&ag.bombRoom===roomId) {
cp.life=Math.max(0,cp.life-7);
addLog(“◆ BOOM! “+cp.name+” -7 Life”,“event”);
cp.deathCause=“Trap Wire Bomb”; cp.deathRoom=roomId;
ag.bombRoom=-1;
}
if (newR[ri].poison>0) {
var ownPoison=(newR[ri].poisonOwner===turn&&cp.character===“THE BOTANIST”);
if (!ownPoison) {
var pdmg=newR[ri].poison*2;
if (cp.life-pdmg<=0){cp.deathCause=“Conium Maculatum poison”;cp.deathRoom=roomId;}
cp.life=Math.max(0,cp.life-pdmg);
addLog(“X Poison! “+cp.name+” -”+pdmg+” Life”,“event”);
}
newR[ri].poison=0; newR[ri].poisonOwner=-1;
}
var roomContents=newR[ri].stackedContents?newR[ri].stackedContents:[newR[ri].type];
var sanGainedThisRoom = 0;
for (var rci=0;rci<roomContents.length;rci++) {
var rct=roomContents[rci];
var prevSan = cp.sanity;
resolveContent(rct,cp,newP,newR,roomId,mCountVal,ec,ag,agIdx);
sanGainedThisRoom += Math.max(0, cp.sanity - prevSan);
}
if (sanGainedThisRoom > 0) {
newP[turn] = cp;
newP = spreadGateOfDespair(sanGainedThisRoom, turn, newP);
cp = Object.assign({}, newP[turn]);
}
if (ec===“THE SINNER”&&roomContents.indexOf(“coins”)>=0&&cp.insanity!==“Conceit”) extra=true;
newP[turn]=cp;
if (ag&&agIdx>=0&&agIdx!==turn) newP[agIdx]=ag;
newP = checkLoveBond(newP);
cp   = Object.assign({}, newP[turn]);
finishRoom(roomId,newP,newR,extra,mCountVal);
}

function resolveContent(contentType,cp,newP,newR,roomId,mCountVal,ec,ag,agIdx) {
if (contentType===“coins”||contentType===“empty”) {
if (contentType===“coins”) {
if (cp.insanity===“Conceit”) { addLog(“Conceit: “+cp.name+” takes nothing.”,“event”); }
else {
cp.coins+=1; addLog(“✦ “+cp.name+” +1 coin (”+cp.coins+”)”,“event”);
if (cp.character===“THE PAINTER”) cp.coloringBoxes=(cp.coloringBoxes||0)+1;
if (ec===“THE UNSTABLE”&&cp.persona===“Maria”) {
cp.mariaCoins=(cp.mariaCoins||0)+1;
if (cp.mariaCoins>=2){cp.persona=“Emily”;cp.sanity=Math.max(0,cp.sanity-5);cp.mariaCoins=0;addLog(“ꀦ Maria->Emily. Sanity -5”,“event”);}
}
}
if (cp.insanity===“Lavish”){cp.coins=Math.max(0,cp.coins-2);addLog(“⍜ Lavish! -2 coins”,“event”);}
if (cp.character===“THE PAINTER”&&cp.disguisedAs){cp.sanity=Math.min(MAX_SANITY,cp.sanity+1);}
}
} else {
var isMas=(contentType===“masacree”);
var isVampire=(ec===“THE VAMPIRE”);
if (ec===“THE UNSTABLE”&&cp.persona===“Emily”&&(isMas||contentType===“dimensional”)) {
cp.persona=“Maria”; cp.mariaCoins=0; addLog(“☽ Emily->Maria! Immune.”,“event”);
} else if (ec===“THE UNSTABLE”&&cp.persona===“Maria”) {
addLog(“Maria immune!”,“event”);
} else if (ec===“THE HUNTER”&&(cp.skills[“Eyes on Prey”]||0)>0) {
cp.skills[“Eyes on Prey”]-=1; addLog(“⌖ Eyes on Prey! (”+cp.skills[“Eyes on Prey”]+” left)”,“event”);
} else if (isMas) {
if (isVampire) { addLog(“♱ Masacree! Curse of Immortal - damage nullified.”,“event”); }
else {
var dmg=cp.insanity===“Masochist”?4:2;
if (cp.life-dmg<=0){cp.deathCause=“Masacree Guardian”+(cp.insanity===“Masochist”?” (doubled)”:””);cp.deathRoom=roomId;}
cp.life=Math.max(0,cp.life-dmg); addLog(“ᛏ Masacree! -”+dmg+” Life”,“event”);
}
} else if (contentType===“dimensional”) {
if (cp.immune) {
cp.immune=false; addLog(“ꀦ Dimensional immune!”,“event”);
} else if (cp.exSaintBlessed) {
cp.exSaintBlessed=false; addLog(“⌂ EX-Saint! Dimensional blocked.”,“event”);
} else if (ec===“THE LAWYER”&&(cp.skills[“Negotiator”]||0)>0) {
cp.skills[“Negotiator”]-=1; addLog(“⊜ Negotiated (auto)! Sanity blocked.”,“event”);
} else {
var sanInc=isVampire?3:2;
if (isVampire){addLog(”꩜ Dimensional! Vampire fragile mind +3 Sanity”,“event”);}
else{addLog(”꩜ Dimensional! Sanity +2 (”+(cp.sanity+sanInc)+”/”+MAX_SANITY+”)”,“event”);}
cp.sanity=Math.min(MAX_SANITY,cp.sanity+sanInc);
}
}
if (ec===“THE HUNTER”&&(isMas||contentType===“dimensional”)){cp.coins+=2;addLog(“ᛏ Trophy! +2 coins”,“event”);}
if (isMas) {
mCountVal+=1; setMasacreeCount(mCountVal);
for (var vi=0;vi<newP.length;vi++) {
if (newP[vi].character===“THE VAMPIRE”&&newP[vi].alive&&vi!==turn) {
var vamp=Object.assign({},newP[vi]); var seen=Object.assign({},vamp.vampireBloodSeen);
seen[turn]=true; vamp.vampireBloodSeen=seen; newP[vi]=vamp;
addLog(“♱ Sanguinis Odium - blood scent acquired.”,“event”);
}
}
}
if (ec===“THE CLAIRVOYANT”&&(cp.skills[“Third Eyes”]||0)>0) {
cp.skills[“Third Eyes”]-=1;
var gr=newR.filter(function(r){return !r.opened&&!r.emptied&&(r.type===“masacree”||r.type===“dimensional”);}).slice(0,6);
var rev=Object.assign({},cp.revealed);
gr.forEach(function(r){rev[r.id]=r.type;}); cp.revealed=rev;
addLog(“ꀦ Third Eyes! “+gr.length+” rooms revealed.”,“event”);
}
if (ec===“THE UNSTABLE”&&cp.persona===“Maria”){cp.sanity=Math.min(MAX_SANITY,cp.sanity+2);}
if (cp.character===“THE BOTANIST”) {
var l2=roomId-1; var r2idx=roomId+1;
if (l2>=1){newR[l2-1].poison=Math.min(2,(newR[l2-1].poison||0)+1);newR[l2-1].poisonOwner=turn;}
if (r2idx<=newR.length){newR[r2idx-1].poison=Math.min(2,(newR[r2idx-1].poison||0)+1);newR[r2idx-1].poisonOwner=turn;}
addLog(“⚘ Poison spreads!”,“event”);
}
if (cp.character===“THE PAINTER”&&cp.disguisedAs){cp.sanity=Math.min(MAX_SANITY,cp.sanity+1);}
}
}

function finishRoom(roomId,newP,newR,extra,mCountVal) {
var cp=Object.assign({},newP[turn]);
if (cp.sanity>=MAX_SANITY&&!cp.insanity){cp.insanity=rollInsanity();addLog(“◌ INSANITY: [”+cp.insanity+”]!”,“event”);}
var docIdx=-1;
for (var i=0;i<newP.length;i++){if(newP[i].character===“THE DOCTOR”&&newP[i].alive&&i!==turn){docIdx=i;break;}}
if (docIdx>=0&&cp.life===2&&(newP[docIdx].skills[“Bound to Oath”]||0)>0&&cp.coins>=1){
var doc=Object.assign({},newP[docIdx]);
doc.skills[“Bound to Oath”]-=1; cp.life=Math.min(MAX_LIFE,cp.life+2); cp.coins-=1; doc.coins+=1;
newP[docIdx]=doc; addLog(“⚕ Bound to Oath! +2 Life”,“event”);
}
if (cp.character===“THE DOCTOR”&&cp.life===2&&(cp.skills[“Care Pack”]||0)>0){
cp.skills[“Care Pack”]-=1; cp.life=MAX_LIFE; addLog(“⚕ Care Pack! Restored.”,“event”);
}
var lawIdx=-1;
for (var i=0;i<newP.length;i++){if(newP[i].character===“THE LAWYER”&&newP[i].alive){lawIdx=i;break;}}
if (lawIdx>=0&&newP[lawIdx].fakeJusticeTarget===turn&&cp.life<=4&&cp.life>0){
var tot=0;
for (var i=0;i<newP.length;i++){if(i!==turn&&newP[i].alive){tot+=newP[i].sanity;newP[i]=Object.assign({},newP[i],{sanity:0,insanity:null});}}
cp.sanity=Math.min(MAX_SANITY,tot);
if (cp.sanity>=MAX_SANITY&&!cp.insanity) cp.insanity=rollInsanity();
cp.life=Math.min(cp.life+5,MAX_LIFE+3);
var law=Object.assign({},newP[lawIdx]); law.fakeJusticeTarget=-1; newP[lawIdx]=law;
addLog(“⊜ Fake Justice triggers!”,“event”);
}
if (cp.life<=0) {
if (cp.character===“THE ILLUSIONIST”&&(cp.skills[“Fake Death”]||0)>0) {
cp.fakeDead=true; cp.skills[“Fake Death”]=0; cp.life=0;
addLog(“◬ “+cp.name+” fakes death! Hidden from the arena.”,“event”);
} else {
cp.alive=false;
if (!cp.deathCause){cp.deathCause=“Guardian encounter”;cp.deathRoom=roomId;}
var agIdx3=-1;
for (var i=0;i<newP.length;i++){if(newP[i].character===“THE AGENT”&&newP[i].alive){agIdx3=i;break;}}
if (agIdx3>=0&&agIdx3!==turn){
var sc=newP[agIdx3].spyCamRooms||[];
if (sc.indexOf(roomId)>=0){
var ag3=Object.assign({},newP[agIdx3]); ag3.coins+=cp.coins; newP[agIdx3]=ag3;
addLog(“⌬ Agent inherits coins!”,“event”); cp.coins=0;
}
}
if (cp.coins>0) {
var utIdx=-1;
for (var i=0;i<newP.length;i++){if(newP[i].character===“THE UNDERTAKER”&&newP[i].alive&&i!==turn&&newP[i].properBurialActive){utIdx=i;break;}}
if (utIdx>=0){
var utP=Object.assign({},newP[utIdx]); utP.coins+=cp.coins; newP[utIdx]=utP;
addLog(“⌂ Proper Burial! Undertaker claims “+cp.coins+” coins.”,“event”); cp.coins=0;
}
}
cp.coins=0;
addLog(”† “+cp.name+” dies.”,“event”);
if (cp.loveBondPartner>=0) {
var bpIdx=cp.loveBondPartner;
if (newP[bpIdx]) {
var bp=Object.assign({},newP[bpIdx]);
bp.loveBondPartner=-1; bp.loveMarkStatus=null;
newP[bpIdx]=bp; addLog(“⚭ Love bond severed by death.”,“event”);
}
}
}
}
newP[turn]=cp;
newP=checkLoveBond(newP);
setPlayers(newP); setRooms(newR); setSelRoom(-1);
if (checkEnd(newP,newR)) return;
if (!extra) nextTurn(newP);
else if (!newP[turn].isHuman&&isAI) setTimeout(function(){doAiTurn(newP,newR,mCountVal||masacreeCount);},800);
}

function openRoom(rid) {
if (phase!==“PLAY”) return;
if (isAI&&!(players[turn]&&players[turn].isHuman)) return;
var ri3=rid-1;
if (rooms[ri3]&&rooms[ri3].type===“dimensional”&&!rooms[ri3].stackedContents&&!rooms[ri3].emptied){
var cp3=players[turn]; var ec3=effChar(cp3);
if (ec3===“THE LAWYER”&&(cp3.skills[“Negotiator”]||0)>0){
var newR3=rooms.map(function(r){return Object.assign({},r);}); newR3[ri3].opened=true;
setModal({
type:“NEGOTIATE”,isAI:false,
onYes:function(){
var P2=players.map(function(p){return Object.assign({},p);}); P2[turn]=Object.assign({},P2[turn]);
P2[turn].skills[“Negotiator”]-=1; addLog(“⊜ Negotiated! Sanity blocked.”,“event”);
setModal(null); finishRoom(rid,P2,newR3,false,masacreeCount);
},
onNo:function(){
var P2=players.map(function(p){return Object.assign({},p);}); P2[turn]=Object.assign({},P2[turn]);
P2[turn].sanity=Math.min(MAX_SANITY,P2[turn].sanity+2); addLog(”꩜ Refused. Sanity +2”,“event”);
setModal(null); finishRoom(rid,P2,newR3,false,masacreeCount);
}
});
return;
}
}
openRoomLogic(rid,players,rooms,masacreeCount);
}

function useSelfTherapy() {
var P=players.map(function(p){return Object.assign({},p);}); var cp=P[turn];
if (cp.insanity===“Boast”) return addLog(“Boast prevents this!”,“warn”);
cp.skills[“Self-Therapy”]=0; cp.sanity=0; cp.insanity=null; cp.immune=true;
P[turn]=cp; setPlayers(P); addLog(“⚕ Self-Therapy used.”,“event”); nextTurn(P);
}
function confirmSpyCam(picks) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
var rev=Object.assign({},cp.revealed);
picks.forEach(function(id){var r=rooms.find(function(x){return x.id===id;});if(r)rev[id]=r.type;});
cp.skills[“Spy Camera”]=0; cp.spyCamRooms=picks; cp.revealed=rev;
P[turn]=cp; setPlayers(P); addLog(“⊙ Cameras: “+picks.join(”, “),“event”); setModal(null); nextTurn(P);
}
function confirmBomb(rid) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
cp.skills[“Trap Wire Bomb”]=0; cp.bombRoom=rid;
P[turn]=cp; setPlayers(P); addLog(“◆ Bomb in Room “+rid,“event”); setModal(null); nextTurn(P);
}
function confirmFJ(tid) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
var actualTid = resolveTarget(tid, turn, P, false);
if (actualTid !== tid) {
addLog(“◬ Fake Justice redirected back to “+P[actualTid].name+”!”,“event”);
var illu=Object.assign({},P[actualTid]);
illu.illusionistShield=Math.max(0,illu.illusionistShield-1);
P[actualTid]=illu;
}
var ti=-1; for (var i=0;i<P.length;i++){if(P[i].id===actualTid){ti=i;break;}}
cp.skills[“Fake Justice”]=0; cp.fakeJusticeTarget=ti;
if (ti>=0&&P[ti].life<=4){
var tot=0; for(var i=0;i<P.length;i++){if(i!==ti&&P[i].alive){tot+=P[i].sanity;P[i]=Object.assign({},P[i],{sanity:0,insanity:null});}}
P[ti]=Object.assign({},P[ti],{sanity:Math.min(MAX_SANITY,tot),life:Math.min(P[ti].life+5,MAX_LIFE+3)});
cp.fakeJusticeTarget=-1;
}
P[turn]=cp; setPlayers(P); addLog(“⊜ Fake Justice: “+(P[ti]?P[ti].name:”?”),“event”); setModal(null); nextTurn(P);
}
function confirmTrade(buyerId,mode,amt) {
var P=players.map(function(p){return Object.assign({},p);});
var bi=-1; for(var i=0;i<P.length;i++){if(P[i].id===buyerId){bi=i;break;}}
var actualBi = resolveTarget(bi, turn, P, false);
if (actualBi !== bi) {
addLog(“◬ Soul Trader redirected to “+P[actualBi].name+”!”,“event”);
var illu2=Object.assign({},P[actualBi]); illu2.illusionistShield=Math.max(0,illu2.illusionistShield-1); P[actualBi]=illu2;
bi = actualBi;
}
var seller=Object.assign({},P[turn]); var buyer=Object.assign({},P[bi]);
if (mode===“buyLife”){
if(seller.coins<amt)return addLog(“Not enough coins!”,“warn”);
seller.coins-=amt; seller.life=Math.min(MAX_LIFE+3,seller.life+amt*2);
addLog(“✦ “+seller.name+” spent “+amt+” coins for “+(amt*2)+” Life.”,“event”);
} else {
if(buyer.coins<amt)return addLog(“Buyer doesn’t have enough coins!”,“warn”);
if(seller.life<=amt)return addLog(“Not enough Life to sell!”,“warn”);
seller.life-=amt; buyer.life=Math.min(MAX_LIFE+3,buyer.life+amt*2);
buyer.coins-=amt; seller.coins+=amt;
addLog(“✦ “+seller.name+” sold “+amt+” Life to “+buyer.name+” for “+amt+” coins.”,“event”);
}
P[turn]=seller; P[bi]=buyer; setPlayers(P); setModal(null); addLog(“✦ Trade done.”,“event”); nextTurn(P);
}
function confirmDisguise(tid) {
var P=players.map(function(p){return Object.assign({},p);}); var target=null;
for(var i=0;i<P.length;i++){if(P[i].id===tid){target=P[i];break;}}
if(!target)return;
var cp=Object.assign({},P[turn]); var fresh=makePlayer(”_”,target.character,99);
var dLeft=(cp.skills[“Disguise”]||1)-1; var dmLeft=cp.skills[“Drop Mask”]||0;
cp.skills=Object.assign({},fresh.skills,{Disguise:dLeft,“Drop Mask”:dmLeft});
cp.coloringBoxes-=5; cp.disguisedAs=target.character;
P[turn]=cp; setPlayers(P); setModal(null); addLog(“ꃳ Disguised as “+target.character,“event”); nextTurn(P);
}
function useDropMask() {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
if(cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
cp.skills[“Drop Mask”]-=1; cp.disguisedAs=null;
cp.skills={Disguise:cp.skills[“Disguise”]||0,“Drop Mask”:cp.skills[“Drop Mask”]};
P[turn]=cp; setPlayers(P); addLog(“ꃳ Mask dropped.”,“event”); nextTurn(P);
}
function confirmMindHavoc(targets) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
cp.skills[“Mind Havoc”]=(cp.skills[“Mind Havoc”]||1)-1;
P[turn]=cp; setPlayers(P); setModal(null); addLog(“ꀦ Mind Havoc!”,“event”);
showHijack(targets,0,P,rooms.map(function(r){return Object.assign({},r);}));
}
function showHijack(targets,idx,P,R) {
if (idx>=targets.length){if(!checkEnd(P,R))nextTurn(P);return;}
var tid2=targets[idx]; var pi=-1;
for(var i=0;i<P.length;i++){if(P[i].id===tid2){pi=i;break;}}
var actualPi = resolveTarget(pi, turn, P, false);
if (actualPi !== pi && actualPi >= 0) {
addLog(“◬ Mind Havoc redirected back to caster!”,“event”);
var illu3=Object.assign({},P[actualPi]); illu3.illusionistShield=Math.max(0,illu3.illusionistShield-1); P[actualPi]=illu3;
pi = actualPi;
}
if (pi<0||!P[pi].alive||P[pi].fakeDead){showHijack(targets,idx+1,P,R);return;}
var clRev=(P[turn]&&P[turn].revealed)?P[turn].revealed:{};
setModal({
type:“HIJACK”,player:P[pi],rooms:R,clRev:clRev,
onPick:function(rid){ setModal(null); execHijack(P,R,pi,rid,targets,idx); }
});
}
function execHijack(P,R,pi,roomId,targets,idx) {
var ri4=roomId-1; var newR=R.map(function(r){return Object.assign({},r);});
if(!newR[ri4]||newR[ri4].opened){showHijack(targets,idx+1,P,newR);return;}
var newP=P.map(function(p){return Object.assign({},p);});
var tp=Object.assign({},newP[pi]); var tec=effChar(tp);
newR[ri4].opened=true; addLog(“ꀦ “+tp.name+” -> Room “+roomId,“event”);
if(newR[ri4].type===“coins”&&tp.insanity!==“Conceit”){
tp.coins+=1; if(tp.insanity===“Lavish”)tp.coins=Math.max(0,tp.coins-2);
} else if(newR[ri4].type===“masacree”){
if(tec===“THE HUNTER”){tp.coins+=2;if((tp.skills[“Eyes on Prey”]||0)>0)tp.skills[“Eyes on Prey”]-=1;else tp.life=Math.max(0,tp.life-(tp.insanity===“Masochist”?4:2));}
else if(tec===“THE VAMPIRE”){addLog(“♱ Vampire immune (Immortal)”,“event”);}
else if(!(tec===“THE UNSTABLE”&&tp.persona===“Maria”)){tp.life=Math.max(0,tp.life-(tp.insanity===“Masochist”?4:2));}
} else if(newR[ri4].type===“dimensional”&&!tp.immune&&tec!==“THE UNSTABLE”){
if(tec===“THE LAWYER”&&(tp.skills[“Negotiator”]||0)>0)tp.skills[“Negotiator”]-=1;
else{var sanInc3=(tec===“THE VAMPIRE”)?3:2;tp.sanity=Math.min(MAX_SANITY,tp.sanity+sanInc3);if(tp.sanity>=MAX_SANITY&&!tp.insanity)tp.insanity=rollInsanity();}
}
if(tp.life<=0){
if(tp.character===“THE ILLUSIONIST”&&(tp.skills[“Fake Death”]||0)>0){tp.fakeDead=true;tp.skills[“Fake Death”]=0;tp.life=0;addLog(“◬ “+tp.name+” fakes death!”,“event”);}
else{tp.alive=false;tp.coins=0;addLog(”† “+tp.name+” dies!”,“event”);}
}
newP[pi]=tp; setPlayers(newP); setRooms(newR);
if(checkEnd(newP,newR))return;
showHijack(targets,idx+1,newP,newR);
}

function useRedOut() {
var cp=players[turn];
if(!cp||cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
if(cp.coins<6||cp.life<6||cp.sanity<6)return addLog(“Red-Out requires 6+ Coins, HP, and Sanity!”,“warn”);
if(masacreeCount<1)return addLog(“No blood has been spilled yet.”,“warn”);
execRedOut(players,rooms,masacreeCount);
}
function useProperBurial() {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
if(cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
cp.skills[“Proper Burial”]=0; cp.properBurialActive=true;
P[turn]=cp; setPlayers(P); addLog(“⌂ Proper Burial activated.”,“event”); nextTurn(P);
}
function confirmExSaint(targetId) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
if(cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
cp.skills[“EX-Saint”]=(cp.skills[“EX-Saint”]||1)-1;
var ti=-1; for(var i=0;i<P.length;i++){if(P[i].id===targetId){ti=i;break;}}
var actualTi = resolveTarget(ti, turn, P, false);
if(actualTi!==ti){addLog(“◬ EX-Saint redirected!”,“event”);var illu4=Object.assign({},P[actualTi]);illu4.illusionistShield=Math.max(0,illu4.illusionistShield-1);P[actualTi]=illu4;ti=actualTi;}
if(ti>=0){P[ti]=Object.assign({},P[ti],{exSaintBlessed:true});addLog(“⌂ EX-Saint! “+P[ti].name+” blessed.”,“event”);}
P[turn]=cp; setPlayers(P); setModal(null); nextTurn(P);
}
function confirmRaise(targetIdx) {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
if(cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
cp.skills[“Raise!”]=0; P[turn]=cp; setPlayers(P); setModal(null);
var corpseInfo={playerIdx:targetIdx,turnsLeft:2};
setRaisedCorpse(corpseInfo);
addLog(“⌂ Raise! “+P[targetIdx].name+” returns for 2 turns.”,“event”);
setModal({type:“RAISE_CORPSE_TURN”,corpseInfo:corpseInfo,rooms:rooms,players:P});
}

function useIllusionistShield() {
var P=players.map(function(p){return Object.assign({},p);}); var cp=Object.assign({},P[turn]);
if(cp.insanity===“Boast”)return addLog(“Boast prevents this!”,“warn”);
if(cp.illusionistShield<=0)return addLog(“No charges left!”,“warn”);
addLog(“◬ Reality shield active (”+cp.illusionistShield+” charges). Skills targeting you will be redirected.”,“event”);
}

function skillBtns(p, i) {
if (i!==turn||!p.alive||p.fakeDead) return null;
if (isAI&&!p.isHuman) return null;
var b=p.insanity===“Boast”; var btns=[];
if (p.character===“THE DOCTOR”&&(p.skills[“Self-Therapy”]||0)>0)
btns.push(React.createElement(“button”,{key:“st”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:useSelfTherapy},“Self-Therapy”));
if (p.character===“THE AGENT”){
if((p.skills[“Spy Camera”]||0)>0)
btns.push(React.createElement(“button”,{key:“sc”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“SPY_CAM”});}},  “Spy Camera”));
if((p.skills[“Trap Wire Bomb”]||0)>0)
btns.push(React.createElement(“button”,{key:“tb”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“BOMB”});}},      “Plant Bomb”));
}
if (p.character===“THE CLAIRVOYANT”&&(p.skills[“Mind Havoc”]||0)>0)
btns.push(React.createElement(“button”,{key:“mh”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“MIND_HAVOC”,eligible:players.filter(function(x){return x.alive&&!x.fakeDead&&x.id!==p.id;})});}}, “Mind Havoc x”+p.skills[“Mind Havoc”]));
if (p.character===“THE LAWYER”&&(p.skills[“Fake Justice”]||0)>0)
btns.push(React.createElement(“button”,{key:“fj”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“FAKE_JUSTICE”,eligible:players.filter(function(x){return x.alive&&!x.fakeDead&&x.id!==p.id;})});}}, “Fake Justice”));
if (p.character===“THE SELLER”)
btns.push(React.createElement(“button”,{key:“sol”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“SOUL_TRADER”,eligible:players.filter(function(x){return x.alive&&!x.fakeDead&&x.id!==p.id;})});}}, “Soul Trader”));
if (p.character===“THE PAINTER”){
if((p.skills[“Disguise”]||0)>0&&!p.disguisedAs)
btns.push(React.createElement(“button”,{key:“dis”,style:{…base.small,opacity:(b||(p.coloringBoxes||0)<5)?0.3:1},disabled:b||(p.coloringBoxes||0)<5,onClick:function(){setModal({type:“DISGUISE”,eligible:players.filter(function(x){return x.alive&&!x.fakeDead&&x.id!==p.id;})});}}, “Disguise (”+(p.coloringBoxes||0)+”/5)”));
if(p.disguisedAs&&(p.skills[“Drop Mask”]||0)>0)
btns.push(React.createElement(“button”,{key:“dm”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:useDropMask}, “Drop Mask x”+p.skills[“Drop Mask”]));
}
if (p.character===“THE VAMPIRE”&&(p.skills[“Red-Out Massacre”]||0)>0){
var canRedOut=!b&&p.coins>=6&&p.life>=6&&p.sanity>=6;
btns.push(React.createElement(“button”,{key:“ro”,style:{…base.small,opacity:canRedOut?1:0.3,background:canRedOut?”#2a0810”:”#130f18”,border:“1px solid “+(canRedOut?”#8a1a2a”:”#221c2e”),color:canRedOut?”#cc2244”:”#3a3448”},disabled:!canRedOut,onClick:useRedOut}, “Red-Out (”+masacreeCount+” blood)”));
}
if (p.character===“THE UNDERTAKER”){
if((p.skills[“Proper Burial”]||0)>0&&!p.properBurialActive)
btns.push(React.createElement(“button”,{key:“pb”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:useProperBurial},“Proper Burial”));
if(p.properBurialActive)
btns.push(React.createElement(“button”,{key:“pb-on”,style:{…base.small,opacity:0.5,background:”#0a0d0a”,border:“1px solid #1a3a1a”,color:”#3a6a3a”},disabled:true},“Burial Active”));
if((p.skills[“EX-Saint”]||0)>0){
var exElig=players.filter(function(x){return x.alive&&!x.fakeDead;});
btns.push(React.createElement(“button”,{key:“ex”,style:{…base.small,opacity:b?0.3:1},disabled:b,onClick:function(){setModal({type:“EX_SAINT”,eligible:exElig});}}, “EX-Saint x”+p.skills[“EX-Saint”]));
}
if((p.skills[“Raise!”]||0)>0){
var deadPlayers=players.filter(function(x){return !x.alive&&!x.fakeDead;});
var canRaise=!b&&deadPlayers.length>0;
btns.push(React.createElement(“button”,{key:“rs”,style:{…base.small,opacity:canRaise?1:0.3},disabled:!canRaise,onClick:function(){setModal({type:“RAISE”,eligible:players.filter(function(x){return !x.alive&&!x.fakeDead;})});}},“Raise! (”+players.filter(function(x){return !x.alive&&!x.fakeDead;}).length+” dead)”));
}
}
if (p.character===“THE AFTERIMAGE”){
if((p.skills[“Quantum Overload Tunneling”]||0)>0){
btns.push(React.createElement(“button”,{key:“qt”,style:{…base.small,background:”#060f14”,border:“1px solid #2a6a8a”,color:”#2a9acc”,opacity:b?0.3:1},disabled:b,onClick:function(){var unopened=rooms.filter(function(r){return !r.opened&&!r.emptied;});setModal({type:“QUANTUM_OVERLOAD”,unopened:unopened});}}, “Quantum Overload”));
}
if((p.skills[“Misdirection”]||0)>0){
btns.push(React.createElement(“button”,{key:“mis”,style:{…base.small,background:”#060f14”,border:“1px solid #2a6a8a”,color:”#2a9acc”,opacity:b?0.3:1},disabled:b,onClick:function(){var unopened2=rooms.filter(function(r){return !r.opened&&!r.emptied;});setModal({type:“MISDIRECTION”,unopened:unopened2});}}, “Misdirection”));
}
}
if (p.character===“THE LOVERMAN”){
if((p.skills[“The Loverman Oath”]||0)>0){
var oathElig=players.filter(function(x){return x.alive&&!x.fakeDead&&x.id!==p.id;});
btns.push(React.createElement(“button”,{key:“oath”,style:{…base.small,background:”#140008”,border:“1px solid #cc4477”,color:”#cc4477”,opacity:b||oathElig.length===0?0.3:1},disabled:b||oathElig.length===0,onClick:function(){setModal({type:“LOVERMAN_OATH_CAST”,eligible:oathElig});}}, “⚭ Oath”));
}
if(p.lovermanState){
btns.push(React.createElement(“div”,{key:“lm-state”,style:{fontSize:9,color:”#cc4477”,padding:“3px 6px”,background:”#140008”,border:“1px solid #cc447744”,borderRadius:3}}, “⚭ “+p.lovermanState+” state”));
}
}
if (p.character===“THE ILLUSIONIST”){
var shieldCharges=p.illusionistShield||0;
btns.push(React.createElement(“button”,{key:“ill-shield”,style:{…base.small,background:”#0a0a06”,border:“1px solid “+(shieldCharges>0?”#aa9933”:”#221c2e”),color:shieldCharges>0?”#aa9933”:”#3a3448”,opacity:b||shieldCharges===0?0.3:1},disabled:b||shieldCharges===0,onClick:useIllusionistShield}, “◬ Reality Shield x”+shieldCharges));
}
return btns.length>0 ? React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:3,marginTop:6}},btns) : null;
}

function VampireStatPanel() {
var vamp=null;
if (isAI){vamp=players[humanIdx];}
else{for(var i=0;i<players.length;i++){if(players[i].character===“THE VAMPIRE”&&players[i].isHuman){vamp=players[i];break;}}}
if(!vamp||vamp.character!==“THE VAMPIRE”)return null;
var seen=vamp.vampireBloodSeen||{}; var seenKeys=Object.keys(seen);
if(seenKeys.length===0)return null;
return React.createElement(“div”,{style:{background:”#0e0509”,border:“1px solid #3a0a14”,borderRadius:4,padding:“8px 10px”,marginTop:6}},
React.createElement(“div”,{style:{fontSize:9,color:”#8a1a2a”,letterSpacing:2,marginBottom:6}},“SANGUINIS ODIUM - BLOOD SIGHT”),
seenKeys.map(function(ki){
var pi2=parseInt(ki); var target=players[pi2]; if(!target)return null;
return React.createElement(“div”,{key:ki,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“4px 0”,borderBottom:“1px solid #1a0508”}},
React.createElement(“span”,{style:{fontSize:10,color:target.alive?”#cc2244”:”#3a1a2a”}},target.name),
React.createElement(“span”,{style:{fontSize:9,color:”#7a3a4a”}},“HP:”+target.life),
React.createElement(“span”,{style:{fontSize:9,color:”#6a2a7a”}},“SAN:”+target.sanity),
React.createElement(“span”,{style:{fontSize:9,color:”#c4896a”}},“✦”+target.coins),
!target.alive&&React.createElement(“span”,{style:{fontSize:9,color:”#3a1a2a”}},”†”)
);
})
);
}

function LovermanBondPanel() {
var hp = isAI ? players[humanIdx] : players[turn];
if (!hp) return null;
var partnerIdx = hp.loveBondPartner;
if (hp.lovermanState !== “Lovers” && hp.loveMarkStatus !== “accepted”) return null;
if (partnerIdx < 0 || !players[partnerIdx]) return null;
var partner = players[partnerIdx];
return React.createElement(“div”,{style:{background:”#140008”,border:“1px solid #cc447744”,borderRadius:4,padding:“8px 10px”,marginTop:6}},
React.createElement(“div”,{style:{fontSize:9,color:”#cc4477”,letterSpacing:2,marginBottom:4}},“⚭ LOVE BOND”),
React.createElement(“div”,{style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”}},
React.createElement(“span”,{style:{fontSize:10,color:”#cc4477”}},partner.name),
React.createElement(“span”,{style:{fontSize:9,color:”#7a3a4a”}},“HP:”+partner.life),
React.createElement(“span”,{style:{fontSize:9,color:”#6a2a7a”}},“SAN:”+partner.sanity),
React.createElement(“span”,{style:{fontSize:9,color:”#c4896a”}},“✦”+partner.coins)
)
);
}

if (phase===“ONLINE_END”) return (
React.createElement(“div”,{style:base.root},React.createElement(“div”,{style:base.center},
React.createElement(“div”,{style:{fontSize:22,color:”#c4896a”,letterSpacing:3}},“SESSION ENDED”),
React.createElement(“div”,{style:{fontSize:12,color:”#5a5070”,fontStyle:“italic”}},“Returning to menu.”),
React.createElement(“button”,{style:base.btn,onClick:exit},“BACK TO MENU”)
))
);

if (phase===“END”) return (
React.createElement(“div”,{style:base.root},
React.createElement(“div”,{style:{maxWidth:480,margin:“0 auto”,padding:24,display:“flex”,flexDirection:“column”,gap:12,alignItems:“center”,width:“100%”}},
React.createElement(“div”,{style:{fontSize:28,color:”#c4896a”,letterSpacing:4,marginTop:20}},“GAME OVER”),
React.createElement(“div”,{style:base.divider}),
winners[0]&&React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,textAlign:“center”}},
winners[0].alive?winners[0].name+” survived with the most coins.”:“All players fell. The Mansion claims everyone.”
),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:10,width:“100%”}},
winners.map(function(p,i){
var notes=[];
if(!p.alive&&p.deathCause){
notes.push({icon:”†”,text:“Died - “+p.deathCause+(p.deathRoom>0?” (Room “+p.deathRoom+”)”:””),color:”#7a3a4a”});
notes.push({icon:“✦”,text:“Coins forfeited on death”,color:”#3a3448”});
}
if(p.fakeDead) notes.push({icon:“◬”,text:“Survived as the last illusion”,color:”#aa9933”});
if(p.sellerCursed) notes.push({icon:“✦”,text:“7-coin curse - 7 coins deducted”,color:”#7a5a1a”});
if(p.fakeJusticePaid>0) notes.push({icon:“⊜”,text:“Fake Justice contract - paid 5 coins”,color:”#5a5070”});
if(p.fakeJusticeCollected>0) notes.push({icon:“⊜”,text:“Fake Justice contract - collected 5 coins”,color:”#c4896a”});
if(p.insanity) notes.push({icon:“◌”,text:“Afflicted: “+p.insanity+” - cleanse at Sanitarium”,color:”#6a2a7a”});
if(p.lovermanState) notes.push({icon:“⚭”,text:“Loverman state: “+p.lovermanState,color:”#cc4477”});
if(p.loveMarkStatus&&p.loveMarkStatus!==null) notes.push({icon:“⚭”,text:“Love mark: “+p.loveMarkStatus,color:”#cc447788”});
if(p.character===“THE VAMPIRE”) notes.push({icon:“♱”,text:“Survived “+masacreeCount+” Masacree encounters”,color:”#8a1a2a”});
if(p.character===“THE UNDERTAKER”&&p.properBurialActive) notes.push({icon:“⌂”,text:“Proper Burial was active”,color:”#4a3a6a”});
if(p.character===“THE AFTERIMAGE”&&p.quantumRooms&&p.quantumRooms.length>0)
notes.push({icon:“∰”,text:“Traversed “+p.quantumRooms.length+” rooms via Quantum Overload”,color:”#2a6a8a”});
return React.createElement(“div”,{key:p.id,style:{background:”#130f18”,border:“1px solid “+(i===0?”#c4896a44”:”#1e1828”),borderRadius:6,padding:“12px 14px”}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:10}},
React.createElement(“span”,{style:{fontSize:16,color:i===0?”#c4896a”:”#3a3448”,minWidth:28}},i===0?“✦”:”#”+(i+1)),
React.createElement(“span”,{style:{flex:1,fontSize:13,color:p.alive?”#8a7a9a”:”#5a5070”}},p.name,p.isHuman&&React.createElement(“span”,{style:{color:”#c4896a66”,fontSize:10,marginLeft:5}},”(you)”)),
React.createElement(“span”,{style:{color:”#c4896a”,fontSize:13,fontWeight:“bold”}},“✦ “+p.coins),
!p.alive&&React.createElement(“span”,{style:{color:”#7a3a4a”,fontSize:13}},”†”)
),
notes.length>0&&React.createElement(“div”,{style:{marginTop:8,display:“flex”,flexDirection:“column”,gap:4,paddingLeft:38}},
notes.map(function(nn,ni){
return React.createElement(“div”,{key:ni,style:{display:“flex”,alignItems:“center”,gap:6}},
React.createElement(“span”,{style:{fontSize:10,color:nn.color}},nn.icon),
React.createElement(“span”,{style:{fontSize:10,color:nn.color,fontStyle:“italic”}},nn.text)
);
})
)
);
})
),
React.createElement(“button”,{style:{…base.btn,marginTop:8,width:“100%”},onClick:exit},“MAIN MENU”)
)
)
);

var cp5=players[turn];
var hp=isAI?players[humanIdx]:cp5;
var myRev=(hp&&hp.revealed)?hp.revealed:{};
var isHumanAgent=hp&&hp.character===“THE AGENT”;
var isHumanBotanist=hp&&hp.character===“THE BOTANIST”;
var liveRooms=isHumanAgent?(hp.spyCamRooms||[]):[];
var agentP=null;
for(var qi2=0;qi2<players.length;qi2++){if(players[qi2].character===“THE AGENT”&&players[qi2].alive){agentP=players[qi2];break;}}
var afterimageP=null;
for(var qi3=0;qi3<players.length;qi3++){if(players[qi3].character===“THE AFTERIMAGE”&&players[qi3].alive){afterimageP=players[qi3];break;}}
var quantumRoomIds=afterimageP?(afterimageP.quantumRooms||[]):[];
if(hp&&hp.character===“THE AFTERIMAGE”) quantumRoomIds=hp.quantumRooms||[];

return (
React.createElement(“div”,{style:base.root},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,justifyContent:“space-between”,padding:“10px 14px”,borderBottom:“1px solid #1e1828”,background:”#0d0b14”,flexShrink:0}},
React.createElement(“div”,{style:{fontSize:12,letterSpacing:6,color:”#c4896a”}},“THIEF”),
React.createElement(“div”,{style:{fontSize:10,color:isMyTurn?”#c4896a”:”#3a3448”,fontStyle:“italic”}},
aiThink?“thinking…”:(isMyTurn?“YOUR TURN”:(cp5?cp5.name+”’s turn…”:””))
),
React.createElement(“button”,{style:base.ghost,onClick:exit},“MENU”)
),
notif!==””&&React.createElement(“div”,{style:{padding:“5px 14px”,fontSize:10,color:”#3a3448”,fontStyle:“italic”,textAlign:“center”,background:”#120f17”}},notif),

React.createElement(“div”,{style:{flex:1,overflowY:“auto”}},
React.createElement(CollapsibleSection,{title:“YOUR STATUS”,defaultOpen:true,badge:hp?(“HP:”+hp.life+” SAN:”+hp.sanity+” COINS:”+hp.coins):””},
hp&&React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:8}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,justifyContent:“space-between”}},
React.createElement(“div”,null,
React.createElement(“div”,{style:{fontSize:15,color:”#c4896a”,fontWeight:“bold”}},hp.name),
React.createElement(“div”,{style:{fontSize:10,color:”#3a3448”,fontStyle:“italic”}},
hp.character+(hp.persona?” [”+hp.persona+”]”:””)+(hp.disguisedAs?” -> “+hp.disguisedAs:””)+(hp.fakeDead?” [HIDDEN]”:””)
)
),
React.createElement(“div”,{style:{fontSize:26,display:“inline-block”,transform:hp.character===“THE VAMPIRE”?“rotate(180deg)”:“none”}},CHAR_INFO[hp.character]?CHAR_INFO[hp.character].icon:”?”)
),
React.createElement(BarComp,{v:hp.life,max:hp.character===“THE SELLER”?MAX_LIFE+3:MAX_LIFE,color:”#7a3a4a”,label:“HP”}),
React.createElement(BarComp,{v:hp.sanity,max:MAX_SANITY,color:”#6a2a7a”,label:“SAN”,danger:true}),
React.createElement(“div”,{style:{display:“flex”,gap:16,alignItems:“center”,marginTop:2}},
React.createElement(“div”,{style:{fontSize:17,color:”#c4896a”}},“✦ “+hp.coins),
hp.character===“THE PAINTER”&&React.createElement(“div”,{style:{fontSize:12,color:”#3a3448”}},“boxes: “+(hp.coloringBoxes||0)+”/5”),
hp.character===“THE VAMPIRE”&&React.createElement(“div”,{style:{fontSize:11,color:”#8a1a2a”}},“blood: “+masacreeCount),
hp.character===“THE AFTERIMAGE”&&React.createElement(“div”,{style:{fontSize:11,color:”#2a6a8a”}},“traversed: “+((hp.quantumRooms||[]).length)),
hp.character===“THE LOVERMAN”&&hp.lovermanState&&React.createElement(“div”,{style:{fontSize:11,color:”#cc4477”}},“⚭ “+hp.lovermanState),
hp.character===“THE ILLUSIONIST”&&React.createElement(“div”,{style:{fontSize:11,color:”#aa9933”}},“◬ shield: “+(hp.illusionistShield||0))
),
hp.insanity&&React.createElement(“div”,{style:{background:”#0e0825”,border:“1px solid #2a1a4a”,borderRadius:4,padding:“8px 10px”}},
React.createElement(“div”,{style:{fontSize:11,color:”#c084fc”,fontWeight:“bold”,letterSpacing:1}},“INSANITY: “+hp.insanity),
React.createElement(“div”,{style:{fontSize:11,color:”#4a3a6a”,fontStyle:“italic”,marginTop:2}},INSANITY_DESC[hp.insanity])
),
React.createElement(SkillsPanel,{player:hp}),
skillBtns(hp,isAI?humanIdx:turn),
React.createElement(VampireStatPanel,null),
React.createElement(LovermanBondPanel,null)
)
),

React.createElement(CollapsibleSection,{title:“THE MANSION - “+rooms.filter(function(r){return !r.opened&&!r.emptied;}).length+” remain”,defaultOpen:true,badge:””},
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(5,1fr)”,gap:6}},
rooms.map(function(room){
var isLive=liveRooms.indexOf(room.id)>=0;
var isBombed=isHumanAgent&&agentP&&agentP.bombRoom===room.id;
var isQuantum=quantumRoomIds.indexOf(room.id)>=0;
var rev=myRev[room.id];
var isEmptied=room.emptied&&!room.opened;
var canClick=!room.opened&&!isEmptied&&isMyTurn&&!aiThink&&phase===“PLAY”;
var cellContent,cellColor=”#2a2238”,cellGlow=“none”;
if(room.opened){
if(room.type===“coins”){cellContent=“✦”;cellColor=”#f0c040”;cellGlow=“0 0 8px #f0c04099,0 0 18px #f0c04044”;}
else if(room.type===“masacree”){cellContent=“ᛏ”;cellColor=”#cc2233”;cellGlow=“0 0 8px #cc223399,0 0 18px #cc223344”;}
else{cellContent=”꩜”;cellColor=”#3a6acc”;cellGlow=“0 0 8px #3a6acc99,0 0 18px #3a6acc44”;}
} else if(isEmptied){
if(isQuantum){cellContent=“∰”;cellColor=”#2a6a8a44”;}
else{cellContent=”?”;cellColor=”#1a1a2a”;}
} else if(isLive){
cellContent=rev===“coins”?“✦”:rev===“masacree”?“ᛏ”:rev===“dimensional”?”꩜”:“⊙”;
cellColor=”#c4896a”;
} else if(isBombed){cellContent=“◆”;cellColor=”#7a3a4a”;}
else if(rev){cellContent=”!”;cellColor=”#7a3a4a”;}
else{cellContent=”?”;cellColor=”#2a2238”;}
return React.createElement(“div”,{key:room.id,
style:{position:“relative”,paddingBottom:“100%”,borderRadius:6,
background:room.opened?(room.type===“coins”?”#1a1508”:room.type===“masacree”?”#1a080e”:”#080e1a”):isEmptied?”#0a0c0f”:”#130f18”,
border:room.opened?“1px solid #1e1828”:isEmptied?“1px solid #1a2a3a44”:isLive?“1px solid #7ec8e388”:“1px solid #221c2e”,
opacity:!canClick&&!room.opened&&!isEmptied?0.5:1,
cursor:canClick?“pointer”:“default”},
onClick:function(){if(canClick)setModal({type:“OPEN_CONFIRM”,roomId:room.id,roomType:room.type});}},
React.createElement(“div”,{style:{position:“absolute”,top:0,left:0,right:0,bottom:0,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”}},
React.createElement(“div”,{style:{fontSize:9,color:”#2a2238”}},room.id),
React.createElement(“div”,{style:{fontSize:room.opened?20:14,color:cellColor,textShadow:cellGlow,transition:“color 0.2s”}},cellContent),
isHumanBotanist&&!room.opened&&room.poison>0&&React.createElement(“div”,{style:{position:“absolute”,top:3,right:3,width:6,height:6,borderRadius:“50%”,background:”#44aa44”,boxShadow:“0 0 6px #44aa44”}}),
room.stackedContents&&!room.opened&&!isEmptied&&React.createElement(“div”,{style:{position:“absolute”,top:2,left:2,fontSize:7,color:”#2a6a8a”,background:”#060f14”,borderRadius:2,padding:“1px 3px”}},“x”+room.stackedContents.length)
)
);
})
),
React.createElement(“div”,{style:{marginTop:8,fontSize:10,color:”#2a2238”,fontStyle:“italic”}},“Coin / Masacree / Dimensional / ! Danger / Bomb / LIVE / Ghost”)
),

React.createElement(CollapsibleSection,{title:“OPPONENTS”,defaultOpen:false,badge:players.filter(function(p){return isAI?!p.isHuman:true;}).filter(function(p){return p.alive&&!p.fakeDead;}).length+” alive”},
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:8}},
players.filter(function(p){return isAI?!p.isHuman:true;}).map(function(p){
var ri5=players.indexOf(p);
return React.createElement(“div”,{key:p.id,style:{…base.card,opacity:p.alive&&!p.fakeDead?1:0.35,border:“1px solid “+(ri5===turn?”#2a2238”:”#14101e”),padding:“10px 12px”}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,justifyContent:“space-between”}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:10}},
React.createElement(“span”,{style:{fontSize:20,display:“inline-block”,transform:p.character===“THE VAMPIRE”?“rotate(180deg)”:“none”}},CHAR_INFO[p.character]?CHAR_INFO[p.character].icon:”?”),
React.createElement(“div”,null,
React.createElement(“div”,{style:{fontSize:13,color:ri5===turn?”#c4896a”:”#5a5070”}},p.name+(p.fakeDead?” [hidden]”:””)),
React.createElement(“div”,{style:{fontSize:10,color:”#2a2238”,fontStyle:“italic”}},p.character+(p.lovermanState?” ⚭ “+p.lovermanState:””))
)
),
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:8}},
ri5===turn&&React.createElement(“span”,{style:{fontSize:9,color:”#c4896a”,letterSpacing:1}},“TURN”),
(!p.alive&&!p.fakeDead)&&React.createElement(“span”,{style:{fontSize:14,color:”#7a3a4a”}},“X”),
p.fakeDead&&React.createElement(“span”,{style:{fontSize:14,color:”#aa9933”}},“◬”)
)
),
!isAI&&React.createElement(“div”,{style:{marginTop:6,display:“flex”,flexDirection:“column”,gap:4}},
React.createElement(BarComp,{v:p.life,max:MAX_LIFE,color:”#7a3a4a”,label:“HP”}),
React.createElement(“div”,{style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”}},
React.createElement(“span”,{style:{fontSize:13,color:”#c4896a”}},“coins: “+p.coins),
p.insanity&&React.createElement(“span”,{style:{fontSize:9,color:”#c084fc”,background:”#0e0825”,border:“1px solid #2a1a4a”,borderRadius:2,padding:“2px 6px”}},p.insanity)
),
ri5===turn&&skillBtns(p,ri5)
)
);
})
)
),

React.createElement(CollapsibleSection,{title:isAI?“YOUR LOG”:“GAME LOG”,defaultOpen:false,badge:log.length+” events”},
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:4,maxHeight:280,overflowY:“auto”}},
log.slice().reverse().map(function(e){
return React.createElement(“div”,{key:e.id,style:{fontSize:11,lineHeight:1.6,borderBottom:“1px solid #100e18”,paddingBottom:4,color:e.type===“turn”?”#c4896a”:e.type===“system”?”#7ec8e3”:e.type===“warn”?”#8b4a00”:e.type===“love”?”#cc4477”:”#5a5070”}},e.msg);
}),
log.length===0&&React.createElement(“div”,{style:{fontSize:11,color:”#1e1828”,fontStyle:“italic”}},“No events yet.”)
)
),

React.createElement(“div”,{style:{height:24}})
),

modal&&React.createElement(ModalLayer,{
modal:modal, setModal:setModal,
players:players, rooms:rooms, turn:turn,
onSpyCam:confirmSpyCam, onBomb:confirmBomb,
onMindHavoc:confirmMindHavoc, onFJ:confirmFJ,
onTrade:confirmTrade, onDisguise:confirmDisguise,
onOpenRoom:openRoom, onExSaint:confirmExSaint,
onRaise:confirmRaise, execRaisedCorpseTurn:execRaisedCorpseTurn,
onQuantumOverload:execQuantumOverload, onMisdirection:execMisdirection,
onLovermanOathCast:execLovermanOath,
currentPlayers:players, currentRooms:rooms
})
)
);
}

// ─ MODAL LAYER ────────────────────────────────────────────────────────────────
function NegModal({ modal }) {
useEffect(function() {
if (modal.isAI) {
var t=setTimeout(function(){Math.random()<0.6?modal.onYes():modal.onNo();},1400);
return function(){clearTimeout(t);};
}
}, []);
return React.createElement(“div”,{style:{position:“fixed”,top:0,left:0,right:0,bottom:0,background:“rgba(0,0,0,0.9)”,display:“flex”,alignItems:“center”,justifyContent:“center”,zIndex:200}},
React.createElement(“div”,{style:{…base.card,maxWidth:400,width:“90%”,padding:20}},
React.createElement(“div”,{style:{fontSize:14,color:”#c4896a”,letterSpacing:2,marginBottom:8}},“INTER-DIMENTION NEGOTIATOR”),
React.createElement(“div”,{style:base.divider}),
React.createElement(“div”,{style:{fontSize:12,color:”#5a5070”,fontStyle:“italic”,lineHeight:1.7,margin:“10px 0”}},“A Dimensional Guardian blocks your path. Negotiate to block the sanity drain?”),
modal.isAI
? React.createElement(“div”,{style:{fontSize:11,color:”#2a2238”,textAlign:“center”,padding:“12px 0”}},“Deliberating…”)
: React.createElement(“div”,{style:{display:“flex”,gap:8,marginTop:10}},
React.createElement(“button”,{style:{…base.btn,flex:1,background:”#2a4a2a”,fontSize:10},onClick:modal.onYes},“NEGOTIATE”),
React.createElement(“button”,{style:{…base.btn,flex:1,background:”#4a1a1a”,fontSize:10},onClick:modal.onNo},“REFUSE”)
)
)
);
}

function HijackModal({ modal }) {
var s=useState(-1); var selR=s[0]; var setSelR=s[1];
var p=modal.player; var cr=modal.clRev||{};
var unopened=modal.rooms.filter(function(r){return !r.opened&&!r.emptied;});
return React.createElement(“div”,{style:{position:“fixed”,top:0,left:0,right:0,bottom:0,background:“rgba(0,0,0,0.92)”,display:“flex”,alignItems:“center”,justifyContent:“center”,zIndex:200}},
React.createElement(“div”,{style:{…base.card,maxWidth:440,width:“90%”,padding:20,maxHeight:“85vh”,overflowY:“auto”}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:12}},
React.createElement(“div”,{style:{fontSize:28,marginBottom:4}},“ꀦ”),
React.createElement(“div”,{style:{fontSize:13,color:”#8b4a8b”,letterSpacing:2}},“MIND HIJACKED”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”}},“Controlling “+p.name+” - “+p.character)
),
React.createElement(“div”,{style:{display:“flex”,gap:12,justifyContent:“center”,marginBottom:10,fontSize:11}},
React.createElement(“span”,{style:{color:”#7a3a4a”}},“HP: “+p.life),
React.createElement(“span”,{style:{color:”#6a2a7a”}},“SAN: “+p.sanity),
React.createElement(“span”,{style:{color:”#c4896a”}},“✦ “+p.coins)
),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Choose a room.”),
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:150,overflowY:“auto”}},
unopened.map(function(r){
var rv=cr[r.id];
return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:“pointer”,color:”#5a5070”,background:selR===r.id?”#180f24”:rv?”#180a1a”:”#130f18”,border:“1px solid “+(selR===r.id?”#8b4a8b”:rv?”#7a3a4a44”:”#1e1828”)},onClick:function(){setSelR(r.id);}},
React.createElement(“div”,{style:{textAlign:“center”}},
React.createElement(“div”,{style:{fontSize:7,color:”#2a2238”}},r.id),
rv&&React.createElement(“div”,{style:{fontSize:7,color:”#7a3a4a”}},”!”)
)
);
})
),
React.createElement(“button”,{style:{…base.btn,background:selR>=0?”#4a1a4a”:”#1a0a1a”,width:“100%”,marginTop:10,opacity:selR>=0?1:0.3},disabled:selR<0,onClick:function(){if(selR>=0)modal.onPick(selR);}},“SEND THEM IN”)
)
);
}

function ModalLayer({ modal, setModal, players, rooms, turn, onSpyCam, onBomb, onMindHavoc, onFJ, onTrade, onDisguise, onOpenRoom, onExSaint, onRaise, execRaisedCorpseTurn, onQuantumOverload, onMisdirection, onLovermanOathCast, currentPlayers, currentRooms }) {
var s1=useState([]); var picks=s1[0]; var setPicks=s1[1];
var s2=useState(-1); var tid=s2[0]; var setTid=s2[1];
var s3=useState(“buyLife”); var mode=s3[0]; var setMode=s3[1];
var s4=useState(1); var amt=s4[0]; var setAmt=s4[1];
var s5=useState([]); var misSources=s5[0]; var setMisSources=s5[1];
var s6=useState(-1); var misDest=s6[0]; var setMisDest=s6[1];
var unopened=rooms.filter(function(r){return !r.opened&&!r.emptied;});
useEffect(function(){setPicks([]);setTid(-1);setMode(“buyLife”);setAmt(1);setMisSources([]);setMisDest(-1);},[modal.type]);
var OVR={position:“fixed”,top:0,left:0,right:0,bottom:0,background:“rgba(0,0,0,0.9)”,display:“flex”,alignItems:“center”,justifyContent:“center”,zIndex:200};
var BOX={…base.card,maxWidth:460,width:“90%”,padding:20,maxHeight:“88vh”,overflowY:“auto”};
function close(){setModal(null);}

if (modal.type===“OPEN_CONFIRM”){
var rid=modal.roomId;
return React.createElement(“div”,{style:{position:“fixed”,top:0,left:0,right:0,bottom:0,background:“rgba(0,0,0,0.92)”,display:“flex”,flexDirection:“column”,alignItems:“center”,justifyContent:“center”,zIndex:200}},
React.createElement(DoorAnimation,{roomType:modal.roomType||“unknown”,roomId:rid,onComplete:function(){setModal(null);onOpenRoom(rid);}}),
React.createElement(“button”,{style:{marginTop:16,background:“transparent”,color:”#5a5070”,border:“1px solid #2a2238”,borderRadius:4,padding:“10px 28px”,fontSize:12,cursor:“pointer”,letterSpacing:2},onClick:function(){setModal(null);}},“CANCEL”)
);
}
if (modal.type===“NEGOTIATE”) return React.createElement(NegModal,{modal:modal});
if (modal.type===“HIJACK”)    return React.createElement(HijackModal,{modal:modal});

if (modal.type===“LOVERMAN_OATH_CAST”){
return React.createElement(“div”,{style:OVR,onClick:close},
React.createElement(“div”,{style:{…BOX,borderColor:”#cc4477”},onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:12}},
React.createElement(“div”,{style:{fontSize:28,marginBottom:4}},“⚭”),
React.createElement(“div”,{style:{fontSize:13,color:”#cc4477”,letterSpacing:2}},“THE LOVERMAN’S OATH”),
React.createElement(“div”,{style:{fontSize:10,color:”#5a5070”,fontStyle:“italic”,marginTop:4}},“Choose who to swear your heart to. This cannot be undone.”)
),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5}},
modal.eligible.map(function(p){
return React.createElement(“div”,{key:p.id,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===p.id?”#1e0810”:”#130f18”,border:“1px solid “+(tid===p.id?”#cc4477”:”#1e1828”)},onClick:function(){setTid(p.id);}},
React.createElement(“span”,{style:{fontSize:11,color:”#8a7a9a”}},p.name),
React.createElement(“span”,{style:{fontSize:10,color:”#3a3448”}},p.character),
React.createElement(“span”,{style:{fontSize:10,color:”#7a3a4a”}},“HP:”+p.life)
);
})
),
React.createElement(“button”,{style:{…base.btn,background:tid>=0?”#4a0020”:”#1a0010”,border:“1px solid #cc4477”,color:”#cc4477”,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){
if(tid<0)return;
var tgtIdx=-1;
for(var i=0;i<(currentPlayers||players).length;i++){if((currentPlayers||players)[i].id===tid){tgtIdx=i;break;}}
setModal(null);
if(tgtIdx>=0)onLovermanOathCast(tgtIdx,currentPlayers||players,currentRooms||rooms);
}},“SWEAR YOUR HEART”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Cancel”)
)
);
}

if (modal.type===“LOVERMAN_OATH”){
return React.createElement(“div”,{style:{…OVR,background:“rgba(30,0,20,0.97)”},onClick:function(){}},
React.createElement(“div”,{style:{…BOX,borderColor:”#cc4477”,maxWidth:400}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:16}},
React.createElement(“div”,{style:{fontSize:32,marginBottom:4}},“⚭”),
React.createElement(“div”,{style:{fontSize:14,color:”#cc4477”,letterSpacing:2}},“AN OATH IS SWORN”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginTop:6,lineHeight:1.7}},modal.loverName+” has sworn their heart to you.”),
React.createElement(“div”,{style:{fontSize:10,color:”#3a3448”,marginTop:4,lineHeight:1.7}},“This mark is permanent. Your choice shapes both your fates.”)
),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:8}},
React.createElement(“button”,{style:{…base.btn,background:”#1a0825”,border:“1px solid #cc4477”,color:”#cc4477”,fontSize:11,padding:“12px”},onClick:function(){modal.onDecide(“accept”);}},
“⚭ ACCEPT  - Bond your souls. Share all. Live or die together.”
),
React.createElement(“button”,{style:{…base.btn,background:”#1a0810”,border:“1px solid #7a3a4a”,color:”#7a3a4a”,fontSize:11,padding:“12px”},onClick:function(){modal.onDecide(“reject”);}},
“REJECT  - Break the heart. All players suffer.”
),
React.createElement(“button”,{style:{…base.btn,background:”#141414”,border:“1px solid #3a3448”,color:”#3a3448”,fontSize:11,padding:“12px”},onClick:function(){modal.onDecide(“hang”);}},
“… HANG  - Leave them waiting. They drain you slowly.”
)
),
React.createElement(“div”,{style:{fontSize:9,color:”#2a2238”,textAlign:“center”,marginTop:10,fontStyle:“italic”}},“You cannot escape this choice.”)
)
);
}

if (modal.type===“QUANTUM_OVERLOAD”){
var qtMax=8; var qtRooms=modal.unopened||[];
function togQt(id){setPicks(function(p){return p.indexOf(id)>=0?p.filter(function(x){return x!==id;}):p.length>=qtMax?p:p.concat([id]);});}
return React.createElement(“div”,{style:OVR,onClick:close},
React.createElement(“div”,{style:{…BOX,borderColor:”#2a6a8a”},onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:12}},
React.createElement(“div”,{style:{fontSize:28,marginBottom:4}},“∰”),
React.createElement(“div”,{style:{fontSize:13,color:”#2a9acc”,letterSpacing:2}},“QUANTUM OVERLOAD TUNNELING”),
React.createElement(“div”,{style:{fontSize:10,color:”#5a5070”,fontStyle:“italic”,marginTop:4}},“Select up to 8 rooms. Silent passage - no log per room. Doors stay closed. Bombs still detonate.”)
),
React.createElement(“div”,{style:{fontSize:10,color:”#2a6a8a”,marginBottom:6,textAlign:“center”}},picks.length+”/”+qtMax+” selected”),
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:180,overflowY:“auto”}},
qtRooms.map(function(r){
var sel=picks.indexOf(r.id)>=0;
return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:“pointer”,color:sel?”#2a9acc”:”#5a5070”,background:sel?”#060f14”:”#130f18”,border:“1px solid “+(sel?”#2a6a8a”:”#1e1828”)},onClick:function(){togQt(r.id);}},
React.createElement(“div”,{style:{textAlign:“center”}},
React.createElement(“div”,{style:{fontSize:7}},r.id),
r.stackedContents&&React.createElement(“div”,{style:{fontSize:7,color:”#2a6a8a”}},“x”+r.stackedContents.length)
)
);
})
),
React.createElement(“div”,{style:{display:“flex”,gap:6,marginTop:10}},
React.createElement(“button”,{style:{…base.btn,flex:1,background:picks.length>0?”#060f14”:”#1a0a1a”,border:“1px solid #2a6a8a”,color:”#2a9acc”,fontSize:10,opacity:picks.length>0?1:0.3},disabled:picks.length===0,onClick:function(){if(picks.length>0)onQuantumOverload(picks,currentPlayers,currentRooms);}},
“TRAVERSE “+picks.length+” ROOM”+(picks.length!==1?“S”:””)
),
React.createElement(“button”,{style:{…base.ghost,fontSize:10},onClick:close},“Cancel”)
)
)
);
}

if (modal.type===“MISDIRECTION”){
var misRooms=modal.unopened||[];
function togMisSrc(id){if(id===misDest)return;setMisSources(function(p){return p.indexOf(id)>=0?p.filter(function(x){return x!==id;}):p.length>=3?p:p.concat([id]);});}
function setDestRoom(id){if(misSources.indexOf(id)>=0)return;setMisDest(id);}
var misStep=misSources.length===0?“source”:misDest<0?“dest”:“confirm”;
return React.createElement(“div”,{style:OVR,onClick:close},
React.createElement(“div”,{style:{…BOX,borderColor:”#2a6a8a”},onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:12}},
React.createElement(“div”,{style:{fontSize:28,marginBottom:4}},“∰”),
React.createElement(“div”,{style:{fontSize:13,color:”#2a9acc”,letterSpacing:2}},“MISDIRECTION”),
React.createElement(“div”,{style:{fontSize:10,color:”#5a5070”,fontStyle:“italic”,marginTop:4}},
misStep===“source”&&“Step 1: Select up to 3 source rooms to empty.”,
misStep===“dest”&&“Step 2: Select 1 destination room to stack contents into.”,
misStep===“confirm”&&(“Stack “+misSources.length+” room(s) into Room “+misDest+”. Confirm?”)
)
),
misStep!==“confirm”&&React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:180,overflowY:“auto”}},
misRooms.map(function(r){
var isSrc=misSources.indexOf(r.id)>=0; var isDst=r.id===misDest;
var agentP2=null;
for(var ai2=0;ai2<(currentPlayers||[]).length;ai2++){if((currentPlayers[ai2].character===“THE AGENT”)&&currentPlayers[ai2].alive){agentP2=currentPlayers[ai2];break;}}
var isBomb=agentP2&&agentP2.bombRoom===r.id;
return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:isBomb?“not-allowed”:“pointer”,color:isSrc?”#2a9acc”:isDst?”#f0c040”:isBomb?”#7a3a4a”:”#5a5070”,background:isSrc?”#060f14”:isDst?”#140f06”:”#130f18”,border:“1px solid “+(isSrc?”#2a6a8a”:isDst?”#c4896a”:isBomb?”#3a1a1a”:”#1e1828”),opacity:isBomb?0.4:1},
onClick:function(){if(isBomb)return;if(misStep===“source”)togMisSrc(r.id);else setDestRoom(r.id);}},
React.createElement(“div”,{style:{textAlign:“center”}},
React.createElement(“div”,{style:{fontSize:7}},r.id),
isBomb&&React.createElement(“div”,{style:{fontSize:7,color:”#7a3a4a”}},“◆”),
r.stackedContents&&React.createElement(“div”,{style:{fontSize:7,color:”#2a6a8a”}},“x”+r.stackedContents.length)
)
);
})
),
misSources.length>0&&misStep===“source”&&React.createElement(“div”,{style:{marginTop:8,fontSize:10,color:”#2a6a8a”,textAlign:“center”}},misSources.length+”/3 source rooms selected. Now select destination.”),
misStep===“confirm”&&React.createElement(“div”,{style:{marginTop:10,padding:“10px”,background:”#060f14”,border:“1px solid #2a6a8a”,borderRadius:4,fontSize:11,color:”#5a5070”,fontStyle:“italic”}},
“Rooms “+misSources.join(”, “)+” will be emptied. All their contents move to Room “+misDest+”. This cannot be undone.”
),
React.createElement(“div”,{style:{display:“flex”,gap:6,marginTop:10}},
misStep===“confirm”&&React.createElement(“button”,{style:{…base.btn,flex:1,background:”#060f14”,border:“1px solid #2a6a8a”,color:”#2a9acc”,fontSize:10},onClick:function(){onMisdirection(misSources,misDest,currentPlayers,currentRooms);}},“EXECUTE”),
misStep===“dest”&&React.createElement(“button”,{style:{…base.btn,flex:1,background:”#060f14”,border:“1px solid #2a6a8a”,color:”#2a9acc”,fontSize:10},onClick:function(){setMisSources([]);}},“Back to Source”),
React.createElement(“button”,{style:{…base.ghost,fontSize:10},onClick:close},“Cancel”)
)
)
);
}

if (modal.type===“SPY_CAM”){
function tog(id){setPicks(function(p){return p.indexOf(id)>=0?p.filter(function(x){return x!==id;}):p.length<5?p.concat([id]):p;});}
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“SPY CAMERA”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Select up to 5 rooms. Contents revealed to you only.”),
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:150,overflowY:“auto”}},
unopened.map(function(r){return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:“pointer”,color:”#5a5070”,background:picks.indexOf(r.id)>=0?”#0d1d0d”:”#130f18”,border:“1px solid “+(picks.indexOf(r.id)>=0?”#c4896a”:”#1e1828”)},onClick:function(){tog(r.id);}},r.id);})
),
React.createElement(“div”,{style:{fontSize:10,color:”#3a3448”,marginTop:4}},picks.length+”/5 selected”),
React.createElement(“button”,{style:{…base.btn,width:“100%”,marginTop:10,opacity:picks.length===0?0.3:1},disabled:picks.length===0,onClick:function(){onSpyCam(picks);}},“INSTALL CAMERAS”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“BOMB”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“TRAP WIRE BOMB”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Plant a bomb. Anyone who opens it loses 7 Life.”),
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:150,overflowY:“auto”}},
unopened.map(function(r){return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:“pointer”,color:”#5a5070”,background:tid===r.id?”#180a1a”:”#130f18”,border:“1px solid “+(tid===r.id?”#7a3a4a”:”#1e1828”)},onClick:function(){setTid(r.id);}},r.id);})
),
React.createElement(“button”,{style:{…base.btn,background:”#4a0a0a”,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){onBomb(tid);}},“PLANT BOMB”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“MIND_HAVOC”){
var elig=modal.eligible.filter(function(p){return p.alive&&!p.fakeDead;});
function togP(id){setPicks(function(p){return p.indexOf(id)>=0?p.filter(function(x){return x!==id;}):p.length<3?p.concat([id]):p;});}
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“MIND HAVOC”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Select up to 3 players to control.”),
React.createElement(“div”,{style:{display:“flex”,flexWrap:“wrap”,gap:6}},
elig.map(function(p){return React.createElement(“div”,{key:p.id,style:{padding:“5px 10px”,borderRadius:3,cursor:“pointer”,fontSize:10,background:picks.indexOf(p.id)>=0?”#150a22”:”#130f18”,border:“1px solid “+(picks.indexOf(p.id)>=0?”#8b4a8b”:”#1e1828”),color:picks.indexOf(p.id)>=0?”#8b4a8b”:”#3a3448”},onClick:function(){togP(p.id);}},p.name);})
),
React.createElement(“button”,{style:{…base.btn,background:”#4a1a4a”,width:“100%”,marginTop:10,opacity:picks.length===0?0.3:1},disabled:picks.length===0,onClick:function(){onMindHavoc(picks);}},“CONTROL “+picks.length+” PLAYER”+(picks.length!==1?“S”:””)),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“FAKE_JUSTICE”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“FAKE JUSTICE”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Mark a player. At 4 or below Life: inherit all sanity, get +5 Life. Owes 5 coins at game end.”),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5}},
modal.eligible.map(function(p){return React.createElement(“div”,{key:p.id,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===p.id?”#1e1828”:”#130f18”,border:“1px solid “+(tid===p.id?”#c4896a”:”#1e1828”)},onClick:function(){setTid(p.id);}},
React.createElement(“span”,{style:{fontSize:11,color:”#8a7a9a”}},p.name),
React.createElement(“span”,{style:{fontSize:10,color:”#3a3448”}},p.character),
React.createElement(“span”,{style:{fontSize:10,color:”#7a3a4a”}},“HP:”+p.life)
);})
),
React.createElement(“button”,{style:{…base.btn,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){onFJ(tid);}},“MARK PLAYER”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“SOUL_TRADER”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“SOUL TRADER”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“1 Coin = 2 Life . 1 Life = 2 Coins.”),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5,marginBottom:10}},
modal.eligible.map(function(p){return React.createElement(“div”,{key:p.id,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===p.id?”#1e1828”:”#130f18”,border:“1px solid “+(tid===p.id?”#c4896a”:”#1e1828”)},onClick:function(){setTid(p.id);}},
React.createElement(“span”,{style:{fontSize:11,color:”#8a7a9a”}},p.name),
React.createElement(“span”,{style:{fontSize:10,color:”#7a3a4a”}},“HP:”+p.life),
React.createElement(“span”,{style:{fontSize:10,color:”#c4896a”}},“✦”+p.coins)
);})
),
tid>=0&&React.createElement(“div”,null,
React.createElement(“div”,{style:{display:“flex”,gap:6,marginBottom:8}},
[“buyLife”,“sellLife”].map(function(m){return React.createElement(“button”,{key:m,style:{flex:1,background:”#130f18”,color:mode===m?”#c4896a”:”#3a3448”,border:“1px solid “+(mode===m?”#c4896a”:”#1e1828”),borderRadius:3,padding:“6px”,fontSize:9,cursor:“pointer”},onClick:function(){setMode(m);}},m===“buyLife”?“BUY LIFE”:“SELL LIFE”);})
),
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:8,marginBottom:8}},
React.createElement(“span”,{style:{fontSize:10,color:”#3a3448”}},“Amount:”),
React.createElement(“input”,{type:“number”,min:1,max:6,value:amt,onChange:function(e){var v=parseInt(e.target.value,10);if(!isNaN(v)&&v>=1)setAmt(v);},style:{…base.input,width:60,padding:“4px 8px”,textAlign:“center”}}),
React.createElement(“span”,{style:{fontSize:9,color:”#2a2238”}},mode===“buyLife”?amt+“c->”+(amt*2)+“HP”:amt+“HP->”+(amt*2)+“c”)
)
),
React.createElement(“button”,{style:{…base.btn,width:“100%”,marginTop:4,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){onTrade(tid,mode,amt);}},“SEAL THE DEAL”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“DISGUISE”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“DISGUISE”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Requires 5 boxes. Fully copy a living character. +1 Sanity per turn while disguised.”),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5}},
modal.eligible.map(function(p){
var inf=CHAR_INFO[p.character];
return React.createElement(“div”,{key:p.id,style:{display:“flex”,alignItems:“center”,gap:10,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===p.id?”#150a22”:”#130f18”,border:“1px solid “+(tid===p.id?”#8b4a8b”:”#1e1828”)},onClick:function(){setTid(p.id);}},
React.createElement(“span”,{style:{fontSize:18}},inf?inf.icon:”?”),
React.createElement(“span”,{style:{fontSize:11,color:”#8a7a9a”,flex:1}},p.name),
React.createElement(“span”,{style:{fontSize:9,color:”#3a3448”}},p.character)
);
})
),
React.createElement(“button”,{style:{…base.btn,background:”#4a1a4a”,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){onDisguise(tid);}},“WEAR THEIR FACE”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“EX_SAINT”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“EX-SAINT”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Bless a player. Their next Dimensional Guardian does nothing.”),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5}},
modal.eligible.map(function(p){
return React.createElement(“div”,{key:p.id,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===p.id?”#0e0d1a”:”#130f18”,border:“1px solid “+(tid===p.id?”#6644aa”:”#1e1828”)},onClick:function(){setTid(p.id);}},
React.createElement(“span”,{style:{fontSize:11,color:”#8a7a9a”}},p.name),
React.createElement(“span”,{style:{fontSize:10,color:”#3a3448”}},p.character),
React.createElement(“span”,{style:{fontSize:10,color:”#6a2a7a”}},“SAN:”+p.sanity)
);
})
),
React.createElement(“button”,{style:{…base.btn,background:”#2a1a4a”,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){onExSaint(tid);}},“BESTOW BLESSING”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“RAISE”){
return React.createElement(“div”,{style:OVR,onClick:close},React.createElement(“div”,{style:BOX,onClick:function(e){e.stopPropagation();}},
React.createElement(“div”,{style:{fontSize:13,color:”#c4896a”,letterSpacing:2,marginBottom:6}},“RAISE!”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”,marginBottom:8}},“Choose a dead player. Control their corpse for 2 turns. Fake-dead players cannot be raised.”),
React.createElement(“div”,{style:{display:“flex”,flexDirection:“column”,gap:5}},
modal.eligible.map(function(p,ei){
return React.createElement(“div”,{key:p.id,style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,padding:“8px 10px”,borderRadius:4,cursor:“pointer”,background:tid===ei?”#0e0d1a”:”#130f18”,border:“1px solid “+(tid===ei?”#6644aa”:”#1e1828”)},onClick:function(){setTid(ei);}},
React.createElement(“span”,{style:{fontSize:11,color:”#5a5070”}},p.name),
React.createElement(“span”,{style:{fontSize:10,color:”#3a3448”}},p.character),
React.createElement(“span”,{style:{fontSize:10,color:”#7a3a4a”}},”†”)
);
})
),
React.createElement(“button”,{style:{…base.btn,background:”#2a1a4a”,width:“100%”,marginTop:10,opacity:tid<0?0.3:1},disabled:tid<0,onClick:function(){
if(tid<0)return;
var realIdx=-1;
for(var i=0;i<players.length;i++){if(!players[i].alive&&!players[i].fakeDead&&modal.eligible[tid]&&players[i].id===modal.eligible[tid].id){realIdx=i;break;}}
if(realIdx>=0)onRaise(realIdx);
}},“RISE FROM DEATH”),
React.createElement(“button”,{style:{…base.ghost,width:“100%”,marginTop:6},onClick:close},“Close”)
));
}

if (modal.type===“RAISE_CORPSE_TURN”){
var corpse=players[modal.corpseInfo.playerIdx];
var unopenedForCorpse=(modal.rooms||rooms).filter(function(r){return !r.opened&&!r.emptied;});
return React.createElement(“div”,{style:{position:“fixed”,top:0,left:0,right:0,bottom:0,background:“rgba(0,0,0,0.92)”,display:“flex”,alignItems:“center”,justifyContent:“center”,zIndex:200}},
React.createElement(“div”,{style:{…base.card,maxWidth:440,width:“90%”,padding:20,maxHeight:“85vh”,overflowY:“auto”}},
React.createElement(“div”,{style:{textAlign:“center”,marginBottom:12}},
React.createElement(“div”,{style:{fontSize:28,marginBottom:4}},“⌂”),
React.createElement(“div”,{style:{fontSize:13,color:”#6644aa”,letterSpacing:2}},“CORPSE CONTROLLED”),
React.createElement(“div”,{style:{fontSize:11,color:”#5a5070”,fontStyle:“italic”}},
(corpse?corpse.name:”?”)+” - “+modal.corpseInfo.turnsLeft+” turn”+(modal.corpseInfo.turnsLeft!==1?“s”:””)+” remaining”
)
),
React.createElement(“div”,{style:{fontSize:11,color:”#3a3448”,fontStyle:“italic”,marginBottom:8}},“Open a door. The corpse gains nothing from it.”),
React.createElement(“div”,{style:{display:“grid”,gridTemplateColumns:“repeat(8,1fr)”,gap:3,maxHeight:150,overflowY:“auto”}},
unopenedForCorpse.map(function(r){
return React.createElement(“div”,{key:r.id,style:{height:40,borderRadius:3,display:“flex”,alignItems:“center”,justifyContent:“center”,fontSize:11,cursor:“pointer”,color:”#5a5070”,background:tid===r.id?”#180f24”:”#130f18”,border:“1px solid “+(tid===r.id?”#6644aa”:”#1e1828”)},onClick:function(){setTid(r.id);}},
React.createElement(“div”,{style:{textAlign:“center”}},React.createElement(“div”,{style:{fontSize:7,color:”#2a2238”}},r.id))
);
})
),
React.createElement(“button”,{style:{…base.btn,background:tid>=0?”#2a1a4a”:”#1a0a1a”,width:“100%”,marginTop:10,opacity:tid>=0?1:0.3},disabled:tid<0,onClick:function(){
if(tid<0)return;
setModal(null);
execRaisedCorpseTurn(tid,modal.corpseInfo,modal.players||players,modal.rooms||rooms);
}},“SEND THE CORPSE IN”)
)
);
}

return null;
}

// ─ COLLAPSIBLE SECTION ────────────────────────────────────────────────────────
function CollapsibleSection(props) {
var title=props.title; var badge=props.badge; var defaultOpen=props.defaultOpen; var children=props.children;
var s=useState(defaultOpen!==undefined?defaultOpen:true); var open=s[0]; var setOpen=s[1];
return React.createElement(“div”,{style:{borderBottom:“1px solid #1e1828”}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,justifyContent:“space-between”,padding:“12px 14px”,cursor:“pointer”,background:open?”#120f17”:”#080604”},onClick:function(){setOpen(!open);}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:8}},
React.createElement(“span”,{style:{fontSize:9,letterSpacing:3,color:”#3a3448”,textTransform:“uppercase”}},title),
badge!==””&&React.createElement(“span”,{style:{fontSize:9,color:”#2a2238”,background:”#130f18”,border:“1px solid #1e1828”,borderRadius:2,padding:“1px 6px”}},badge)
),
React.createElement(“span”,{style:{fontSize:12,color:”#2a2238”}},open?”^”:“v”)
),
open&&React.createElement(“div”,{style:{padding:“4px 14px 14px 14px”}},children)
);
}

// ─ SKILLS PANEL ───────────────────────────────────────────────────────────────
function SkillsPanel({ player }) {
var ex=useState(null); var expanded=ex[0]; var setExpanded=ex[1];
var ec=player.disguisedAs||player.character;
var allSkills=(CHAR_SKILLS[ec]||CHAR_SKILLS[player.character]||[]);
return React.createElement(“div”,{style:{background:”#120f17”,border:“1px solid #1e1828”,borderRadius:4,padding:“8px 10px”}},
React.createElement(“div”,{style:{fontSize:9,color:”#2a2238”,letterSpacing:2,marginBottom:6}},“SKILLS”),
allSkills.map(function(sk,i){
var isPassive=sk.type===“Φ”; var charge=player.skills[sk.name];
var isUnlimited=sk.limit===“∞”; var isActive=isUnlimited||(charge!==undefined&&charge>0);
var isExp=expanded===i;
return React.createElement(“div”,{key:i,style:{marginBottom:5}},
React.createElement(“div”,{style:{display:“flex”,justifyContent:“space-between”,alignItems:“center”,cursor:“pointer”,padding:“3px 0”},onClick:function(){setExpanded(isExp?null:i);}},
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:5,flex:1,minWidth:0}},
React.createElement(“span”,{style:{fontSize:8,color:isPassive?”#7ec8e3”:”#c4896a”,background:”#0a0806”,border:“1px solid “+(isPassive?”#7ec8e322”:”#c4896a22”),borderRadius:2,padding:“1px 4px”,flexShrink:0}},sk.type),
React.createElement(“span”,{style:{fontSize:11,color:isActive?”#8a7a9a”:”#2a2238”,overflow:“hidden”,textOverflow:“ellipsis”,whiteSpace:“nowrap”}},sk.name)
),
React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:5,flexShrink:0}},
isUnlimited?React.createElement(“span”,{style:{fontSize:9,color:”#3a3448”}},“inf”):React.createElement(“span”,{style:{fontSize:9,color:isActive?”#c4896a”:”#1e1828”}},“x”+(charge!==undefined?charge:0)),
React.createElement(“span”,{style:{fontSize:8,color:”#2a2238”}},isExp?”^”:“v”)
)
),
isExp&&React.createElement(“div”,{style:{fontSize:10,color:”#5a5070”,fontStyle:“italic”,lineHeight:1.6,padding:“5px 8px”,background:”#0a0806”,borderRadius:3,marginTop:2,borderLeft:“2px solid #2a2238”}},sk.desc)
);
})
);
}

// ─ SMALL COMPONENTS ──────────────────────────────────────────────────────────
function BarComp({ v, max, color, label, danger }) {
var pct=Math.max(0,Math.min(1,v/max));
var col=danger?(pct>=0.9?”#7a3a4a”:pct>=0.5?”#7a4a00”:color):color;
return React.createElement(“div”,{style:{display:“flex”,alignItems:“center”,gap:4}},
label&&React.createElement(“span”,{style:{fontSize:7,color:”#2a2238”,minWidth:26}},label),
React.createElement(“div”,{style:{flex:1,height:5,background:”#0e0a00”,borderRadius:2}},
React.createElement(“div”,{style:{width:(pct*100)+”%”,height:“100%”,background:col,borderRadius:2,transition:“width 0.25s”}})
),
React.createElement(“span”,{style:{fontSize:7,color:”#2a2238”,minWidth:22}},v+”/”+max)
);
}

// CharCardSmall kept for any future internal use (not used in ban/pick anymore)
function CharCardSmall({ c, onClick }) {
var inf=CHAR_INFO[c];
var an=useState(false); var anim=an[0]; var setAnim=an[1];
function handleTap() { if(anim)return; setAnim(true); }
function handleDone(){ setAnim(false); if(onClick)onClick(); }
return React.createElement(“div”,{style:{background:”#130f18”,border:“1px solid “+(anim?inf.color+“88”:”#221c2e”),borderRadius:5,padding:“8px 8px 10px 8px”,cursor:“pointer”,transition:“border-color 0.15s”,position:“relative”,overflow:“hidden”,display:“flex”,flexDirection:“column”,alignItems:“center”},onClick:handleTap},
anim
? React.createElement(HologramCard,{character:c,size:120,onDone:handleDone})
: React.createElement(“div”,{style:{width:“100%”,height:120,display:“flex”,alignItems:“center”,justifyContent:“center”}},
React.createElement(“span”,{style:{fontSize:52,color:inf.color,textShadow:“0 0 16px “+inf.color+“55”,display:“block”,textAlign:“center”,lineHeight:1,transform:c===“THE VAMPIRE”?“rotate(180deg)”:“none”}},inf.icon)
),
React.createElement(“div”,{style:{fontSize:9,fontWeight:“bold”,color:anim?inf.color:”#5a5070”,letterSpacing:1,marginTop:4,marginBottom:2,textAlign:“center”}},c),
React.createElement(“div”,{style:{fontSize:9,color:”#3a3448”,fontStyle:“italic”,lineHeight:1.4,textAlign:“center”}},inf.tag)
);
}