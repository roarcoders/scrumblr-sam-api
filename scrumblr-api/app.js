const express = require('express');
const app = express();
const router = express.Router();
// const port = 3000; // Uncomment for testing locally
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');

const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// uncomment for testing locally
// AWS.config.update({
//   region: 'ap-southeast-2',
//   endpoint: 'http://localhost:8000',
// });

const docClient = new AWS.DynamoDB.DocumentClient();

// Replace with the name of your local Dynanmodb table name
const table = process.env.TABLE_NAME;
const regex = new RegExp('^[a-zA-Z0-9-  ]*$');

let boardID;
let noteID;
let board;
let boardName;
let isNotePresent = false;

const isNameValid = (strName) => {
  if (strName.length <= 32 && regex.test(strName)) {
    return true;
  }
  return false;
};

const isEmpty = (obj) => {
  if (obj == null) {
    return false;
  }
  return Object.keys(obj).length === 0;
};

const errorReturn = (responseStatus, message, response) => {
  response.status(responseStatus);
  response.send(JSON.stringify(message));
};

const isIdAlphaNumeric = (testBoardId) => (regex.test(testBoardId) && testBoardId.length === 36);

// List all boards in memory(array)
router.get('/board', async (req, res) => {
  const params = {
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

router.get('/board/boardNames', async (req, res) => {
  const params = {
    TableName: table,
    ProjectionExpression: 'BoardName',
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

// Get a particular board
// router.get('/board/:BoardId', async (req, res) => {

// let boardID
// if (!('BoardId' in req.params)){
//     boardID = ''
//     errorReturn(404, 'BoardId is not present in parameters', res)
//     return;
// }
// else {
//     boardID = req.params.BoardId
// }

//   switch (isIdAlphaNumeric(boardID)) {
//     case false:
//       errorReturn(400, 'BoardId is not valid', res);
//       return;
//     case true:
//     default:
//   }

// let params = {
//     TableName: table
// }

// const tableRows = await docClient.scan(params).promise();

// board = tableRows.Items.find(board => board.BoardId === boardID)

//   try {
//     if(board)
//     {
//     res.send(board);
//     }
//     else
//     {
//       errorReturn(404, 'Board not found', res)
//        return;
//     }
//   } catch (error) {
//     res.send(JSON.stringify(error));
//   }
// });

// Get board by name
router.get('/board/:BoardName', async (req, res) => {
  if (!('BoardName' in req.params)) {
    boardName = '';
    errorReturn(404, 'Board name is not present in parameters', res);
    return;
  }

  boardName = req.params.BoardName;

  switch (isNameValid(boardName)) {
    case false:
      errorReturn(400, 'Board name is invalid', res);
      return;
    case true:
    default:
  }

  const params = {
    TableName: table,
    IndexName: 'BoardNameGSI',
    KeyConditionExpression: 'BoardName = :boardname',
    ExpressionAttributeValues: {
      ':boardname': boardName,
    },
  };

  try {
    board = await docClient.query(params).promise();
  } catch (error) {
    res.send(JSON.stringify(error));
  }

  res.status(200);
  res.send(board);
});

router.options('*', cors());

// Create a new board
router.post('/board', cors(corsOptions), async (req, res) => {
  const boardId = uuidv4();
  boardName = req.body.BoardName;
  if (isEmpty(boardName) || !isNameValid(boardName)) {
    errorReturn(404, 'Board Name is invalid', res);
    return;
  }

  const params = {
    TableName: table,
    Item: {
      BoardId: boardId,
      BoardName: boardName,
      board_notes: [],
    },
  };

  try {
    await docClient.put(params).promise();
    const boardIdObj = {
      BoardId: boardId,
    };
    res.send(boardIdObj);
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

// Update the board name
router.patch('/board/:BoardId', cors(corsOptions), async (req, res) => {
  if (!(('BoardId') in req.params)) {
    boardID = '';
    errorReturn(404, 'BoardId is not present in parameters', res);
    return;
  }

  boardID = req.params.BoardId;

  switch (isIdAlphaNumeric(boardID)) {
    case false:
      errorReturn(404, 'BoardId is invalid', res);
      return;
    case true:
    default:
  }

  boardName = req.body.BoardName;
  switch (typeof boardName === 'string' && !isEmpty(boardName)) {
    case false:
      errorReturn(404, 'Board name not valid', res);
      return;
    case true:
    default:
  }

  switch (isNameValid(req.body.BoardName)) {
    case false:
      errorReturn(404, 'Board name not valid', res);
      return;
    case true:
    default:
  }

  const params = {
    TableName: table,
    Key: {
      BoardId: boardID,
    },
    KeyConditionExpression: 'BoardId = :boardId',
    ExpressionAttributeValues: {
      ':boardId': boardID,
    },
  };

  const myBoard = await docClient.query(params).promise();

  switch (isEmpty(myBoard.Items)) {
    case false: {
      const params1 = {
        TableName: table,
        Key: {
          BoardId: boardID,
        },
        UpdateExpression: 'SET BoardName = :boardName',
        ExpressionAttributeValues: {
          ':boardName': req.body.BoardName,
        },
      };

      try {
        await docClient.update(params1).promise();
        res.status(200);
        res.send();
      } catch (error) {
        res.send(JSON.stringify(error));
      }
    }
      break;
    case true:
    default:
      errorReturn(404, 'Board not found', res);
  }
});

// Delete a specific board
router.delete('/board/:BoardId', async (req, res) => {
  if (!('BoardId' in req.params)) {
    boardID = '';
    errorReturn(404, 'Board Id is not present in the parameters', res);
    return;
  }
  boardID = req.params.BoardId;

  switch (isIdAlphaNumeric(boardID)) {
    case false:
      errorReturn(404, 'Board Id is not valid', res);
      return;
    case true:
    default:
  }

  const params = {
    TableName: table,
  };

  const boards = await docClient.scan(params).promise();

  switch (boards.Items.length === 0) {
    case true:
      errorReturn(404, 'No Boards found in Database', res); // works
      return;
    case false:
    default:
  }

  let params1;
  let isBoardPresent = false;
  for (const board in boards.Items) {
    if (boards.Items[board].BoardId === boardID) {
      isBoardPresent = true;
      params1 = {
        TableName: table,
        Key: {
          BoardId: boardID,
        },
      };
    }
  }

  try {
    if (isBoardPresent) {
      await docClient.delete(params1).promise();
      res.status(200);
      res.send();
    } else {
      errorReturn(404, 'Board Not Found', res);
      return;
    }
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

// Create a note for a specified board
router.post('/board/:BoardId/note', async (req, res) => {
  // convert the below if to switch
  if (!('BoardId' in req.params)) {
    boardID = '';
  } else {
    boardID = req.params.BoardId;
  }

  switch (isIdAlphaNumeric(boardID)) {
    case false:
      errorReturn(400, 'Board Id is not valid', res);
      return;
    case true:
    default:
  }

  const textForNote = req.body.singleNote;

  switch (typeof textForNote === 'string') { // &&!isEmpty(textForNote)) {
    case false:
      errorReturn(400, 'Topic for note is invalid', res);
      return;
    case true:
    default:
  }
  noteID = req.body.noteId;
  const singleNote = {
    note_id: noteID,
    topic: textForNote,
    dateCreated: Date.now(),
  };

  const params = {
    TableName: table,
  };

  const boards = await docClient.scan(params).promise();
  switch (isEmpty(boards.Items)) {
    case true:
      errorReturn(404, 'No boards found in the database', res);
      return;
    case false:
    default:
  }

  let isBoardPresent = false;
  for (const board in boards.Items) {
    if (boards.Items[board].BoardId === boardID) {
      isBoardPresent = true;
      const updateBoard = {
        TableName: table,
        Key: {
          BoardId: boardID,
        },
        UpdateExpression: 'SET board_notes = list_append(board_notes,:note)',
        ExpressionAttributeValues: {
          ':note': [singleNote],
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
  switch (isBoardPresent) {
    case false:
      errorReturn(404, 'Board not found', res);
      break;
    case true:
    default:
  }
});

// Delete a particular note from a particular board
router.delete('/board/:boardId/note/:noteId', async (req, res) => {
  if (!('boardId' in req.params) && 'noteId' in req.params) {
    boardID = '';
    noteID = '';
  } else {
    boardID = req.params.boardId;
    noteID = req.params.noteId;
  }
  // switch(isIdAlphaNumeric(board_id) && isIdAlphaNumeric(noteID))  //doesn't work
  // {
  //   case false:
  //     errorReturn(400, 'Id isnt valid', res)  //works
  //     return;
  //   case true:
  //     default:
  // }

  const params = {
    TableName: table,
    Key: {
      BoardId: boardID,
    },
    KeyConditionExpression: 'BoardId = :boardId',
    ExpressionAttributeValues: {
      ':boardId': boardID,
    },
  };

  try {
    board = await docClient.query(params).promise();
  } catch (err) {
    errorReturn(404, 'Board not found', res);
    return;
  }

  switch (isEmpty(board.Items)) {
    case true:
      errorReturn(404, 'Board not present in the database', res); // works
      return;
    case false:
    default:
  }

  const itemsFirstIndex = board.Items.find(Boolean);
  let params1;

  for (const note in itemsFirstIndex.board_notes) {
    if (itemsFirstIndex.board_notes[note].note_id === noteID) {
      isNotePresent = true;
      itemsFirstIndex.board_notes.splice(note, 1);

      params1 = {
        TableName: table,
        Key: {
          BoardId: boardID,
        },
        UpdateExpression: 'SET board_notes = :board_notes_new_array',
        ExpressionAttributeValues: {
          ':board_notes_new_array': itemsFirstIndex.board_notes,
        },
      };
    }
  }
  switch (isNotePresent) {
    case false:
      errorReturn(404, 'Note not found', res); // works
      return;
    case true:
    default:
  }
  try {
    await docClient.update(params1).promise();
    res.send();
  } catch (err) {
    res.send(JSON.stringify(err));
  }
});

// Update a specific note
router.patch('/board/:boardId/note/:noteId', async (req, res) => {
  if (!('boardId' in req.params) && 'noteId' in req.params) {
    noteID = '';
    boardID = '';
  } else {
    noteID = req.params.noteId;
    boardID = req.params.boardId;
  }

  // switch(isIdAlphaNumeric(boardID) && isIdAlphaNumeric(noteID)) {
  //   case false:
  //     errorReturn(400, 'Id is not valid', res) //works
  //     return;
  //   case true:
  //   default:
  // }

  const textForNote = req.body.singleNote;

  switch (typeof textForNote === 'string') {
    case false:
      errorReturn(400, 'Topic is not valid', res);
      break;
    case true:
    default:
  }

  const params = {
    TableName: table,
    KeyConditionExpression: 'BoardId = :boardId',
    ExpressionAttributeValues: {
      ':boardId': boardID,
    },
  };

  board = await docClient.query(params).promise();

  switch (board.Items.length === 0) {
    case true:
      errorReturn(404, 'Board not found', res); // crashes
      return;
    case false:
    default:
  }

  let updateNote; let
    note;

  for (note in board.Items.find(Boolean).board_notes) {
    if (board.Items.find(Boolean).board_notes[note].note_id === noteID) {
      isNotePresent = true;
      updateNote = {
        TableName: table,
        Key: {
          BoardId: boardID,
        },
        UpdateExpression: `SET board_notes[${note}].topic = :noteText`,
        ExpressionAttributeValues: {
          ':noteText': textForNote,
        },
      };
      break;
    }
  }

  try {
    switch (isNotePresent) {
      case true:
        await docClient.update(updateNote).promise();
        res.send();
        return;
      case false:
      default:
        errorReturn(404, 'Note not found', res);
    }
  } catch (error) {
    res.send(error);
  }
});

// Get a specific note
router.get('/board/:boardId/note/:noteId', async (req, res) => {
  if (!('boardId' in req.params) && 'noteId' in req.params) {
    noteID = '';
    boardID = '';
  } else {
    noteID = req.params.noteId;
    boardID = req.params.boardId;
  }

  switch (isIdAlphaNumeric(boardID) && isIdAlphaNumeric(noteID)) {
    case false:
      errorReturn(400, 'Id is not valid', res);
      break;
    case true:
    default:
  }

  const params = {
    TableName: table,
    KeyConditionExpression: 'BoardId = :boardId',
    ExpressionAttributeValues: {
      ':boardId': boardID,
    },
  };

  board = await docClient.query(params).promise();

  switch (board.Items.length === 0) {
    case true:
      errorReturn(404, 'Board not found', res);
      return;
    case false:
    default:
  }

  const singleNote = {};

  for (const note in board.Items.find(Boolean).board_notes) {
    if (board.Items.find(Boolean).board_notes[note].note_id === noteID) {
      isNotePresent = true;
      singleNote = {
        note_id: board.Items.find(Boolean).board_notes[note].note_id,
        topic: board.Items.find(Boolean).board_notes[note].topic,
        dateCreated: board.Items.find(Boolean).board_notes[note].dateCreated,
      };
    }
  }
  try {
    switch (isNotePresent) {
      case true:
        res.send(JSON.stringify(singleNote));
        return;
      case false:
        errorReturn(404, 'Note not found', res);
        return;
      default:
    }
  } catch (error) {
    res.send(JSON.stringify(error));
  }
});

app.use('/', router);

// uncomment for local testing
// app.listen(port, () => {
//   console.log(`App listening at http://localhost:${port}`);
// });

module.exports = app;
