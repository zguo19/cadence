// Helper function: Does the work of setting theme color for all meta tags
function setThemeColor(color) {
  document.getElementById("chrome-color").content = color;
  document.getElementById("ie-color").content = color;
}

// Function that starts playing the video for video themes
function setVideo(themeObj) {
  var video = document.getElementById("video-source");
  var filename = document.location.origin + themeObj.videoPath;
  // Loads the video source
  if (video.src !== filename) {
    video.src = filename;
    video.parentElement.load(); // The parent element of video is the div "fullscreen-bg"
  }
}

// Handles clicks
$(document).ready(function () {
  $('.themeChoice').on('click', function () {
    var themeChoice = $(this).attr('id');
    themeChanger(themeChoice);
  });
});

var callback = new CallbackInterface(null);

// The main theme setter function
function themeChanger(themeName) {
  // Returns the specific theme as a single object
  var themeObj = Object.assign({}, theme[themeName]);
  var currentHour = new Date().getHours();

  var t=themeObj;

  // Copy of callback to be called in posthooks
  var call=Object.assign({}, callback);
  Object.setPrototypeOf(call, callback.constructor.prototype);

  do {
      // Check if the theme wants us to load a random theme
      if (t===true) {
          // List of theme keys
          var keys=Object.keys(theme)

          // Remove the key for the rejected theme, plus all nightmodes
          keys = keys.filter(function(value, index, arr) {
              // Filter out the nightmodes first
              if (theme[value].hasNightMode) {
                  // This theme either is a nightmode or has one.
                  // Check if it ends in "Night"
                  if (value.endsWith("Night")) {
                      // This is probably a nightmode.
                      // But bugs will happen if a daymode theme is named, for example, tokyoNight.
                      // Therefore, make sure a theme exists which has the same name without the Night
                      if (arr.includes(value.substring(0, value.length-5))) {
                          // This theme is a nightmode. Scratch it.
                          return false;
                      }
                  }
              }

              return value!=themeObj.themeKey;
          });

          // Choose a random themeKey...
          var index=Math.floor(Math.random()*keys.length)

          // And set that theme as our theme
          t=theme[keys[index]]
      }

      // If the theme is blocked on mobile, and we're on mobile, default to chicagoEvening
      // Uses the same mobile check as Ken and I used back in the beginning, which is still used for pause
      if (t.blockMobile && /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
          var name=t.mobileTheme || 'chicagoEvening';
          themeObj=theme[name];
      }
      else {
          themeObj=t;
      }

      // Setup the theme's callback
      themeObj.callback = themeObj.callback || CallbackInterface;
      try {
        themeObj.callback = new themeObj.callback(themeObj);
      }
      catch(e) {
          themeObj.callback = new themeObj.callback.constructor(themeObj)
      }
  } while (t=themeObj.callback.preLoad(callback.theme));

  callback.preUnload(themeObj);

  // If a nightmode exists
  if (themeObj.hasNightMode == true) {
    // If it is nighttime
    if (currentHour < 8 || currentHour > 22) {
      themeObj.callback.nightmodeSwitch();
      themeNameNight = themeName + "Night";
      var themeObjNight;
      t = Object.assign({}, theme[themeNameNight]);
      themeObj.callback.preUnload(t);
      themeObj.callback.postUnload();
      do {
          // Check if the theme wants us to load a random theme
          if (t===true) {
              // List of theme keys
              var keys=Object.keys(theme)

              // Remove the key for the rejected theme, plus all nightmodes
              keys = keys.filter(function(value, index, arr) {
                  // Filter out the nightmodes first
                  if (theme[value].hasNightMode) {
                      // This theme either is a nightmode or has one.
                      // Check if it ends in "Night"
                      if (value.endsWith("Night")) {
                          // This is probably a nightmode.
                          // But bugs will happen if a daymode theme is named, for example, tokyoNight.
                          // Therefore, make sure a theme exists which has the same name without the Night
                          if (arr.includes(value.substring(0, value.length-5))) {
                              // This theme is a nightmode. Scratch it.
                              return false;
                          }
                      }
                  }

                  return value!=themeObj.themeKey;
              });

              // Choose a random themeKey...
              var index=Math.floor(Math.random()*keys.length)

              // And set that theme as our theme
              t=theme[keys[index]]
          }

          // Setup the theme
          themeObjNight = t;
          themeObjNight.callback = themeObjNight.callback || CallbackInterface;
          try {
            themeObjNight.callback = new themeObjNight.callback(themeObjNight);
          }
          catch(e) {
              themeObjNight.callback = new themeObjNight.callback.constructor(themeObjNight)
          }
      } while (t=themeObjNight.callback.preLoad(callback.theme));
      document.getElementById("selected-css").href = themeObjNight.cssPath;
      document.getElementById("title").innerHTML = themeObjNight.title;
      document.getElementById("subtitle").innerHTML = themeObjNight.subtitle;
      setThemeColor(themeObjNight.themeColor);
      localStorage.setItem('themeKey', themeObjNight.themeKey);
      // If the nightmode is a video theme
      if (themeObjNight.videoPath) {
        setVideo(themeObjNight);
      }

      // Schedule a theme reset shortly after daytime
      var time=new Date();
      var target=new Date();
      Object.assign(target,time);
      target.setHours(9);
      target.setMinutes(0);
      target.setSeconds(1); // Offset by one second just in case
      // Offset the day if its after 8 [since we can't be here if its not nighttime]
      if (time.getHours()>20) {
          target.setDate(target.getDate()+1);
      }
      var diff=target-time; // Milliseconds
      setTimeout(function() {
          themeObjNight.callback.daymodeSwitch();
          defaultTheme();
      }, diff); // Schedule a theme default for one second after 9 AM

      // Call the post hooks as soon as the thread becomes idle
      setTimeout(function() {
          call.postUnload();
          themeObjNight.callback.postLoad();
      }, 0)

      callback=themeObjNight.callback;
      return
    }
    // Else, set daytime and schedule a theme reset shortly after nighttime
    else {
      document.getElementById("selected-css").href = themeObj.cssPath;
      document.getElementById("title").innerHTML = themeObj.title;
      document.getElementById("subtitle").innerHTML = themeObj.subtitle;
      setThemeColor(themeObj.themeColor);
      localStorage.setItem('themeKey', themeObj.themeKey);
      if (themeObj.videoPath) {
        setVideo(themeObj);
      }

      var time=new Date();
      var target=new Date();
      Object.assign(target,time);
      target.setHours(23);
      target.setMinutes(0);
      target.setSeconds(1); // Offset by one second just in case
      var diff=target-time; // Milliseconds
      setTimeout(defaultTheme, diff); // Schedule a theme default for one second after 11 PM
    }
  }
  // Otherwise, no nightmode to fall back on
  else {
    document.getElementById("selected-css").href = themeObj.cssPath;
    document.getElementById("title").innerHTML = themeObj.title;
    document.getElementById("subtitle").innerHTML = themeObj.subtitle;
    setThemeColor(themeObj.themeColor);
    localStorage.setItem('themeKey', themeObj.themeKey);
    if (themeObj.videoPath) {
      setVideo(themeObj);
    }
  }

  // Call the post hooks as soon as the thread becomes idle
  setTimeout(function() {
      call.postUnload();
      themeObj.callback.postLoad();
  }, 0);

  callback=themeObj.callback;
}


// This is run onload. To change the default theme, (for users that have not yet picked one) change the statement for null
function defaultTheme() {
  var theme = localStorage.getItem('themeKey');
  if (theme === null) {
    themeChanger("chicagoEvening");
  } else {
    themeChanger(theme);
  }
}

// Execute the load handler whenever the page is ready
$(document).ready(defaultTheme);
