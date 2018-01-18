module.exports = Differ

function Differ (left, right) {
  if (!(this instanceof Differ)) return new Differ(left, right)
  this.left = left
  this.right = right
  this.leftNodes = null
  this.rightNodes = null
}

Differ.prototype.next = function (cb) {
  var self = this

  this.nextLeft(function (err, l) {
    if (err) return cb(err)

    self.nextRight(function (err, r) {
      if (err) return cb(err)

      if (!r && !l) return cb(null, null)

      if (!r || !l) {
        self.leftNodes = self.rightNodes = null
        return cb(null, {left: l, right: r})
      }

      var kl = l[0].key
      var kr = r[0].key

      if (kl === kr) {
        if (same(l, r)) return self._skip(cb)
        // update / conflict
        self.leftNodes = self.rightNodes = null
        return cb(null, {left: l, right: r})
      }

      // sort keys - TODO: make sure the iterator also suffixes .key
      var sl = l[0].path.join('') + '@' + kl
      var sr = r[0].path.join('') + '@' + kr

      if (sl < sr) { // move left
        self.leftNodes = null
        cb(null, {left: l, right: null})
      } else { // move right
        self.rightNodes = null
        cb(null, {left: null, right: r})
      }
    })
  })
}

Differ.prototype._skip = function (cb) {
  // TODO: this can be greatly simplified
  var map = new Map()
  this.left._threads.forEach(function (t) {
    t.stack.forEach(index)
  })
  this.right._threads.forEach(function (t) {
    t.stack.forEach(index)
  })
  this.left._threads.forEach(function (t) {
    t.stack = t.stack.filter(filter)
  })
  this.right._threads.forEach(function (t) {
    t.stack = t.stack.filter(filter)
  })

  function index (s) {
    var k = s.node.feed + '@' + s.node.seq + '@' + s.i
    map.set(k, 1 + (map.get(k) || 0))
  }

  function filter (s) {
    var k = s.node.feed + '@' + s.node.seq + '@' + s.i
    return map.get(k) < 2
  }

  this.leftNodes = this.rightNodes = null
  this.next(cb)
}

Differ.prototype.nextRight = function (cb) {
  if (this.rightNodes) return cb(null, this.rightNodes)
  var self = this
  this.right.next(function (err, nodes) {
    if (err) return cb(err)
    self.rightNodes = nodes
    cb(null, nodes)
  })
}

Differ.prototype.nextLeft = function (cb) {
  if (this.leftNodes) return cb(null, this.leftNodes)
  var self = this
  this.left.next(function (err, nodes) {
    if (err) return cb(err)
    self.leftNodes = nodes
    cb(null, nodes)
  })
}

function same (l, r) {
  if (l.length !== r.length) return false
  // TODO: sort order should be same, but should verify that
  for (var i = 0; i < l.length; i++) {
    var a = l[i]
    var b = r[i]
    if (a.feed !== b.feed || a.seq !== b.seq) return false
  }
  return true
}