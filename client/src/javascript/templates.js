import fs from 'fs';
import Mustache from 'mustache';

const ready_event = new Event('templates_loaded');
const template_dir = __dirname + '/templates';

let template_db = {};

// Exported methods
const Templates = {
  generate: (template, data) => {
    return Mustache.render(template_db[template], data);
  }
}

// Load the templates
fs.readdir(template_dir, (err, files) => {

  let i = files.length;
  files.forEach(fname => {
    if (fname.indexOf('mst') + 1) {
      let template_name = fname.substring(0, fname.length - 4);

      template_db[template_name] = fs.readFileSync(template_dir + '/' + fname, {encoding: 'utf8'});

      console.log('Loaded template ' + template_name);

    }
    i--;
    if (i === 0) {
      document.dispatchEvent(ready_event);
    }
  });
});

export default Templates;
