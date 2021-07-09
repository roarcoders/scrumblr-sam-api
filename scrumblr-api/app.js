'use strict'
const express = require('express')
const app = express()
const router = express.Router()
const LorenIpsum = require('lorem-ipsum').loremIpsum
const port = 3000
const { v4: uuidv4 } = require('uuid')
const AWS = require('aws-sdk')

router.use(express.json())
router.use(express.urlencoded({extended: true}))

AWS.config.update({
    region:'ap-southeast-2',
    endpoint:'arn:aws:dynamodb:ap-southeast-2:660741582805:table/scrumblr-api-ScrumblrDB-1IS0A6PFAQEK7'
})

const docClient = new AWS.DynamoDB.DocumentClient()

const table = 'scrumblr-api-ScrumblrDB-1IS0A6PFAQEK7'

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
router.get("/", function(req, res){
    let board = {
        board_id: uuidv4(),
        board_notes: [
            {
                "note_id": uuidv4(),
                "topic": new LorenIpsum(),
                "creation_date": Date.now()
            },
            {
                "note_id": uuidv4(),
                "topic":new LorenIpsum(),
                "creation_date": Date.now()
            },
            {
                "note_id":uuidv4(),
                "topic":new LorenIpsum(),
                "creation_date": Date.now()
            }
        ]
    }
    DevCop.push(board);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(DevCop));
})

//List all boards in memory(array)
router.get("/board", async(req, res) => {
    let params = {
        TableName: table
    }

    const data = await docClient.scan(params).promise();
    res.send(JSON.stringify(data))
})

//Get a particular board
router.get("/board/:boardId", async(req,res) => {

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
    let result

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
                result = await docClient.get(params1).promise();
            } catch (error) {
                res.send(JSON.stringify(error))
            }
        }
    }
    res.send(JSON.stringify(result))
})

//Create a new board
router.post('/board', async(req, res) => {
    const boardId = uuidv4();

    let params = {
        TableName : table,
        Item: {
            BoardId: boardId,
            board_notes: [

            ]
        }
    }

    try{
     await docClient.put(params).promise();
    } catch (error){
        res.send(JSON.stringify(error))    
    }
    res.send(JSON.stringify(params))
})

//Delete a specific board
router.delete('/board/:boardId', async(req, res) => {
    let board_id

    if(!('boardId' in req.params)){
        board_id = ""
    }else{
        board_id = req.params.boardId
    }

    let params = {
        TableName: table
    }

    let boards = await docClient.scan(params).promise();
    let deleteBoard
    
    for(let board in boards.Items){
        if(boards.Items[board].BoardId === board_id){
            let params1 = {
                TableName: table,
                Key: {
                    "BoardId": board_id
                }
            }
            try {
                deleteBoard = await docClient.delete(params1).promise();
                res.send(JSON.stringify("deleted successfully"))
            } catch (error){
                res.send(JSON.stringify("Error occured while deleting -> " + error))
            }
        }
    }
})

//Create a note for a specified board
router.post('/board/:boardId/note', async(req, res) => {
    let board_id
    if(!('boardId' in req.params)){
        board_id = ""
    }else {
        board_id = req.params.boardId
    }

    const textForNote = req.body.singleNote
    const singleNote = {
        "note_id": uuidv4(),
        "topic": textForNote,
        "dateCrated": Date.now()
    }

    let params = {
        TableName:table
    }
    
    let boards = await docClient.scan(params).promise();
    for (let board in boards.Items){
        if(boards.Items[board].BoardId === board_id){

            let updateBoard = {
                TableName: table,
                Key:{
                    "BoardId": board_id
                },
                UpdateExpression: "SET board_notes = list_append(board_notes,:note)",
                ExpressionAttributeValues: {
                    ":note": [singleNote]
                }
            }

            try {
                await docClient.update(updateBoard).promise();
                res.send(JSON.stringify("Note Inserted Successfully"))  
            } catch (error) {
                res.send(JSON.stringify(error))
            }
        }
    }
})

// Delete a particular note from a particular board
router.delete('/board/:boardId/note/:noteId', async(req, res) => {
    let board_id
    let note_id

    if (!('boardId' in req.params) && ('notedId' in req.params)){
        board_id = ""
        note_id = ""
    }
    else{
        board_id = req.params.boardId
        note_id = req.params.noteId
    }

    let params = {
        TableName: table
    }

    let boards = await docClient.scan(params).promise();
    
    for (let board in boards.Items){
        if(boards.Items[board].BoardId === board_id){
            for(let note in boards.Items[board].board_notes){
                if(boards.Items[board].board_notes[note].note_id === note_id){
                    
                    let deleteNote = {
                        TableName: table,
                        Key: {
                            "BoardId": board_id
                        },
                        UpdateExpression: "REMOVE board_notes[" + note + "]"
                    }

                    try {
                        await docClient.update(deleteNote).promise();
                        res.send(JSON.stringify("Note deleted successfully"))
                    } catch (error){
                        res.send(JSON.stringify("Error occurred : " + error))
                    }
                }
            }   
        }
    }
})

// Update a specific note
router.patch('/board/:boardId/note/:noteId', async(req,res) => {
    let note_id
    let board_id

    if(!('boardId' in req.params) && ('noteId' in req.params)){
        note_id = ""
        board_id = ""
    }else{
        note_id = req.params.noteId
        board_id = req.params.boardId
    }

    const textForNote = req.body.singleNote

    let params = {
        TableName: table
    }

    let boards = await docClient.scan(params).promise();
    
    for (let board in boards.Items){
        if(boards.Items[board].BoardId === board_id){
            for(let note in boards.Items[board].board_notes){
                if(boards.Items[board].board_notes[note].note_id === note_id){
                    
                    let updateNote = {
                        TableName: table,
                        Key: {
                            "BoardId": board_id
                        },
                        UpdateExpression: "SET board_notes[" + note + "].topic = :noteText",
                        ExpressionAttributeValues : {
                            ":noteText": [textForNote]
                        }
                    }
                    
                    try {
                        await docClient.update(updateNote).promise();
                        res.send(JSON.stringify("Note Updated Successfully"));
                    } catch (error) {
                        res.send(JSON.stringify("An error occurred " + error));
                    }
                    
                }  
            }
        }
    }
})

// Get a specific note
router.get('/board/:boardId/note/:noteId', async(req, res) => {
    let note_id
    let board_id

    if(!('boardId' in req.params) && ('noteId' in req.params)){
        note_id = " "
        board_id = " "

    }else {
        note_id = req.params.noteId
        board_id = req.params.boardId
    }

    let params = {
        TableName: table,
        KeyConditionExpression: "BoardId = :boardId",
        ExpressionAttributeValues : {
            ":boardId": board_id
        }
    }

    let board = await docClient.query(params).promise();
    for (let note in board.Items){
        if (board.Items[note].board_notes[note].note_id === note_id){

            let params1 = {
                TableName:table,
                KeyConditionExpression: "BoardId = :board_id",
                FilterExpression: "contains(board_notes, :note)",
                ExpressionAttributeValues: {
                    ":board_id":board_id,
                    ":note":board.Items[note].board_notes[note]
                }
            }
            try{
                await docClient.query(params1).promise(); 
                res.send(JSON.stringify(board.Items[note].board_notes[note]))
            }catch(error){
                res.send(JSON.stringify(error))
            }
        }
    }
}) 

app.use('/', router)

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})

module.exports = app;