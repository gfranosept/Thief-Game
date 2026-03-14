import { useState, useEffect, useCallback, useRef } from “react”;

// — CONSTANTS —————————————————————
var MAX_LIFE = 8;
var MAX_SANITY = 10;
var SANITARIUM_COST = 10;
var ALL_CHARS = [
“THE SINNER”,“THE HUNTER”,“THE CLAIRVOYANT”,“THE DOCTOR”,
“THE UNSTABLE”,“THE AGENT”,“THE BOTANIST”,“THE LAWYER”,
“THE SELLER”,“THE PAINTER”
];
var INSANITY_LIST = [“Lavish”,“Masochist”,“Conceit”,“Boast”];
var INSANITY_DESC = {
Lavish: “Discard 2 coins every coin room turn.”,
Masochist: “Masacree deals 4 damage instead of 2.”,
Conceit: “Take nothing from coin rooms.”,
Boast: “Cannot use active skills.”
};
var CHAR_INFO = {
“THE SINNER”:      { icon:“🩸”, tag:“Greed made flesh.”, color:”#8b1a1a” },
“THE HUNTER”:      { icon:“🎯”, tag:“Every kill is a payday.”, color:”#5a7a2a” },
“THE CLAIRVOYANT”: { icon:“👁️”, tag:“She sees what walls hide.”, color:”#2a4a7a” },
“THE DOCTOR”:      { icon:“🩺”, tag:“First do no harm. Then collect coins.”, color:”#4a7a6a” },
“THE UNSTABLE”:    { icon:“🌀”, tag:“Two souls. One body. No mercy.”, color:”#7a2a7a” },
“THE AGENT”:       { icon:“🕵️”, tag:“Watch everything. Trust no one.”, color:”#2a2a5a” },
“THE BOTANIST”:    { icon:“🌿”, tag:“She doesn’t attack. She just gardens.”, color:”#2a5a2a” },
“THE LAWYER”:      { icon:”(scale)️”, tag:“Every deal has fine print.”, color:”#7a6a2a” },
“THE SELLER”:      { icon:“💰”, tag:“Everything has a price.”, color:”#7a5a1a” },
“THE PAINTER”:     { icon:“🎨”, tag:“Any face. Any power.”, color:”#4a2a7a” }
};
var HOW_TO = [
{ title:“THE MANSION”, icon:“🏚️”, text:“The game takes place in a Mansion filled with rooms. Each room hides coins or a Guardian. Rooms are randomly arranged each game - nobody knows what’s behind any door.” },
{ title:“TAKING TURNS”, icon:“⏳”, text:“Players take turns opening one room per turn. Select a room on the grid then confirm. Some skills allow extra actions before opening.” },
{ title:“COINS”, icon:“💰”, text:“Opening a coin room earns 1 coin. Most coins at game end wins. Coins only transfer to your wallet if you survive the game.” },
{ title:“GUARDIANS”, icon:“👹”, text:“Two types lurk inside:\n\n🪓 Masacree Guardian - hurls an axe. You lose 2 Life (or 4 with Masochist insanity).\n\n🌀 Dimensional Guardian - haunts your mind. Sanity +2.” },
{ title:“LIFE ESSENCE”, icon:”<3️”, text:“Every player starts with 8 Life. If it reaches zero you die - all coins are lost. In 1v1, the game ends immediately when either player dies.” },
{ title:“SANITY”, icon:“🧠”, text:“Sanity starts at 0 and rises from Dimensional Guardians. At 10 you get a random Insanity:\n\n- Lavish - lose 2 coins per coin room\n- Masochist - double axe damage\n- Conceit - take nothing from coin rooms\n- Boast - cannot use active skills\n\nInsanity persists between games until cleansed.” },
{ title:“SANITARIUM”, icon:“🏥”, text:“Access from the main menu via your Profile. Costs 10 coins to perform Cleansing Soul and remove insanity. Insanity carries into your next game if not cleansed.” },
{ title:“BANNING & PICKING”, icon:“🚫”, text:“Before each game, players ban characters in turns. Then pick in order. You can ban any character - but can only pick characters you own.” },
{ title:“WIN CONDITION”, icon:“👑”, text:“Game ends when all rooms are opened or all but one player are dead. Most coins wins. VS AI: game ends the moment you or all opponents die.” }
];
var CHAR_SKILLS = {
“THE SINNER”: [{ name:“Unsatisfied Desire”, type:“Φ”, limit:“∞”, desc:“When The Sinner opens a coin room, he opens another immediately. Chain continues until a non-coin room - or Conceit blocks the reward.” }],
“THE HUNTER”: [
{ name:“Hunting Trophy”, type:“Φ”, limit:“∞”, desc:“Every Guardian kill earns +2 coins. Always active.” },
{ name:“Eyes on Prey”, type:“Φ”, limit:“4”, desc:“Nullifies all damage from Guardian encounters. When exhausted, Hunter takes normal damage but Trophy still fires.” }
],
“THE CLAIRVOYANT”: [
{ name:“Third Eyes”, type:“Φ”, limit:“1”, desc:“On first Guardian encounter, reveals 6 other Guardian rooms - visible to Clairvoyant only.” },
{ name:“Mind Havoc”, type:“Δ”, limit:“2”, desc:“Seize control of 3 players. Assign each a room to open. They are helpless. Controlled players’ passives still fire.” }
],
“THE DOCTOR”: [
{ name:“Care Pack”, type:“Φ”, limit:“1”, desc:“Auto-triggers when Doctor’s Life drops to 2. Restores to full. Bound to Oath takes priority.” },
{ name:“Self-Therapy”, type:“Δ”, limit:“1”, desc:“Resets sanity to 0 and clears insanity. Immune to next Dimensional Guardian. Costs a turn.” },
{ name:“Bound to Oath”, type:“Φ”, limit:“3”, desc:“When any other player hits exactly 2 Life, they get +2 Life but must pay 1 coin. No coin = no trigger.” }
],
“THE UNSTABLE”: [{ name:“Soul Switching”, type:“Φ”, limit:“∞”, desc:”[Emily] Encountering a Guardian instantly shifts to [Maria]. [Maria] Immune to all Guardians. +2 Sanity per turn from herself only. After 2 coin rooms in Maria mode, reverts to Emily with Sanity -5.” }],
“THE AGENT”: [
{ name:“Spy Camera”, type:“Δ”, limit:“1”, desc:“Install cameras in 5 rooms. Contents revealed to Agent only. Rooms show [LIVE] status.” },
{ name:“Trap Wire Bomb”, type:“Δ”, limit:“1”, desc:“Plant a bomb in any room. Anyone who opens it - including yourself - loses 7 Life.” },
{ name:“Eliminate All Evidence”, type:“Φ”, limit:“∞”, desc:“When a player dies in a Live room, all their coins transfer to The Agent.” }
],
“THE BOTANIST”: [{ name:“Conium Maculatum”, type:“Φ”, limit:“∞”, desc:“On Guardian encounter, spreads poison to adjacent rooms. Poison stacks up to 2 (max -4 damage). Clears after one victim. Poison is invisible. Botanist immune to her own poison only.” }],
“THE LAWYER”: [
{ name:“Inter-Dimention Negotiator”, type:“Φ”, limit:“3”, desc:“On Dimensional encounter a popup appears: Negotiate (block sanity, use 1 charge) or Refuse (take +2 sanity, keep charge).” },
{ name:“Fake Justice”, type:“Δ”, limit:“1”, desc:“Mark a player. At 4 or below Life they inherit all players’ sanity and get +5 Life. At game end they owe 5 coins. Contract survives their death. Lawyer death voids the mark.” }
],
“THE SELLER”: [
{ name:“Supplies”, type:“Φ”, limit:“1”, desc:“Starts with 7 bonus coins and +3 max Life.” },
{ name:“Soul Trader”, type:“Δ”, limit:“∞”, desc:“1 Coin = 2 Life. 1 Life = 2 Coins. Seller chooses who trades. Seller coins floored at 0. End game: if coins >= 7, exactly 7 are deducted.” }
],
“THE PAINTER”: [
{ name:“Make-Up Box”, type:“Φ”, limit:“∞”, desc:“Collect one box from every coin room opened.” },
{ name:“Disguise”, type:“Δ”, limit:“2”, desc:“Requires 10 boxes. Fully copy a living character - all skills fresh. +1 Sanity per turn while disguised.” },
{ name:“Drop Mask”, type:“Δ”, limit:“2”, desc:“End disguise immediately. Stops sanity drain. Loses borrowed skills. No refund.” }
]
};

// — HELPERS —————————————————————–
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
var mas = Math.floor(total * 0.23);
var dim = Math.floor(total * 0.23);
var coins = total - mas - dim;
var arr = [];
for (var i = 0; i < coins; i++) arr.push(“coins”);
for (var i = 0; i < mas; i++) arr.push(“masacree”);
for (var i = 0; i < dim; i++) arr.push(“dimensional”);
arr = shuffle(arr);
return arr.map(function(type, idx) {
return { id: idx + 1, type: type, opened: false, poison: 0, poisonOwner: -1 };
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
coloringBoxes: 0
};
if (char === “THE SELLER”)      { p.coins = 7; p.life = MAX_LIFE + 3; }
if (char === “THE HUNTER”)      { p.skills[“Eyes on Prey”] = 4; }
if (char === “THE UNSTABLE”)    { p.persona = “Emily”; }
if (char === “THE CLAIRVOYANT”) { p.skills[“Third Eyes”] = 1; p.skills[“Mind Havoc”] = 2; }
if (char === “THE DOCTOR”)      { p.skills[“Care Pack”] = 1; p.skills[“Self-Therapy”] = 1; p.skills[“Bound to Oath”] = 3; }
if (char === “THE AGENT”)       { p.skills[“Spy Camera”] = 1; p.skills[“Trap Wire Bomb”] = 1; }
if (char === “THE LAWYER”)      { p.skills[“Fake Justice”] = 1; p.skills[“Negotiator”] = 3; }
if (char === “THE PAINTER”)     { p.skills[“Disguise”] = 2; p.skills[“Drop Mask”] = 2; }
if (!isHuman && Math.random() < 0.25) {
p.insanity = rollInsanity(); p.sanity = MAX_SANITY;
}
return p;
}

function effChar(p) { return p.disguisedAs || p.character; }

function aiRoom(player, rooms) {
var open = rooms.filter(function(r) { return !r.opened; });
if (!open.length) return -1;
var rev = player.revealed;
var safe = open.filter(function(r) { return rev[r.id] === “coins”; });
if (safe.length) return safe[Math.floor(Math.random() * safe.length)].id;
var unk = open.filter(function(r) { return !rev[r.id]; });
var pool = unk.length ? unk : open;
return pool[Math.floor(Math.random() * pool.length)].id;
}

// — PROFILE STORE ———————————————————–
function useProfiles() {
var init = {};
var state = useState(init);
var profiles = state[0];
var setProfiles = state[1];

function get(name) {
return profiles[name] || { name: name, coins: 0, insanity: null, avatar: “🎭” };
}
function save(name, data) {
var cur = get(name);
var next = {};
for (var k in cur) next[k] = cur[k];
for (var k in data) next[k] = data[k];
setProfiles(function(p) {
var np = {};
for (var k in p) np[k] = p[k];
np[name] = next;
return np;
});
}
function addCoins(name, amt) {
var p = get(name);
save(name, { coins: (p.coins || 0) + amt });
}
function setIns(name, ins) { save(name, { insanity: ins }); }
function cleanse(name) {
var p = get(name);
if ((p.coins || 0) < SANITARIUM_COST) return false;
save(name, { insanity: null, coins: p.coins - SANITARIUM_COST });
return true;
}
return { get: get, save: save, addCoins: addCoins, setIns: setIns, cleanse: cleanse };
}

// — STYLES ——————————————————————
var C = {
bg: “#0a0806”, gold: “#c9a84c”, dim: “#5a4a2a”, dark: “#1a1000”,
red: “#8b1a1a”, purple: “#7a2a7a”, green: “#2a5a2a”, blue: “#2a4a7a”
};
var base = {
root: { minHeight:“100vh”, background:C.bg, color:”#c9a84c”, fontFamily:“Georgia, serif”, display:“flex”, flexDirection:“column” },
center: { display:“flex”, flexDirection:“column”, alignItems:“center”, justifyContent:“center”, flex:1, padding:20, gap:16 },
card: { background:”#0f0c08”, border:“1px solid #2a1a00”, borderRadius:6, padding:“12px 14px” },
input: { background:”#0f0c08”, border:“1px solid #2a1a00”, borderRadius:4, color:”#c9a84c”, padding:“8px 12px”, fontSize:13, outline:“none”, width:“100%”, boxSizing:“border-box”, fontFamily:“Georgia, serif” },
btn: { background:”#c9a84c”, color:”#0a0806”, border:“none”, borderRadius:4, padding:“10px 24px”, fontSize:12, fontWeight:“bold”, letterSpacing:2, cursor:“pointer”, fontFamily:“Georgia, serif” },
ghost: { background:“transparent”, border:“1px solid #2a1a00”, color:”#5a4a2a”, borderRadius:4, padding:“8px 18px”, fontSize:11, cursor:“pointer”, letterSpacing:1, fontFamily:“Georgia, serif” },
small: { background:”#0f0c08”, border:“1px solid #1e1500”, color:”#c9a84c”, borderRadius:3, padding:“4px 8px”, fontSize:10, cursor:“pointer”, fontFamily:“Georgia, serif” },
logo: { fontSize:40, letterSpacing:14, color:”#c9a84c”, textShadow:“0 0 40px rgba(201,168,76,0.4)”, textAlign:“center” },
sub: { fontSize:11, color:”#3a2a10”, letterSpacing:3, textAlign:“center” },
divider: { height:1, background:“linear-gradient(to right, transparent, #2a1a00, transparent)”, margin:“8px 0” },
tag: { fontSize:8, letterSpacing:3, color:”#2a1a00”, textTransform:“uppercase”, paddingBottom:6, borderBottom:“1px solid #1a1000”, marginBottom:8 }
};

// — ROOT ———————————————————————
export default function App() {
var s = useState(“HOME”);
var screen = s[0]; var setScreen = s[1];
var g = useState(null);
var gameConfig = g[0]; var setGameConfig = g[1];
var store = useProfiles();

function startGame(cfg) { setGameConfig(cfg); setScreen(“GAME”); }
function exitGame() { setGameConfig(null); setScreen(“HOME”); }

if (screen === “HOME”)    return React.createElement(Home, { go: setScreen });
if (screen === “HOW_TO”)  return React.createElement(HowToPlay, { back: function() { setScreen(“HOME”); } });
if (screen === “CHARS”)   return React.createElement(CharSheets, { back: function() { setScreen(“HOME”); } });
if (screen === “PROFILE”) return React.createElement(Profile, { store: store, back: function() { setScreen(“HOME”); } });
if (screen === “VS_AI”)   return React.createElement(VsAISetup, { store: store, back: function() { setScreen(“HOME”); }, start: startGame });
if (screen === “ONLINE”)  return React.createElement(OnlineSetup, { store: store, back: function() { setScreen(“HOME”); }, start: startGame });
if (screen === “GAME”)    return React.createElement(Game, { cfg: gameConfig, store: store, exit: exitGame });
return null;
}

// — HOME ———————————————————————
function Home({ go }) {
return (

<div style={base.root}>
<div style={base.center}>
<div style={base.logo}>* THIEF *</div>
<div style={base.sub}>Enter the Mansion. Collect the coins. Survive.</div>
<div style={base.divider} />
<div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
<button style={base.btn} onClick={function() { go("VS_AI"); }}>🤖 VS AI</button>
<button style={base.ghost} onClick={function() { go("ONLINE"); }}>🌐 ONLINE</button>
</div>
<div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
<button style={base.ghost} onClick={function() { go("HOW_TO"); }}>📖 How to Play</button>
<button style={base.ghost} onClick={function() { go("CHARS"); }}>📜 Characters</button>
<button style={base.ghost} onClick={function() { go("PROFILE"); }}>👤 Profile</button>
</div>
<div style={{ fontSize:9, color:"#1e1500", letterSpacing:2, marginTop:16 }}>(c) THIEF OFFICIAL 2022</div>
</div>
</div>
);
}

// — HOW TO PLAY –––––––––––––––––––––––––––––––
function HowToPlay({ back }) {
var s = useState(0); var idx = s[0]; var setIdx = s[1];
var ch = HOW_TO[idx];
return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={back}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>HOW TO PLAY</div>
</div>
<div style={{ display:"flex", flex:1, overflow:"hidden" }}>
<div style={{ width:140, borderRight:"1px solid #1a1000", overflowY:"auto", padding:"8px 0" }}>
{HOW_TO.map(function(h, i) {
return (
<div key={i} style={{ padding:"8px 12px", cursor:"pointer", borderLeft:"2px solid " + (idx === i ? "#c9a84c" : "transparent"), background: idx === i ? "rgba(201,168,76,0.05)" : "transparent" }} onClick={function() { setIdx(i); }}>
<div style={{ fontSize:16 }}>{h.icon}</div>
<div style={{ fontSize:8, color: idx === i ? "#c9a84c" : "#3a2a10", letterSpacing:1, marginTop:2 }}>{h.title}</div>
</div>
);
})}
</div>
<div style={{ flex:1, overflowY:"auto", padding:"20px 20px" }}>
<div style={{ fontSize:20, color:"#c9a84c", marginBottom:8 }}>{ch.icon} {ch.title}</div>
<div style={base.divider} />
<div style={{ fontSize:14, color:"#8a7a5a", lineHeight:1.9, whiteSpace:"pre-line", marginTop:12, fontStyle:"italic" }}>{ch.text}</div>
<div style={{ display:"flex", justifyContent:"space-between", marginTop:24 }}>
<button style={base.ghost} onClick={function() { if (idx > 0) setIdx(idx - 1); }}>Prev</button>
<button style={base.ghost} onClick={function() { if (idx < HOW_TO.length - 1) setIdx(idx + 1); }}>Next</button>
</div>
</div>
</div>
</div>
);
}

// — CHARACTER SHEETS ———————————————————
function CharSheets({ back }) {
var s = useState(ALL_CHARS[0]); var active = s[0]; var setActive = s[1];
var info = CHAR_INFO[active];
var skills = CHAR_SKILLS[active];
return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={back}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>CHARACTER DOSSIERS</div>
</div>
<div style={{ display:"flex", flex:1, overflow:"hidden" }}>
<div style={{ width:130, borderRight:"1px solid #1a1000", overflowY:"auto", padding:"8px 0" }}>
{ALL_CHARS.map(function(c) {
var inf = CHAR_INFO[c];
return (
<div key={c} style={{ padding:"8px 10px", cursor:"pointer", borderLeft:"2px solid " + (active === c ? inf.color : "transparent"), background: active === c ? inf.color + "11" : "transparent" }} onClick={function() { setActive(c); }}>
<div style={{ fontSize:18 }}>{inf.icon}</div>
<div style={{ fontSize:7, color: active === c ? inf.color : "#3a2a10", letterSpacing:1, marginTop:2 }}>{c}</div>
</div>
);
})}
</div>
<div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
<div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
<div style={{ fontSize:40 }}>{info.icon}</div>
<div>
<div style={{ fontSize:18, color: info.color, letterSpacing:2 }}>{active}</div>
<div style={{ fontSize:12, color:"#5a4a2a", fontStyle:"italic" }}>"{info.tag}"</div>
</div>
</div>
<div style={base.divider} />
<div style={{ fontSize:9, color:"#3a2a10", letterSpacing:2, margin:"12px 0 8px" }}>SPECIALISATIONS</div>
{skills.map(function(sk, i) {
return (
<div key={i} style={{ background:"rgba(0,0,0,0.4)", border:"1px solid " + info.color + "33", borderLeft:"3px solid " + info.color, borderRadius:"0 4px 4px 0", padding:"10px 12px", marginBottom:10 }}>
<div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
<span style={{ fontSize:11, color: info.color, fontWeight:"bold" }}>{sk.name}</span>
<span style={{ fontSize:9, color: sk.type === "Δ" ? "#c9a84c" : "#7ec8e3", background:"#111", border:"1px solid #333", borderRadius:2, padding:"1px 5px" }}>{sk.type}</span>
<span style={{ fontSize:9, color:"#3a2a10", background:"#0a0806", border:"1px solid #1a1000", borderRadius:2, padding:"1px 5px" }}>x{sk.limit}</span>
</div>
<div style={{ fontSize:12, color:"#7a6a4a", lineHeight:1.7, fontStyle:"italic" }}>{sk.desc}</div>
</div>
);
})}
<div style={{ fontSize:10, color:"#2a1a00", fontStyle:"italic", textAlign:"center", marginTop:16 }}>Δ = Cast (costs turn) . Φ = Passive (auto-triggers)</div>
</div>
</div>
</div>
);
}

// — PROFILE ——————————————————————
var AVATARS = [“🎭”,“🗡️”,“🔮”,“💀”,“🌿”,”(scale)️”,“🎨”,“🩺”,“💣”,“👁️”,“🦴”,“🌙”];
function Profile({ store, back }) {
var n = useState(””); var name = n[0]; var setName = n[1];
var l = useState(null); var loaded = l[0]; var setLoaded = l[1];
function load() {
if (!name.trim()) return;
setLoaded(store.get(name.trim()));
}
function setAv(a) { store.save(name, { avatar: a }); setLoaded(store.get(name)); }
function doClean() {
var ok = store.cleanse(name);
if (ok) setLoaded(store.get(name));
else alert(“Not enough coins! Need 10.”);
}
return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={back}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>PROFILE</div>
</div>
<div style={{ maxWidth:480, margin:"0 auto", padding:20, width:"100%", display:"flex", flexDirection:"column", gap:12 }}>
<div style={{ display:"flex", gap:8 }}>
<input style={base.input} value={name} placeholder="Enter your name" onChange={function(e) { setName(e.target.value); }} />
<button style={base.btn} onClick={load}>LOAD</button>
</div>
{loaded && (
<div style={{ display:"flex", flexDirection:"column", gap:10 }}>
<div style={{ ...base.card, textAlign:"center" }}>
<div style={{ fontSize:48 }}>{loaded.avatar || "🎭"}</div>
<div style={{ fontSize:18, color:"#c9a84c", marginTop:4 }}>{loaded.name}</div>
<div style={{ fontSize:13, color:"#5a4a2a", marginTop:2 }}>💰 {loaded.coins || 0} coins</div>
{loaded.insanity && (
<div style={{ background:"#0e0820", border:"1px solid #2a1a40", borderRadius:4, padding:"8px", marginTop:10 }}>
<div style={{ fontSize:10, color:"#c084fc", fontWeight:"bold" }}>AFFLICTION: {loaded.insanity}</div>
<div style={{ fontSize:11, color:"#5a4a7a", fontStyle:"italic", marginTop:2 }}>{INSANITY_DESC[loaded.insanity]}</div>
<button style={{ ...base.btn, marginTop:8, width:"100%", fontSize:10 }} onClick={doClean}>🏥 Cleansing Soul - 10 coins</button>
</div>
)}
{!loaded.insanity && <div style={{ fontSize:11, color:"#2a3a2a", fontStyle:"italic", marginTop:6 }}>Mind is clear.</div>}
</div>
<div style={base.card}>
<div style={base.tag}>CHOOSE AVATAR</div>
<div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center" }}>
{AVATARS.map(function(a) {
return <div key={a} style={{ fontSize:22, cursor:"pointer", padding:6, borderRadius:4, border:"1px solid " + (loaded.avatar === a ? "#c9a84c" : "#1a1000"), background: loaded.avatar === a ? "#1a1500" : "transparent" }} onClick={function() { setAv(a); }}>{a}</div>;
})}
</div>
</div>
</div>
)}
</div>
</div>
);
}

// — VS AI SETUP –––––––––––––––––––––––––––––––
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
bans = bans.concat([avail[Math.floor(Math.random() * avail.length)]]);
}
setBanned(bans); setStep(“PICK”);
}
function doPick(c) {
var prof = store.get(pname);
var taken = [c]; var aipicks = [];
for (var i = 0; i < aiCount; i++) {
var avail = ALL_CHARS.filter(function(x) { return banned.indexOf(x) === -1 && taken.indexOf(x) === -1; });
var p = avail[Math.floor(Math.random() * avail.length)];
aipicks.push(p); taken.push(p);
}
var players = [{ name: pname, char: c, isHuman: true, insanity: prof.insanity }];
for (var i = 0; i < aipicks.length; i++) players.push({ name: “AI “ + (i + 1), char: aipicks[i], isHuman: false, insanity: null });
start({ mode: “VS_AI”, players: players, total: total });
}

if (step === “COUNT”) return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={back}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>VS AI</div>
</div>
<div style={base.center}>
<div style={{ fontSize:12, color:"#3a2a10", letterSpacing:2 }}>HOW MANY AI OPPONENTS?</div>
<div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
{[1,2,3,4].map(function(n) {
return <div key={n} style={{ width:80, padding:"12px 8px", borderRadius:5, cursor:"pointer", textAlign:"center", border:"1px solid " + (aiCount === n ? "#c9a84c" : "#1e1500"), background: aiCount === n ? "#1a1500" : "#0f0c08", color: aiCount === n ? "#c9a84c" : "#3a2a10" }} onClick={function() { setAiCount(n); }}>
<div style={{ fontSize:20, fontWeight:"bold" }}>1v{n}</div>
<div style={{ fontSize:9, marginTop:2 }}>{n} AI{n > 1 ? "s" : ""}</div>
</div>;
})}
</div>
<input style={{ ...base.input, maxWidth:280, textAlign:"center" }} value={pname} placeholder="Your name" onChange={function(e) { setPname(e.target.value); }} />
<button style={base.btn} onClick={function() { setBanned([]); setStep("BAN"); }}>START BANNING</button>
</div>
</div>
);

var availBan = ALL_CHARS.filter(function(c) { return banned.indexOf(c) === -1; });
if (step === “BAN”) return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={function() { setStep("COUNT"); }}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>YOUR BAN</div>
</div>
<div style={{ overflowY:"auto", flex:1, padding:16 }}>
<div style={{ fontSize:10, color:"#3a2a10", fontStyle:"italic", marginBottom:12, textAlign:"center" }}>Ban one character. AI will ban the rest automatically.</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8 }}>
{availBan.map(function(c) { return <CharCardSmall key={c} c={c} onClick={function() { doBan(c); }} />; })}
</div>
{banned.length > 0 && <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:12, justifyContent:"center" }}>{banned.map(function(c) { return <span key={c} style={{ fontSize:9, color:"#8b1a1a", border:"1px solid #3a1a1a", borderRadius:2, padding:"2px 7px" }}>{c}</span>; })}</div>}
</div>
</div>
);

var availPick = ALL_CHARS.filter(function(c) { return banned.indexOf(c) === -1; });
return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={function() { setStep("BAN"); }}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>YOUR CHARACTER</div>
</div>
<div style={{ overflowY:"auto", flex:1, padding:16 }}>
<div style={{ fontSize:10, color:"#3a2a10", fontStyle:"italic", marginBottom:12, textAlign:"center" }}>Choose wisely. AI picks after you.</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8 }}>
{availPick.map(function(c) { return <CharCardSmall key={c} c={c} onClick={function() { doPick(c); }} />; })}
</div>
</div>
</div>
);
}

// — ONLINE SETUP ———————————————————––
function OnlineSetup({ store, back, start }) {
var st = useState(“COUNT”); var step = st[0]; var setStep = st[1];
var pc = useState(2); var pcount = pc[0]; var setPcount = pc[1];
var ns = useState([“Player 1”,“Player 2”,“Player 3”,“Player 4”,“Player 5”]); var names = ns[0]; var setNames = ns[1];
var bc = useState([]); var banned = bc[0]; var setBanned = bc[1];
var bcc = useState(0); var banCount = bcc[0]; var setBanCount = bcc[1];
var cp = useState(0); var cpp = cp[0]; var setCpp = cp[1];
var pk = useState({}); var picked = pk[0]; var setPicked = pk[1];

function doBan(c) {
var nb = banned.concat([c]); var nc = banCount + 1;
setBanned(nb); setBanCount(nc);
if (nc < pcount) setCpp((cpp + 1) % pcount);
else { setCpp(0); setPicked({}); setStep(“PICK”); }
}
function doPick(c) {
var np = {}; for (var k in picked) np[k] = picked[k]; np[cpp] = c;
setPicked(np);
if (Object.keys(np).length < pcount) {
var nx = (cpp + 1) % pcount;
while (np[nx] !== undefined) nx = (nx + 1) % pcount;
setCpp(nx);
} else {
var players = names.slice(0, pcount).map(function(nm, i) {
var prof = store.get(nm);
return { name: nm, char: np[i], isHuman: true, insanity: prof.insanity };
});
start({ mode: “ONLINE”, players: players, total: pcount });
}
}

if (step === “COUNT”) return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={back}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>ONLINE MULTIPLAYER</div>
</div>
<div style={base.center}>
<div style={{ fontSize:12, color:"#3a2a10", letterSpacing:2 }}>NUMBER OF PLAYERS</div>
<div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center" }}>
{[2,3,4,5].map(function(n) {
return <div key={n} style={{ width:70, padding:"12px 8px", borderRadius:5, cursor:"pointer", textAlign:"center", border:"1px solid " + (pcount === n ? "#7ec8e3" : "#1e1500"), background: pcount === n ? "#06151a" : "#0f0c08", color: pcount === n ? "#7ec8e3" : "#3a2a10" }} onClick={function() { setPcount(n); }}>
<div style={{ fontSize:20, fontWeight:"bold" }}>{n}</div>
</div>;
})}
</div>
<div style={{ display:"flex", flexDirection:"column", gap:6, width:"100%", maxWidth:300 }}>
{names.slice(0, pcount).map(function(nm, i) {
return <input key={i} style={base.input} value={nm} placeholder={"Player " + (i+1)} onChange={function(e) { var a = names.slice(); a[i] = e.target.value; setNames(a); }} />;
})}
</div>
<button style={{ ...base.btn, background:"#5a8a9a", color:"#080808" }} onClick={function() { setBanned([]); setBanCount(0); setCpp(0); setStep("BAN"); }}>START BANNING</button>
</div>
</div>
);

var availBan = ALL_CHARS.filter(function(c) { return banned.indexOf(c) === -1; });
if (step === “BAN”) return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={function() { setStep("COUNT"); }}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>{names[cpp]}'s BAN ({banCount}/{pcount})</div>
</div>
<div style={{ overflowY:"auto", flex:1, padding:16 }}>
<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8 }}>
{availBan.map(function(c) { return <CharCardSmall key={c} c={c} onClick={function() { doBan(c); }} />; })}
</div>
<div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:12, justifyContent:"center" }}>{banned.map(function(c) { return <span key={c} style={{ fontSize:9, color:"#8b1a1a", border:"1px solid #3a1a1a", borderRadius:2, padding:"2px 7px" }}>{c}</span>; })}</div>
</div>
</div>
);

var availPick = ALL_CHARS.filter(function(c) { return banned.indexOf(c) === -1 && Object.values(picked).indexOf(c) === -1; });
return (

<div style={base.root}>
<div style={{ display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #1a1000", gap:12 }}>
<button style={base.ghost} onClick={function() { setStep("BAN"); }}>Back</button>
<div style={{ flex:1, textAlign:"center", fontSize:12, letterSpacing:3, color:"#c9a84c" }}>{names[cpp]}'s PICK ({Object.keys(picked).length}/{pcount})</div>
</div>
<div style={{ overflowY:"auto", flex:1, padding:16 }}>
<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8 }}>
{availPick.map(function(c) { return <CharCardSmall key={c} c={c} onClick={function() { doPick(c); }} />; })}
</div>
<div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:12, justifyContent:"center" }}>{Object.entries(picked).map(function(e) { return <span key={e[0]} style={{ fontSize:9, color:"#4caf50", border:"1px solid #1a3a1a", borderRadius:2, padding:"2px 7px" }}>{names[e[0]]}: {e[1]}</span>; })}</div>
</div>
</div>
);
}

