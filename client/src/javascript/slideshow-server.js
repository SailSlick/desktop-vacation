import { ipcMain as ipc } from 'electron';
import Wallpaper from './wallpaper-server';

let main_loop;

// Events

ipc.on('set-slideshow', (event, slideshow_paths_array, timer) => {
  let index = 0;
  if (main_loop) {
    clearInterval(main_loop);
  }
  event.sender.send('set-slideshow-done', 0);

  console.log('entering loop');
  main_loop = setInterval(() => {
    console.log('next image:', slideshow_paths_array[index], index);
    Wallpaper.set(slideshow_paths_array[index], (exitCode) => {
      if (exitCode !== 0) {
        console.error('Failed to set background', exitCode);
      }
      index = (index + 1) % slideshow_paths_array.length;
    });
  }, timer);
});

ipc.on('clearSlideshow', (event) => {
  console.log('clearing slideshow');
  clearInterval(main_loop);
  event.sender.send('set-slideshow-done', 0);
});
