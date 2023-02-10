// ----------------------------------------------------------------------------
//
//
//
//
//
//
//
//
// ----------------------------------------------------------------------------

// DDL
// See "External Content Tables" (https://www.sqlite.org/fts5.html)
const ddlSql = `
  CREATE TABLE IF NOT EXISTS
    doc(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      location TEXT NOT NULL,

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
      content_rowid = 'id' -- use the 'doc.id' as the 'rowid'
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
`
const getDocSql = `SELECT * FROM doc WHERE dataset = ? AND location = ?`
const insDocSql = `INSERT INTO doc(dataset, location, title, body) VALUES(?, ?, ?, ?)`
const updDocSql = `UPDATE doc SET title = ?, body = ? WHERE dataset = ? AND location = ?`
const ensDocSql = `
  INSERT INTO
    doc(dataset, location, title, body)
  VALUES
    (?, ?, ?, ?)
  ON CONFLICT(dataset, location) DO UPDATE SET
    title = excluded.title,
    body = excluded.body
  ;
`
const delDocSql = `DELETE FROM doc WHERE dataset = ? AND location = ?`
const searchSql = `
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
    this.searchStmt  = this.db.prepare(searchSql)
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
    return row
  }

  ins(dataset, location, title, body) {
    const info = this.insDocStmt.run(dataset, location, title, body)
    this.log('ins()', 'info', info)
    return info.lastInsertRowid
  }

  upd(dataset, location, title, body) {
    const info = this.updDocStmt.run(title, body, dataset, location)
    this.log('upd()', 'info', info)
    return info.changes
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

  search(dataset, query) {
    if ( !dataset || !query ) {
      throw new Error(`SearchLite: search() - provide both 'dataset' and 'query'`)
    }
    const results = this.searchStmt.all(dataset, query)
    this.log(`search(${dataset}, ${query})`, 'results', results)
    return results
  }
}