// — GAME ———————————————————————
function Game({ cfg, store, exit }) {
var isAI = cfg.mode === “VS_AI”;
var PCOUNT = cfg.total;

var initP = cfg.players.map(function(p, i) { return makePlayer(p.name, p.char, i, p.isHuman, p.insanity); });
var ps = useState(initP); var players = ps[0]; var setPlayers = ps[1];
var rs = useState(function() { return genRooms(PCOUNT); }); var rooms = rs[0]; var setRooms = rs[1];
var ts = useState(0); var turn = ts[0]; var setTurn = ts[1];
var ls = useState([]); var log = ls[0]; var setLog = ls[1];
var sel = useState(-1); var selRoom = sel[0]; var setSelRoom = sel[1];
var ph = useState(“PLAY”); var phase = ph[0]; var setPhase = ph[1];
var ws = useState([]); var winners = ws[0]; var setWinners = ws[1];
var ms = useState(null); var modal = ms[0]; var setModal = ms[1];
var ait = useState(false); var aiThink = ait[0]; var setAiThink = ait[1];
var nt = useState(””); var notif = nt[0]; var setNotif = nt[1];
var humanIdx = isAI ? 0 : -1;
var aiRef = useRef(null);

var addLog = useCallback(function(msg, type) {
setLog(function(prev) { return prev.slice(-80).concat([{ msg: msg, type: type || “info”, id: Date.now() + Math.random() }]); });
}, []);

var isMyTurn = isAI ? (players[turn] && players[turn].isHuman) : true;

useEffect(function() {
if (phase !== “PLAY” || !isAI) return;
var cp = players[turn];
if (!cp || cp.isHuman || !cp.alive) return;
setAiThink(true);
aiRef.current = setTimeout(function() {
setAiThink(false);
doAiTurn(players, rooms);
}, 1200);
return function() { clearTimeout(aiRef.current); };
}, [turn, phase]);

function nextTurn(P, from) {
var base = from !== undefined ? from : turn;
var next = (base + 1) % PCOUNT;
var tries = 0;
while (P[next] && !P[next].alive && tries < PCOUNT) { next = (next + 1) % PCOUNT; tries++; }
setTurn(next);
if (!isAI || (P[next] && P[next].isHuman)) addLog(”– “ + P[next].name + “’s turn –”, “turn”);
}

function checkEnd(P, R) {
var allOpen = R.every(function(r) { return r.opened; });
if (isAI) {
var human = P[humanIdx];
if (!human || !human.alive) { endGame(P); return true; }
var anyAiAlive = P.some(function(p) { return !p.isHuman && p.alive; });
if (!anyAiAlive) { endGame(P); return true; }
}
var alive = P.filter(function(p) { return p.alive; });
if (alive.length <= 1 || allOpen) { endGame(P); return true; }
return false;
}

function endGame(P) {
var final = P.map(function(p) { return Object.assign({}, p); });
// Seller curse
for (var i = 0; i < final.length; i++) {
if (final[i].character === “THE SELLER” && final[i].alive && final[i].coins >= 7) {
final[i].coins -= 7;
}
}
// Fake Justice payout
var li = -1;
for (var i = 0; i < final.length; i++) {
if (final[i].character === “THE LAWYER” && final[i].alive && final[i].fakeJusticeTarget >= 0) { li = i; break; }
}
if (li >= 0) {
var ti = final[li].fakeJusticeTarget;
if (final[ti] && final[ti].alive) {
final[ti].coins = Math.max(0, final[ti].coins - 5);
final[li].coins += 5;
}
}
// Persist human
if (isAI) {
var h = final[humanIdx];
if (h) {
if (h.alive) store.addCoins(h.name, h.coins);
store.setIns(h.name, h.insanity);
}
}
if (!isAI) { setPhase(“ONLINE_END”); return; }
final.sort(function(a, b) { return b.coins - a.coins; });
setWinners(final); setPhase(“END”);
addLog(“Game over!”, “system”);
}

function doAiTurn(P, R) {
var cp = P[turn];
if (!cp || !cp.alive) { nextTurn(P); return; }
var rid = aiRoom(cp, R);
if (rid < 0) { nextTurn(P); return; }
setNotif(cp.name + “ opens Room “ + rid + “…”);
setTimeout(function() { setNotif(””); }, 900);
openRoomLogic(rid, P, R);
}

function openRoomLogic(roomId, P, R) {
var ri = roomId - 1;
var newR = R.map(function(r) { return Object.assign({}, r); });
if (newR[ri].opened) return;
var newP = P.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, newP[turn]);
if (!cp.alive) { nextTurn(newP); return; }
var extra = false;
var ec = effChar(cp);
newR[ri].opened = true;

// Bomb
var agIdx = -1;
for (var i = 0; i < newP.length; i++) { if (newP[i].character === “THE AGENT” && newP[i].alive) { agIdx = i; break; } }
var ag = agIdx >= 0 ? Object.assign({}, newP[agIdx]) : null;
if (ag && ag.bombRoom === roomId) {
cp.life = Math.max(0, cp.life - 7);
addLog(“💣 BOOM! “ + cp.name + “ -7 Life”, “event”);
ag.bombRoom = -1;
}

// Poison
if (newR[ri].poison > 0) {
var ownPoison = (newR[ri].poisonOwner === turn && cp.character === “THE BOTANIST”);
if (!ownPoison) {
var pdmg = newR[ri].poison * 2;
cp.life = Math.max(0, cp.life - pdmg);
addLog(“X️ Poison! “ + cp.name + “ -” + pdmg + “ Life”, “event”);
}
newR[ri].poison = 0; newR[ri].poisonOwner = -1;
}

if (newR[ri].type === “coins”) {
if (cp.insanity === “Conceit”) {
addLog(“Conceit: “ + cp.name + “ takes nothing.”, “event”);
} else {
cp.coins += 1;
addLog(“💰 “ + cp.name + “ +1 coin (” + cp.coins + “)”, “event”);
if (cp.character === “THE PAINTER”) cp.coloringBoxes = (cp.coloringBoxes || 0) + 1;
if (ec === “THE SINNER”) extra = true;
if (ec === “THE UNSTABLE” && cp.persona === “Maria”) {
cp.mariaCoins = (cp.mariaCoins || 0) + 1;
if (cp.mariaCoins >= 2) {
cp.persona = “Emily”; cp.sanity = Math.max(0, cp.sanity - 5); cp.mariaCoins = 0;
addLog(“👁️ Maria->Emily. Sanity -5”, “event”);
}
}
}
if (cp.insanity === “Lavish”) { cp.coins = Math.max(0, cp.coins - 2); addLog(“💸 Lavish! -2 coins”, “event”); }
if (cp.character === “THE PAINTER” && cp.disguisedAs) { cp.sanity = Math.min(MAX_SANITY, cp.sanity + 1); }
} else {
var isMas = newR[ri].type === “masacree”;
if (ec === “THE UNSTABLE” && cp.persona === “Emily”) {
cp.persona = “Maria”; cp.mariaCoins = 0;
addLog(“🔀 Emily->Maria! Immune.”, “event”);
} else if (ec === “THE UNSTABLE” && cp.persona === “Maria”) {
addLog(”(swords)️ Maria immune!”, “event”);
} else if (ec === “THE HUNTER” && (cp.skills[“Eyes on Prey”] || 0) > 0) {
cp.skills[“Eyes on Prey”] -= 1;
addLog(“🎯 Eyes on Prey! (” + cp.skills[“Eyes on Prey”] + “ left)”, “event”);
} else if (isMas) {
var dmg = cp.insanity === “Masochist” ? 4 : 2;
cp.life = Math.max(0, cp.life - dmg);
addLog(“🪓 Masacree! -” + dmg + “ Life”, “event”);
} else {
if (cp.immune) {
cp.immune = false;
addLog(“🛡️ Dimensional immune!”, “event”);
} else if (ec === “THE LAWYER” && (cp.skills[“Negotiator”] || 0) > 0) {
// Show negotiate popup - pause execution
newP[turn] = cp;
if (ag && agIdx >= 0) newP[agIdx] = ag;
setPlayers(newP); setRooms(newR);
setModal({
type: “NEGOTIATE”, isAI: !cp.isHuman,
onYes: function() {
var P2 = newP.map(function(p) { return Object.assign({}, p); });
P2[turn].skills[“Negotiator”] -= 1;
addLog(”(scale)️ Negotiated! Sanity blocked.”, “event”);
setModal(null);
finishRoom(roomId, P2, newR, extra);
},
onNo: function() {
var P2 = newP.map(function(p) { return Object.assign({}, p); });
P2[turn].sanity = Math.min(MAX_SANITY, P2[turn].sanity + 2);
addLog(“🌀 Refused. Sanity +2”, “event”);
setModal(null);
finishRoom(roomId, P2, newR, extra);
}
});
return;
} else {
cp.sanity = Math.min(MAX_SANITY, cp.sanity + 2);
addLog(“🌀 Dimensional! Sanity +2 (” + cp.sanity + “/” + MAX_SANITY + “)”, “event”);
}
}
if (ec === “THE HUNTER”) { cp.coins += 2; addLog(“🏆 Trophy! +2 coins”, “event”); }
if (ec === “THE CLAIRVOYANT” && (cp.skills[“Third Eyes”] || 0) > 0) {
cp.skills[“Third Eyes”] -= 1;
var gr = newR.filter(function(r) { return !r.opened && (r.type === “masacree” || r.type === “dimensional”); }).slice(0, 6);
var rev = Object.assign({}, cp.revealed);
gr.forEach(function(r) { rev[r.id] = r.type; });
cp.revealed = rev;
addLog(“👁️ Third Eyes! “ + gr.length + “ rooms revealed.”, “event”);
}
if (ec === “THE UNSTABLE” && cp.persona === “Maria”) { cp.sanity = Math.min(MAX_SANITY, cp.sanity + 2); }
if (cp.character === “THE BOTANIST”) {
var l = roomId - 1; var r2 = roomId + 1;
if (l >= 1) { newR[l-1].poison = Math.min(2, (newR[l-1].poison || 0) + 1); newR[l-1].poisonOwner = turn; }
if (r2 <= newR.length) { newR[r2-1].poison = Math.min(2, (newR[r2-1].poison || 0) + 1); newR[r2-1].poisonOwner = turn; }
addLog(“🌿 Poison spreads!”, “event”);
}
if (cp.character === “THE PAINTER” && cp.disguisedAs) { cp.sanity = Math.min(MAX_SANITY, cp.sanity + 1); }
}

if (ec === “THE SINNER” && (newR[ri].type !== “coins” || cp.insanity === “Conceit”)) extra = false;
newP[turn] = cp;
if (ag && agIdx >= 0) newP[agIdx] = ag;
finishRoom(roomId, newP, newR, extra);

}

