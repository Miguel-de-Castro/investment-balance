// Old shared links used the app's hash router at the site root
// (e.g. /#/simulate/PETR4). The app now lives at /app/, so forward them.
if (location.hash.indexOf('#/') === 0) {
  location.replace('/app/' + location.hash);
}
