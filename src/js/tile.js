// TILE SCRIPT
// ==================================================
// Tile content initializer
let tile_content_top_offset = 30;
let tile_outer_height = 220;

function set_tile_content_container_positions() {
	$('.tile-content-container').each(function() {
		// Uninitialize tile
		$(this).removeClass('initialized');
		$(this).css('margin-bottom', '');
		$(this).css('height', '');
		// Set tile-content top position
		let tile = $(this).parent();
		let tile_top = $(tile).position().top;
		let tile_height = tile_outer_height;//$(tile).outerHeight(true);
		let top_val = tile_top + tile_height + tile_content_top_offset;
		$(this).css('top', top_val+'px');
		// Set tile-content height and tile margin-bottom
		let tile_content_outer_height = $(this).outerHeight(true);
		tile.css('margin-bottom', tile_content_outer_height+'px');
		let tile_content_height = $(this)[0].getBoundingClientRect().height;
		$(this).css('height', tile_content_height+'px');
		// Set tile-content to initialized
		$(this).addClass('initialized');
	});
}
set_tile_content_container_positions();

// Tile click handler
const tile_show_transition_duration = 200;
let tile_show_timeout = null;

$('.tile-borders').bind('click', function() {
	let tile = $(this).parent('.tile');
	if($(tile).hasClass('show')) {
		$(tile).removeClass('show');
		$(tile).removeClass('selected');
	}
	else {
		clearTimeout(tile_show_timeout);
		$('.tile.selected').removeClass('selected');
		$(tile).addClass('selected');
		if(tile_show_timeout !== null || $('.tile.show').length > 0) {
			$('.tile.show').removeClass('show');
			tile_show_timeout = setTimeout((() => {
				$(tile).addClass('show');
				tile_show_timeout = null;
			}).bind(tile), 
			tile_show_transition_duration+10);
		}
		else {
			$(tile).addClass('show');
		}
	}
});