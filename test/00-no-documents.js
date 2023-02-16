// local
import setup from './util/setup.js'

// setup
const { test, filename, db, sl } = setup()

// tests
test('00-no-documents: just test nothingness', t => {
  t.plan(6)

  const count1 = sl.count('whatever')
  t.equal(count1, 0, "No docs yet")

  const doc = sl.get('foo', 'bar')
  t.equal(doc, undefined, "Nothing there")

  const isUpdated = sl.upd('no-dataset', 'an-id-1', 'Hello', 'World!')
  t.deepEqual(isUpdated, false, "No tweet updated")

  const isDeleted = sl.del('empty', 'set')
  t.deepEqual(isDeleted, false, "Nothing Deleted")

  const withQuery = sl.search('the-void', 'query')
  t.deepEqual(withQuery, [], 'No expected results')

  const noQuery = sl.search('no-query')
  t.deepEqual(noQuery, [], 'No expected results')

  t.end()
})
