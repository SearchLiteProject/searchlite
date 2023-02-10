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