function finishRoom(roomId, newP, newR, extra) {
var cp = Object.assign({}, newP[turn]);
// Insanity check
if (cp.sanity >= MAX_SANITY && !cp.insanity) {
cp.insanity = rollInsanity();
addLog(“😱 INSANITY: [” + cp.insanity + “]!”, “event”);
}
// Doctor Bound to Oath
var docIdx = -1;
for (var i = 0; i < newP.length; i++) { if (newP[i].character === “THE DOCTOR” && newP[i].alive && i !== turn) { docIdx = i; break; } }
if (docIdx >= 0 && cp.life === 2 && (newP[docIdx].skills[“Bound to Oath”] || 0) > 0 && cp.coins >= 1) {
var doc = Object.assign({}, newP[docIdx]);
doc.skills[“Bound to Oath”] -= 1;
cp.life = Math.min(MAX_LIFE, cp.life + 2);
cp.coins -= 1; doc.coins += 1;
newP[docIdx] = doc;
addLog(“💊 Bound to Oath! +2 Life”, “event”);
}
// Care Pack
if (cp.character === “THE DOCTOR” && cp.life === 2 && (cp.skills[“Care Pack”] || 0) > 0) {
cp.skills[“Care Pack”] -= 1; cp.life = MAX_LIFE;
addLog(“💉 Care Pack! Restored.”, “event”);
}
// Fake Justice
var lawIdx = -1;
for (var i = 0; i < newP.length; i++) { if (newP[i].character === “THE LAWYER” && newP[i].alive) { lawIdx = i; break; } }
if (lawIdx >= 0 && newP[lawIdx].fakeJusticeTarget === turn && cp.life <= 4 && cp.life > 0) {
var tot = 0;
for (var i = 0; i < newP.length; i++) { if (i !== turn && newP[i].alive) { tot += newP[i].sanity; newP[i] = Object.assign({}, newP[i], { sanity: 0, insanity: null }); } }
cp.sanity = Math.min(MAX_SANITY, tot);
if (cp.sanity >= MAX_SANITY && !cp.insanity) cp.insanity = rollInsanity();
cp.life = Math.min(cp.life + 5, MAX_LIFE + 3);
var law = Object.assign({}, newP[lawIdx]); law.fakeJusticeTarget = -1; newP[lawIdx] = law;
addLog(”(scale)️ Fake Justice triggers!”, “event”);
}
// Death
if (cp.life <= 0) {
cp.alive = false;
var agIdx2 = -1;
for (var i = 0; i < newP.length; i++) { if (newP[i].character === “THE AGENT” && newP[i].alive) { agIdx2 = i; break; } }
if (agIdx2 >= 0) {
var sc = newP[agIdx2].spyCamRooms || [];
if (sc.indexOf(roomId) >= 0) {
var ag2 = Object.assign({}, newP[agIdx2]); ag2.coins += cp.coins; newP[agIdx2] = ag2;
addLog(“🕵️ Agent inherits coins!”, “event”);
}
}
cp.coins = 0;
addLog(“💀 “ + cp.name + “ dies.”, “event”);
}
newP[turn] = cp;
setPlayers(newP); setRooms(newR); setSelRoom(-1);
if (checkEnd(newP, newR)) return;
if (!extra) nextTurn(newP);
else if (!newP[turn].isHuman && isAI) setTimeout(function() { doAiTurn(newP, newR); }, 800);
}

