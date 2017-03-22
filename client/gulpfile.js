const jetpack = require('fs-jetpack');
const electron = require('electron');
const spawn = require('child_process').spawn;
const gulp = require('gulp');
const less = require('gulp-less');
const watch = require('gulp-watch');
const sourcemaps = require('gulp-sourcemaps');
const rollup = require('gulp-better-rollup');
const buble = require('rollup-plugin-buble');
const cjs = require('rollup-plugin-commonjs');
const istanbul = require('rollup-plugin-istanbul');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require('./package.json');
const builtins = require('./scripts/builtins.json');

// Files that specific plugins shouldn't touch
const exclude = ['node_modules/**', '**/*.autogenerated', '**/*.less'];

// Modules that don't need to/shouldn't be bundled
const externalAll = Object.keys(pkg.dependencies).concat(builtins);

const externalDev = externalAll.concat(Object.keys(pkg.devDependencies));

const pluginsAll = [
  cjs(),
  buble({
    exclude,
    target: { chrome: 50 }
  }),
  resolve({
    main: true,
    jsnext: true,
    browser: true
  }),
];

const cache = [];

// Creates a master file for tests
function generateSpecFile() {
  const files = jetpack.cwd('src').find('.', { matching: '*.spec.js*' });
  const output = files.map((path) => {
    const new_path = path.replace(/\\/g, '/');
    return `import './${new_path}';`;
  }).join('\n');
  jetpack.cwd('src').write('specs.js.autogenerated', output);
}

// Rolls up <fileName> from src and puts it in app folder
function compile(taskName, fileName, external, plugins) {
  gulp.task(taskName, () =>
    gulp.src(`src/${fileName}`)
      .pipe(sourcemaps.init())
      .pipe(rollup({
        external,
        plugins,
        cache
      }, {
        format: 'cjs'
      }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('app'))
  );
}

function watchAndRun(watchPattern, task) {
  watch(`src/${watchPattern}`, () =>
    gulp.start(task)
  );
}

// Unit Tests
generateSpecFile();
compile('build-tests', 'specs.js.autogenerated', externalDev, pluginsAll.concat([istanbul({
  exclude: exclude.concat(['**/*.spec.js*']),
})]));

// App
compile('build-app-foreground', 'app.js', externalAll, pluginsAll);

// Background
compile('build-app-background', 'background.js', externalAll, pluginsAll);

// Less
gulp.task('build-style', () =>
  gulp.src('src/stylesheets/*')
    .pipe(less())
    .pipe(gulp.dest('app/stylesheets'))
);

// Complete gulp tasks
gulp.task('build', ['build-style', 'build-app-foreground', 'build-app-background']);
gulp.task('build-testing', ['build', 'build-tests']);

// Watch
gulp.task('watch', () => {
  watchAndRun('**/*.js*', 'build-app-foreground');
  watchAndRun('background.js', 'build-app-background');
  watchAndRun('stylesheets/*', 'build-style');
});

// Run
gulp.task('start', ['build', 'watch'], () => {
  spawn(electron, ['.'], { stdio: 'inherit' })
    .on('close', process.exit);
});