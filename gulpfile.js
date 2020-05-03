// Includes
const { src, dest, series, parallel, lastRun } = require('gulp');
const del = require('del');
const log = require('fancy-log');
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
// resources
const cwebp = require('gulp-cwebp');
// upload
const s3upload = require('gulp-s3-upload')({useIAM: true});
// invalidate
const cloudfront = require('gulp-cloudfront-invalidate');


// Paths
const paths = {
	pug: {
		data: 'data.json',
		index: 'pug_templates/index-template.pug',
		release: 'pug_templates/release-template.pug',
		gallery: 'pug_templates/gallery-template.pug',
	},
	in: {
		css: 'src/css/*.css',
		js: ['src/js/*.js', '!src/js/index_exclude/*.js'],
		alt_js: {
			'release': [
				'index_exclude/loaded_release.js',
				'index_exclude/router_override.js',
				'invert.js',
				'scroll.js',
			],
			'gallery': [
				'index_exclude/loaded_gallery.js',
				'index_exclude/router_override.js',
				'invert.js',
				'scroll.js',
			],
		},
		resources: 'resources/**/*',
		resource_images: 'resources/static/img/**/*.{jpg,png}',
	},
	out: {
		base: 'build/',
		html: 'build/',
		css: 'build/static/css/',
		js: 'build/static/js/',
		webp: 'resources/static/img/',
	}
}

// Pug config
const pug_config = {
	// pretty: true,
};

// Pre-parse json
const data = JSON.parse(fs.readFileSync(paths.pug.data));

// s3 Metadata
const s3meta = {'uploaded-via': 'gulp-s3-upload'};
const s3cache = 'max-age=60,s-maxage=31536000';
const s3cache_browser = 'max-age=315360000,s-maxage=31536000';
const cfdistro = 'E2HS6DFR9V8QEP';

// Image quality
const image_quality = 85;


//=======================================================
// HTML - Pug
function index() {
  	return src(paths.pug.index)
  		.pipe(rename('index.pug'))
    	.pipe(pug(
    		Object.assign({'locals': data}, pug_config)
    	))
    	.pipe(dest(paths.out.html));
}
function release_pages() {
	return data.releases.map(r => (
		() => src(paths.pug.release)
			.pipe(pug(
	    		Object.assign({locals: r}, pug_config)
	    	))
	    	.pipe(rename(`${r.number}.html`))
			.pipe(dest(paths.out.html))
		)
	);
}
function gallery_pages() {
	return data.galleries.map(g => (
		() => src(paths.pug.gallery)
			.pipe(pug(
				Object.assign({locals: g}, pug_config)
			))
			.pipe(rename(`visual/${g.title.replace(/\s+/g, '-')}.html`))
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
function alt_js() {
	return Object.entries(paths.in.alt_js).map(([name, ps]) => {
		ps = ps.map(p => 'src/js/'+p);
		return () => src(ps)
			.pipe(sourcemaps.init())
		    .pipe(concat(name+'.min.js'))
		    .pipe(babel())
		    .pipe(uglify())
		    .pipe(sourcemaps.write("."))
		    .pipe(dest(paths.out.js))
		}
	);
}

// Resources
function move_resources() {
	return src([paths.in.resources])
		.pipe(dest(paths.out.base));
}
function webp_images() {
	return src(paths.in.resource_images)
		.pipe(cwebp({q: image_quality}))
		.pipe(dest(paths.out.webp));
}

// Upload
let changed_keynames = null;
function upload() {
	changed_keynames = [];
	return src(paths.out.base+'**/*')
		.pipe(s3upload({
			Bucket: 'badoptics.co',
			ACL: 'private',
			maps:{
				Metadata: () => s3meta,
				CacheControl: (k) => {
					if(/static\/img\//.exec(k)) {
						return s3cache_browser
					}
					return s3cache;
				}
			},
			onChange: (k) => {
				changed_keynames.push('/'+k);
			}
		},{
			maxRetries: 5,
		}));
}

// Invalidate
function invalidate_custom(paths) {
	return src('*').pipe(
		cloudfront({
			distribution: cfdistro,
			paths: paths,
		}));
}
function invalidate_changed() {
	if(changed_keynames === null || changed_keynames.length === 0)
		return Promise.resolve(log('-- No changes, skipping invalidations'));
	log('-- INVALIDATING:');
	changed_keynames.forEach(e => log('-- '+e));
	return invalidate_custom(changed_keynames);
}
function invalidate_index() {
	return invalidate_custom(['/index.html']);
}
function invalidate_html() {
	return invalidate_custom(['/*.html']);
}
function invalidate_js() {
	return invalidate_custom(['/static/js/*']);
}
function invalidate_css() {
	return invalidate_custom(['/static/css/*']);
}
function invalidate_all() {
	return invalidate_custom(['/*']);
}

// Cleanup
function clean() {
	return del(paths.out.base+'*');
}

// Exports - standard
exports.clean = clean
exports.resources = series(webp_images, move_resources)
exports.js = parallel(index_js, ...alt_js());
exports.css = css;
exports.html = parallel(index, ...release_pages(), ...gallery_pages());
// Exports - build combo
exports.build = series(clean, parallel(exports.html, css, exports.js, exports.resources));
// Exports - uploading
exports.upload = series(upload, invalidate_changed);
exports.upload_no_invalidate = upload;
exports.upload_ni = exports.upload_no_invalidate;
// Exports - invalidations
exports.invalidate_index = invalidate_index;
exports.invalidate_js = invalidate_js;
exports.invalidate_css = invalidate_css;
exports.invalidate_html = invalidate_html;
exports.invalidate_all = invalidate_all;
// Exports - combos
exports.full = series(exports.build, exports.upload);
exports.fresh = series(exports.build, exports.upload_no_invalidate, invalidate_all);
// Exports - default
exports.default = exports.build;
