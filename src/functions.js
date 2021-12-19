const fs = require('fs');
const { execSync } = require('child_process');
const { resolve } = require('path');

const PROJECT_PATH = resolve(__dirname, '..');

const SUPPORTED_LANGUAGES = ['fa', 'ar', 'ur', 'tr', 'ku'];

const nest = (items, id = null, link = 'parent') =>
  items
    .filter((item) => item[link] === id)
    .map((item) => ({ ...item, children: nest(items, item.id) }));

/**
 * @param {import('./DB')} db
 * @returns {void}
 */
const parseGoogle = (db) => {
  const data = fs.readFileSync(`${PROJECT_PATH}/verticals/google.txt`, {
    encoding: 'utf8',
  });
  data
    .trim()
    .split('\n')
    .forEach((line) => {
      const fields = line.trim().split('\t');
      const parts = fields[2].split('/');
      const name = parts[parts.length - 1];
      parts.pop();
      const parent = parts.join('/');
      const path = fields[2];
      db.add('g', name, path, parent);
    });
};

/**
 * @param {import('./DB')} db
 * @returns {void}
 */
const loadVerticals = (db) => {
  const files = execSync(
    `find ${PROJECT_PATH}/verticals/aasaam -name *.txt -type f`,
    { encoding: 'utf8' }
  )
    .trim()
    .split('\n');

  files.forEach((path) => {
    const data = fs.readFileSync(path, { encoding: 'utf8' });
    data
      .trim()
      .split('\n')
      .forEach((line) => {
        const fields = line.trim().split('\t');
        const parts = fields[0].split('/');
        const name = parts[parts.length - 1];
        parts.pop();
        const parent = parts.join('/');
        const path = line.trim();
        db.add('a', name, path, parent);
      });
  });
};

/**
 * @param {String} lang
 * @returns {any}
 */
const loadI18n = (lang) => {
  const lines = fs
    .readFileSync(`${PROJECT_PATH}/i18n/${lang}.tsv`, {
      encoding: 'utf8',
    })
    .trim()
    .split('\n');
  lines.shift();
  const translate = {};
  const csv = [];
  lines.forEach((line) => {
    const [Path, Name, Translate] = line.trim().split('\t');
    if (translate[Path]) {
      throw new Error(`Duplicate path found on ${lang}: ${Path}`);
    }
    translate[Path] = Translate;
    csv.push({ Path, Name, Translate });
  });
  return {
    csv,
    translate,
  };
};

/**
 * @param {String} lang
 * @param {Object} data
 * @returns {void}
 */
const saveI18nTemp = (lang, data) => {
  fs.writeFileSync(
    `${PROJECT_PATH}/tmp/${lang}.tsv`,
    ['Path', 'Name', 'Translate', '\n'].join('\t')
  );
  const csv = [];
  data.forEach(({ Path, Name, Translate }) => {
    csv.push([Path, Name, Translate].join('\t'));
  });
  fs.appendFileSync(`${PROJECT_PATH}/tmp/${lang}.tsv`, csv.join('\n'));
};

/**
 * @param {import('./DB')} db
 * @returns {void}
 */
const distributeDB = (db) => {
  execSync(`rm -rf ${PROJECT_PATH}/dist/*`);

  const result = db.getResult();

  const fileDataEn = {};
  const fileDataEnArray = {};
  const filePathEn = `${PROJECT_PATH}/dist/names-en.json`;
  const filePathEnArray = `${PROJECT_PATH}/dist/names-array-en.json`;
  result.forEach(({ id, path, name }) => {
    fileDataEn[id] = name;
    const parts = path.split('/');
    parts.shift();
    fileDataEnArray[id] = parts;
  });
  fs.writeFileSync(filePathEn, JSON.stringify(fileDataEn));
  fs.writeFileSync(filePathEnArray, JSON.stringify(fileDataEnArray));

  const translateData = {};
  SUPPORTED_LANGUAGES.forEach((lang) => {
    const { translate } = loadI18n(lang);
    translateData[lang] = translate;
    const fileData = {};
    const filePath = `${PROJECT_PATH}/dist/names-${lang}.json`;
    result.forEach(({ id, path, name }) => {
      if (translate[path]) {
        fileData[id] = translate[path];
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(fileData));
  });

  const tree = [];
  const treeNames = [];
  result.forEach(({ id, name, parent }) => {
    tree.push({ id, parent });
    treeNames.push({ id, name, parent });
  });
  fs.writeFileSync(
    `${PROJECT_PATH}/dist/tree.json`,
    JSON.stringify(nest(tree))
  );
  fs.writeFileSync(
    `${PROJECT_PATH}/dist/tree-names.json`,
    JSON.stringify(nest(treeNames))
  );
};

module.exports = {
  parseGoogle,
  loadI18n,
  loadVerticals,
  saveI18nTemp,
  distributeDB,
  SUPPORTED_LANGUAGES,
};
