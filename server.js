const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const env = process.env.NODE_ENV || 'development';

if (env === 'development') {
    const config = require('./config')[env];
    process.env.MONGODB_URI = config.DATABASE_URL;
}

// remove this and replace with the path to your Mongodb database
const DATABASE_URL = process.env.MONGODB_URI;

const _ = require('lodash');

// enable cors for cross-domain requests
app.use(cors())
app.use(bodyParser.json());

let db = undefined;

// tasks collection
const TASKS_COLLECTION = 'tasks';

MongoClient.connect(DATABASE_URL, (err, database) => {
    if (err) {
        return console.log(err);
    }
    db = database;
    app.listen(3002, () => {
        console.log('Listening on 3002');
    });
});

// returns array containing all tasks
app.get('/tasks', (req, res) => {
    db.collection(TASKS_COLLECTION).find().toArray((err, results) => {
        res.send(results);
    });
});

// creates a new task object and saves to database
app.post('/tasks', (req, res) => {
    let response = {
        ok: 0,
    };

    if (!_.isEmpty(req.body)) {

        const date = new Date();
        
        // create the new task
        const task = {
            text: req.body.text,
            parentId: req.body.parentId,
            completed: false,
            created: date.getTime(),
            modified: date.getTime(),
        };

        // save to the db
        db.collection(TASKS_COLLECTION).save(task, (err, result) => {
            if (err) {
                response = err;
            } else {
                response = result;
            }

            res.send(response);
        })
    }
});

// returns a specific task defined by the parameter
app.get('/tasks/:id', (req, res) => {

    // get the param
    const id = req.params.id;

    // check if id exists
    if (!_.isEmpty(id)) {

        // find the task and update fields
        db.collection(TASKS_COLLECTION).findOne(
            {
                _id: ObjectID(id),
            },
            {},
            (err, result) => {
                if (err) {
                    return res.send(err);
                }
                res.send(result);
            }
        );
    } else {
        res.send({
            ok: 0,
        });
    }
});

// updates an existing task defined by the parameter
app.put('/tasks/:id', (req, res) => {

    // get the param
    const id = req.params.id;

    // check if id exists
    if (!_.isEmpty(id)) {

        const date = new Date();
        
        // create task object with updated data
        const task = {
            modified: date.getTime(),
        };

        if (req.body.text) {
            task.text = req.body.text;
        }

        if (req.body.completed) {
            task.completed = req.body.completed;
        }

        // find the task and update fields
        db.collection(TASKS_COLLECTION).findOneAndUpdate(
            {
                _id: ObjectID(id),
            },
            {
                $set: {
                    text: task.text,
                    completed: task.completed,
                    modified: task.modified,
                },
            },
            {
                sort: {_id: -1},
                upsert: true,
            },
            (err, result) => {
                if (err) {
                    return res.send(err);
                }
                res.send(result);
            }
        );
    } else {
        res.send({
            ok: 0,
        });
    }
});

// delete an existing task defined by the parameter
app.delete('/tasks/:id', (req, res) => {

    // get the param
    const id = req.params.id;

    // check if id exists
    if (!_.isEmpty(id)) {
    
        db.collection(TASKS_COLLECTION).findOneAndDelete(
            {
                _id: ObjectID(id),
            },
            (err, result) => {
                if (err) {
                    return res.send(500, err);
                }
                res.send({
                    ok: 1,
                });
            }
        );
    } else {
        res.send({
            ok: 0,
        });
    }
});