module.exports = (function() {
  var Color = require('Color');
  var utils = require('Utilities');
  var $$ = process.bridge;
  var $ = process.bridge.dotnet;

  function Notification()
  {
    var $ = process.bridge.dotnet;
    var events = {}, titlestring = "", textstring = "", subtitlestring = "", 
        soundEnabled = false, actionbuttontitle = "", otherbuttontitle = "",
        timeoutHandle = null;

    function fireEvent(event, args) {
      if(events[event]) (events[event]).forEach(function(item,index,arr) { item.apply(null,args); });
    }

    this.addEventListener = function(event, func) { if(!events[event]) events[event] = []; events[event].push(func); }
    this.removeEventListener = function(event, func) { if(events[event] && events[event].indexOf(func) != -1) events[event].splice(events[event].indexOf(func), 1); }
    

    Object.defineProperty(this, 'title', {
      get:function() { return titlestring; },
      set:function(e) { titlestring = e; }
    });

    Object.defineProperty(this, 'subtitle', {
      get:function() { return subtitlestring; },
      set:function(e) { subtitlestring = e; }
    });

    Object.defineProperty(this, 'text', {
      get:function() { return textstring; },
      set:function(e) { textstring = e; }
    });

    Object.defineProperty(this, 'sound', {
      get:function() { return soundEnabled; },
      set:function(e) { soundEnabled = e ? true : false; }
    });

    Object.defineProperty(this, 'buttonLabel', {
      get:function() { return actionbuttontitle; },
      set:function(e) { actionbuttontitle = e; }
    });

    this.dispatch = function() {
      if(!titlestring || titlestring == "") return false;
      if(!textstring || textstring == "") return false;

      var w = new $.System.Windows.Window();
      w.Width = 350;
      w.MinWidth = 350;
      w.MaxWidth = 350;
      w.Height = 65;
      w.MinHeight = 65;
      w.MaxHeight = 65;
      w.ShowInTaskbar = false;
      w.ResizeMode = $.System.Windows.ResizeMode.CanResize;
      w.Content = new $.AutoLayout.AutoLayoutPanel();
      w.TopMost = true;
      w.WindowStyle = $.System.Windows.WindowStyle.None;

      function animateOut() {
        var dur = new $.System.Windows.Duration($.System.TimeSpan.FromSeconds(0.175));
        var anim = new $.System.Windows.Media.Animation.DoubleAnimation(w.Left, w.Left + w.Width + 5 + 0.00001, dur);
        w.BeginAnimation($.System.Windows.Window.LeftProperty,anim);
        setTimeout(function() {
          w.Hide();
          w.Close();
        },1000);
      }
      w.Content.addEventListener('PreviewMouseDown', function() {
        clearTimeout(timeoutHandle);
        fireEvent('click',['contents']);
        animateOut();
      }.bind(this));


      var bgcolor = new Color('transparent');
      var img;
      if(application.icon) img = utils.makeImage(application.icon);
      else img = utils.makeImage('info');
      img.Stretch = $.System.Windows.Media.Stretch.UniformToFill;
      img.Width = 50;
      img.Height = 50;
      w.Content.InternalChildren.Add(img);
      w.Content.AddLayoutConstraint(w.Content, 'Top', '=', img, 'Top', 1.0, 0);
      w.Content.AddLayoutConstraint(img, 'Height', '=', img, null, null, 50);
      w.Content.AddLayoutConstraint(w.Content, 'Left', '=', img, 'Left', 1.0, 0);
      w.Content.AddLayoutConstraint(img, 'Right', '=', img, 'Left', 1.0, 50);

      var btn = new $.System.Windows.Controls.Button();
      btn.addEventListener('PreviewMouseDown', function() {
        fireEvent('click',['button']);
        animateOut();
      }.bind(this));
      btn.Content = new $.System.Windows.Controls.StackPanel();
      var label = new $.System.Windows.Controls.Label();
      label.Content = actionbuttontitle == "" ? "Dismiss" : actionbuttontitle;
      label.Width = 40;

      btn.Content.InternalChildren.Add(label);
      w.Content.InternalChildren.Add(btn);
      w.Content.AddLayoutConstraint(w.Content, 'Top', '=', btn, 'Top', 1.0, 0);
      w.Content.AddLayoutConstraint(w.Content, 'Bottom', '=', btn, 'Bottom', 1.0, 0);
      w.Content.AddLayoutConstraint(btn, 'Left', '=', btn, 'Right', 1.0, -50);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', btn, 'Right', 1.0, 0);
      btn.BorderBrush = new $.System.Windows.Media.SolidColorBrush($.System.Windows.Media.Colors.Gray);

      var text = new $.System.Windows.Controls.TextBlock();
      text.Text = titlestring;
      text.FontSize = text.FontSize * 1.1;
      text.FontWeight = $.System.Windows.FontWeight.FromOpenTypeWeight(600);
      w.Content.AddLayoutConstraint(w.Content, 'Left', '=', text, 'Left', 1.0, -55);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', text, 'Right', 1.0, 60);
      w.Content.AddLayoutConstraint(w.Content, 'Top', '=', text, 'Top', 1.0, 0);
      w.Content.InternalChildren.Add(text);

      var text2 = new $.System.Windows.Controls.TextBlock();
      text2.TextWrapping = $.System.Windows.TextWrapping.Wrap;
      text2.Text = textstring;
      text2.Width = 225;
      w.Content.AddLayoutConstraint(w.Content, 'Left', '=', text2, 'Left', 1.0, -55);
      w.Content.AddLayoutConstraint(w.Content, 'Right', '=', text2, 'Right', 1.0, 60);
      w.Content.AddLayoutConstraint(text2, 'Top', '=', text, 'Bottom', 1.0, 0);
      w.Content.InternalChildren.Add(text2);

      var hwnd = new $.System.Windows.Interop.WindowInteropHelper(w).EnsureHandle();
      var margin = new $$.win32.structs.MARGINS;
      margin.cxLeftWidth = -1;
      margin.cxRightWidth = -1;
      margin.cyTopHeight = -1;
      margin.cyBottomHeight = -1;
      $$.win32.dwmapi.DwmExtendFrameIntoClientArea(hwnd.pointer.rawpointer,margin);

      var mainWindowSrc = $.System.Windows.Interop.HwndSource.FromHwnd(hwnd);
      mainWindowSrc.CompositionTarget.BackgroundColor = bgcolor.native;
      w.Background = new $.System.Windows.Media.SolidColorBrush(bgcolor.native);
      w.Content.Background = new $.System.Windows.Media.SolidColorBrush(bgcolor.native);

      // Set the notification off screen.
      var workarea = $.System.Windows.SystemParameters.WorkArea;
      w.Left = workarea.X + workarea.Width;
      w.Top = workarea.Y + workarea.Height - w.Height - 5;
      
      w.Show();
      fireEvent('fired');

      // Set the timeout to animate in, animate out and close the window.
      var dur = new $.System.Windows.Duration($.System.TimeSpan.FromSeconds(0.175));
      var anim = new $.System.Windows.Media.Animation.DoubleAnimation(w.Left - 0.00001, w.Left - w.Width - 5 - 0.00001, dur);
      w.BeginAnimation($.System.Windows.Window.LeftProperty,anim);
      timeoutHandle = setTimeout(animateOut,5000);

      return true;
    }
  }
  
  Notification.requestPermission = function(callback){
    if(callback) callback({handleEvent:function() { return true; }});
    return true;
  }

  return Notification;
})();