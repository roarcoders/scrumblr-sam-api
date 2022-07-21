const express = require('express');
const bcryptjs = require('bcryptjs');

const app = express();
const router = express.Router();
// const port = 3000; // Uncomment for testing locally
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const saltRounds = 10;
let boardColumns = [];

/** FOR LOCAL TESTING */
if (process.env.NODE_ENV === 'development') {
  console.log('-----> running in developement mode...');

  const YOUR_PROFILE_NAME_AWS_CLI = '' || process.env.AWS_CLI_PROFILE;

  if (!YOUR_PROFILE_NAME_AWS_CLI) {
    console.log('***** DID YOU REMEMBER TO ADD YOUR PROFILE NAME?...****');
    throw Error('no profile name provided');
  }

  const credentials = new AWS.SharedIniFileCredentials({ profile: YOUR_PROFILE_NAME_AWS_CLI });
  AWS.config.credentials = credentials;

  AWS.config.update({ region: 'ap-southeast-2' });
}
/** FOR LOCAL TESTING */

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
const docClient = new AWS.DynamoDB.DocumentClient();

// eslint-disable-next-line prefer-destructuring
const TABLE_BOARD = process.env.TABLE_BOARD;
const regex = new RegExp('^[a-zA-Z0-9-  ]*$');

let boardID;
let noteID;
let board;
let boardName;
let passCode;
let hashedPassCode;
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

/** @typedef {{colour: string, position: { left: number, top: number }, text: string}} Note */

/**
 * @description validates that the note is a valid note based on the keys & values
 * @param {Note} note
 * @returns {boolean} return true false if note is valid
 */
function isNoteDataValid(note) {
  // check if note is not object, is null/undefined, or is an array
  if (note == null || Array.isArray(note) || typeof note !== 'object') return false;

  // const validNoteStructure = {
  //   colour: ['white', 'yellow', 'blue', 'green'],
  //   position: { top: Number(), left: Number() },
  //   text: String(),
  //   status: String(),
  // };

  // // check key length is equal
  // const validNoteKeys = Object.keys(validNoteStructure);
  // const NoteKeys = Object.keys(note);
  // if (NoteKeys.length !== validNoteKeys.length) {
  //   return false;
  // }

  // // check the position key length
  // if (Object.keys(validNoteStructure.position).length !== Object.keys(note?.position || {}).length)
  //   {
  //   return false;
  // }

  // // check if position exists & left top are numbers
  // if (
  //   typeof note?.position?.left != typeof validNoteStructure.position.left ||
  //   typeof note?.position?.top != typeof validNoteStructure.position.top
  // ) {
  //   return false;
  // }

  // // check valid colour prop is one of colours
  // if (!validNoteStructure.colour.some((c) => c === note.colour)) {
  //   return false;
  // }

  // // check valid text prop is string
  // if (typeof note.text !== typeof validNoteStructure.text) {
  //   return false;
  // }

  return true;
}

const errorReturn = (responseStatus, message, response) => {
  response.status(responseStatus);
  response.send(JSON.stringify(message));
};

const isIdAlphaNumeric = (testBoardId) => regex.test(testBoardId) && testBoardId.length === 36;

