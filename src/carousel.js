;$$carousel = (function(){

  // Options
  var __options = {
  target              : null,
  carouselSelector    : ".carousel",
  panelsSelector      : ".panels",
  panelClassName      : "panel",
  panelWidthRate      : "100%", // ["%" or "px"] numbar case is %.
  panelMargin         : 0,
  
  moveTarget          : null,
  // moveCount           : 30,
  dragElement         : null,
  dragTranslationRate : 0.3,
  dragInertiaSpeed    : 10,
  currentNumber       : 0,
  pagenationSelector  : ".pagenation",
  pagenationElement   : null,
  autoScroll          : true,
  autoScrollflg       : {},
  autoScrollTime      : 5000,
  html                : "",

  buttons             : true,
  page_point          : true,
  loop                : true,
  panel_align         : "center", // [ "center" , "left" ]
  vertical_scroll_stop : false,

  loaded              : function(e){}
  };

  // ----------
  // 起動処理
  var MAIN = function(options){
    if(!options){return;}
    this.options = new LIB().setOptions(options);
    if(!this.options.target){return;}

    var lib = new LIB();
    switch(document.readyState){
      case "complete" : {
        this.start();
      } break;
      case "interactive" : {
        lib.event(
          window , 
          "DOMContentLoaded" , 
          (function(e){this.start(e)}).bind(this)
        );
      } break;
      default : {
        lib.event(
          window , 
          "load" , 
          (function(e){this.start(e)}).bind(this)
        );
      } break;
    }
  };

  // 初期設定
  MAIN.prototype.start = function(){
    if(!this.set_base()){return}
    var lib = new LIB();
    var base_pathinfo = lib.urlinfo(lib.currentScriptTag);
    this.autoload_css(base_pathinfo);
    this.setEvent();
  }

  MAIN.prototype.set_base = function(){
    var bases = document.querySelectorAll(this.options.target);
    if(bases && bases.length){
      var d = (+new Date());
      for(var i=0; i<bases.length; i++){
        var key  = d+"_"+i;
        var name = btoa(key);
        bases[i].setAttribute("data-carousel-name",name);
      }
      return true;
    }
    else{
      return false;
    }
  };

  // [初期設定] 基本CSSセット(jsと同じ階層同じファイル名.cssを読み込む)
  MAIN.prototype.autoload_css = function(base_pathinfo){
    if(document.querySelector("link[data-carousel-library='loaded']")){
      this.css_loaded();
    }
    else{
      var head = document.getElementsByTagName("head");
      var base = (head) ? head[0] : document.body;
      var css  = document.createElement("link");
      css.rel  = "stylesheet";
      css.className = "carousel";
      css.setAttribute("data-carousel-library","loaded");
      var plugin_css = base_pathinfo.dir + base_pathinfo.file.replace(".js",".css");
      var query = [];
      for(var i in base_pathinfo.query){query.push(i);}
      css.href = plugin_css +"?"+ query.join("");
      css.onload = (function(){this.css_loaded()}).bind(this);
      base.appendChild(css);
    }
  };
  MAIN.prototype.css_loaded = function(){
    this.setStyleSheets();
    var lib = new LIB();
    var base_pathinfo = lib.urlinfo(lib.currentScriptTag);
    this.load_template(base_pathinfo);
  };

  MAIN.prototype.getStyleSheet = function(){
    var sss = document.styleSheets;
    var ss = null;
    for(var i=0; i<sss.length; i++){
      if(sss[i].ownerNode.getAttribute("data-carousel-library") === "loaded"){
        ss = sss[i];
        break;
      }
    }
    return ss;
  };

  MAIN.prototype.setStyleSheets = function(){
    var ss = this.getStyleSheet();
    if(ss === null){return;}
    var targets = this.getElm_targets();
    for(var i=0; i<targets.length; i++){
      var name = targets[i].getAttribute("data-carousel-name");
      if(!name){continue;}
      this.addStyleSheetRule(name , ss);
    }
  };

  MAIN.prototype.addStyleSheetRule = function(name , ss){
    var width  = this.options.panelWidthRate;
    var margin = this.options.panelMargin    ? this.options.panelMargin / 2 : 0;
    var num    = ss.cssRules.length;
    var selector = "*[data-crousel-name='"+name+"'].carousel .panels > *";
    ss.insertRule(selector+" { color: white }", num); 
    ss.cssRules[num].style.setProperty("width"        , width  +"%" , "");
    ss.cssRules[num].style.setProperty("margin-left"  , margin +"px" , "");
    ss.cssRules[num].style.setProperty("margin-right" , margin +"px" , "");
  };


  MAIN.prototype.load_template = function(base_pathinfo){
    new AJAX({
      url : base_pathinfo.dir + base_pathinfo.file.replace(".js",".html"),
      method : "get",
      onSuccess : (function(html){
        this.set_template(html);
        this.setCarousels();
        if(typeof this.options.loaded !== "undefined"){
          this.options.loaded();
        }
        this.viewParts();
      }).bind(this)
    });
  };
  MAIN.prototype.set_template = function(template){
    if(!template){return;}
    var targets = this.getElm_targets();
    for(var i=0; i<targets.length; i++){
      var target = targets[i];
      var panels = target.innerHTML;
      target.innerHTML = template.replace("{{panels}}" , panels);
      var panels_area  = target.querySelector(this.options.panelsSelector);
      if(!panels_area || !this.options.html){continue;}
      panels_area.innerHTML = this.options.html;
    }
  };

  MAIN.prototype.setCarousels = function(){
    var carousels = this.getElm_bases();
    if(!carousels || !carousels.length){return;}
    // 複数の表示に対応
    for(var i=0; i<carousels.length; i++){
      this.setCarousel(carousels[i]);
    }
  };
  MAIN.prototype.setCarousel = function(carousel){
    if(!carousel){return}
    // auto-scroll初期設定
    if(this.options.autoScroll === true){
      this.setAutoScroll_next(carousel);
    }
    this.setButtons(carousel);
    var res = this.setPanels(carousel);
    if(!res){return;}
    this.setPagenations(carousel);
    this.setEvent_panels(carousel);
    this.setCurrentPagenation(carousel);
    this.setPagenation_active(carousel);
  };


  MAIN.prototype.setEvent = function(){
    var lib = new LIB();
    var passive = this.options.vertical_scroll_stop === true ? {passive : false} : null;
    lib.event(window , "mousedown" , (function(e){this.dragStart(e)}).bind(this));
    lib.event(window , "mousemove" , (function(e){this.dragMove(e)}).bind(this) , passive);
    lib.event(window , "mouseup"   , (function(e){this.dragEnd(e)}).bind(this));
    lib.event(window , "touchstart", (function(e){this.dragStart(e)}).bind(this));
    lib.event(window , "touchmove" , (function(e){this.dragMove(e)}).bind(this) , passive);
    lib.event(window , "touchend"  , (function(e){this.dragEnd(e)}).bind(this));
  };

  MAIN.prototype.setEvent_panels = function(carousel){
    if(!carousel){return;}
    var panel_parent = this.getElm_panelParent(carousel);
    if(!panel_parent){return}
    // loop配置処理
    new LIB().event(panel_parent , "transitionend" , (function(e){
      if(this.options.loop !== true){return}
      parent = e.target;
      var carousel = new LIB().upperSelector(parent , this.options.carouselSelector);
      if(parent.hasAttribute("data-animation")){
        parent.removeAttribute("data-animation","1");
      }

      this.setSort_activePanel(carousel);
      var marginLeft = this.getNextPanel_marginLeft(carousel);
      parent.style.setProperty("margin-left" , -marginLeft + "px" , "");
    }).bind(this));
  };


  // ----------
  // Intial-Setting
  MAIN.prototype.setPanels = function(carousel){
    if(!carousel){return;}
    var parent = carousel.querySelector(this.options.panelsSelector);
    var panels = parent.querySelectorAll(":scope > *");
    if(!panels || !panels.length){return false;}

    // set-initial
    for(var i=0; i<panels.length; i++){
      // set-active : 最初は先頭をactiveにする
      if(i==0){
        panels[i].setAttribute("data-active" , "1");
      }
      this.setPanel(panels[i] , i);
    }

    // set-sort-active-panel
    this.setSort_activePanel(carousel);
    this.setActivePanel_viewCenter_now(carousel);

    return true;
  };

  MAIN.prototype.setPanel = function(panel , num){
    if(panel.hasAttribute("data-panel")){return;}
    panel.setAttribute("data-panel" , num);
    if(!panel.classList.contains(this.options.panelClass)){
      panel.classList.add(this.options.panelClassName);
    }
    panel.style.setProperty("width" , this.options.panelWidthRate ,"");
  };

  // 現在activeのpanelを中心に持ってくるように、並びの入れ替えを行う
  // oxxxx -> xxoxx
  // oxxx  -> xoxx
  MAIN.prototype.setSort_activePanel = function(carousel){
    if(this.options.loop !== true){return}
    if(!carousel){return;}

    var parent = this.getElm_panelParent(carousel);
    var panels = this.getElm_panels(carousel);

    if(!panels || !panels.length){return;}

    // 総panel数の取得
    var total_count = panels.length;

    // active-panelの現在位置
    var current_num = this.getActivePanel_num(carousel);

    // 並び順の中心位置を算出
    var center_position = Math.floor((total_count - 0.5) / 2);
    // active-panelの並び順を中心に持ってくる。（後ろに移動）（偶数の場合は、前寄り
    if(current_num < center_position){
      for(var i=0; i<center_position-current_num; i++){
        var lastElm  = parent.querySelector(":scope > *:last-child");
        var firstElm = parent.querySelector(":scope > *:first-child");
        parent.insertBefore(lastElm , firstElm);
      }
    }
    // active-panelの並び順を中心に持ってくる。（前に移動）（偶数の場合は、前寄り）
    else if(current_num > center_position){
      for(var i=0; i<current_num - center_position; i++){
        var firstElm = parent.querySelector(":scope > *:first-child");
        parent.appendChild(firstElm);
      }
    }
  };

  MAIN.prototype.getActivePanel_elm = function(panels){
    if(!panels){return;}
    var carousel = new LIB().upperSelector(panels[0] , this.options.carouselSelector);
    var num = this.getActivePanel_num(carousel);
    if(num === null || typeof panels[num] === "undefined"){
      return null;
    }
    else{
      return panels[num];
    }
  };
  MAIN.prototype.getActivePanel_num = function(carousel){
    if(!carousel){return}
    var panels = this.getElm_panels(carousel);
    if(!panels || !panels.length){return;}
    var current_num = null;
    for(var i=0; i<panels.length; i++){
      if(panels[i].getAttribute("data-active") === "1"){
        current_num = i;
        break;
      }
    }
    return current_num;
  };

  MAIN.prototype.setActivePanel_viewCenter_now = function(carousel){
    if(!carousel){return}
    var parent = this.getElm_panelParent(carousel);
    var panels = this.getElm_panels(carousel);
    if(!panels || !panels.length){return;}

    // get-info : 初期の移動アニメーションをさせない処理
    var marginLeft    = this.getNextPanel_marginLeft(carousel);
    parent.style.setProperty("margin-left" , -marginLeft + "px" , "");
    this.setPanelAnimation(carousel);
  };

  MAIN.prototype.getCurrentMargin_panelParent = function(panel_parent){
    panel_parent = panel_parent ? panel_parent : this.getElm_panelParent();
    if(panel_parent === null){return null;}
    return Number(getComputedStyle(panel_parent, null).getPropertyValue("margin-left").replace("px",""));
  };
  MAIN.prototype.getNextPanel_marginLeft = function(carousel){
    if(!carousel){return;}
    var parent            = this.getElm_panelParent(carousel);
    var panels            = this.getElm_panels(carousel);
    var current_panel = this.getActivePanel_elm(panels);
    var parent_margin = this.getCurrentMargin_panelParent(parent);
    var base_width    = carousel.offsetWidth;
    var active_width  = current_panel.offsetWidth;
    switch(this.options.panel_align){
      case "center":
        var inner_left    = Math.floor(base_width / 2) - Math.floor(active_width / 2);
        var active_left   = current_panel.offsetLeft;
        var center_pos    = active_left - inner_left + (parent_margin * -1);
        break;
      case "left":
        var inner_left    = 0;
        var active_left   = current_panel.offsetLeft;
        var center_pos    = active_left - inner_left + (parent_margin * -1);
        break;
    }
    return center_pos;
  };

  // --
  // get-element
  MAIN.prototype.getElm_targets = function(){
    if(typeof this.targets === "undefined"){
      this.targets = document.querySelectorAll(this.options.target);
    }
    return this.targets;
  };
  MAIN.prototype.getElm_bases = function(){
    if(typeof this.bases === "undefined"){
      this.bases = [];
      var targets = this.getElm_targets();
      for(var i=0; i<targets.length; i++){
        var base = targets[i].querySelector(this.options.carouselSelector);
        if(!base){continue;}
        this.bases.push(base);
      }
    }
    return this.bases;
  };

  MAIN.prototype.getElm_base = function(){
    return document.querySelector(this.options.target +" "+ this.options.carouselSelector);
  };
  MAIN.prototype.getElm_panelParent = function(carousel){
    if(!carousel){return null;}
    return carousel.querySelector(this.options.panelsSelector);
  };
  MAIN.prototype.getElm_panels = function(carousel){
    if(!carousel){return;}
    return carousel.querySelectorAll(this.options.panelsSelector +" ."+ this.options.panelClassName);
  };
  MAIN.prototype.getElm_pagenationArea = function(carousel){
    if(!carousel){return;}
    return carousel.querySelector(this.options.pagenationSelector);
  };
  MAIN.prototype.getElm_pagenations = function(carousel){
    if(!carousel){return}
    return carousel.querySelectorAll(this.options.pagenationSelector +" .point");
  }
  MAIN.prototype.carousel2keyname = function(carousel){
    if(!carousel){return null;}
    var base = new LIB().upperSelector(carousel , this.options.target);
    if(!base){return null;}
    return base.getAttribute("data-carousel-name");
  };



  // Button (left,right)
  MAIN.prototype.setButtons = function(carousel){
    if(!carousel){return}
    if(this.options.buttons !== true){return;}

    var button_left = carousel.querySelector(".button[data-button='prev']");
    if(!button_left){
      button_left = document.createElement("div");
      button_left.setAttribute("class"       , "button");
      button_left.setAttribute("data-button" , "prev");
      carousel.insertBefore(button_left , carousel.firstElementChild);
    }
    new LIB().event(button_left , "click" , (function(e){this.animButton_prev(e)}).bind(this));
    
    var button_right = carousel.querySelector(".button[data-button='next']");
    if(!button_right){
      button_right = document.createElement("div");
      button_right.setAttribute("class"       , "button");
      button_right.setAttribute("data-button" , "next");
      carousel.insertBefore(button_right , carousel.firstElementChild);
    }
    new LIB().event(button_right , "click" , (function(e){this.animButton_next(e)}).bind(this));
  };

  // ->に移動
  MAIN.prototype.animButton_prev = function(e){
    var carousel = new LIB().upperSelector(e.target , this.options.carouselSelector);
    var panels = this.getElm_panels(carousel);

    if(!panels || !panels.length){return;}

    // 個数が少ない場合は処理しない
    if(carousel.offsetWidth > panels[0].offsetWidth * panels.length){return;}

    // auto-scrollを一時停止
    this.stopAutoScroll(carousel);

    // 現在activeの取得
    var current_num = this.getActivePanel_num(carousel);
    if(current_num === null){return;}

    // 次の項目を取得 (次が無い場合は、リストの先頭を取得)
    var prev_num = this.get_panel_number_prev(current_num , panels.length);
    if(prev_num === null){return}
    if(typeof panels[prev_num] === "undefined"){return}

    // 次の項目にactiveを移動
    panels[current_num].removeAttribute("data-active");
    panels[prev_num].setAttribute("data-active","1");

    // 移動
    this.setPanelAnimation(carousel);

    // autoscroll 再開
    this.setAutoScroll(carousel);
  };
  MAIN.prototype.get_panel_number_prev = function(current_num , length){
    if(typeof current_num === "undefined" || !length){return;}
    if(this.options.loop === true){
      return current_num >= 1 ? current_num - 1 : length - 1;
    }
    else{
      return current_num >= 1 ? current_num - 1 : 0;
    }
  };

  // <-に移動
  MAIN.prototype.animButton_next = function(e){
    var carousel = new LIB().upperSelector(e.target , this.options.carouselSelector);
    var panels = this.getElm_panels(carousel);
    if(!panels || !panels.length){return;}

    // 個数が少ない場合は処理しない
    if(carousel.offsetWidth > panels[0].offsetWidth * panels.length){return;}

    // auto-scrollを一時停止
    this.stopAutoScroll(carousel);

    // 現在activeの取得
    var current_num = this.getActivePanel_num(carousel);
    if(current_num === null){return;}

    // 次の項目を取得 (次が無い場合は、リストの先頭を取得)
    var next_num = this.get_panel_number_next(current_num , panels.length);
    if(typeof panels[next_num] === "undefined"){return}

    // 次の項目にactiveを移動
    panels[current_num].removeAttribute("data-active");
    panels[next_num].setAttribute("data-active","1");

    // 移動
    this.setPanelAnimation(carousel);

    // autoscroll 再開
    this.setAutoScroll(carousel);
  };
  MAIN.prototype.get_panel_number_next = function(current_num , length){
    if(typeof current_num === "undefined" || !length){return;}
    if(this.options.loop === true){
      return current_num < length ? current_num + 1 : 0;
    }
    else{
      return current_num < length ? current_num + 1 : length - 1;
    }
  };

  // active-panelを中心に移動させる
  MAIN.prototype.setPanelAnimation = function(carousel){
    if(!carousel){return}
    var parent = this.getElm_panelParent(carousel);

    // 現在activeの取得
    var current_num = this.getActivePanel_num(carousel);
    if(current_num === null){return;}

    // set css-animation
    var marginLeft = this.getNextPanel_marginLeft(carousel);

    // style値のセット
    parent.style.setProperty("margin-left" , -marginLeft +"px" , "");

    // animation-play
    if(!parent.hasAttribute("data-animation")){
      parent.setAttribute("data-animation","1");
    }

    // pagenation
    this.setPagenation_active(carousel);
  };

  MAIN.prototype.setPanelAnimation_silent = function(parent){
    parent = parent ? parent : this.getElm_panelParent();
    if(parent.hasAttribute("data-animation")){
      parent.removeAttribute("data-animation","1");
    }
    var carousel = new LIB().upperSelector(parent , this.options.carouselSelector);
    this.setSort_activePanel(parent);
    var marginLeft = this.getNextPanel_marginLeft(carousel);
    parent.style.setProperty("margin-left" , -marginLeft + "px" , "");
  }





  // ----------
  // Drag
  MAIN.prototype.dragStart = function(e){
    var target = e.target;
    if(!target){return;}
    if(!new LIB().upperSelector(target , this.options.panelsSelector)){return}
    var carousel = new LIB().upperSelector(target,this.options.carouselSelector);
    if(!carousel){return;}
    var panelArea = this.getElm_panelParent(carousel);
    if(!panelArea){return;}
    var pageX = typeof e.touches === "undefined" ? e.pageX : e.touches[0].pageX;
    this.drag = {
      target      : panelArea,
      startPos    : pageX,
      marginLeft  : new LIB().getMargin(panelArea)
    };

    // css-animationを一時停止
    // 既存座標が直接指定の場合の対処法
    var ss = this.getStyleSheet();
    var cssMarginLeft = null;
    for(var i=0; i<ss.cssRules.length; i++){
      if(ss.cssRules[i].selectorText === '.carousel .panels[data-animation="1"]'){
        cssMarginLeft = Number(ss.cssRules[i].style.getPropertyValue("margin-left").replace("px",""));
        break;
      }
    }
    this.drag.target.setAttribute("data-animation","0");

    // auto-scrollを一時停止
    this.stopAutoScroll(carousel);
  };

  MAIN.prototype.dragMove = function(e){
    if(!this.drag || !this.drag.target || typeof this.drag.target === "undefined"){return;}

    e.preventDefault();

    var pageX = typeof e.touches === "undefined" ? e.pageX : e.touches[0].pageX;
    var diff = pageX - this.drag.startPos;
    var margin = this.drag.marginLeft + diff;
    this.drag.target.style.setProperty("margin-left" , margin + "px" , "");

    // 移動方向を判別
    this.drag.direct = diff > 0 ? "prev" : "next";
  };

  MAIN.prototype.dragEnd = function(e){
    if(!this.drag || !this.drag.target || typeof this.drag.target === "undefined"){return;}

    // css-animationを復活
    this.drag.target.setAttribute("data-animation","1");

    var carousel = new LIB().upperSelector(this.drag.target , this.options.carouselSelector);

    // activeフラグをセット -----
    // - 画面中央のpanelを取得
    var center_panel = this.getElm_centerPanel(carousel);
    if(center_panel){
      // 現在のactive-panel
      var panels = this.getElm_panels(carousel);
      var active_panel = this.getActivePanel_elm(panels);
      if(active_panel && active_panel.hasAttribute("data-active")){
        active_panel.removeAttribute("data-active")
      }
      center_panel.setAttribute("data-active" , "1");
    }

    // autoscroll 再開
    var carousel = new LIB().upperSelector(this.drag.target , this.options.carouselSelector);
    this.setAutoScroll(carousel);

    // キャッシュデータを削除
    this.drag = null;

    // センタリングアニメ
    this.setPanelAnimation(carousel);
  };

  // panelをdragした時の移動先panelの決定
  MAIN.prototype.getElm_centerPanel = function(carousel){
    panel_parent = this.getElm_panelParent(carousel);
    if(!panel_parent){return;}
    // var baseSizeRate = 0.3;
    var carousel = new LIB().upperSelector(panel_parent , this.options.carouselSelector);
    var panels       = this.getElm_panels(carousel);
    if(!panels || !panels.length){return;}
    var target_panel = null;
    switch(this.options.panel_align){
      case "center":
        var center = carousel.offsetWidth / 2;
        for(var i=0; i<panels.length; i++){
          if(panels[i].offsetLeft < center
            && center < panels[i].offsetLeft + panels[i].offsetWidth){
            target_panel = panels[i];
            break;
          }
        }
        break;
      case "left":
        var center = panels[0].offsetWidth / 2;
        for(var i=0; i<panels.length; i++){
          if(panels[i].offsetLeft < center
            && center < panels[i].offsetLeft + panels[i].offsetWidth){
            target_panel = panels[i];
            break;
          }
        }
        break;
    }
    // loop無しモードの時の画面右端管理（一番うしろが、画面右端よりinした場合）
    var last_panel = panels[panels.length -1];
    if(last_panel.offsetLeft + last_panel.offsetWidth <= carousel.offsetWidth){
      var shift_num = Math.floor(carousel.offsetWidth / panels[0].offsetWidth);
      var num = panels.length - shift_num - 1;
      num = num >= 0 ? num : 0;
      target_panel = panels[num];
    }
    
    return target_panel;
  };


  // ----------
  // Pagenation
  MAIN.prototype.setPagenations = function(carousel){
    if(!carousel){return;}
    if(this.options.page_point !== true){return;}
    var pagenation_parent = this.getElm_pagenationArea(carousel);
    if(!pagenation_parent){return;}
    var panels = carousel.querySelectorAll(":scope "+ this.options.panelsSelector +" > ."+ this.options.panelClassName);
    if(!panels || !panels.length){return;}
    var nums = [];
    for(var i=0; i<panels.length; i++){
      nums.push(panels[i].getAttribute("data-panel"));
    }
    nums.sort();
    
    
    for(var i=0; i<nums.length; i++){
      var num = nums[i];
      if(num === null){continue;}
      var div = document.createElement("div");
      div.setAttribute("class" , "point");
      div.setAttribute("data-panel" , num);
      new LIB().event(div , "click" , (function(e){this.clickPagenation(e)}).bind(this));
      pagenation_parent.appendChild(div);
    }
  };

  MAIN.prototype.clickPagenation = function(e){
    var point_target = e.currentTarget;
    if(!point_target){return;}
    if(!point_target.hasAttribute("data-panel")){return;}
    var num = point_target.getAttribute("data-panel");
    if(num === null){return;}

    // 現在active-panelのactive-flgを削除
    var carousel = new LIB().upperSelector(e.target , this.options.carouselSelector);
    if(!carousel){return}
    var panels        = this.getElm_panels(carousel);
    var current_panel = this.getActivePanel_elm(panels);
    if(current_panel.hasAttribute("data-active")){
      current_panel.removeAttribute("data-active");
    }

    // 対象のpanelにactive-flgをセット
    var panel_target = carousel.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName +"[data-panel='"+num+"']");
    if(!panel_target){return;}
    panel_target.setAttribute("data-active","1");
    this.setPanelAnimation(carousel);
  };

  MAIN.prototype.setCurrentPagenation = function(carousel){
    if(!carousel){return;}
    var panels = this.getElm_panels(carousel);
    var pagenations = this.getElm_pagenations(carousel);
    if(!pagenations || !pagenations.length){return;}
    var current_pos = this.getActivePanel_num(carousel);
    var current_num = panels[current_pos].getAttribute("data-panel");
    for(var i=0; i<pagenations.length; i++){
      if(i === current_num){
        pagenations[i].setAttribute("data-active","1");
      }
      else if(panels[i].hasAttribute("data-active")){
        pagenations[i].removeAttribute("data-active")
      }
    }
  }

  MAIN.prototype.getPagenationMotion = function(){console.log("getPagenationMotion");
    if(!this.options.pagenationElement){return;}
    var base = new LIB().upperSelector(this.options.pagenationElement , this.options.carouselSelector);
    // console.log(base);
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName +":first-child");
    if(!first){return;}
    var currentPosition = this.options.pagenationElement.offsetLeft;
    if(currentPosition < -10){
      first.style.setProperty("margin-left", (first.offsetLeft + 20) + "px" , "");
      setTimeout((function(e){this.getPagenationMotion(e)}).bind(this) , 10);
    }
    else if(currentPosition > 10){
      first.style.setProperty("margin-left", (first.offsetLeft -  20) + "px" , "");
      setTimeout((function(e){this.getPagenationMotion(e)}).bind(this) , 10);
    }
    else{
      var panels = base.querySelectorAll(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName);
      var order = 0;
      for(var i=0; i<panels.length; i++){
        if(panels[i] === this.options.pagenationElement){
          order = i;
          break;
        }
      }
      var parent = base.querySelector(":scope "+ this.options.panelsSelector);
      if(order < 1){
        for(var i=0; i<(1 - order); i++){
          var currentFirst = parent.querySelector(":scope > ."+this.options.panelClassName +":first-child");
          var currentLast  = parent.querySelector(":scope > ."+this.options.panelClassName +":last-child");
          parent.insertBefore(currentLast , currentFirst);
        }
      }
      else{
        for(var i=0; i<(order - 1); i++){
          var currentFirst = parent.querySelector(":scope > ."+this.options.panelClassName +":first-child");
          parent.appendChild(currentFirst);
        }
      }
      
      first.style.removeProperty("margin-left");
      this.setCurrentPagenation(base);
      this.options.pagenationElement = null;

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  };
  MAIN.prototype.setPagenation_active = function(carousel){
    if(!carousel){return;}
    var panels      = this.getElm_panels(carousel);
    var current_elm = this.getActivePanel_elm(panels);
    if(current_elm === null){return;}
    var current_num = current_elm.getAttribute("data-panel");
    if(current_num === null){return;}

    var pagenation_area = this.getElm_pagenationArea();
    var pagenations = this.getElm_pagenations(carousel);
    if(!pagenations){return;}
    // フラグ切り替え処理
    for(var i=0; i<pagenations.length; i++){
      var pagenation_num = pagenations[i].getAttribute("data-panel");
      if(pagenation_num === null){continue;}
      if(pagenation_num === current_num){
        pagenations[i].setAttribute("data-active","1");
      }
      else if(pagenations[i].hasAttribute("data-active")){
        pagenations[i].removeAttribute("data-active");
      }
    }
  };


  // ----------
  // AutoScroll
  MAIN.prototype.setAutoScroll_next = function(carousel){
    if(!carousel){return;}
    var keyname = this.carousel2keyname(carousel);
    if(!keyname){return}
    if(typeof this.options.autoScrollflg[keyname] !== "undefined"){
      clearTimeout(this.options.autoScrollflg[keyname]);
    }

    this.options.autoScrollflg[keyname] = setTimeout((function(carousel){
      this.autoScrollMotion(carousel);
    }).bind(this,carousel),this.options.autoScrollTime);
  };
  
  MAIN.prototype.autoScrollMotion = function(carousel){
    var nextButton = carousel.querySelector(".button[data-button='next']");
    if(!nextButton){return;}
    nextButton.click();
    this.setAutoScroll_next(carousel);
  };

  // autoscrollを再開
  MAIN.prototype.setAutoScroll = function(carousel){
    if(!carousel){return;}
    if(this.options.autoScroll !== true){return}
    var keyname = this.carousel2keyname(carousel);
    if(!keyname){return;}

    this.options.autoScrollflg[keyname] = setTimeout((function(carousel){
      this.autoScrollMotion(carousel);
    }).bind(this,carousel) , this.options.autoScrollTime);
  };

  // auto-scrollを一時停止
  MAIN.prototype.stopAutoScroll = function(carousel){
    if(!carousel){return}
    if(this.options.autoScroll !== true){return}
    var keyname = this.carousel2keyname(carousel);
    if(!keyname){return;}

    if(this.options.autoScroll === true
    && typeof this.options.autoScrollflg[keyname] !== "undefined"){
      clearTimeout(this.options.autoScrollflg[keyname]);
    }
  };

  // 機能パーツの表示、非表示設定
  MAIN.prototype.viewParts = function(){

    var carousels = this.getElm_bases();
    for(var i=0; i<carousels.length; i++){
      var panels = this.getElm_panels(carousels[i]);

      // next-prev-button
      if(this.options.buttons !== true){
        carousels[i].setAttribute("data-buttons","off");
      }
      else{
        // panel数が表示エリアよりも小さい場合にnext-prevボタンを非表示
        if(panels[0].offsetWidth * panels.length <= carousels[i].offsetWidth){
          carousels[i].setAttribute("data-buttons","off");
        }
      }

      // pagenation-points
      if(this.options.page_point !== true){
        carousels[i].setAttribute("data-page-point","off");
      }
      else{
        // panel数が表示エリアよりも小さい場合にnext-prevボタンを非表示
        if(panels[0].offsetWidth * panels.length <= carousels[i].offsetWidth){
          carousels[i].setAttribute("data-page-point","off");
        }
      }
    }
  };




  // ----------
  var LIB = function(){};

  LIB.prototype.event = function(target, mode, func , flg){
    flg = (flg) ? flg : false;
		if (target.addEventListener){target.addEventListener(mode, func, flg)}
		else{target.attachEvent('on' + mode, function(){func.call(target , window.event)})}
  };

  LIB.prototype.upperSelector = function(elm , selectors) {
    selectors = (typeof selectors === "object") ? selectors : [selectors];
    if(!elm || !selectors){return;}
    var flg = null;
    for(var i=0; i<selectors.length; i++){
      for (var cur=elm; cur; cur=cur.parentElement) {
        if (cur.matches(selectors[i])) {
          flg = true;
          break;
        }
      }
      if(flg){
        break;
      }
    }
    return cur;
  }
  // [共通関数] URL情報分解
	LIB.prototype.urlinfo = function(uri){
    uri = (uri) ? uri : location.href;
    var data={};
    var urls_hash  = uri.split("#");
    var urls_query = urls_hash[0].split("?");
		var sp   = urls_query[0].split("/");
		var data = {
      uri      : uri
		,	url      : sp.join("/")
    , dir      : sp.slice(0 , sp.length-1).join("/") +"/"
    , file     : sp.pop()
		,	domain   : sp[2]
    , protocol : sp[0].replace(":","")
    , hash     : (urls_hash[1]) ? urls_hash[1] : ""
		,	query    : (urls_query[1])?(function(urls_query){
				var data = {};
				var sp   = urls_query.split("#")[0].split("&");
				for(var i=0;i<sp .length;i++){
					var kv = sp[i].split("=");
					if(!kv[0]){continue}
					data[kv[0]]=kv[1];
				}
				return data;
			})(urls_query[1]):[]
		};
		return data;
  };

  // 起動scriptタグを選択
  LIB.prototype.currentScriptTag = (function(){
    var scripts = document.getElementsByTagName("script");
    return this.currentScriptTag = scripts[scripts.length-1].src;
  })();

  LIB.prototype.setOptions = function(options){
    var base_options = JSON.parse(JSON.stringify(__options));
    if(options && Object.keys(options).length){
      for(var i in options){
        base_options[i] = options[i];
      }
    }

    if(!base_options.panelWidthRate){
      base_options.panelWidthRate = "100%";
    }
    else if(base_options.panelWidthRate
    && !String(base_options.panelWidthRate).match(/\%$/)
    && !String(base_options.panelWidthRate).match(/px$/)){
      base_options.panelWidthRate += "%";
    }

    return base_options;
  };

  LIB.prototype.getMargin = function(elm){
    if(elm){
      var elm_style  = getComputedStyle(elm, null);
      var margin_val = elm_style.getPropertyValue("margin-left");
      return Number(margin_val.replace("px",""));
    }
    else{
      return null;
    }
  };



  var AJAX = function(options){
    if(!options){return}
		var httpoj = this.createHttpRequest();
		if(!httpoj){return;}
		// open メソッド;
		var option = this.setOption(options);

		// queryデータ
		var data = this.setQuery(option);
		if(!data.length){
			option.method = "get";
		}

		// 実行
		httpoj.open( option.method , option.url , option.async );
		// type
		if(option.type){
			httpoj.setRequestHeader('Content-Type', option.type);
		}
		
		// onload-check
		httpoj.onreadystatechange = function(){
			//readyState値は4で受信完了;
			if (this.readyState==4 && httpoj.status == 200){
				//コールバック
				option.onSuccess(this.responseText);
			}
		};

		// FormData 送信用
		if(typeof option.form === "object" && Object.keys(option.form).length){
			httpoj.send(option.form);
		}
		// query整形後 送信
		else{
			//send メソッド
			if(data.length){
				httpoj.send(data.join("&"));
			}
			else{
				httpoj.send();
			}
		}
		
  };
	AJAX.prototype.dataOption = {
		url:"",
		query:{},				// same-key Nothing
		querys:[],			// same-key OK
		data:{},				// ETC-data event受渡用
		form:{},
		async:"true",		// [trye:非同期 false:同期]
		method:"POST",	// [POST / GET]
		type:"application/x-www-form-urlencoded", // ["text/javascript" , "text/plane"]...
		onSuccess:function(res){},
		onError:function(res){}
	};
	AJAX.prototype.option = {};
	AJAX.prototype.createHttpRequest = function(){
		//Win ie用
		if(window.ActiveXObject){
			//MSXML2以降用;
			try{return new ActiveXObject("Msxml2.XMLHTTP")}
			catch(e){
				//旧MSXML用;
				try{return new ActiveXObject("Microsoft.XMLHTTP")}
				catch(e2){return null}
			}
		}
		//Win ie以外のXMLHttpRequestオブジェクト実装ブラウザ用;
		else if(window.XMLHttpRequest){return new XMLHttpRequest()}
		else{return null}
	};
	AJAX.prototype.setOption = function(options){
		var option = {};
		for(var i in this.dataOption){
			if(typeof options[i] != "undefined"){
				option[i] = options[i];
			}
			else{
				option[i] = this.dataOption[i];
			}
		}
		return option;
	};
	AJAX.prototype.setQuery = function(option){
		var data = [];
		if(typeof option.datas !== "undefined"){
			for(var key of option.datas.keys()){
				data.push(key + "=" + option.datas.get(key));
			}
		}
		if(typeof option.query !== "undefined"){
			for(var i in option.query){
				data.push(i+"="+encodeURIComponent(option.query[i]));
			}
		}
		if(typeof option.querys !== "undefined"){
			for(var i=0;i<option.querys.length;i++){
				if(typeof option.querys[i] == "Array"){
					data.push(option.querys[i][0]+"="+encodeURIComponent(option.querys[i][1]));
				}
				else{
					var sp = option.querys[i].split("=");
					data.push(sp[0]+"="+encodeURIComponent(sp[1]));
				}
			}
		}
		return data;
	};



  return MAIN;
})();