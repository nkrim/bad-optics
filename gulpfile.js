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

// Globals
const RELEASES_FILE = 'releases.json';

function html() {
	let releases_config = JSON.parse(fs.readFileSync(RELEASES_FILE));
  	return src('index-template.pug')
  		.pipe(rename('index.pug'))
    	.pipe(pug({
    		'pretty': true,
    		'locals': releases_config
    	}))
    	.pipe(dest('build'));
}

function css() {
  	return src('src/css/*.css')
		.pipe(sourcemaps.init())
		.pipe(postcss([ autoprefixer() ]))
		.pipe(minifyCSS())
		.pipe(sourcemaps.write('.'))
		.pipe(dest('build/static/css'))
}

function js() {
  	return src('src/js/*.js')
  		.pipe(sourcemaps.init())
	  	.pipe(babel())
	    .pipe(concat('app.min.js'))
	    .pipe(uglify())
	    .pipe(sourcemaps.write("."))
	    .pipe(dest('build/static/js'));
}

function resources() {
	return src('resources/**/*').pipe(dest('build/'));
}

function clean() {
	return del('build/*');
}

exports.clean = clean
exports.resources = resources
exports.js = js;
exports.css = css;
exports.html = html;
exports.default = series(clean, parallel(html, css, js, resources));