function openRoom(rid) {
if (phase !== “PLAY”) return;
if (isAI && !(players[turn] && players[turn].isHuman)) return;
openRoomLogic(rid, players, rooms);
}

// Active skills
function useSelfTherapy() {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = P[turn];
if (cp.insanity === “Boast”) return addLog(“Boast prevents this!”, “warn”);
cp.skills[“Self-Therapy”] = 0; cp.sanity = 0; cp.insanity = null; cp.immune = true;
P[turn] = cp; setPlayers(P); addLog(“💊 Self-Therapy used.”, “event”); nextTurn(P);
}
function confirmSpyCam(picks) {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, P[turn]);
var rev = Object.assign({}, cp.revealed);
picks.forEach(function(id) { var r = rooms.find(function(x) { return x.id === id; }); if (r) rev[id] = r.type; });
cp.skills[“Spy Camera”] = 0; cp.spyCamRooms = picks; cp.revealed = rev;
P[turn] = cp; setPlayers(P); addLog(“📷 Cameras: “ + picks.join(”, “), “event”); setModal(null); nextTurn(P);
}
function confirmBomb(rid) {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, P[turn]);
cp.skills[“Trap Wire Bomb”] = 0; cp.bombRoom = rid;
P[turn] = cp; setPlayers(P); addLog(“💣 Bomb in Room “ + rid, “event”); setModal(null); nextTurn(P);
}
function confirmFJ(tid) {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, P[turn]);
var ti = -1; for (var i = 0; i < P.length; i++) { if (P[i].id === tid) { ti = i; break; } }
cp.skills[“Fake Justice”] = 0; cp.fakeJusticeTarget = ti;
if (ti >= 0 && P[ti].life <= 4) {
var tot = 0; for (var i = 0; i < P.length; i++) { if (i !== ti && P[i].alive) { tot += P[i].sanity; P[i] = Object.assign({}, P[i], { sanity: 0, insanity: null }); } }
P[ti] = Object.assign({}, P[ti], { sanity: Math.min(MAX_SANITY, tot), life: Math.min(P[ti].life + 5, MAX_LIFE + 3) });
cp.fakeJusticeTarget = -1;
}
P[turn] = cp; setPlayers(P); addLog(”(scale)️ Fake Justice: “ + (P[ti] ? P[ti].name : “?”), “event”); setModal(null); nextTurn(P);
}
function confirmTrade(buyerId, mode, amt) {
var P = players.map(function(p) { return Object.assign({}, p); });
var bi = -1; for (var i = 0; i < P.length; i++) { if (P[i].id === buyerId) { bi = i; break; } }
var seller = Object.assign({}, P[turn]); var buyer = Object.assign({}, P[bi]);
if (mode === “buyLife”) {
if (buyer.coins < amt) return addLog(“Not enough coins!”, “warn”);
buyer.coins -= amt; buyer.life = Math.min(MAX_LIFE + 3, buyer.life + amt * 2); seller.coins += amt;
} else {
if (buyer.life <= amt) return addLog(“Not enough Life!”, “warn”);
buyer.life -= amt; buyer.coins += amt * 2; seller.coins = Math.max(0, seller.coins - amt * 2);
}
P[turn] = seller; P[bi] = buyer; setPlayers(P); setModal(null); addLog(“🛒 Trade done.”, “event”); nextTurn(P);
}
function confirmDisguise(tid) {
var P = players.map(function(p) { return Object.assign({}, p); });
var target = null; for (var i = 0; i < P.length; i++) { if (P[i].id === tid) { target = P[i]; break; } }
if (!target) return;
var cp = Object.assign({}, P[turn]);
var fresh = makePlayer(”_”, target.character, 99);
var dLeft = (cp.skills[“Disguise”] || 1) - 1;
var dmLeft = cp.skills[“Drop Mask”] || 0;
cp.skills = Object.assign({}, fresh.skills, { Disguise: dLeft, “Drop Mask”: dmLeft });
cp.coloringBoxes -= 10; cp.disguisedAs = target.character;
P[turn] = cp; setPlayers(P); setModal(null); addLog(“🎭 Disguised as “ + target.character, “event”); nextTurn(P);
}
function useDropMask() {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, P[turn]);
if (cp.insanity === “Boast”) return addLog(“Boast prevents this!”, “warn”);
cp.skills[“Drop Mask”] -= 1; cp.disguisedAs = null;
cp.skills = { Disguise: cp.skills[“Disguise”] || 0, “Drop Mask”: cp.skills[“Drop Mask”] };
P[turn] = cp; setPlayers(P); addLog(“🎭 Mask dropped.”, “event”); nextTurn(P);
}
function confirmMindHavoc(targets) {
var P = players.map(function(p) { return Object.assign({}, p); });
var cp = Object.assign({}, P[turn]);
cp.skills[“Mind Havoc”] = (cp.skills[“Mind Havoc”] || 1) - 1;
P[turn] = cp; setPlayers(P); setModal(null);
addLog(“🧿 Mind Havoc!”, “event”);
showHijack(targets, 0, P, rooms.map(function(r) { return Object.assign({}, r); }));
}
function showHijack(targets, idx, P, R) {
if (idx >= targets.length) { if (!checkEnd(P, R)) nextTurn(P); return; }
var tid = targets[idx];
var pi = -1; for (var i = 0; i < P.length; i++) { if (P[i].id === tid) { pi = i; break; } }
if (pi < 0 || !P[pi].alive) { showHijack(targets, idx + 1, P, R); return; }
var clRev = (P[turn] && P[turn].revealed) ? P[turn].revealed : {};
setModal({
type: “HIJACK”, player: P[pi], rooms: R, clRev: clRev,
onPick: function(rid) {
setModal(null);
execHijack(P, R, pi, rid, targets, idx);
}
});
}
function execHijack(P, R, pi, roomId, targets, idx) {
var ri = roomId - 1;
var newR = R.map(function(r) { return Object.assign({}, r); });
if (!newR[ri] || newR[ri].opened) { showHijack(targets, idx + 1, P, newR); return; }
var newP = P.map(function(p) { return Object.assign({}, p); });
var tp = Object.assign({}, newP[pi]);
var tec = effChar(tp);
newR[ri].opened = true;
addLog(“🧿 “ + tp.name + “ -> Room “ + roomId, “event”);
if (newR[ri].type === “coins” && tp.insanity !== “Conceit”) {
tp.coins += 1; if (tp.insanity === “Lavish”) tp.coins = Math.max(0, tp.coins - 2);
} else if (newR[ri].type === “masacree”) {
if (tec === “THE HUNTER”) { tp.coins += 2; if ((tp.skills[“Eyes on Prey”] || 0) > 0) tp.skills[“Eyes on Prey”] -= 1; else tp.life = Math.max(0, tp.life - (tp.insanity === “Masochist” ? 4 : 2)); }
else if (!(tec === “THE UNSTABLE” && tp.persona === “Maria”)) { tp.life = Math.max(0, tp.life - (tp.insanity === “Masochist” ? 4 : 2)); }
} else if (newR[ri].type === “dimensional” && !tp.immune && tec !== “THE UNSTABLE”) {
if (tec === “THE LAWYER” && (tp.skills[“Negotiator”] || 0) > 0) tp.skills[“Negotiator”] -= 1;
else { tp.sanity = Math.min(MAX_SANITY, tp.sanity + 2); if (tp.sanity >= MAX_SANITY && !tp.insanity) tp.insanity = rollInsanity(); }
}
if (tp.life <= 0) { tp.alive = false; tp.coins = 0; addLog(“💀 “ + tp.name + “ dies!”, “event”); }
newP[pi] = tp; setPlayers(newP); setRooms(newR);
if (checkEnd(newP, newR)) return;
showHijack(targets, idx + 1, newP, newR);
}

