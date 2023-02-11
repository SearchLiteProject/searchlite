<p align="center">
  <img src="searchlite.svg" width="200px" align="center" alt="SearchLite logo" />
  <h1 align="center">SearchLite</h1>
  <p align="center">
    <a href="https://searchlite.org">https://searchlite.org</a>
    <br/>
    An easy to use search implementation using SQLite's `FTS5()` extension.
  </p>
</p>

<br/>
<br/>

# SearchLite

A backend library for Node.js which uses SQLite (via
[better-sqlite3](https://www.npmjs.com/package/better-sqlite3)) to provide you
an easy to use interface to the FTS5 (Full Text Search) extension.

ToDo: We also have a web server with an API and search UI at
[SearchLite Server](https://www.npmjs.com/package/@searchlite/searchlite-server).

ToDo: We also have some scripts which enable you to load documents locally at
[SearchLite Utils](https://www.npmjs.com/package/@searchlite/searchlite-utils).

Each of these projects use this SearchLite package.

## About

1. insert a number of documents into the search index
  - `dataset` so you can index recipes, a website, enron, whatever
  - `location` such as `https://example.com` or `file://path/to/filename.txt`
    or `id-123` ... must be unique per `dataset`
  - `title` such as "Unique Rocky Road"
  - `body` such as the recipe itself
2. uses a table called `doc` for the above document with those fields
3. interal: uses a Sqlite FTS5 virtual table called `ftsi` (for Full Text
   Search Index)
4. when searching, orders the results using BM25 where the weightings are:
  - `title` = 5
  - `body` = 3
  - `location` = 1

That's it really! Any questions?

## Synopsis

Firstly, you'll need `better-sqlite3` since you need to create a DB instance of
it to pass to us. Why? So that we don't take over your database and you can
still use it in whatever way you need. i.e. This search functionality is
additional to your DB.

```js
import Sqlite from 'better-sqlite3'
import SearchLite from '@searchlite/searchlite'

// create your own DB
const db = Sqlite('tmp/synopsis.db')

// as recommended by 'better-sqlite3'
db.pragma('journal_mode = WAL')

// here you can use `db` however you like
// create tables, insert data, query, etc

// create a new SearchLite instance
const sl = new SearchLite(db)

// add three documents (under the 'dataset=recipe')
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/easy-rocky-road',
  'Easy rocky road',
  'Great for a bake sale, a gift, or simply an afternoon treat to enjoy with a cup of tea, this rocky road is quick to make and uses mainly storecupboard ingredients.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/collection/chocolate-chip-cookie-recipes',
  'Chocolate chip cookie recipes',
  'Indulge in the ultimate sweet treat on your next tea break: homemade chocolate chip cookies. They pair perfectly with a cup of tea or glass of milk.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/the-big-double-cheeseburger-secret-sauce',
  'The ultimate beef burger',
  'Forget the takeaway and make these double decker homemade cheeseburgers. With gherkins, crisp lettuce and a secret sauce, they take some beating. Have with chips.'
)
sl.ens(
  'recipe',
  'https://www.bbcgoodfood.com/recipes/beef-burgers-learn-make',
  'Beef burgers – learn to make',
  'Learn how to make succulent beef burgers with just four ingredients. An easy recipe for perfect homemade patties'
)

// try some searches
console.log('recipe / chocolate:', sl.search('recipe', 'chocolate'))
console.log()

console.log('recipe / tea:', sl.search('recipe', 'tea'))
console.log()

console.log('recipe / beef:', sl.search('recipe', 'beef'))
console.log()
```

## Roadmap

* ability to add "terms" (i.e. key=value pairs) to each document. e.g. if you
  were indexing an "email", you might have "from=bob@example.com" or multiple
  "to=jane@example.com" and "to=dora@example.com". This allows you query on
  such terms as well, such as "all emails from bob@example.com"

* ability to add range values such as "quantity=26", "height=176" or
  "created=2023-02-10T01:26:33.554Z", so you can filter for such things as
  "created between 1 Jan 2022 and 31 Dec 2022"

* perhaps one day we allow for providing your own search fields instead of
  using only "location", "title", "body. e.g. "title", "description",
  "content", "profile", "whatever"

## Releases / Changelog

* v0.1.0 - first release
  * creates the DB schema when instantiated with a `better-sqlite3` DB
  * ins/upd/ens/del documents with "dataset", "location", "title", "body"
  * count all docs in a dataset
  * do a search (with weights) against "location", "title", "body"

# License

MIT - https://chilts.mit-license.org/2023

(Ends)
