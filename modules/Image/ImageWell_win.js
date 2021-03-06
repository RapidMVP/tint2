module.exports = (function() {
  if(global.__TINT.ImageWell) {
    return global.__TINT.ImageWell;
  }

  var Container = require('Container');
  var util = require('Utilities');
  var $ = process.bridge.dotnet;

  function ImageWell(options) {
    options = options || {};
    this.nativeClass = this.nativeClass || $.System.Windows.Controls.Image;
    this.nativeViewClass = this.nativeViewClass || $.System.Windows.Controls.Image;
    Container.call(this, options);
    this.scale = "constrain";
  }

  ImageWell.prototype = Object.create(Container.prototype);
  ImageWell.prototype.constructor = ImageWell;

  util.makePropertyImageType(ImageWell.prototype, 'image', 'Source');
  util.makePropertyMapType(ImageWell.prototype, 'scale', 'Stretch', {
    'constrain':$.System.Windows.Media.Stretch.UniformToFill,
    'fit':$.System.Windows.Media.Stretch.Fill,
    'contain':$.System.Windows.Media.Stretch.Uniform,
    'none':$.System.Windows.Media.Stretch.None
  });

  global.__TINT.ImageWell = ImageWell;
  return ImageWell;
})();