function skillBtns(p, i) {
if (i !== turn || !p.alive) return null;
if (isAI && !p.isHuman) return null;
var b = p.insanity === “Boast”; var btns = [];
if (p.character === “THE DOCTOR” && (p.skills[“Self-Therapy”] || 0) > 0) btns.push(<button key=“st” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={useSelfTherapy}>💊 Self-Therapy</button>);
if (p.character === “THE AGENT”) {
if ((p.skills[“Spy Camera”] || 0) > 0) btns.push(<button key=“sc” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={function() { setModal({ type:“SPY_CAM” }); }}>📷 Spy Camera</button>);
if ((p.skills[“Trap Wire Bomb”] || 0) > 0) btns.push(<button key=“tb” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={function() { setModal({ type:“BOMB” }); }}>💣 Plant Bomb</button>);
}
if (p.character === “THE CLAIRVOYANT” && (p.skills[“Mind Havoc”] || 0) > 0) btns.push(<button key=“mh” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={function() { setModal({ type:“MIND_HAVOC”, eligible: players.filter(function(x) { return x.alive && x.id !== p.id; }) }); }}>🧿 Mind Havoc x{p.skills[“Mind Havoc”]}</button>);
if (p.character === “THE LAWYER” && (p.skills[“Fake Justice”] || 0) > 0) btns.push(<button key=“fj” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={function() { setModal({ type:“FAKE_JUSTICE”, eligible: players.filter(function(x) { return x.alive && x.id !== p.id; }) }); }}>(scale)️ Fake Justice</button>);
if (p.character === “THE SELLER”) btns.push(<button key=“sol” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={function() { setModal({ type:“SOUL_TRADER”, eligible: players.filter(function(x) { return x.alive && x.id !== p.id; }) }); }}>🛒 Soul Trader</button>);
if (p.character === “THE PAINTER”) {
if ((p.skills[“Disguise”] || 0) > 0 && !p.disguisedAs) btns.push(<button key=“dis” style={{ …base.small, opacity: (b || (p.coloringBoxes || 0) < 10) ? 0.3 : 1 }} disabled={b || (p.coloringBoxes || 0) < 10} onClick={function() { setModal({ type:“DISGUISE”, eligible: players.filter(function(x) { return x.alive && x.id !== p.id; }) }); }}>🎭 Disguise ({p.coloringBoxes || 0}/10)</button>);
if (p.disguisedAs && (p.skills[“Drop Mask”] || 0) > 0) btns.push(<button key=“dm” style={{ …base.small, opacity: b ? 0.3 : 1 }} disabled={b} onClick={useDropMask}>🚫 Drop Mask x{p.skills[“Drop Mask”]}</button>);
}
return btns.length > 0 ? <div style={{ display:“flex”, flexDirection:“column”, gap:3, marginTop:6 }}>{btns}</div> : null;
}

