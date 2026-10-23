
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "santiago-2026";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db = { users: [], commerces: [] };
if (fs.existsSync('db.json')) {
  try { db = JSON.parse(fs.readFileSync('db.json')); } catch(e) {}
}
function save() { fs.writeFileSync('db.json', JSON.stringify(db, null, 2)); }

app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname, 'index.html')) });

app.post('/api/signup', async (req,res)=>{
  const {nom, email, password} = req.body;
  if(db.users.find(u=>u.email===email.toLowerCase())) return res.status(400).json({error:"Email déjà utilisé"});
  const hash = await bcrypt.hash(password, 10);
  const user = {nom, email:email.toLowerCase(), password:hash};
  db.users.push(user); save();
  const token = jwt.sign({nom, email:email.toLowerCase()}, SECRET);
  res.json({token, user:{nom, email:email.toLowerCase()}});
});

app.post('/api/login', async (req,res)=>{
  const {email, password} = req.body;
  const user = db.users.find(u=>u.email===email.toLowerCase());
  if(!user) return res.status(400).json({error:"Utilisateur non trouvé"});
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(400).json({error:"Mot de passe faux"});
  const token = jwt.sign({nom:user.nom, email:user.email}, SECRET);
  res.json({token, user:{nom:user.nom, email:user.email}});
});

app.get('/api/commerces', (req,res)=> res.json(db.commerces));
app.post('/api/commerces', (req,res)=>{ db.commerces.unshift(req.body); save(); res.json({ok:true}); });

app.listen(PORT, ()=> console.log(`SERVEUR LANCE sur ${PORT}`));
