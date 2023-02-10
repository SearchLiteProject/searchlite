// local
import setup from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

// tests
test('small document inserts - tweets', t => {
  t.plan(3)

  const id1 = sl.ins('tweet', 'jack/20', '', 'just setting up my twttr')
  t.equal(id1, 1, 'inserted twttr')
  const id2 = sl.ins('tweet', 'realDonaldTrump/869766994899468288', '', 'Despite the constant negative press covfefe')
  t.equal(id2, 2, 'inserted covfefe')
  const id3 = sl.ins('tweet', 'WarrenBuffett/329993701524918272', '', 'Warren is in the house.')
  t.equal(id3, 3, 'inserted house')

  t.end()
})

test('get a tweet', t => {
  t.plan(1)

  const exp = {
    id: 3,
    dataset: 'tweet',
    location: 'WarrenBuffett/329993701524918272',
    title: '',
    body: 'Warren is in the house.',
    updates: 1,
  }

  const tweet = sl.get('tweet', 'WarrenBuffett/329993701524918272')
  delete tweet.inserted
  delete tweet.updated
  t.deepEqual(tweet, exp, "Got Warren's Tweet")

  t.end()
})

test('query tweets', t => {
  t.plan(1)

  const exp = [
    {
      id: 3,
      dataset: 'tweet',
      location: 'WarrenBuffett/329993701524918272',
      title: '',
      body: 'Warren is in the house.',
      relevance: -0.8106216455827525,
    },
  ]

  const results = sl.search('tweet', 'house')
  t.deepEqual(results, exp, "Found Warren's Tweet")

  t.end()
})

test('update a tweet', t => {
  t.plan(6)

  const isUpdated1 = sl.upd('wrong-dataset', 'WarrenBuffett/329993701524918272', '', '')
  t.deepEqual(isUpdated1, false, "No tweet updated #1")

  const isUpdated2 = sl.upd('tweet', 'does not exist', '', '')
  t.deepEqual(isUpdated2, false, "No tweet updated #2")

  const isUpdated3 = sl.upd('tweet', 'WarrenBuffett/329993701524918272', 'GONE', 'Not anymore!')
  t.deepEqual(isUpdated3, true, "Updated Warren's Tweet")

  const exp = {
    id: 3,
    dataset: 'tweet',
    location: 'WarrenBuffett/329993701524918272',
    title: 'GONE',
    body: 'Not anymore!',
    updates: 2,
  }

  const tweet1 = sl.get('tweet', 'WarrenBuffett/329993701524918272')
  t.notEqual(tweet1.inserted, tweet1.updated, 'inserted/updated are now different')
  delete tweet1.inserted
  delete tweet1.updated
  t.deepEqual(tweet1, exp, "Got Warren's newly updated Tweet")

  sl.upd('tweet', 'WarrenBuffett/329993701524918272', '1', '1')
  sl.upd('tweet', 'WarrenBuffett/329993701524918272', '2', '2')
  sl.upd('tweet', 'WarrenBuffett/329993701524918272', '3', '3')

  const tweet2 = sl.get('tweet', 'WarrenBuffett/329993701524918272')
  t.equal(tweet2.updates, 5, "Warren's Tweet now updated 5 times")

  t.end()
})

test('delete a tweet', t => {
  t.plan(3)

  const deleted1 = sl.del('tweet', 'WarrenBuffett/329993701524918272')
  t.deepEqual(deleted1, true, "Deleted Warren's Tweet")

  // query again
  const results = sl.search('tweet', 'house')
  t.deepEqual(results, [], "No results")

  // delete again
  const deleted2 = sl.del('tweet', 'WarrenBuffett/329993701524918272')
  t.deepEqual(deleted2, false, "Already deleted")

  t.end()
})
