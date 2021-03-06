/**
 *
 * @fileoverview provides file picking capability
 *
 */

goog.provide('colab.filepicker');

goog.require('colab.app');

/**
 * Public developer key. Used by picker.
 *
 * @see https://console.developers.google.com/\
 *   project/apps~colab-sandbox/apiui/credential
 * @type {string}
 * @const
 */
colab.filepicker.PUBLIC_DEVELOPER_KEY =
    'AIzaSyCoDfWuxLxqqLWfKVNqfHy7DIWudoPTeuk';


/**
 * App ID for Web App (this is a substring of the client ID).
 *
 * @type {string}
 * @const
 */
colab.filepicker.WEB_APP_KEY =
    'm2uip5p987oi948dikp8khomucgt1b5h';


/**
 * App ID for Chrome App (this is a substring of the client ID.
 *
 * @see https://console.developers.google.com/\
 *   project/apps~windy-ellipse-510/apiui/credential
 * @type {string}
 * @const
 */
colab.filepicker.CHROME_APP_KEY =
    '0tcrnl8lnu5b0ccgpp92al27pplahn5a';

/**
 * Upon successful file selection calls callback with
 * @param {function(Object)} cb Object is an instance of
 *     google.picker.Response
 * @param {boolean?} opt_upload Whether to display an "upload"
 *     tab in the filepicker (default false).
 */
colab.filepicker.selectFile = function(cb, opt_upload) {
  gapi.load('picker', function() {
    var view = new google.picker.DocsView();
    view.setMode(google.picker.DocsViewMode.LIST);
    // Default extension, user can change and search for any file he wants
    view.setQuery('ipynb');
    view.setIncludeFolders(true).setSelectFolderEnabled(false);
    view.setLabel('Everything');
    var samples = new google.picker.DocsView();
    samples.setMode(google.picker.DocsViewMode.LIST);

    // List sample notebooks
// TODO(colab-team): add sample notebooks for open repo. Put directory link here.
//    samples.setParent('Parent ID');
    samples.setLabel('Sample Notebooks');
    var byMe = new google.picker.DocsView();
    byMe.setOwnedByMe(true);
    byMe.setMode(google.picker.DocsViewMode.LIST);
    byMe.setIncludeFolders(true)
        .setSelectFolderEnabled(false);

    var mimeTypes = ('application/ipynb' +
        ',application/colab,application/ipy,' +
        'application/octet-stream,application/vnd');

    var recentlyPicked = new google.picker.View(
        google.picker.ViewId.RECENTLY_PICKED);
    recentlyPicked.setMimeTypes(mimeTypes);

    var picker = new google.picker.PickerBuilder()
        .addView(recentlyPicked)
        .addView(view)
        .addView(byMe)
        // .addView(samples)
        .setOAuthToken(gapi.auth.getToken().access_token)
        .setSelectableMimeTypes(mimeTypes)
        .setCallback(cb);

    if (opt_upload) {
        var upload = new google.picker.DocsUploadView();
        picker.addView(upload);
    }

    if (colab.app.appMode) {
      picker.setAppId(colab.filepicker.CHROME_APP_KEY);
    } else {
      picker.setAppId(colab.filepicker.WEB_APP_KEY);
    }

    var dlg = picker.build();
    dlg.setVisible(true);
  });
};

/**
 * Upon successful file selection calls callback with
 * @param {function(Object)} cb Object is an instance of
 * google.picker.Response
 */
colab.filepicker.selectDir = function(cb) {
  gapi.load('picker', function() {
    var docsView = new google.picker.DocsView()
      .setIncludeFolders(true)
      .setMimeTypes('application/vnd.google-apps.folder')
      .setSelectFolderEnabled(true);


    var picker = new google.picker.PickerBuilder()
      .setOAuthToken(gapi.auth.getToken().access_token)
      .addView(docsView)
      .setCallback(cb);

    if (colab.app.appMode) {
      picker.setAppId(colab.filepicker.CHROME_APP_KEY);
    } else {
      picker.setAppId(colab.filepicker.WEB_APP_KEY);
    }

    var dlg = picker.build();
    dlg.setVisible(true);
  });
};

/**
 * Selects a file and reloads colab on success.
 * @param {boolean?} opt_upload Whether to display an "upload"
 *     tab in the filepicker (default false).
 */
colab.filepicker.selectFileAndReload = function(opt_upload) {
  /** @param {Object} ev is json with fields listed in
   * google.picker.Response
  */
  var cb = function(ev) {
    var response = google.picker.Response;

    if (ev[response.ACTION] != google.picker.Action.PICKED) return;

    var doc = ev[response.DOCUMENTS][0];
    if (!doc || doc.length) return;
    var fileId = doc[google.picker.Document.ID];
    if (colab.app.appMode) {
      colab.app.postMessage('launch', {'fileId': fileId});
    } else {
      var url = colab.params.getNotebookUrl({'fileId': fileId });
      // If we are on notebook page, do proper reloading
      if (colab.reload) {
        window.location.href = url;
        colab.reload();
      } else {
        // This will reload the page once we exit this function.
        window.location.href = url;
      }
    }
  };
  colab.filepicker.selectFile(cb, opt_upload);
};
