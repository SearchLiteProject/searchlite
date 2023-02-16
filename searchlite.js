// ----------------------------------------------------------------------------
//
// searchlite.js
//
// An easy to use search implementation using SQLite's `FTS5()` extension.
//
// * https://www.sqlite.org/fts5.html
//
// ----------------------------------------------------------------------------

// DDL
// See "External Content Tables" (https://www.sqlite.org/fts5.html)
const ddlSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS
    doc(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      location TEXT NOT NULL,
      updates INTEGER NOT NULL DEFAULT 1,
      inserted DATETIME NOT NULL,
      updated DATETIME NOT NULL,

      UNIQUE(dataset, location)
    )
  ;

  CREATE VIRTUAL TABLE IF NOT EXISTS
    ftsi
  USING
    fts5(
      title,
      body,
      location,
      content = doc, -- from the 'doc' table
      content_rowid = 'id', -- use the 'doc.id' as the 'rowid',
      tokenize = porter -- use the "porter" stemmer (https://www.sqlite.org/fts5.html#porter_tokenizer)
    )
  ;

  -- triggers to keep the FTSI up to date
  CREATE TRIGGER IF NOT EXISTS doc_ai AFTER INSERT ON doc BEGIN
    INSERT INTO ftsi(rowid, location, title, body) VALUES (new.id, new.location, new.title, new.body);
  END;

  CREATE TRIGGER IF NOT EXISTS doc_ad AFTER DELETE ON doc BEGIN
    INSERT INTO ftsi(ftsi, rowid, location, title, body) VALUES('delete', old.id, old.location, old.title, old.body);
  END;

  CREATE TRIGGER IF NOT EXISTS doc_au AFTER UPDATE ON doc BEGIN
    INSERT INTO ftsi(ftsi, rowid, location, title, body) VALUES('delete', old.id, old.location, old.title, old.body);
    INSERT INTO ftsi(rowid, location, title, body) VALUES (new.id, new.location, new.title, new.body);
  END;

  CREATE TABLE IF NOT EXISTS
    term(
      doc_id INTEGER NOT NULL,
      field TEXT NOT NULL,
      value TEXT NOT NULL,

      UNIQUE(doc_id, field, value),
      FOREIGN KEY(doc_id) REFERENCES doc(id)
    )
  ;
`

// Docs
const getDocSql = `SELECT * FROM doc WHERE dataset = ? AND location = ?`
const insDocSql = `INSERT INTO doc(dataset, location, title, body, updates, inserted, updated) VALUES(?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now'))`
const updDocSql = `UPDATE doc SET title = ?, body = ?, updates = updates + 1, updated = strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now') WHERE dataset = ? AND location = ?`
const ensDocSql = `
  INSERT INTO
    doc(dataset, location, title, body, updates, inserted, updated)
  VALUES
    (?, ?, ?, ?, 1, strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now'))
  ON CONFLICT(dataset, location) DO UPDATE SET
    title = excluded.title,
    body = excluded.body,
    updates = updates + 1,
    updated = strftime('%Y-%m-%dT%H:%M:%S.%fZ', 'now')
  ;
`
const delDocSql = `DELETE FROM doc WHERE dataset = ? AND location = ?`
const searchSqlSubTableWithQuery = `
  SELECT
    doc.id,
    doc.dataset,
    doc.location, -- rank 1 below
    doc.title,    -- rank 5 below
    doc.body,     -- rank 3 below

    -- bm25(ftsi, 0, 0, 0, 0, 1) AS relevance -- all Zero!
    -- bm25(ftsi, 0, 0, 0, 1, 0) AS relevance -- all Zero!
    -- bm25(ftsi, 0, 0, 1, 0, 0) AS relevance -- only "location" is ranked (all -0.14415417884143727), neither title or location are.
    -- bm25(ftsi, 0, 1, 0, 0, 0) AS relevance -- only "body" is ranked (all -0.14415417884143727), neither body or location are.
    -- bm25(ftsi, 1, 0, 0, 0, 0) AS relevance -- only "title" is ranked (all -0.14415417884143727), neither title or body are.

    -- order is by number in the 'ftsi' table, not the order of cols in this query
    bm25(ftsi, 5, 3, 1, 0, 0) AS relevance -- all three are ranked, all with different ranking - this is correct!!!

  FROM
    ftsi
    JOIN doc ON (ftsi.rowid = doc.id)
  WHERE
    doc.dataset = ?
  AND
    ftsi MATCH ?
  ORDER BY
    relevance
`
const searchSqlSubTableNoQuery = `
  SELECT
    doc.id,
    doc.dataset,
    doc.location, -- rank 1 below
    doc.title,    -- rank 5 below
    doc.body,     -- rank 3 below
    0 AS relevance

  FROM
    ftsi
    JOIN doc ON (ftsi.rowid = doc.id)
  WHERE
    doc.dataset = ?
  ORDER BY
    doc.id
`
const searchWithQuerySql = `
  SELECT
    doc.*,
    json_group_array(term.field || ':' || term.value) AS terms
  FROM
    (${searchSqlSubTableWithQuery}) AS doc
    LEFT JOIN term ON (doc.id = term.doc_id)
  GROUP BY
    doc.id,
    doc.dataset,
    doc.location,
    doc.title,
    doc.body,
    doc.relevance
  ;
`
const searchNoQuerySql = `
  SELECT
    doc.*,
    json_group_array(term.field || ':' || term.value) AS terms
  FROM
    (${searchSqlSubTableNoQuery}) AS doc
    LEFT JOIN term ON (doc.id = term.doc_id)
  GROUP BY
    doc.id,
    doc.dataset,
    doc.location,
    doc.title,
    doc.body,
    doc.relevance
  ;
`
const countDocsSql = `SELECT count(*) AS count FROM doc WHERE dataset = ?`

// Terms
const insTermSql = `INSERT INTO term(doc_id, field, value) VALUES(?, ?, ?)`

const getTermsForDocIdSql = `select json_group_array(field || ':' || value) AS terms from term JOIN doc ON doc.id = term.doc_id where doc.id = ?;`

export default class SearchLite {
  constructor(db, debug) {
    this.db = db
    this.debug = Boolean(debug)

    // create our `doc` and `ftsi` tables and relevant triggers
    this.db.exec(ddlSql)

    // prepare all SQL
    this.getDocStmt = this.db.prepare(getDocSql)
    this.insDocStmt = this.db.prepare(insDocSql)
    this.updDocStmt = this.db.prepare(updDocSql)
    this.ensDocStmt = this.db.prepare(ensDocSql)
    this.delDocStmt = this.db.prepare(delDocSql)
    this.searchWithQueryStmt  = this.db.prepare(searchWithQuerySql)
    this.searchNoQueryStmt  = this.db.prepare(searchNoQuerySql)
    this.countDocsStmt = this.db.prepare(countDocsSql)

    this.insTermStmt = this.db.prepare(insTermSql)
    this.getTermsForDocIdStmt = this.db.prepare(getTermsForDocIdSql)

    this.insTrans = this.db.transaction((dataset, location, title, body, terms) => {
      const info = this.insDocStmt.run(dataset, location, title, body)
      this.log('ins()', 'info', info)

      const docId = info.lastInsertRowid

      // loop over all terms
      // if ( terms ) {
      for ( const [ field, values ] of Object.entries(terms) ) {
        for ( const value of values ) {
          this.insTermStmt.run(docId, field, value)
        }
      }
      // }

      return docId
    })
  }

  log(fn, name, obj) {
    if ( this.debug ) {
      console.log(`${fn} - ${name}:`, obj)
    }
  }

  print() {
    console.log('db:', this.db)
  }

  get(dataset, location) {
    const row = this.getDocStmt.get(dataset, location)
    this.log('get()', 'row', row)
    if ( !row ) {
      return
    }

    // const term = {}
    const result = this.getTermsForDocIdStmt.get(row.id)
    const terms = JSON.parse(result.terms)
    row.term = {}
    terms.forEach(t => {
      const [ field, value ] = t.split(/:/)
      row.term[field] = row.term[field] || []
      row.term[field].push(value)
    })

    return row
  }

  ins(dataset, location, title, body, terms = {}) {
    return this.insTrans(dataset, location, title, body, terms)
    // const info = this.insDocStmt.run(dataset, location, title, body)
    // this.log('ins()', 'info', info)
    // return info.lastInsertRowid
  }

  upd(dataset, location, title, body, terms) {
    const info = this.updDocStmt.run(title, body, dataset, location)
    this.log('upd()', 'info', info)
    return Boolean(info.changes)
  }

  // tries an insert but if it fails on `(dataset, location)` constraint, updates `title` and `body` instead
  ens(dataset, location, title, body) {
    const info = this.ensDocStmt.run(dataset, location, title, body)
    this.log('ens()', 'info', info)
    return info.lastInsertRowid
  }

  del(dataset, location) {
    const info = this.delDocStmt.run(dataset, location)
    this.log('del()', 'info', info)
    return Boolean(info.changes)
  }

  search(dataset, query, term) {
    if ( !dataset ) {
      throw new Error(`SearchLite: search() - provide a 'dataset'`)
    }

    const results = query ? this.searchWithQueryStmt.all(dataset, query) : this.searchNoQueryStmt.all(dataset)
    for ( const result of results ) {
      // make a place for the terms
      result.term = {}

      // check if there are any terms for this doc
      if ( result.terms === '[null]' ) {
        // nothing more to do, not even worth a `JSON.parse()`
        delete result.terms
        continue;
      }

      // parse the JSON of the 'terms' field
      const terms = JSON.parse(result.terms)
      delete result.terms

      // now loop over them all
      terms.forEach(t => {
        const [ field, value ] = t.split(/:/)
        result.term[field] = result.term[field] || []
        result.term[field].push(value)
      })
    }

    // Okay, and this is silly (and we'll absolutely do it in the query next
    // time) we'll just loop over each result and make sure any `terms` was
    // want are present. We promise, this is just to pass the tests first! :)
    term = term || {}
    const resultsWithExpectedTerms = []
    const numFieldsToMatch = Object.keys(term).length
    for ( const result of results ) {
      // For each field, we must have at least one value.
      //
      // e.g. if we want `{ cuisine: [ 'chinese' ], diet: [ 'vegetarian' ] }`
      // we **must** have both.
      //
      // e.g. if we want `{ cuisine: [ 'chinese', 'italian' ] }`
      // we **must** have either 'chinese' or 'italian'.
      console.log('result.term:', result.term)
      const matched = {}
      for ( const [ field, values ] of Object.entries(term) ) {
        console.log(`${field}:${values.join('+')}`)
        for ( const value of values ) {
          if ( field in result.term && result.term[field].includes(value) ) {
            matched[field] = true
          }
        }
      }
      console.log('matched:', matched)
      if ( numFieldsToMatch == Object.keys(matched).length ) {
        console.log('matched all fields asked for')
        resultsWithExpectedTerms.push(result)
      }
      else {
        console.log("didn't match all fields")
      }
    }

    this.log(`search(${dataset}, ${query})`, 'resultsWithExpectedTerms:', resultsWithExpectedTerms)
    return resultsWithExpectedTerms
  }

  count(dataset) {
    const row = this.countDocsStmt.get(dataset)
    return row.count
  }
}
