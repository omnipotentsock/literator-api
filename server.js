// check for environment variables
if (!process.env.CLOUDANT_URL || !process.env.CLOUDANT_APIKEY) {
  console.error('Please create CLOUDANT_URL & CLOUDANT_APIKEY environment variables before running. See README for details.')
  process.exit(1)
}

const express = require('express')
const bodyParser = require('body-parser')

const { CloudantV1 } = require('@ibm-cloud/cloudant')
const client = CloudantV1.newInstance()
const USERDB = 'users'
const STORYDB = 'stories'

// constants
const PORT = 8080
const HOST = '0.0.0.0'

// the express app
const app = express()
app.use(express.static('public'))
app.use(bodyParser.json())

// POST /register endpoint for registering users
app.post('/api/register', async (req, res) => {
  console.log('POST /api/register')
  const user = req.body

  const response = await client.postDocument({
    db: USERDB,
    document: user
  })

  res.send(response)
})

app.post('/api/stories/addstoryboard', async (req, res) => {
  console.log("POST /api/stories/addstoryboard");
  const storyboard = req.body

  const response = await client.postDocument({
    db: STORYDB,
    document: storyboard
  })
})

// GET /users endpoint
app.get('/api/users', async (req, res) => {
  console.log('GET /api/users')
  // get users in reverse chrono order, limit 50
  const response = await client.postFind({
    db: USERDB,
    selector: {},
    sort: [{
      dateCreated: 'desc'
    }],
    limit: 50
  })
  res.send({
    ok: true,
    response: response.result.docs
  })
})

app.get('/api/users/bytag', async (req, res) => {
  console.log('GET /api/users/bytag')
  // get all users by tag in reverse chrono order
  const tag = req.query.tag
  const response = await client.postFind({
    db: USERDB,
    selector: {tag:tag},
    sort: [{
      dateCreated: 'desc'
    }],
    limit: 50
  })
  res.send({
    ok: true,
    response: response.result.docs
  })
})

// DELETE /users endpoint
app.delete('/api/users', async (req, res) => {
  console.log('DELETE /users')
  const todo = req.body

  await client.deleteDocument({
    db: USERDB,
    docId: todo._id,
    rev: todo._rev
  })
  res.send({ ok: true })
})


// Just for debugging !!
const populateUsers = async function () {
  // find out if the db exists and if not create it

  try {
    await client.getDatabaseInformation({db:USERDB})
    //if you get here the db exists so do nothing
    console.log("Database exists")
    return
  } catch (error) {
    //if you end up here you need to create the db
    console.log("Database does not exist. Creating...")
  }
  try {
    await client.putDatabase({db:USERDB})

    //now create the indexes
    await client.postIndex({
      db: USERDB,
      ddoc: 'bydate-index',
      name: 'getUsersByAge',
      index: {fields:["dateCreated"]},
      type: 'json'
    })
    
    await client.postIndex({
      db: USERDB,
      ddoc: 'bytag-index',
      name: 'getUsersByTag',
      index: {fields:["tag", "dateCreated"]},
      type: 'json'
    })

    //now add some sample data

    await client.postDocument({
      db:USERDB,
      document: {
        username: "zazapachulia",
        dateCreated: new Date().toISOString(),
        tag: "verified",
        contributions: []
      }
    })
    await client.postDocument({
      db:USERDB,
      document: {
        username: "LaVar James",
        dateCreated: new Date().toISOString(),
        tag: "unverified",
        contributions: []
      }
    })
  } catch (error) {
    console.log("Failed to create database or indexes: ", error)
    return
  }
  
}

const createStoryboards = async function() {
  try {
    await client.getDatabaseInformation({db: STORYDB})
    console.log("Storyboard DB exists");
    return
  }
  catch(error){
    console.log("Database DNE, creating storyboard database...");    
  }

  try {
    await client.putDatabase({db: STORYDB})
  } catch (error) {
    console.log("Error creating database lol haha get rekt git pwnde");
    
  }
}

const main = async function () {

  await populateUsers();
  await createStoryboards();

  // start the webserver
  app.listen(PORT, HOST)
  console.log(`Running on http://${HOST}:${PORT}`)
}

main()
