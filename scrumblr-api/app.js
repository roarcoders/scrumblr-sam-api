"use strict";
const express = require("express");
const app = express();
const router = express.Router();
const LorenIpsum = require("lorem-ipsum").loremIpsum;
//const port = 3000;
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

let DevCop = [];

const docClient = new AWS.DynamoDB.DocumentClient()

const table = 'scrumblr-api-1-ScrumblrDB-YNZ5VH51RIPV'

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE');
//     res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type, Accept");
//   //   res.header(
//   //     "Access-Control-Allow-Headers",
//   //     "Origin, X-Requested-With, Content-Type, Accept"
//   //   );
//     next();
//   });

//Create a board with 3 sample notes
// router.get("/", function(req, res){
//     let board = {
//         board_id: uuidv4(),
//         board_notes: [
//             {
//                 "note_id": uuidv4(),
//                 "topic": new LorenIpsum(),
//                 "creation_date": Date.now()
//             },
//             {
//                 "note_id": uuidv4(),
//                 "topic":new LorenIpsum(),
//                 "creation_date": Date.now()
//             },
//             {
//                 "note_id":uuidv4(),
//                 "topic":new LorenIpsum(),
//                 "creation_date": Date.now()
//             }
//         ]
//     }
//     DevCop.push(board);
//     res.setHeader('Content-Type', 'application/json');
//     res.send(JSON.stringify(DevCop));
// })

//List all boards in memory(array)
router.get("/board", async (req, res) => {
  let params = {
      TableName: table
  }

  let data

  try{
  data = await docClient.scan(params).promise();
  } catch (error){
    res.send(JSON.stringify(error));
  }
  res.send(JSON.stringify(data));
});

//Get a particular board
router.get("/board/:boardId", async (req, res) => {
  //let board_id;
  // if (!("boardId" in req.params)) {
  //   board_id = "";
  // } else {
  //   board_id = req.params.boardId;
  // }
  // let data = {};
  // let board;

  // for (board in DevCop) {
  //   if (DevCop[board].boardId === board_id) {
  //     data = DevCop[board];
  //   }
  // }


  // try {
  //   res.send(JSON.stringify(data));
  // } catch (error) {
  //   res.send(JSON.stringify(error));
  // }


let board_id
if (!('boardId' in req.params)){
    board_id = ""
}
else {
    board_id = req.params.boardId
}

let params = {
    TableName: table
}

const tableRows = await docClient.scan(params).promise();
let data

for (let row in tableRows.Items){
    if (tableRows.Items[row].BoardId === board_id)
    {
        let params1 = {
            TableName: table,
            Key: {
                "BoardId": board_id
            }
        }
        try {
            data = await docClient.get(params1).promise();
            res.send(data)
        } catch (error) {
            res.send(JSON.stringify(error))
        }
    }
}

});

//Create a new board
router.post("/board", async (req, res) => {
  const boardId = uuidv4();

//   let board = {
//     boardId: boardId,
//     board_notes: [],
//   };
//   DevCop.push(board);
//   res.send(JSON.stringify(board));
// });

let params = {
    TableName : table,
    Item: {
        BoardId: boardId,
        board_notes: [

        ]
    }
}

let data

try{
  data = await docClient.put(params).promise();
  res.send(data.items)
} catch (error){
    res.send(JSON.stringify(error))
}
})

//Delete a specific board
router.delete("/board/:boardId", async (req, res) => {
  let board_id;

  if (!("boardId" in req.params)) {
    board_id = "";
  } else {
    board_id = req.params.boardId;
  }

  // for (let board in DevCop) {
  //   if (DevCop[board].boardId === board_id) {
  //     DevCop.splice(board, 1);
  //   }
  // }
  // try {
  //   res.sendStatus(200);
  // } catch (error) {
  //   res.sendStatus(500);
  // }

  let params = {
      TableName: table
  }

  let boards = await docClient.scan(params).promise();
  let data

  for(let board in boards.Items){
      if(boards.Items[board].BoardId === board_id){
          let params1 = {
              TableName: table,
              Key: {
                  "BoardId": board_id
              }
          }
          try {
            data = await docClient.delete(params1).promise();
              res.send("DELETED BOARD" + data)
          } catch (error){
              res.send(JSON.stringify("Error occured while deleting -> " + error))
          }
      }
  }
});

