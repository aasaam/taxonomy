const { program } = require('commander');

const DB = require('./src/DB');
const {
  parseGoogle,
  loadVerticals,
  loadI18n,
  saveI18nTemp,
  distributeDB,
  SUPPORTED_LANGUAGES,
} = require('./src/functions');

program
  .command('verticals')
  .description('Process verticals and update db.json')
  .action(() => {
    const db = new DB();
    parseGoogle(db);
    loadVerticals(db);
    db.save();
  });

program
  .command('i18n')
  .description('Dump csv for translate')
  .action(() => {
    const db = new DB();
    db.load();
    const result = db.getResult();
    SUPPORTED_LANGUAGES.forEach((lang) => {
      const { csv, translate } = loadI18n(lang);
      console.log([lang, csv]);
      const requireTranslate = [];
      result.forEach(({ path, name }) => {
        if (!translate[path]) {
          requireTranslate.push({
            Path: path,
            Name: name,
            Translate: '',
          });
        }
      });
      saveI18nTemp(lang, requireTranslate);
    });
  });

program
  .command('dist')
  .description('Distribute data')
  .action(() => {
    const db = new DB();
    db.load();
    distributeDB(db);
  });

program.parse(process.argv);
