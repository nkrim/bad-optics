// LOADED SCRIPT (FOR RELEASE PAGES)
// ==================================================
function setHtmlLoaded() {
	$('html').addClass('loaded');
}
$(document).ready(function() {
	//route_change(window.location.pathname);
	$(window).trigger('scroll');
	setTimeout(setHtmlLoaded, 50);
});