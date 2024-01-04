const PORT = process.env.PORT || 3000;
const express = require('express');
const mongoose = require('mongoose');
const APP = express();
APP.use(express.json());

// await mongoose.connect('mongodb://127.0.0.1/my_database');

// MongoCreds: USER: grandonsmith Pass: HvXMQJi50TCmyb80
// mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@testapi.3dyzzyz.mongodb.net/?retryWrites=true&w=majority

const courses = [
    {id: 1, name: 'course1'},
    {id: 2, name: 'course2'},
    {id: 3, name: 'course3'},
]

APP.get('/', (req, res) => {
    res.send('hello world!');
})

APP.get('/api/courses', (req, res) => {
    res.send(courses)
})

APP.get('/api/courses/:id', (req, res) => {
   const course = courses.find(c => c.id === parseInt(req.params.id));
   if(!course) {
    //return 404 status
    res.status(404).send('course with given ID not found')
   }
   else {
    res.send(course)
   }
 })

APP.post('/api/courses', (req, res) => {
    // look into JOI package for validation
    //at top of file -> const Joi = require('joi');

    // const SCHEMA  = {
    //     name: Joi.string().min(3).required()
    // }

    // const RESULT Joi.validate(req.body, SCHEMA)

    if(!req.body.name || req.body.name.length < 3) {
        // 400 == bad request
        req.status(400).send('name is required and must be > 3 char');
        return;
    }
    const course = {
        id: courses.length + 1,
        name: req.body.name
    }
    courses.push(course);
    res.send(course);
})

APP.put('/api/courses/:id', (req, res) => {
    //look up course
    // if not existing, return 404
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if(!course) {
        //return 404 status
        res.status(404).send('course with given ID not found')
       }

    //validate
    // if invalid, return 400 - bad request

    //update course
})

APP.listen(PORT, () => console.log('listening on port...', PORT))

mongoose.connect('mongodb+srv://grandonsmith:HvXMQJi50TCmyb80@testapi.3dyzzyz.mongodb.net/?retryWrites=true&w=majority')