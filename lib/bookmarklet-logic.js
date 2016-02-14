
https://github.com/nkostelnik/gulp-s3
https://wyattjoh.ca/setup-gulp-upload-assets-s3/

// TODO check that we are on tictail.com - check for jQuery

(function () {
	var themeCache  = null
	    $editor     = $('.theme-editor'),
	    $btnPreview = $('.preview-button'),
	    $status     = $('#tbwStatus').length ? $ ('#tbwStatus') : $('<div id="tbwStatus">');

	function setStatus(msg, isConnected) {
		var prefix = '';
		if (isConnected) {
			prefix = 'Connected: listening for local theme changes...<br><br>';
		}
		$status.html(prefix + msg);
	}

	function poll() {
		clearTimeout(window._tictailLiveReloadPoll);
		jQuery.ajax({
			url:'https://localhost:8080/theme.mustache', dataType:'text',
			success: function(theme, status) {
				if (themeCache !== theme)  {
					setStatus('Theme updated at ' + (new Date()).toLocaleTimeString(), true);
					ace.edit($editor[0]).getSession().setValue(theme);
					$btnPreview.click();
					themeCache = theme; 
				}
			},
			error: function () {
				themeCache = null;
				setStatus('*** Error connecting to local dev server. Is ´gulp´ running? ***');
			}
		});
		window._tictailLiveReloadPoll = setTimeout(poll, 2000)
	}

	function disableEditor() {
		$editor.hide();
		$status.css({padding: '10'})
		$editor.after($status)
		setStatus('Connecting to local dev server...');
	}

	function init() {
		disableEditor();
		poll();
	}

	init();

}());