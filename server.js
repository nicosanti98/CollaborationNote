const express = require('express')
const app = express()
const path = require('path')
const port = process.env.PORT || 3001

app.use('/', express.static(__dirname+"login.html"))

app.listen(port, () => console.log("Listening on Port", port)) 