// List all boards in memory(array)
router.get('/board', async (req, res) => {
  const params = {
    TableName: TABLE_BOARD,
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

// change endpoint name from boardNames to boardNamesAndPasscodes
router.get('/board/boardNames', async (req, res) => {
  const params = {
    TableName: TABLE_BOARD,
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

async function verifyPinAndBoardName(passCode, boardName) {
  const params = {
    TableName: TABLE_BOARD,
    IndexName: 'BoardNameGSI',
    KeyConditionExpression: 'BoardName = :boardname',
    ExpressionAttributeValues: {
      ':boardname': boardName,
    },
  };

  let result;
  try {
    board = await docClient.query(params).promise();
    if (board.Items.length === 0) {
      result = false;
    } else {
      result = await bcryptjs.compare(passCode, board.Items[0].Passcode);
    }
    return result;
  } catch (error) {
    return error;
  }
}
// come to this after posting all notes functionality is done
router.post('/board/verifyPinAndBoardName', cors(corsOptions), async (req, res) => {
  passCode = req.body.Passcode;
  boardName = req.body.BoardName;

  const result = await verifyPinAndBoardName(passCode, boardName);

  if (typeof result !== 'boolean') {
    res.send(JSON.stringify(result));
  }

  res.status(200);
  res.send(result);
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
    TableName: TABLE_BOARD,
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
  passCode = req.body.Passcode;

  if (isEmpty(boardName) || !isNameValid(boardName)) {
    errorReturn(404, 'Board Name is invalid', res);
    return;
  }

  hashedPassCode = await bcryptjs.hash(passCode, saltRounds);

  const params = {
    TableName: TABLE_BOARD,
    Item: {
      BoardId: boardId,
      BoardName: boardName,
      Passcode: hashedPassCode,
      ColumnsName: [],
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
  if (!('BoardId' in req.params)) {
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
    TableName: TABLE_BOARD,
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
    case false:
      {
        const params1 = {
          TableName: TABLE_BOARD,
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
          res.status(200).send();
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
    TableName: TABLE_BOARD,
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
        TableName: TABLE_BOARD,
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

async function SaveAllNotes(boardId, boardName, passcode) {}

async function SaveNotesOneByOne(req, res) {
  /** @type {Note} */
  const noteData = req.body.singleNote;

  switch (isNoteDataValid(noteData)) {
    case false:
      errorReturn(400, 'Note data is invalid', res);
      return;
    case true:
    default:
  }

  // noteID = req.body.noteId;
  const singleNote = {
    note_id: uuidv4(),
    topic: noteData,
    dateCreated: Date.now(),
    status: 'Inserted',
  };

  const params = {
    TableName: TABLE_BOARD,
    Key: {
      BoardId: boardID,
    },
  };

  board = await docClient.get(params).promise();

  if (!board) {
    // eslint-disable-next-line consistent-return
    return errorReturn(404, 'Board not found', res);
  }

  const updateBoard = {
    TableName: TABLE_BOARD,
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

router.patch('/board/:BoardId/columns', async (req, res) => {
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

  const params = {
    TableName: TABLE_BOARD,
    Key: {
      BoardId: boardID,
    },
  };
  board = await docClient.get(params).promise();

  switch (isEmpty(board.Items)) {
    case true:
      errorReturn(404, 'Board not present in the database', res);
      return;
    case false:
    default:
  }

  boardColumns = req.body.Columns;

  const updateBoard = {
    TableName: TABLE_BOARD,
    Key: {
      BoardId: boardID,
    },
    UpdateExpression: 'SET ColumnNames = :colColumnNames',
    ExpressionAttributeValues: {
      ':colColumnNames': docClient.createSet(boardColumns),
    },
  };

  try {
    await docClient.update(updateBoard).promise();
    res.send(200);
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
    boardName = req.params.BoardName;
    passCode = req.params.Passcode;
  }

  switch (isIdAlphaNumeric(boardID)) {
    case false:
      errorReturn(400, 'Board Id is not valid', res);
      return;
    case true:
    default:
  }

  // await SaveAllNotes(boardID, boardName, passCode);

  await SaveNotesOneByOne(req, res);
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
    TableName: TABLE_BOARD,
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
        TableName: TABLE_BOARD,
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

  /** @type {Note} */
  const textForNote = req.body.singleNote;

  switch (isNoteDataValid(textForNote)) {
    // typeof textForNote === 'string'
    case false:
      errorReturn(400, 'Data is invalid', res);
      break;
    case true:
    default:
  }

  const params = {
    TableName: TABLE_BOARD,
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

  /**
   * index number of noteID in board_notes array
   * @type {number | null }
   */
  const noteIndex = board.Items[0].board_notes.reduce((acc, note, idx) => {
    return note.note_id === noteID ? (acc = idx) : acc;
  }, null);

  /** @type {AWS.DynamoDB.DocumentClient.UpdateItemInput} */
  const updateNoteParams = {
    TableName: TABLE_BOARD,
    Key: {
      BoardId: boardID,
    },
    UpdateExpression: `SET board_notes[${noteIndex}].topic = :noteText`,
    ExpressionAttributeValues: {
      ':noteText': textForNote,
    },
    ReturnValues: 'ALL_NEW',
  };

  // let updateNote;
  // let note;

  // for (note in board.Items.find(Boolean).board_notes) {
  //   if (board.Items.find(Boolean).board_notes[note].note_id === noteID) {
  //     isNotePresent = true;
  //     updateNote = {
  //       TableName: TABLE_NAME,
  //       Key: {
  //         BoardId: boardID,
  //       },
  //       UpdateExpression: `SET board_notes[${note}].topic = :noteText`,
  //       ExpressionAttributeValues: {
  //         ':noteText': textForNote,
  //       },
  //     };
  //     break;
  //   }
  // }

  try {
    switch (noteIndex !== null) {
      // isNotePresent
      case true:
        await docClient.update(updateNoteParams).promise();
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
    TableName: TABLE_BOARD,
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

if (process.env.NODE_ENV === 'development') {
  const PORT = 3000;
  /** uncomment for local testing */
  app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
  });
  console.log('-----> server listening in developement mode...');
  /** uncomment for local testing */
}

module.exports = app;
