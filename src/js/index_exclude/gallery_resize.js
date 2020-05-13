// GALLERYRESIZE SCRIPT
// ==================================================
let gallery_canvases = $('.gallery-section-canvas');
let prev_gallery_width = null;
let max_gallery_width = null;

function gallery_resize() {
	// Set max_gallery_width once
	if(max_gallery_width === null) {
		max_gallery_width = 0;
		gallery_canvases.each(function() {
			let canvas_width = parseInt($(this).attr('canvas-width'));
			if(canvas_width > max_gallery_width)
				max_gallery_width = canvas_width;
		})
	}
	// Check for width change, if no change then return
	let gallery_width = $(window).width();
	if(gallery_width === prev_gallery_width)
		return;
	prev_gallery_width = gallery_width;

	// Determine if canvases need to be adjusted to mobile mode
	let mobile_width_threshold = gallery_width < max_gallery_width;
	gallery_canvases.each(function() {
		const mobile_class = 'gallery-canvas-mobile';
		if(mobile_width_threshold)
			$(this).addClass(mobile_class);
		else
			$(this).removeClass(mobile_class);
	});
}

$(window).resize(gallery_resize);