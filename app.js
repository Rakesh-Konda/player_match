const express = require("express");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const hlo = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`${error}`);
    process.exit(1);
  }
};
hlo();

const convert = (msg) => {
  return {
    playerId: msg.player_id,
    playerName: msg.player_name,
  };
};

const match = (msg) => {
  return {
    matchId: msg.match_id,
    match: msg.match,
    year: msg.year,
  };
};

const convertPlayer = (msg) => {
  return {
    playerId: msg.player_id,
    playerName: msg.player_name,
  };
};

//get
app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details;`;
  const res = await db.all(query);
  response.send(res.map(convert));
});

//get playerid
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details
    WHERE player_id=${playerId};`;
  const res = await db.get(query);
  response.send(convert(res));
});

//put
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const update = request.body;
  const { playerName } = update;
  const query = `UPDATE player_details SET
    player_name="${playerName}" WHERE player_id=${playerId};`;
  const res = await db.run(query);
  response.send("Player Details Updated");
});

//get
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT match_id as matchId,
  match,year FROM match_details
    WHERE match_id=${matchId};`;
  const res = await db.get(query);
  response.send(res);
});

//get all match details
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT match_details.match_id,
  match,year
  FROM match_details INNER JOIN
  player_match_score ON match_details.match_id=player_match_score.match_id
  WHERE player_id=${playerId};`;
  const res = await db.all(query);
  response.send(res.map(match));
});

// list of players specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT player_details.player_id,
    player_name 
    FROM player_details INNER JOIN player_match_score
    ON player_details.player_id=player_match_score.player_id 
    WHERE player_match_score.match_id=${matchId};`;
  const res = await db.all(query);
  response.send(res.map(convertPlayer));
});

// get total scores
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROm player_details INNER JOIN player_match_score
    ON player_details.player_id=player_match_score.player_id WHERE
    player_details.player_id=${playerId};`;
  const res = await db.get(query);
  response.send(res);
});
module.exports = app;
