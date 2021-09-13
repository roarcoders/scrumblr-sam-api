"use strict";
const express = require("express");
const app = express();
const router = express.Router();
//const port = 3000; // Uncomment for testing locally
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const bodyParser = require('body-parser')
const cors = require('cors')

var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

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


const docClient = new AWS.DynamoDB.DocumentClient();

// Replace with the name of your local Dynanmodb table name
const table = "scrumblr-api-1-ScrumblrDB-1MVOKMASEC4G"; 

let board_id, note_id

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
  res.status(200);
  res.send(JSON.stringify(data));
});

//Get a particular board
router.get("/board/:BoardId", async (req, res) => {

let board_id
if (!('BoardId' in req.params)){
    board_id = ""
}
else {
    board_id = req.params.BoardId
}

let params = {
    TableName: table
}

const tableRows = await docClient.scan(params).promise();

let board = tableRows.Items.find(board => board.BoardId === board_id)

  try {
    res.send(board);
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

router.options('*', cors())


//Create a new board
router.post("/board",cors(corsOptions), async (req, res) => {
  const boardId = uuidv4();
  let board_name = req.body.BoardName;
  
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
    let boardIdObj = {
      boardID : boardId
    }
    res.send(boardIdObj)
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

//Update the board name
router.patch("/board/:BoardId",cors(corsOptions), async (req, res) => {
  if (!('BoardId') in req.params){
    board_id = ""
  }
  else {
    board_id = req.params.BoardId
  }

  let params = {
    TableName: table,
    Key:{
      BoardId: board_id
    },
    UpdateExpression: "SET BoardName = :boardName",
    ExpressionAttributeValues: {
      ":boardName": req.body.BoardName
    }
  }
  try{
    await docClient.update(params).promise();
    res.status(200)
    res.send()
  } catch (error){
    res.send(JSON.stringify(error))
  }

})

//Delete a specific board
router.delete("/board/:BoardId", async (req, res) => {
 if (!("BoardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.BoardId;
  }

  let params = {
    TableName: table,
  };

  let boards = await docClient.scan(params).promise();
  let data, params1;
  let isBoardPresent = false;
  for (let board in boards.Items) {
    if (boards.Items[board].BoardId === board_id) {
        isBoardPresent = true;
        params1 = {
          TableName: table,
          Key: {
            BoardId: board_id,
          },
        };
    }
  }

  try {
    if(isBoardPresent) {
      data = await docClient.delete(params1).promise();
      res.status(200);
      res.send();
    }
    else{
      res.status(404);
      res.send();
    }
  }
   catch (error) {
    res.send(JSON.stringify(error));
  }

});

//Create a note for a specified board
router.post("/board/:BoardId/note", async (req, res) => {
  if (!("BoardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.BoardId;
  }

  const textForNote = req.body.singleNote;
  const singleNote = {
    note_id: uuidv4(),
    topic: textForNote,
    dateCreated: Date.now(),
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
        res.send();
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
    Key: {
      "BoardId": board_id,
    },
    KeyConditionExpression: "BoardId = :boardId",
    ExpressionAttributeValues: {
      ":boardId": board_id,
    },
  };

  let board = await docClient.query(params).promise();
  let itemsFirstIndex = board.Items.find(Boolean);
  let params1;

  for (let note in itemsFirstIndex.board_notes) {
    if (itemsFirstIndex.board_notes[note].note_id === note_id) {
        itemsFirstIndex.board_notes.splice(note, 1);

      params1= {
        TableName: table,
        Key: {
          "BoardId": board_id,
        },
        UpdateExpression: "SET board_notes = :board_notes_new_array",
        ExpressionAttributeValues: {
          ":board_notes_new_array": itemsFirstIndex.board_notes,
        },
      };
    } 
  }
  try{
    await docClient.update(params1).promise();
    res.send();
  } catch {
    res.send(JSON.stringify(err))
  }
      
      
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
        UpdateExpression: "SET board_notes[" + note + "].topic = :noteText",
        ExpressionAttributeValues: {
          ":noteText": textForNote,
        },
      };
      break;
    }
  }

  try {
    await docClient.update(updateNote).promise();
    res.send();
  } catch (error) {
    res.send(error);
  }
});

// Get a specific note

router.get("/board/:boardId/note/:noteId", async (req, res) => {
  if (!("boardId" in req.params) && "noteId" in req.params) {
    note_id = "";
    board_id = "";
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
