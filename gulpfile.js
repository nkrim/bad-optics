// Includes
const { src, dest, series, parallel } = require('gulp');
const del = require('del');
// html
const fs = require('fs');
const pug = require('gulp-pug');
const rename = require('gulp-rename');
// js
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
// css
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const minifyCSS = require('gulp-csso');

// Paths
const paths = {
	'pug': {
		'data': 'releases.json',
		'index': 'index-template.pug',
		'release': 'release-template.pug',
	},
	'in': {
		'css': 'src/css/*.css',
		'js': ['src/js/*.js', '!src/js/index_exclude/*.js'],
		'release_js': 
			[
				'index_exclude/loaded_release.js',
				'index_exclude/router_override.js',
				'invert.js',
				'scroll.js',
			].map(p => 'src/js/'+p),
		'resources': 'resources/**/*',
	},
	'out': {
		'base': 'build/',
		'html': 'build/',
		'css': 'build/static/css/',
		'js': 'build/static/js/',
	}
}

// Pug config
const pug_config = {
	'pretty': true,
};

// Pre-parse releases json
const releases = JSON.parse(fs.readFileSync(paths.pug.data));

// HTML - Pug
function index() {
  	return src(paths.pug.index)
  		.pipe(rename('index.pug'))
    	.pipe(pug(
    		Object.assign({'locals': releases}, pug_config)
    	))
    	.pipe(dest(paths.out.html));
}
function release_pages() {
	return releases.releases.map(r => (
		() => src(paths.pug.release)
			.pipe(rename(`${r.number}.html`))
			.pipe(pug(
	    		Object.assign({'locals': r}, pug_config)
	    	))
			.pipe(dest(paths.out.html))
		)
	);
}

// CSS
function css() {
  	return src(paths.in.css)
		.pipe(sourcemaps.init())
		.pipe(postcss([ autoprefixer() ]))
		.pipe(minifyCSS())
		.pipe(sourcemaps.write('.'))
		.pipe(dest(paths.out.css))
}

// JS - babel
function index_js() {
  	return src(paths.in.js)
  		.pipe(sourcemaps.init())
	    .pipe(concat('index.min.js'))
	    .pipe(babel())
	    .pipe(uglify())
	    .pipe(sourcemaps.write("."))
	    .pipe(dest(paths.out.js));
}
function release_js() {
	return src(paths.in.release_js)
		.pipe(sourcemaps.init())
	    .pipe(concat('release.min.js'))
	    .pipe(babel())
	    .pipe(uglify())
	    .pipe(sourcemaps.write("."))
	    .pipe(dest(paths.out.js));
}

// Resources
function resources() {
	return src(paths.in.resources)
		.pipe(dest(paths.out.base));
}

// Cleanup
function clean() {
	return del(paths.out.base+'*');
}

// Exports
exports.clean = clean
exports.resources = resources
exports.js = parallel(index_js, release_js);
exports.css = css;
exports.html = parallel(index, ...release_pages());
exports.default = series(clean, parallel(exports.html, css, exports.js, resources));
