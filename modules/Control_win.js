module.exports = (function() {
  console.assert(typeof application !== "undefined", 'You must use require(\'Application\') prior to using any GUI components.');
  console.assert(process.bridge.dotnet, 'Failure to establish dotnet bridge, use require(\'Application\') prior to using window components.');

  if(global.__TINT.Control) {
    return global.__TINT.Control;
  }

  var $ = process.bridge.dotnet;
  var utils = require('Utilities');

  function Control(options) {
    options = options || {};
    options.delegates = options.delegates || [];

    this.nativeView = new this.nativeViewClass();
    if(this.nativeClass === this.nativeViewClass) {
      this.native = this.nativeView;
    } else {
      this.native = new this.nativeClass();
    }

    Object.defineProperty(this,'private', {
      enumerable:false,
      configurable:false,
      value:{
        events:{}, layoutConstraints:[], parent:null, trackingArea:null, needsMouseTracking:0,
        user:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        constraints:{ width:null, height:null, left:null, right:null, top:null, bottom:null, center:null, middle:null },
        states:{}, callbacks:[]
      }
    });

    var addNativeEventHandlers = function() {
      if(options.nonStandardEvents) {
        return;
      }
      this.private.rightMouseUp = function() { this.fireEvent('rightmouseup'); }.bind(this);
      this.private.rightMouseDown = function() { this.fireEvent('rightmousedown'); }.bind(this);
      this.private.leftMouseDown =  function() { this.fireEvent('leftmousedown'); }.bind(this);
      this.private.leftMouseUp = function() { this.fireEvent('leftmouseup'); }.bind(this);
      this.private.mouseUp = function() {
        setTimeout(function() {
          this.fireEvent('mouseup');
          this.fireEvent('click');
        }.bind(this),0);
      }.bind(this);
      this.private.mouseDown = function() { 
        this.fireEvent('private-pre-mousedown');
        this.fireEvent('mousedown'); 
      }.bind(this);
      this.private.mouseMove = function() { this.fireEvent('mousemove'); }.bind(this);
      this.private.mouseEnter = function() { this.fireEvent('mouseenter'); }.bind(this);
      this.private.mouseLeave = function() { this.fireEvent('mouseexit'); }.bind(this);
      this.private.keyDown = function() { 
        setTimeout(function() { this.fireEvent('keydown'); }.bind(this),0);
      }.bind(this);
      this.private.keyUp = function() { 
        setTimeout(function() { this.fireEvent('keyup'); }.bind(this),0);
      }.bind(this);

      this.native.addEventListener('MouseRightButtonUp', this.private.rightMouseUp);
      this.native.addEventListener('MouseRightButtonDown', this.private.rightMouseDown);
      this.native.addEventListener('MouseLeftButtonDown', this.private.leftMouseDown);
      this.native.addEventListener('MouseLeftButtonUp', this.private.leftMouseUp);
      this.native.addEventListener('PreviewMouseUp', this.private.mouseUp);
      this.native.addEventListener('PreviewMouseDown', this.private.mouseDown);
      this.native.addEventListener('MouseMove', this.private.mouseMove);
      this.native.addEventListener('MouseEnter', this.private.mouseEnter);
      this.native.addEventListener('MouseLeave', this.private.mouseLeave);
      this.native.addEventListener('KeyDown', this.private.keyDown);
      this.native.addEventListener('KeyUp', this.private.keyUp);
    }.bind(this);

    addNativeEventHandlers();

    // Incase the base native type needs to be remapped we need to re-apply all of the 
    // subsequent settings back to "normal".
    this.private.remapStates = function() {
      var keys = Object.keys(this.private.states);
      for(var i=0; i < keys.length; i++) {
        this[keys[i]] = this.private.states[keys[i]];
      }
      addNativeEventHandlers();
    }.bind(this);

    this.addEventListener('parent-attached', function(p) { this.private.parent = p; }.bind(this));
    this.addEventListener('parent-dettached', function() { this.private.parent = null; }.bind(this));
  }

  Control.prototype.animateOnSizeChange = false;
  Control.prototype.animateOnPositionChange = false;

  utils.makePropertyNumberType(Control.prototype, 'alpha', 'Opacity');

  utils.makePropertyBoolType(Control.prototype, 'visible', 'Visibility',
    $.System.Windows.Visibility.Visible,
    $.System.Windows.Visibility.Hidden);

  utils.def(Control.prototype, 'boundsOnScreen',
    function() {
      if(!this.native.GetType().Equals($.System.Windows.Window) && !this.private.parent) {
        return null;
      }
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target === null) {
        return null;
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = utils.wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
   }
  );

  utils.def(Control.prototype, 'boundsOnWindow',
    function() {
      if(!this.native.GetType().Equals($.System.Windows.Window) && !this.private.parent) {
        return null;
      }
      var target = $.System.Windows.Window.GetWindow(this.nativeView);
      if(target === null) {
        return null;
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = utils.wpfDeviceToLogicalPx(target,this.nativeView.PointToScreen(new $.System.Windows.Point(0,0)));
      return {x:Math.round(p.X - target.Left), y:Math.round(p.Y - target.Top), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  );

  utils.def(Control.prototype, 'bounds',
    function() {
      var target = this.nativeView.Parent;
      if(this.native.GetType().Equals($.System.Windows.Window)) {
        return this.boundsOnWindow;
      } else {
        if(!this.private.parent) {
          return null;
        }
      }
      var bounds = this.nativeView.TransformToVisual(target).TransformBounds($.System.Windows.Controls.Primitives.LayoutInformation.GetLayoutSlot(this.nativeView));
      var p = this.nativeView.TransformToAncestor(target).Transform(new $.System.Windows.Point(0,0));
      return {x:Math.round(p.X), y:Math.round(p.Y), width:Math.round(bounds.Width), height:Math.round(bounds.Height)};
    }
  );

  utils.defEvents(Control.prototype);

  function getConstraintSolver() {
    // WPF has an awkward inheritence schema. If we want a border on an element we have to wrap that element
    // in a Border control (rather than border being properties on the control inherited).  This means when we
    // do layout we have to determine which is hte "actual" child that's the target we're adding to (always, almost
    // always, a AutoLayoutPanel as the target).  In addition we have to carefully determine what the items are,
    // we do this by looking for a defined "Child" attribute. "wrapping" controls such as Border use this to set
    // the single (and only) child element.  The Child will contain the panel that we need to use for our target and
    // first/second item.  This detects for it and silently returns if it doesn't find any target.
    if(this.private.parent.nativeView.Child && this.private.parent.nativeView.Child.AddLayoutConstraint) {
      return this.private.parent.nativeView.Child;
    } else if (this.private.parent.nativeView.AddLayoutConstraint) {
      return this.private.parent.nativeView;
    } else {
      return null;
    }
  }

  Control.prototype.addLayoutConstraint = function(layoutObject) {
    var target = (getConstraintSolver.bind(this))();
    if(target === null) {
      return;
    }

    var firstItem = (layoutObject.firstItem ? layoutObject.firstItem.nativeView : layoutObject.item.nativeView);
    var secondItem = (layoutObject.secondItem ? layoutObject.secondItem.nativeView : null);
    secondItem = secondItem ? (secondItem.Child ? secondItem.Child : secondItem) : null;

    var constraint = target.AddLayoutConstraint(
        firstItem,
        utils.capitalize(layoutObject.firstAttribute),
        layoutObject.relationship,
        secondItem,
        (layoutObject.secondAttribute ? utils.capitalize(layoutObject.secondAttribute) : null),
        (layoutObject.multiplier ? layoutObject.multiplier : 0), 
        (layoutObject.constant ? layoutObject.constant : 0) );
    this.private.layoutConstraints.push(layoutObject);
    return constraint;
  };

  Control.prototype.changeLayoutConstraint = function(previousConstraint, layoutObject) {
    if(previousConstraint.multiplier !== layoutObject.multiplier ||
        previousConstraint.controlSecond === null && layoutObject.secondItem !== null || 
        previousConstraint.controlSecond !== null && layoutObject.secondItem === null || 
        previousConstraint.controlFirst !== null && layoutObject.firstItem === null) 
    {
      this.removeLayoutConstraint(previousConstraint);
      return this.addLayoutConstraint(layoutObject);
    }
    var target = (getConstraintSolver.bind(this))();
    if(target === null) {
      return;
    }

    if(this.animateOnSizeChange || this.animateOnPositionChange) {
      target.AnimateConstant(previousConstraint, layoutObject.constant);
    } else {
      target.ChangeConstant(previousConstraint, layoutObject.constant);
    }
    return previousConstraint;
  };

  Control.prototype.removeLayoutConstraint = function(n) {
    this.private.parent.nativeView.RemoveLayoutConstraint(n);
    this.private.layoutConstraints.splice(this.private.layoutConstraints.indexOf(n),1);
  };

  // control, name, percentName, percentFunc, scalarName, scalarFunc, notallowed
  utils.createLayoutProperty(Control.prototype, 'top', 'bottom', utils.identity, 'top', utils.identity, ['bottom','height']);
  utils.createLayoutProperty(Control.prototype, 'bottom', 'bottom', utils.negate, 'bottom', utils.negate, ['top','height']);
  utils.createLayoutProperty(Control.prototype, 'left', 'left', utils.identity, 'left', utils.identity, ['right','width']);
  utils.createLayoutProperty(Control.prototype, 'right', 'right', utils.identity, 'right', utils.negate, ['left','width']);
  utils.createLayoutProperty(Control.prototype, 'height', 'height', utils.identity, null, utils.identity, ['top','bottom']);
  utils.createLayoutProperty(Control.prototype, 'width', 'width', utils.identity, null, utils.identity, ['left','right']);
  utils.createLayoutProperty(Control.prototype, 'middle', 'middle', utils.identity, 'middle', utils.identity, null);
  utils.createLayoutProperty(Control.prototype, 'center', 'center', utils.identity, 'center', utils.identity, null);

  global.__TINT.Control = Control;
  return Control;
})();
