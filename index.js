import browserslist from 'browserslist';
const { transform, browserslistToTargets } = require('lightningcss');
const path = require('path');
const replaceExt = require('replace-ext');
const PluginError = require('plugin-error');
const applySourceMap = require('vinyl-sourcemaps-apply');
const { Transform } = require('stream');

const PLUGIN_NAME = 'gulp-lightningcss';
let browsersListVersions = '>= 0.25%';

/**
 * e.g: '>= 0.25%' means the las two versions
 * Invoke this functions first before call gulpLightningcss
 * You can also pass the targets as an object or using browserlist
 * https://lightningcss.dev/transpilation.html#browser-targets
 *
 * @param {string} version
 */
const setBrowserlistVersions = (version) => {
  browsersListVersions = version;
};

const getBrowserListVersions = () => browsersListVersions;

let targets = browserslistToTargets(browserslist(getBrowserListVersions()));

function replaceExtension(fp) {
  return path.extname(fp) ? replaceExt(fp, '.css') : fp;
}

/**
 *
 * @param {object} opts
 * @param {boolean} opts.minify
 * @param {boolean} opts.sourceMap
 * @param {object | string} opts.targets
 * @param {string} opts.fileName
 * @param {object} opts.targets
 * @returns
 */
function gulpLightningcss(opts) {
  opts = opts || {};

  return new Transform({
    objectMode: true,
    transform(file, enc, cb) {
      if (file.isNull()) {
        cb(null, file);
        return;
      }

      if (file.isStream()) {
        this.emit(
          'error',
          new PluginError(PLUGIN_NAME, error, {
            fileName: file.path,
            showProperties: false,
          })
        );
      }

      const options = {
        targets,
        code: Buffer.from(file.contents.toString()),
        filename: file.path,
        sourceMap: false,
        minify: true,
        ...opts,
      };

      const { code, map } = transform(options);

      if (options.sourceMap && map) {
        const sourcemaps = JSON.parse(map);
        sourcemaps.file = replaceExtension(file.relative);
        sourcemaps.sources = sourcemaps.sources.map((filePath) => {
          return file.path === filePath
            ? replaceExtension(file.relative)
            : replaceExtension(path.relative(file.path, filePath));
        });
        applySourceMap(file, sourcemaps);
      }

      file.contents = Buffer.from(code);
      file.path = replaceExtension(file.path);

      this.push(file);
    },
  });
}

module.exports = {
  gulpLightningcss,
  setBrowserlistVersions,
};
