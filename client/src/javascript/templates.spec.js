import fs from 'fs';
import { expect } from 'chai';
import Templates from './templates';
import Mustache from 'mustache';

describe('templates', _ => {
    it('loads the templates', done =>
        document.addEventListener('templates_loaded', _ => done(), false)
    );

    it('generates a template', done => {
        let data = {src: 'test.png'};
        let test_file = fs.readFileSync(__dirname + '/templates/image-gallery-item.mst', {encoding: 'utf8'});
        expect(Templates.generate('image-gallery-item', data)).to.equal(Mustache.render(test_file, data));
        done();
    });
});
