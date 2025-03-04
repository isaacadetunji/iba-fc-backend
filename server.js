// Backend - server.js (Node.js + Express + MongoDB)
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

{
  "type": "module",
  "dependencies": { }
}

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://bukolaadetunji73:<fdSF52YV7voVcUX2>@cluster0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const playerSchema = new mongoose.Schema({
  name: String,
  team: String,
});
const Player = mongoose.model('Player', playerSchema);

const teams = ['Team A', 'Team B', 'Team C', 'Team D'];
const maxPlayersPerTeam = 4;

app.post('/assign-team', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });

  const existingPlayer = await Player.findOne({ name });
  if (existingPlayer) return res.status(400).json({ message: 'Player already assigned' });

  let assignedTeams = await Player.find();
  let teamCounts = teams.reduce((acc, team) => {
    acc[team] = assignedTeams.filter(p => p.team === team).length;
    return acc;
  }, {});

  let availableTeams = teams.filter(team => teamCounts[team] < maxPlayersPerTeam);
  if (availableTeams.length === 0) return res.status(400).json({ message: 'All teams are full' });

  let selectedTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
  const newPlayer = new Player({ name, team: selectedTeam });
  await newPlayer.save();

  res.json({ name, team: selectedTeam });
});

app.get('/players', async (req, res) => {
  const players = await Player.find();
  res.json(players);
});

app.post('/admin/reset', async (req, res) => {
  await Player.deleteMany();
  res.json({ message: 'All players removed' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Frontend - Modify components-BallotSystem.jsx to connect to backend
import React, { useState, useEffect } from 'react';

const teams = ['Team A', 'Team B', 'Team C', 'Team D'];

function BallotSystem() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('https://iba-fc-backend.onrender.com/players')
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, []);

  const handleSelection = () => {
    if (!name) return alert('Enter a name');

    fetch('https://iba-fc-backend.onrender.com/assign-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
      .then(res => res.json())
      .then(data => {
        if (data.message) {
          alert(data.message);
        } else {
          setPlayers([...players, data]);
        }
      });
  };

  return (
    <div>
      <h2>Player Balloting</h2>
      <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSelection}>Select Team</button>
      <ul>
        {players.map(player => (
          <li key={player.name}>{player.name} - {player.team}</li>
        ))}
      </ul>
    </div>
  );
}

export default BallotSystem;
