import path from 'path';
import { spy } from 'sinon';
import { ipcRenderer as ipc } from 'electron';
import { should as chaiShould } from 'chai';
import Wallpaper from './wallpaper-client';

// Use 'should' style chai testing
chaiShould();

describe('Wallpaper Client', () => {
  const test_image_path = path.join(__dirname, '../build/icons/512x512.png');
  let ipcSpy;

  beforeEach(() => {
    ipcSpy = spy(ipc, 'send');
  });

  afterEach(() => {
    ipc.send.restore();
  });

  it('can set the wallpaper', (done) => {
    Wallpaper.set(test_image_path);
    ipcSpy.calledOnce.should.be.ok;
    ipcSpy.calledWith('set-wallpaper', test_image_path);
    done();
  });
});

