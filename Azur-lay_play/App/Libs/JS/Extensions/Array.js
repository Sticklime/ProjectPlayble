/**
 * Adds a `first` getter to arrays to retrieve the first element.
 */
Object.defineProperty(Array.prototype, "first", {
  get() {
    return this[0];
  },
});

/**
 * Adds a `last` getter to arrays to retrieve the last element.
 */
Object.defineProperty(Array.prototype, "last", {
  get() {
    return this[this.length - 1];
  },
});

/**
 * Returns a random element from the array.
 * @returns {*} A random element, or null if the array is empty.
 */
Array.prototype.randomElement = function () {
  return this.length === 0
    ? undefined
    : this[Math.floor(Math.random() * this.length)];
};

/**
 * Adds a value to the array if it does not already exist.
 * @param {*} value - The value to add.
 */
Array.prototype.add = function (value) {
  if (!this.includes(value)) this.push(value);
};

/**
 * Removes the first occurrence of a value from an array.
 * @param {*} value - The value to remove.
 * @returns {*} The removed value, or null if not found.
 */
Array.prototype.remove = function (value) {
  const index = this.indexOf(value);
  return index !== -1 ? this.splice(index, 1)[0] : null;
};

/**
 * Rotates the array by a specified number of steps.
 * @param {number} [count=1] - The number of steps to rotate.
 * @returns {Array} The rotated array.
 */
Array.prototype.rotate = function (count = 1) {
  const len = this.length;
  if (len === 0 || count % len === 0) return this;
  const offset = ((count % len) + len) % len;
  this.push(...this.splice(0, offset));
  return this;
};

/**
 * Finds the first element in the array that satisfies a callback.
 * @param {Function} callback - The callback function.
 * @returns {*} The first matching element, or null if none found.
 */
Array.prototype.findFirst = function (callback) {
  for (let i = 0; i < this.length; i++) {
    const result = callback(this[i], i, this);
    if (result) return result;
  }
  return null;
};
