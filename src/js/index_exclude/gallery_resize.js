// GALLERYRESIZE SCRIPT
// ==================================================
let gallery_canvases = $('.gallery-section-canvas');
let prev_gallery_width = null;

function gallery_resize() {
	// Check for width change, if no change then return
	let gallery_width = $(window).width();
	if(gallery_width === prev_gallery_width)
		return;
	prev_gallery_width = gallery_width;

	// Determine if canvases need to be adjusted to flex mode
	gallery_canvases.each(function() {
		const flex_class = 'gallery-canvas-flex';
		let is_flex = $(this).hasClass(flex_class);
		let canvas_width = parseInt($(this).attr('canvas-width'));
		if(!is_flex && canvas_width > gallery_width)
			$(this).addClass(flex_class);
		else if(is_flex && canvas_width <= gallery_width)
			$(this).removeClass(flex_class);
	});
}

$(window).resize(gallery_resize);