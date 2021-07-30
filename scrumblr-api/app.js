"use strict";
const express = require("express");
const app = express();
const router = express.Router();
//const port = 3000; // Uncomment for testing locally
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const bodyParser = require('body-parser')
const cors = require('cors')

router.use(express.json());
router.use(express.urlencoded({ extended: true }));


router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

//uncomment for testing locally
// AWS.config.update({
//   region: "ap-southeast-2",
//   endpoint: "http://localhost:8000",
// });

//let DevCop = [];

// router.use((req, res, next) => {
//   res.append('Access-Control-Allow-Origin', ['*']);
//   res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.append('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });


const docClient = new AWS.DynamoDB.DocumentClient();

// Replace with the name of your local Dynanmodb table name
const table = "scrumblr-api-1-ScrumblrDB-10AZCBWJQYD6L"; 

let board_id, note_id;



//List all boards in memory(array)
router.get("/board", async (req, res) => {
  let params = {
    TableName: table,
  };

  let data;

  try {
    data = await docClient.scan(params).promise();
  } catch (error) {
    res.send(JSON.stringify(error));
  }
  res.send(JSON.stringify(data));
});

//Get a particular board
router.get("/board/:boardId", async (req, res) => {
  if (!("boardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.boardId;
  }

  let params = {
    TableName: table,
  };

  const tableRows = await docClient.scan(params).promise();
  let data;

  for (let row in tableRows.Items) {
    if (tableRows.Items[row].BoardId === board_id) {
      let params1 = {
        TableName: table,
        Key: {
          BoardId: board_id,
        },
      };
      try {
        data = await docClient.get(params1).promise();
        res.send(data);
      } catch (error) {
        res.send(JSON.stringify(error));
      }
    }
  }
});

//Create a new board
router.post("/board", async (req, res) => {
  const boardId = uuidv4();
  let board_name = res.body.BoardName;
  console.log(board_name);

  let params = {
    TableName: table,
    Item: {
      BoardId: boardId,
      BoardName: board_name,
      board_notes: [],
    },
  };

  let data;

  try {
    data = await docClient.put(params).promise();
    res.set('Content-Type','application/json')
    res.send(data.items);
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

//Delete a specific board
router.delete("/board/:boardId", async (req, res) => {
 if (!("boardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.boardId;
  }

  let params = {
    TableName: table,
  };

  let boards = await docClient.scan(params).promise();
  let data;

  for (let board in boards.Items) {
    if (boards.Items[board].BoardId === board_id) {
      let params1 = {
        TableName: table,
        Key: {
          BoardId: board_id,
        },
      };
      try {
        data = await docClient.delete(params1).promise();
        res.send("DELETED BOARD" + data);
      } catch (error) {
        res.send(JSON.stringify("Error occured while deleting -> " + error));
      }
    }
  }
});

//Create a note for a specified board
router.post("/board/:boardId/note", async (req, res) => {
  if (!("boardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.boardId;
  }

  const textForNote = req.body.singleNote;
  const singleNote = {
    note_id: uuidv4(),
    topic: textForNote,
    dateCrated: Date.now(),
  };

  let params = {
    TableName: table,
  };

  let boards = await docClient.scan(params).promise();
  for (let board in boards.Items) {
    if (boards.Items[board].BoardId === board_id) {
      let updateBoard = {
        TableName: table,
        Key: {
          "BoardId": board_id,
        },
        UpdateExpression: "SET board_notes = list_append(board_notes,:note)",
        ExpressionAttributeValues: {
          ":note": [singleNote],
        },
      };

      try {
        await docClient.update(updateBoard).promise();
        res.send(JSON.stringify("Note Inserted Successfully"));
      } catch (error) {
        res.send(JSON.stringify(error));
      }
    }
  }
});

// Delete a particular note from a particular board
router.delete("/board/:boardId/note/:noteId", async (req, res) => {
  if (!("boardId" in req.params) && "noteId" in req.params) {
    board_id = "";
    note_id = "";
  } else {
    board_id = req.params.boardId;
    note_id = req.params.noteId;
  }

  let params = {
    TableName: table,
    KeyConditionExpression: "BoardId = :boardId",
    ExpressionAttributeValues: {
      ":boardId": board_id,
    },
  };

  let board = await docClient.query(params).promise();
  let itemsFirstIndex = board.Items.find(Boolean);

  for (let note in itemsFirstIndex.board_notes) {
    if (itemsFirstIndex.board_notes[note].note_id === note_id) {
      itemsFirstIndex.board_notes.splice(note, 1);
    }
  }
  res.send(JSON.stringify(itemsFirstIndex));

});

// Update a specific note
router.patch("/board/:boardId/note/:noteId", async (req, res) => {
  if (!("boardId" in req.params) && "noteId" in req.params) {
    note_id = "";
    board_id = "";
  } else {
    note_id = req.params.noteId;
    board_id = req.params.boardId;
  }

  const textForNote = req.body.singleNote;

  let params = {
    TableName: table,
    KeyConditionExpression: "BoardId = :boardId",
    ExpressionAttributeValues: {
      ":boardId": board_id
    },
  };

  let board = await docClient.query(params).promise();
  let updateNote
  let note
  for (note in board.Items.find(Boolean).board_notes) {
    if (board.Items.find(Boolean).board_notes[note].note_id === note_id) {
      updateNote = {
        TableName: table,
        Key: {
          "BoardId": board_id,
        },
        // KeyConditionExpression : "BoardId = :board_id",
        UpdateExpression: "SET board_notes[" + note + "].topic = :noteText",
        ExpressionAttributeValues: {
          //":board_id": board_id,
          ":noteText": textForNote,
        },
      };
      break;
    }
  }

  try {
    await docClient.update(updateNote).promise();
    res.send(JSON.stringify(board.Items.find(Boolean).board_notes[note]));
  } catch (error) {
    res.send(JSON.stringify("An error occurred " + error));
  }
});

// Get a specific note

router.get("/board/:boardId/note/:noteId", async (req, res) => {
  if (!("boardId" in req.params) && "noteId" in req.params) {
    note_id = " ";
    board_id = " ";
  } else {
    note_id = req.params.noteId;
    board_id = req.params.boardId;
  }

  let params = {
    TableName: table,
    KeyConditionExpression: "BoardId = :boardId",
    ExpressionAttributeValues: {
      ":boardId": board_id,
    },
  };

  let board = await docClient.query(params).promise();
  let itemsFirstIndex = board.Items.find(Boolean);

  for (let note in itemsFirstIndex.board_notes) {
    if (itemsFirstIndex.board_notes[note].note_id === note_id) {
      const singleNote = {
        note_id: itemsFirstIndex.board_notes[note].note_id,
        topic: itemsFirstIndex.board_notes[note].topic,
        dateCrated: itemsFirstIndex.board_notes[note].dateCrated,
      };

      res.send(JSON.stringify(singleNote));
    }
  }
});

app.use("/", router);

// uncomment for local testing
// app.listen(port, () => {
//   console.log(`App listening at http://localhost:${port}`);
// });

module.exports = app;
