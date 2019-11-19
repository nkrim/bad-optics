// Includes
const { src, dest, parallel } = require('gulp');
const fs = require('fs');
const pug = require('gulp-pug');
// const less = require('gulp-less');
// const minifyCSS = require('gulp-csso');
// const concat = require('gulp-concat');

// Globals
const RELEASES_FILE = 'releases.json';

function html() {
	let releases_config = JSON.parse(fs.readFileSync(RELEASES_FILE));
  	return src('index-template.pug')
    	.pipe(pug({
    		'pretty': true,
    		'locals': releases_config
    	}))
    	.pipe(dest('.'))
}

/*function css() {
  return src('client/templates/*.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(dest('build/css'))
}

function js() {
  return src('client/javascript/*.js', { sourcemaps: true })
    .pipe(concat('app.min.js'))
    .pipe(dest('build/js', { sourcemaps: true }))
}

exports.js = js;
exports.css = css;*/
exports.html = html;
exports.default = html;//parallel(html, css, js);
