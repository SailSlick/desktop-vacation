import fs from 'fs';
import path from 'path';
import { expect } from 'chai';
import Mustache from 'mustache';
import Templates from './templates';

describe('templates', () => {
  it('loads the templates', done =>
    document.addEventListener('templates_loaded', () => done(), false)
  );

  it('generates a template', (done) => {
    const data = { src: 'test.png' };
    const test_file = fs.readFileSync(path.join(__dirname, 'templates/image-gallery-item.mst'), { encoding: 'utf8' });
    expect(Templates.generate('image-gallery-item', data)).to.equal(Mustache.render(test_file, data));
    done();
  });
});