if (phase === “ONLINE_END”) return (

<div style={base.root}><div style={base.center}>
<div style={{ fontSize:22, color:"#c9a84c", letterSpacing:3 }}>SESSION ENDED</div>
<div style={{ fontSize:12, color:"#5a4a2a", fontStyle:"italic" }}>Returning to menu.</div>
<button style={base.btn} onClick={exit}>BACK TO MENU</button>
</div></div>
);

if (phase === “END”) return (

<div style={base.root}><div style={{ maxWidth:480, margin:"0 auto", padding:24, display:"flex", flexDirection:"column", gap:12, alignItems:"center" }}>
<div style={{ fontSize:28, color:"#c9a84c", letterSpacing:4, marginTop:20 }}>GAME OVER</div>
<div style={base.divider} />
<div style={{ display:"flex", flexDirection:"column", gap:8, width:"100%" }}>
{winners.map(function(p, i) {
return (
<div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, background:"#0f0c08", border:"1px solid " + (i === 0 ? "#c9a84c44" : "#1a1000"), borderRadius:5, padding:"10px 14px", opacity: p.alive ? 1 : 0.45 }}>
<span style={{ fontSize:16, color: i === 0 ? "#c9a84c" : "#3a2a10", minWidth:24 }}>{i === 0 ? "👑" : "#" + (i+1)}</span>
<span style={{ flex:1, fontSize:13, color:"#8a7a5a" }}>{p.name} {p.isHuman && <span style={{ color:"#c9a84c66", fontSize:10 }}>(you)</span>}</span>
<span style={{ color:"#c9a84c", fontSize:12 }}>💰 {p.coins}</span>
{!p.alive && <span style={{ color:"#8b1a1a" }}>X</span>}
</div>
);
})}
</div>
<button style={{ ...base.btn, marginTop:8 }} onClick={exit}>MAIN MENU</button>
</div></div>
);

var cp = players[turn];
var hp = isAI ? players[humanIdx] : cp;
var myRev = (hp && hp.revealed) ? hp.revealed : {};
var isHumanAgent = hp && hp.character === “THE AGENT”;
var liveRooms = isHumanAgent ? (hp.spyCamRooms || []) : [];
var agentP = null;
for (var i = 0; i < players.length; i++) {
if (players[i].character === “THE AGENT” && players[i].alive) { agentP = players[i]; break; }
}

