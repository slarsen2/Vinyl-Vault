// GitHub Pages SPA routing script
// This script helps maintain proper routing when GitHub Pages serves your single-page app
(function() {
  // Save the URL path if we need to redirect
  var path = sessionStorage.getItem('redirect_path');
  var repo = "Vinyl-Vault"; // Your repository name
  
  if (path) {
    // Clear the saved path
    sessionStorage.removeItem('redirect_path');
    
    // If we're on the correct page, but need to navigate
    if (window.location.pathname.indexOf(repo) !== -1) {
      // Use history to avoid a page refresh
      var cleanPath = path.replace(new RegExp('^/' + repo), '');
      if (cleanPath === '') cleanPath = '/';
      window.history.replaceState(null, null, cleanPath);
    }
  }
})();