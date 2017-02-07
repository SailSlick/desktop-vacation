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
    let template_name = fname.substring(0, fname.length - 4);

    fs.readFile(template_dir + '/' + fname, {encoding: 'utf8'}, (err, data) => {
      template_db[template_name] = data;
      console.log('Loaded template ' + template_name);
      i--;
      if (i === 0) {
        document.dispatchEvent(ready_event);
      }
    });
  });
});

export default Templates;