return (

<div style={base.root}>
  {/* TOP BAR */}
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid #1a1000", background:"#050402", flexShrink:0 }}>
    <div style={{ fontSize:12, letterSpacing:6, color:"#c9a84c" }}>THIEF</div>
    <div style={{ fontSize:10, color: isMyTurn ? "#c9a84c" : "#3a2a10", fontStyle:"italic" }}>
      {aiThink ? "thinking..." : isMyTurn ? "YOUR TURN" : (cp ? cp.name + "'s turn..." : "")}
    </div>
    <button style={base.ghost} onClick={exit}>MENU</button>
  </div>

{notif !== “” && <div style={{ padding:“5px 14px”, fontSize:10, color:”#3a2a10”, fontStyle:“italic”, textAlign:“center”, background:”#0c0a06” }}>{notif}</div>}

{/* SCROLLABLE SECTIONS */}

  <div style={{ flex:1, overflowY:"auto" }}>

```
{/* STATUS SECTION */}
<CollapsibleSection title="YOUR STATUS" defaultOpen={true} badge={hp ? ("HP:" + hp.life + " SAN:" + hp.sanity + " COINS:" + hp.coins) : ""}>
  {hp && (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:15, color:"#c9a84c", fontWeight:"bold" }}>{hp.name}</div>
          <div style={{ fontSize:10, color:"#3a2a10", fontStyle:"italic" }}>
            {hp.character}{hp.persona ? " [" + hp.persona + "]" : ""}{hp.disguisedAs ? " -> " + hp.disguisedAs : ""}
          </div>
        </div>
        <div style={{ fontSize:26 }}>{CHAR_INFO[hp.character] ? CHAR_INFO[hp.character].icon : "?"}</div>
      </div>
      <BarComp v={hp.life} max={hp.character === "THE SELLER" ? MAX_LIFE + 3 : MAX_LIFE} color="#8b1a1a" label="LIFE" />
      <BarComp v={hp.sanity} max={MAX_SANITY} color="#7a2a7a" label="SANITY" danger={true} />
      <div style={{ display:"flex", gap:16, alignItems:"center", marginTop:2 }}>
        <div style={{ fontSize:17, color:"#c9a84c" }}>coins: {hp.coins}</div>
        {hp.character === "THE PAINTER" && <div style={{ fontSize:12, color:"#3a2a10" }}>boxes: {hp.coloringBoxes || 0}/10</div>}
      </div>
      {hp.insanity && (
        <div style={{ background:"#0e0820", border:"1px solid #2a1a40", borderRadius:4, padding:"8px 10px" }}>
          <div style={{ fontSize:11, color:"#c084fc", fontWeight:"bold", letterSpacing:1 }}>INSANITY: {hp.insanity}</div>
          <div style={{ fontSize:11, color:"#4a3a5a", fontStyle:"italic", marginTop:2 }}>{INSANITY_DESC[hp.insanity]}</div>
        </div>
      )}
      <div style={{ background:"#0c0a06", border:"1px solid #1a1000", borderRadius:4, padding:"8px 10px" }}>
        <div style={{ fontSize:9, color:"#2a1a00", letterSpacing:2, marginBottom:6 }}>SKILLS</div>
        {Object.entries(hp.skills).map(function(e) {
          return (
            <div key={e[0]} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:11, color: e[1] > 0 ? "#5a4a2a" : "#1a1000" }}>{e[0]}</span>
              <span style={{ fontSize:11, color: e[1] > 0 ? "#c9a84c" : "#1a1000" }}>{"x" + e[1]}</span>
            </div>
          );
        })}
      </div>
      {skillBtns(hp, isAI ? humanIdx : turn)}
    </div>
  )}
</CollapsibleSection>

{/* MANSION SECTION */}
<CollapsibleSection title={"THE MANSION - " + rooms.filter(function(r) { return !r.opened; }).length + " remain"} defaultOpen={true} badge="">
  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
    {rooms.map(function(room) {
      var isLive = liveRooms.indexOf(room.id) >= 0;
      var isBombed = isHumanAgent && agentP && agentP.bombRoom === room.id;
      var rev = myRev[room.id];
      var isSel = selRoom === room.id;
      var canClick = !room.opened && isMyTurn && !aiThink && phase === "PLAY";
      var cellContent;
      if (room.opened) {
        cellContent = room.type === "coins" ? "💰" : room.type === "masacree" ? "🪓" : "🌀";
      } else if (isLive) {
        cellContent = rev === "coins" ? "💰" : rev === "masacree" ? "🪓" : rev === "dimensional" ? "🌀" : "📷";
      } else if (isBombed) {
        cellContent = "💣";
      } else if (rev) {
        cellContent = "!";
      } else {
        cellContent = "?";
      }
      return (
        <div key={room.id}
          style={{
            position:"relative",
            paddingBottom:"100%",
            borderRadius:6,
            background: room.opened ? (room.type === "coins" ? "#0e1d0e" : "#1d0e0e") : "#0f0c08",
            border: room.opened ? "1px solid #1a1000" : isLive ? "1px solid #7ec8e388" : "1px solid #1e1500",
            opacity: !canClick && !room.opened ? 0.5 : 1,
            cursor: canClick ? "pointer" : "default"
          }}
          onClick={function() { if (canClick) setModal({ type:"OPEN_CONFIRM", roomId: room.id }); }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:9, color:"#2a1a00" }}>{room.id}</div>
            <div style={{ fontSize: room.opened || (isLive && rev) ? 18 : 14, color: rev && !room.opened ? "#8b1a1a" : "inherit" }}>{cellContent}</div>
          </div>
        </div>
      );
    })}
  </div>
```

{/* Room confirmation handled via popup */}
<div style={{ marginTop:8, fontSize:10, color:”#2a1a00”, fontStyle:“italic” }}>
Coin / Masacree / Dimensional / ! Danger / Bomb / LIVE = Spy Cam
</div>
</CollapsibleSection>

```
{/* OPPONENTS SECTION */}
<CollapsibleSection title="OPPONENTS" defaultOpen={false} badge={players.filter(function(p) { return isAI ? !p.isHuman : true; }).filter(function(p) { return p.alive; }).length + " alive"}>
  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
    {players.filter(function(p) { return isAI ? !p.isHuman : true; }).map(function(p) {
      var ri = players.indexOf(p);
      return (
        <div key={p.id} style={{ ...base.card, opacity: p.alive ? 1 : 0.35, border:"1px solid " + (ri === turn ? "#2a1a00" : "#100a00"), padding:"10px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:20 }}>{CHAR_INFO[p.character] ? CHAR_INFO[p.character].icon : "?"}</span>
              <div>
                <div style={{ fontSize:13, color: ri === turn ? "#c9a84c" : "#5a4a2a" }}>{p.name}</div>
                <div style={{ fontSize:10, color:"#2a1a00", fontStyle:"italic" }}>{p.character}</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {ri === turn && <span style={{ fontSize:9, color:"#c9a84c", letterSpacing:1 }}>TURN</span>}
              {!p.alive && <span style={{ fontSize:14, color:"#8b1a1a" }}>X</span>}
            </div>
          </div>
          {!isAI && (
            <div style={{ marginTop:6, display:"flex", flexDirection:"column", gap:4 }}>
              <BarComp v={p.life} max={MAX_LIFE} color="#8b1a1a" label="HP" />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#c9a84c" }}>coins: {p.coins}</span>
                {p.insanity && <span style={{ fontSize:9, color:"#c084fc", background:"#0e0820", border:"1px solid #2a1a40", borderRadius:2, padding:"2px 6px" }}>{p.insanity}</span>}
              </div>
              {ri === turn && skillBtns(p, ri)}
            </div>
          )}
        </div>
      );
    })}
  </div>
</CollapsibleSection>

{/* LOG SECTION */}
<CollapsibleSection title={isAI ? "YOUR LOG" : "GAME LOG"} defaultOpen={false} badge={log.length + " events"}>
  <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:280, overflowY:"auto" }}>
    {log.slice().reverse().map(function(e) {
      return (
        <div key={e.id} style={{ fontSize:11, lineHeight:1.6, borderBottom:"1px solid #0c0a00", paddingBottom:4, color: e.type === "turn" ? "#c9a84c" : e.type === "system" ? "#7ec8e3" : e.type === "warn" ? "#8b4a00" : "#5a4a2a" }}>
          {e.msg}
        </div>
      );
    })}
    {log.length === 0 && <div style={{ fontSize:11, color:"#1a1000", fontStyle:"italic" }}>No events yet.</div>}
  </div>
</CollapsibleSection>

<div style={{ height:24 }} />
```

  </div>

{modal && <ModalLayer modal={modal} setModal={setModal} players={players} rooms={rooms} turn={turn} onSpyCam={confirmSpyCam} onBomb={confirmBomb} onMindHavoc={confirmMindHavoc} onFJ={confirmFJ} onTrade={confirmTrade} onDisguise={confirmDisguise} onOpenRoom={openRoom} />}

</div>
);
}

// — MODALS —————————————————————––
function NegModal({ modal }) {
useEffect(function() {
if (modal.isAI) {
var t = setTimeout(function() { Math.random() < 0.6 ? modal.onYes() : modal.onNo(); }, 1400);
return function() { clearTimeout(t); };
}
}, []);
return (

<div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.9)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
<div style={{ ...base.card, maxWidth:400, width:"90%", padding:20 }}>
<div style={{ fontSize:14, color:"#c9a84c", letterSpacing:2, marginBottom:8 }}>(scale)️ INTER-DIMENTION NEGOTIATOR</div>
<div style={base.divider} />
<div style={{ fontSize:12, color:"#5a4a2a", fontStyle:"italic", lineHeight:1.7, margin:"10px 0" }}>A Dimensional Guardian blocks your path. Negotiate to block the sanity drain?</div>
{modal.isAI
? <div style={{ fontSize:11, color:"#2a1a00", textAlign:"center", padding:"12px 0" }}>⏳ Deliberating...</div>
: <div style={{ display:"flex", gap:8, marginTop:10 }}>
<button style={{ ...base.btn, flex:1, background:"#2a4a2a", fontSize:10 }} onClick={modal.onYes}>NEGOTIATE</button>
<button style={{ ...base.btn, flex:1, background:"#4a1a1a", fontSize:10 }} onClick={modal.onNo}>REFUSE</button>
</div>}
</div>
</div>
);
}

function HijackModal({ modal }) {
var s = useState(-1); var selR = s[0]; var setSelR = s[1];
var p = modal.player; var cr = modal.clRev || {};
var unopened = modal.rooms.filter(function(r) { return !r.opened; });
return (

<div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
<div style={{ ...base.card, maxWidth:440, width:"90%", padding:20, maxHeight:"85vh", overflowY:"auto" }}>
<div style={{ textAlign:"center", marginBottom:12 }}>
<div style={{ fontSize:28, marginBottom:4 }}>🧿</div>
<div style={{ fontSize:13, color:"#8b4a8b", letterSpacing:2 }}>MIND HIJACKED</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic" }}>Controlling {p.name} - {p.character}</div>
</div>
<div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:10, fontSize:11 }}>
<span style={{ color:"#8b1a1a" }}>HP: {p.life}</span>
<span style={{ color:"#7a2a7a" }}>🧠 {p.sanity}</span>
<span style={{ color:"#c9a84c" }}>💰 {p.coins}</span>
</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Choose a room. Unknown rooms stay hidden - only Third Eyes warnings visible.</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:3, maxHeight:150, overflowY:"auto" }}>
{unopened.map(function(r) {
var rv = cr[r.id];
return <div key={r.id} style={{ height:40, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, cursor:"pointer", color:"#5a4a2a", background: selR === r.id ? "#180f20" : rv ? "#1a0808" : "#0f0c08", border:"1px solid " + (selR === r.id ? "#8b4a8b" : rv ? "#8b1a1a44" : "#1a1000") }} onClick={function() { setSelR(r.id); }}>
<div style={{ textAlign:"center" }}>
<div style={{ fontSize:7, color:"#2a1a00" }}>{r.id}</div>
{rv && <div style={{ fontSize:7, color:"#8b1a1a" }}>!</div>}
</div>
</div>;
})}
</div>
<button style={{ ...base.btn, background: selR >= 0 ? "#4a1a4a" : "#1a0a1a", width:"100%", marginTop:10, opacity: selR >= 0 ? 1 : 0.3 }} disabled={selR < 0} onClick={function() { if (selR >= 0) modal.onPick(selR); }}>SEND THEM IN</button>
</div>
</div>
);
}

