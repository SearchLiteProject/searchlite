// node
import fs from 'node:fs'

// npm
import test from 'tape'
import Sqlite from 'better-sqlite3'

// local
import SearchLite from '../../searchlite.js'

const allDb = {}

// close and delete DB when finished
test.onFinish(() => {
  console.log('onFinish()')
  for ( const [ filename, db ] of Object.entries(allDb) ) {
    console.log(`Closing DB '${filename}'`)
    db.close()
    console.log(`Deleting DB '${filename}'`)
    fs.unlinkSync(filename)
  }
  console.log('Done')
})

export default function setup() {
  // setup
  const filename = '/tmp/' + Date.now() + '.db'
  const db = Sqlite(filename)
  const sl = new SearchLite(db)
  allDb[filename] = db

  return { test, filename, db, sl }
}

export function insDocs(sl, docs) {
  for ( const doc of docs ) {
    sl.ins(...doc)
  }
}
