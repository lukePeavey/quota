#!/usr/bin/env

/* eslint-disable no-console */
require('dotenv').config()
const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const Quotes = require('../src/models/Quotes')
const Authors = require('../src/models/Authors')
const Tags = require('../src/models/Tags')

// Seeds the database with data from `quotes.json` and `authors.json`.
// This should be run when setting up a new database, or after modifying
// source data.
// --------------
console.log('==> Seeding database...')

const [dataDirectory] = process.argv.slice(2)
let _quotes
let _authors
let _tags

try {
  _quotes = fs.readFileSync(
    path.join(__dirname, '../', dataDirectory, 'quotes.json')
  )
  _authors = fs.readFileSync(
    path.join(__dirname, '../', dataDirectory, 'authors.json')
  )
  _tags = fs.readFileSync(
    path.join(__dirname, '../', dataDirectory, 'tags.json')
  )
} catch (error) {
  console.log('==> [ERROR] Invalid data directory')
  process.exit()
}

async function seedQuotes() {
  // Remove any existing data from the collection
  await Quotes.collection.deleteMany({})
  // Import the items from quotes.json
  const result = await Quotes.collection.insertMany(JSON.parse(_quotes))
  console.log(`==> Added ${result.insertedCount} documents to Quotes`)
}

async function seedAuthors() {
  // Remove any existing data from the collection
  await Authors.collection.deleteMany({})
  // Import the items from authors.json
  const result = await Authors.collection.insertMany(JSON.parse(_authors))
  console.log(`==> Added ${result.insertedCount} documents to Authors`)
}

async function seedTags() {
  // Remove any existing data from the collection
  await Tags.collection.deleteMany({})
  // Import the items from authors.json
  const result = await Tags.collection.insertMany(JSON.parse(_tags))
  console.log(`==> Added ${result.insertedCount} documents to Tags`)
}

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    Promise.all([seedQuotes(), seedAuthors(), seedTags()]).then(() => {
      console.log('==> Finished!')
      process.exit()
    })
  })
  .catch(error => {
    console.log('==> [ERROR] database connection failed')
    console.error(error)
    process.exit()
  })