function ModalLayer({ modal, setModal, players, rooms, turn, onSpyCam, onBomb, onMindHavoc, onFJ, onTrade, onDisguise, onOpenRoom }) {
var s1 = useState([]); var picks = s1[0]; var setPicks = s1[1];
var s2 = useState(-1); var tid = s2[0]; var setTid = s2[1];
var s3 = useState(“buyLife”); var mode = s3[0]; var setMode = s3[1];
var s4 = useState(1); var amt = s4[0]; var setAmt = s4[1];
var unopened = rooms.filter(function(r) { return !r.opened; });
var OVR = { position:“fixed”, top:0, left:0, right:0, bottom:0, background:“rgba(0,0,0,0.9)”, display:“flex”, alignItems:“center”, justifyContent:“center”, zIndex:200 };
var BOX = { …base.card, maxWidth:460, width:“90%”, padding:20, maxHeight:“88vh”, overflowY:“auto” };
function close() { setModal(null); }

if (modal.type === “OPEN_CONFIRM”) {
var rid = modal.roomId;
return (
<div style={{ position:“fixed”, top:0, left:0, right:0, bottom:0, background:“rgba(0,0,0,0.75)”, display:“flex”, alignItems:“center”, justifyContent:“center”, zIndex:200 }}>
<div style={{ background:”#0f0c08”, border:“1px solid #2a1a00”, borderRadius:8, maxWidth:300, width:“85%”, padding:24, textAlign:“center” }}>
<div style={{ fontSize:32, marginBottom:8 }}>🚪</div>
<div style={{ fontSize:18, color:”#c9a84c”, letterSpacing:2, marginBottom:6 }}>ROOM {rid}</div>
<div style={{ fontSize:12, color:”#5a4a2a”, fontStyle:“italic”, marginBottom:20 }}>Open this door? What lies behind is unknown.</div>
<div style={{ display:“flex”, gap:10 }}>
<button style={{ flex:1, background:”#c9a84c”, color:”#0a0806”, border:“none”, borderRadius:4, padding:“14px”, fontSize:14, fontWeight:“bold”, letterSpacing:2, cursor:“pointer” }} onClick={function() { setModal(null); onOpenRoom(rid); }}>OPEN</button>
<button style={{ flex:1, background:“transparent”, color:”#5a4a2a”, border:“1px solid #2a1a00”, borderRadius:4, padding:“14px”, fontSize:14, cursor:“pointer” }} onClick={function() { setModal(null); }}>CANCEL</button>
</div>
</div>
</div>
);
}
if (modal.type === “NEGOTIATE”) return <NegModal modal={modal} />;
if (modal.type === “HIJACK”) return <HijackModal modal={modal} />;

if (modal.type === “SPY_CAM”) {
function tog(id) { setPicks(function(p) { return p.indexOf(id) >= 0 ? p.filter(function(x) { return x !== id; }) : p.length < 5 ? p.concat([id]) : p; }); }
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>📷 SPY CAMERA</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Select up to 5 rooms. Contents revealed to you only - rooms show [LIVE].</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:3, maxHeight:150, overflowY:"auto" }}>
{unopened.map(function(r) { return <div key={r.id} style={{ height:40, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, cursor:"pointer", color:"#5a4a2a", background: picks.indexOf(r.id) >= 0 ? "#0d1d0d" : "#0f0c08", border:"1px solid " + (picks.indexOf(r.id) >= 0 ? "#c9a84c" : "#1a1000") }} onClick={function() { tog(r.id); }}>{r.id}</div>; })}
</div>
<div style={{ fontSize:10, color:"#3a2a10", marginTop:4 }}>{picks.length}/5 selected</div>
<button style={{ ...base.btn, width:"100%", marginTop:10, opacity: picks.length === 0 ? 0.3 : 1 }} disabled={picks.length === 0} onClick={function() { onSpyCam(picks); }}>INSTALL CAMERAS</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}

if (modal.type === “BOMB”) {
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>💣 TRAP WIRE BOMB</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Plant a bomb. Anyone who opens it - including yourself - loses 7 Life.</div>
<div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:3, maxHeight:150, overflowY:"auto" }}>
{unopened.map(function(r) { return <div key={r.id} style={{ height:40, borderRadius:3, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, cursor:"pointer", color:"#5a4a2a", background: tid === r.id ? "#1a0808" : "#0f0c08", border:"1px solid " + (tid === r.id ? "#8b1a1a" : "#1a1000") }} onClick={function() { setTid(r.id); }}>{r.id}</div>; })}
</div>
<button style={{ ...base.btn, background:"#4a0a0a", width:"100%", marginTop:10, opacity: tid < 0 ? 0.3 : 1 }} disabled={tid < 0} onClick={function() { onBomb(tid); }}>PLANT BOMB</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}

if (modal.type === “MIND_HAVOC”) {
var elig = modal.eligible.filter(function(p) { return p.alive; });
function togP(id) { setPicks(function(p) { return p.indexOf(id) >= 0 ? p.filter(function(x) { return x !== id; }) : p.length < 3 ? p.concat([id]) : p; }); }
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>🧿 MIND HAVOC</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Select up to 3 players to control. You will assign each a room to open.</div>
<div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
{elig.map(function(p) { return <div key={p.id} style={{ padding:"5px 10px", borderRadius:3, cursor:"pointer", fontSize:10, background: picks.indexOf(p.id) >= 0 ? "#150a20" : "#0f0c08", border:"1px solid " + (picks.indexOf(p.id) >= 0 ? "#8b4a8b" : "#1a1000"), color: picks.indexOf(p.id) >= 0 ? "#8b4a8b" : "#3a2a10" }} onClick={function() { togP(p.id); }}>{p.name}</div>; })}
</div>
<button style={{ ...base.btn, background:"#4a1a4a", width:"100%", marginTop:10, opacity: picks.length === 0 ? 0.3 : 1 }} disabled={picks.length === 0} onClick={function() { onMindHavoc(picks); }}>CONTROL {picks.length} PLAYER{picks.length !== 1 ? "S" : ""}</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}

if (modal.type === “FAKE_JUSTICE”) {
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>(scale)️ FAKE JUSTICE</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Mark a player. At 4 or below Life: they inherit all sanity, get +5 Life. They owe 5 coins at game end.</div>
<div style={{ display:"flex", flexDirection:"column", gap:5 }}>
{modal.eligible.map(function(p) { return <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:4, cursor:"pointer", background: tid === p.id ? "#1a1500" : "#0f0c08", border:"1px solid " + (tid === p.id ? "#c9a84c" : "#1a1000") }} onClick={function() { setTid(p.id); }}>
<span style={{ fontSize:11, color:"#8a7a5a" }}>{p.name}</span>
<span style={{ fontSize:10, color:"#3a2a10" }}>{p.character}</span>
<span style={{ fontSize:10, color:"#8b1a1a" }}>HP:{p.life}</span>
</div>; })}
</div>
<button style={{ ...base.btn, width:"100%", marginTop:10, opacity: tid < 0 ? 0.3 : 1 }} disabled={tid < 0} onClick={function() { onFJ(tid); }}>MARK PLAYER</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}

if (modal.type === “SOUL_TRADER”) {
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>🛒 SOUL TRADER</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>1 Coin = 2 Life . 1 Life = 2 Coins. Seller coins floored at 0.</div>
<div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
{modal.eligible.map(function(p) { return <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 10px", borderRadius:4, cursor:"pointer", background: tid === p.id ? "#1a1500" : "#0f0c08", border:"1px solid " + (tid === p.id ? "#c9a84c" : "#1a1000") }} onClick={function() { setTid(p.id); }}>
<span style={{ fontSize:11, color:"#8a7a5a" }}>{p.name}</span>
<span style={{ fontSize:10, color:"#8b1a1a" }}>HP:{p.life}</span>
<span style={{ fontSize:10, color:"#c9a84c" }}>💰{p.coins}</span>
</div>; })}
</div>
{tid >= 0 && <div>
<div style={{ display:"flex", gap:6, marginBottom:8 }}>
{["buyLife","sellLife"].map(function(m) { return <button key={m} style={{ flex:1, background:"#0f0c08", color: mode === m ? "#c9a84c" : "#3a2a10", border:"1px solid " + (mode === m ? "#c9a84c" : "#1a1000"), borderRadius:3, padding:"6px", fontSize:9, cursor:"pointer" }} onClick={function() { setMode(m); }}>{m === "buyLife" ? "BUY LIFE" : "SELL LIFE"}</button>; })}
</div>
<div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
<span style={{ fontSize:10, color:"#3a2a10" }}>Amount:</span>
<input type="number" min={1} max={6} value={amt} onChange={function(e) { setAmt(Number(e.target.value)); }} style={{ ...base.input, width:60, padding:"4px 8px", textAlign:"center" }} />
<span style={{ fontSize:9, color:"#2a1a00" }}>{mode === "buyLife" ? amt + "c->" + (amt*2) + "HP" : amt + "HP->" + (amt*2) + "c"}</span>
</div>
</div>}
<button style={{ ...base.btn, width:"100%", marginTop:4, opacity: tid < 0 ? 0.3 : 1 }} disabled={tid < 0} onClick={function() { onTrade(tid, mode, amt); }}>SEAL THE DEAL</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}

if (modal.type === “DISGUISE”) {
return (

<div style={OVR} onClick={close}><div style={BOX} onClick={function(e) { e.stopPropagation(); }}>
<div style={{ fontSize:13, color:"#c9a84c", letterSpacing:2, marginBottom:6 }}>🎭 DISGUISE</div>
<div style={{ fontSize:11, color:"#5a4a2a", fontStyle:"italic", marginBottom:8 }}>Requires 10 boxes. Fully copy a living character. +1 Sanity per turn while disguised.</div>
<div style={{ display:"flex", flexDirection:"column", gap:5 }}>
{modal.eligible.map(function(p) {
var inf = CHAR_INFO[p.character];
return <div key={p.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:4, cursor:"pointer", background: tid === p.id ? "#150a20" : "#0f0c08", border:"1px solid " + (tid === p.id ? "#8b4a8b" : "#1a1000") }} onClick={function() { setTid(p.id); }}>
<span style={{ fontSize:18 }}>{inf ? inf.icon : "?"}</span>
<span style={{ fontSize:11, color:"#8a7a5a", flex:1 }}>{p.name}</span>
<span style={{ fontSize:9, color:"#3a2a10" }}>{p.character}</span>
</div>;
})}
</div>
<button style={{ ...base.btn, background:"#4a1a4a", width:"100%", marginTop:10, opacity: tid < 0 ? 0.3 : 1 }} disabled={tid < 0} onClick={function() { onDisguise(tid); }}>WEAR THEIR FACE</button>
<button style={{ ...base.ghost, width:"100%", marginTop:6 }} onClick={close}>Close</button>
</div></div>
);
}
return null;
}

// — COLLAPSIBLE SECTION —————————————————–
function CollapsibleSection(props) {
var title = props.title;
var badge = props.badge;
var defaultOpen = props.defaultOpen;
var children = props.children;
var s = useState(defaultOpen !== undefined ? defaultOpen : true);
var open = s[0]; var setOpen = s[1];
return (
<div style={{ borderBottom:“1px solid #1a1000” }}>
<div style={{ display:“flex”, alignItems:“center”, justifyContent:“space-between”, padding:“12px 14px”, cursor:“pointer”, background: open ? “#0c0a06” : “#080604” }} onClick={function() { setOpen(!open); }}>
<div style={{ display:“flex”, alignItems:“center”, gap:8 }}>
<span style={{ fontSize:9, letterSpacing:3, color:”#3a2a10”, textTransform:“uppercase” }}>{title}</span>
{badge !== “” && <span style={{ fontSize:9, color:”#2a1a00”, background:”#0f0c08”, border:“1px solid #1a1000”, borderRadius:2, padding:“1px 6px” }}>{badge}</span>}
</div>
<span style={{ fontSize:12, color:”#2a1a00” }}>{open ? “^” : “v”}</span>
</div>
{open && (
<div style={{ padding:“4px 14px 14px 14px” }}>
{children}
</div>
)}
</div>
);
}

// — SMALL COMPONENTS ———————————————————
function BarComp({ v, max, color, label, danger }) {
var pct = Math.max(0, Math.min(1, v / max));
var col = danger ? (pct >= 0.9 ? “#8b1a1a” : pct >= 0.5 ? “#7a4a00” : color) : color;
return (

<div style={{ display:"flex", alignItems:"center", gap:4 }}>
{label && <span style={{ fontSize:7, color:"#2a1a00", minWidth:26 }}>{label}</span>}
<div style={{ flex:1, height:5, background:"#0e0a00", borderRadius:2 }}>
<div style={{ width:(pct * 100) + "%", height:"100%", background:col, borderRadius:2, transition:"width 0.25s" }} />
</div>
<span style={{ fontSize:7, color:"#2a1a00", minWidth:22 }}>{v}/{max}</span>
</div>
);
}

function CharCardSmall({ c, onClick }) {
var s = useState(false); var hov = s[0]; var setHov = s[1];
var inf = CHAR_INFO[c];
return (

<div style={{ background: hov ? inf.color + "11" : "#0f0c08", border:"1px solid " + (hov ? inf.color + "44" : "#1e1500"), borderRadius:5, padding:"10px 12px", cursor:"pointer", transition:"all 0.15s" }} onClick={onClick} onMouseEnter={function() { setHov(true); }} onMouseLeave={function() { setHov(false); }}>
<div style={{ fontSize:20, marginBottom:4 }}>{inf.icon}</div>
<div style={{ fontSize:9, fontWeight:"bold", color: hov ? inf.color : "#5a4a2a", letterSpacing:1, marginBottom:2 }}>{c}</div>
<div style={{ fontSize:9, color:"#3a2a10", fontStyle:"italic", lineHeight:1.4 }}>{inf.tag}</div>
</div>
);
}