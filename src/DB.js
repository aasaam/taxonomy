const fs = require('fs');
const crypto = require('crypto');
const { resolve } = require('path');

const PROJECT_PATH = resolve(__dirname, '..');

/**
 * @param {String} prefix
 * @param {String} str
 * @returns {Number}
 */
const hash = (prefix, str) => {
  return (
    prefix +
    crypto
      .createHash('md5')
      .update(str)
      .digest('base64')
      .replace(/[^a-z0-9]/gi, '')
      .substring(0, 5)
  );
};

class DB {
  constructor() {
    this.path = `${PROJECT_PATH}/db-verticals.json`;
    this.result = [
      {
        id: 'root',
        name: 'Uncategorized',
        parentName: '',
        parent: null,
        path: '/',
      },
    ];
    this.resultID = {};
    this.resultName = {};
    this.resultPath = {};
    this.lastID = 0;
  }

  add(prefix, name, path, parentName) {
    const id = hash(prefix, path);

    if (this.resultID[id]) {
      throw new Error(`Duplicate ID ${id}`);
    }
    if (this.resultName[name]) {
      throw new Error(`Duplicate name ${name}`);
    }
    if (this.resultPath[path]) {
      throw new Error(`Duplicate path ${path}`);
    }

    this.resultID[id] = name;
    this.resultName[name] = id;
    this.resultPath[path] = id;

    if (id > this.lastID) {
      this.lastID = id;
    }

    this.result.push({
      id,
      name,
      parentName,
      parent: this.resultPath[parentName] ?? 'root',
      path,
    });
  }

  getTranslateKeys() {
    return Object.keys(this.resultName);
  }

  getResult() {
    return this.resultPath;
  }

  getResult() {
    return this.result;
  }

  load() {
    this.result = JSON.parse(fs.readFileSync(this.path, { encoding: 'utf8' }));
    this.result.forEach(({ id, name, path }) => {
      this.resultID[id] = name;
      this.resultName[name] = id;
      this.resultPath[path] = id;
    });
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.result, null, 2));
  }
}

module.exports = DB;