//Create a note for a specified board
router.post("/board/:boardId/note", async (req, res) => {
  let board_id;
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

  for (let board in DevCop) {
    if (DevCop[board].boardId === board_id) {
      DevCop[board].board_notes.push(singleNote);
    }
  }
  try {
    res.send(JSON.stringify(singleNote));
  } catch (error) {
    res.send(JSON.stringify(error));
  }

  // let params = {
  //     TableName:table
  // }

  // let boards = await docClient.scan(params).promise();
  // for (let board in boards.Items){
  //     if(boards.Items[board].BoardId === board_id){

  //         let updateBoard = {
  //             TableName: table,
  //             Key:{
  //                 "BoardId": board_id
  //             },
  //             UpdateExpression: "SET board_notes = list_append(board_notes,:note)",
  //             ExpressionAttributeValues: {
  //                 ":note": [singleNote]
  //             }
  //         }

  //         try {
  //             await docClient.update(updateBoard).promise();
  //             res.send(JSON.stringify("Note Inserted Successfully"))
  //         } catch (error) {
  //             res.send(JSON.stringify(error))
  //         }
  //     }
  // }
});

// Delete a particular note from a particular board
router.delete("/board/:boardId/note/:noteId", async (req, res) => {
  let board_id;
  let note_id;

  if (!("boardId" in req.params) && "noteId" in req.params) {
    board_id = "";
    note_id = "";
  } else {
    board_id = req.params.boardId;
    note_id = req.params.noteId;
  }

  // let params = {
  //     TableName: table
  // }

  // let boards = await docClient.scan(params).promise();

  for (let board in DevCop) {
    if (DevCop[board].boardId === board_id) {
      for (let note in DevCop[board].board_notes) {
        if (DevCop[board].board_notes[note].note_id === note_id) {
          DevCop[board].board_notes.splice(DevCop[board].board_notes[note], 1);

          // let deleteNote = {
          //     TableName: table,
          //     Key: {
          //         "BoardId": board_id
          //     },
          //     UpdateExpression: "REMOVE board_notes[" + note + "]"
          // }

          // try {
          //     await docClient.update(deleteNote).promise();
          //     res.send(JSON.stringify("Note deleted successfully"))
          // } catch (error){
          //     res.send(JSON.stringify("Error occurred : " + error))
          // }
        }
      }
    }
  }
  try {
    res.send(JSON.stringify(DevCop[board].board_notes));
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

// Update a specific note
router.patch("/board/:boardId/note/:noteId", async (req, res) => {
  let note_id;
  let board_id;

  if (!("boardId" in req.params) && "noteId" in req.params) {
    note_id = "";
    board_id = "";
  } else {
    note_id = req.params.noteId;
    board_id = req.params.boardId;
  }

  const textForNote = req.body.singleNote;

  let board;
  let note;

  board = DevCop.find((board_Id) => board_Id.boardId === board_id);
  note = board.board_notes.find(
    (currentNote) => currentNote.note_id === note_id
  );
  note.topic = textForNote;

  try {
    res.send(JSON.stringify(note));
  } catch (error) {
    res.send(JSON.stringify(error));
  }

  // let params = {
  //     TableName: table
  // }

  // let boards = await docClient.scan(params).promise();

  // for (let board in boards.Items){
  //     if(boards.Items[board].BoardId === board_id){
  //         for(let note in boards.Items[board].board_notes){
  //             if(boards.Items[board].board_notes[note].note_id === note_id){

  //                 let updateNote = {
  //                     TableName: table,
  //                     Key: {
  //                         "BoardId": board_id
  //                     },
  //                     UpdateExpression: "SET board_notes[" + note + "].topic = :noteText",
  //                     ExpressionAttributeValues : {
  //                         ":noteText": [textForNote]
  //                     }
  //                 }

  //                 try {
  //                     await docClient.update(updateNote).promise();
  //                     res.send(JSON.stringify("Note Updated Successfully"));
  //                 } catch (error) {
  //                     res.send(JSON.stringify("An error occurred " + error));
  //                 }

  //             }
  //         }
  //     }
  // }
});

// Get a specific note
router.get("/board/:boardId/note/:noteId", async (req, res) => {
  let note_id;
  let board_id;

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
  for (let note in board.Items) {
    if (board.Items[note].board_notes[note].note_id === note_id) {
      let params1 = {
        TableName: table,
        KeyConditionExpression: "BoardId = :board_id",
        FilterExpression: "contains(board_notes, :note)",
        ExpressionAttributeValues: {
          ":board_id": board_id,
          ":note": board.Items[note].board_notes[note],
        },
      };
      try {
        await docClient.query(params1).promise();
        res.send(JSON.stringify(board.Items[note].board_notes[note]));
      } catch (error) {
        res.send(JSON.stringify(error));
      }
    }
  }
});

app.use("/", router);

// app.listen(port, () => {
//   console.log(`App listening at http://localhost:${port}`);
// });

module.exports = app;
