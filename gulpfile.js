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
// upload
const s3upload = require('gulp-s3-upload')({useIAM: true});


// Paths
const paths = {
	pug: {
		data: 'releases.json',
		index: 'pug_templates/index-template.pug',
		release: 'pug_templates/release-template.pug',
	},
	in: {
		css: 'src/css/*.css',
		js: ['src/js/*.js', '!src/js/index_exclude/*.js'],
		release_js: 
			[
				'index_exclude/loaded_release.js',
				'index_exclude/router_override.js',
				'invert.js',
				'scroll.js',
			].map(p => 'src/js/'+p),
		resources: 'resources/**/*',
	},
	out: {
		base: 'build/',
		html: 'build/',
		css: 'build/static/css/',
		js: 'build/static/js/',
	}
}

// Pug config
const pug_config = {
	// pretty: true,
};

// Pre-parse json
const releases = JSON.parse(fs.readFileSync(paths.pug.data));

// s3 Metadata
const s3meta = {'uploaded-via': 'gulp-s3-upload'};
const s3cache = 'max-age=315360000';

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
	    		Object.assign({locals: r}, pug_config)
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

// Upload
function upload() {
	return src(paths.out.base+'**/*')
		.pipe(s3upload({
			Bucket: 'badoptics.co',
			ACL: 'private',
			maps:{
				Metadata: () => s3meta,
				CacheControl: () => s3cache,
			},
		},{
			maxRetries: 5,
		}));
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
exports.build = series(clean, parallel(exports.html, css, exports.js, resources));
exports.upload = series(upload, ()=>Promise.resolve(console.log("NOTE: Remember to perform invalidations in cloudfront")));
exports.full = series(exports.build, exports.upload);
exports.default = exports.build;
