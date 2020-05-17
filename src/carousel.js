;$$carousel = (function(){

  // Options
  var __options = {
  target              : null,
  baseSelector        : ".carousel",
  panelsSelector      : ".panels",
  panelClassName      : "panel",
  panelWidthRate      : 100,
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
  autoScrollTime      : 2000,
  html                : "",
  loaded              : function(e){}
  };

  // ----------
  var LIB = function(){};

  LIB.prototype.event = function(target, mode, func){
		if (typeof target.addEventListener !== "undefined"){
      target.addEventListener(mode, func, false);
    }
    else if(typeof target.attachEvent !== "undefined"){
      target.attachEvent('on' + mode
      , function(){func.call(target , window.event)});
    }
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

  
  
  // ----------
  var MAIN = function(options){
    this.options = this.setOptions(options);
    if(!this.options.target){return;}
// console.log(__options);
// console.log(this.options);

    var lib = new LIB();
    switch(document.readyState){
      case "complete"    : this.start(); break;
      case "interactive" : lib.event(window , "DOMContentLoaded" , (function(e){this.start(e)}).bind(this)); break;
      default            : lib.event(window , "load"             , (function(e){this.start(e)}).bind(this)); break;
    }
  };

  MAIN.prototype.start = function(){
    var lib = new LIB();
    var base_pathinfo = lib.urlinfo(lib.currentScriptTag);
    this.autoload_css(base_pathinfo);
    // this.autoload_ajax(base_pathinfo);
    this.setEvent();
  }

  MAIN.prototype.autoload_css = function(base_pathinfo){
    // [初期設定] 基本CSSセット(jsと同じ階層同じファイル名.cssを読み込む)
    var head = document.getElementsByTagName("head");
    var base = (head) ? head[0] : document.body;
    var css  = document.createElement("link");
    css.rel  = "stylesheet";
    // css.id   = "carousel";
    var plugin_css = base_pathinfo.dir + base_pathinfo.file.replace(".js",".css");
    var query = [];
    for(var i in base_pathinfo.query){
      query.push(i);
    }
    css.href = plugin_css +"?"+ query.join("");
    css.onload = (function(){
      this.setStyleSheets();
      var lib = new LIB();
      var base_pathinfo = lib.urlinfo(lib.currentScriptTag);
      this.autoload_ajax(base_pathinfo);
    }).bind(this);
    base.appendChild(css);
  };

  MAIN.prototype.getStyleSheet = function(){
    var sss = document.styleSheets;
    var ss = null;
    for(var i=0; i<sss.length; i++){
      if(sss[i].href && sss[i].href.indexOf("carousel.css") !== -1){
        ss = sss[i];
        break;
      }
    }
    return ss;
  };

  MAIN.prototype.setStyleSheets = function(){
    var ss = this.getStyleSheet();
    if(ss === null){return;}
    this.setStyleSheet(ss);
  };
  MAIN.prototype.setStyleSheet = function(ss){
    var width  = this.options.panelWidthRate ? Number(this.options.panelWidthRate)  : 100;
    var margin = this.options.panelMargin    ? Number(this.options.panelMargin / 2) : 0;
    for(var i=0; i<ss.cssRules.length; i++){
      if(ss.cssRules[i].selectorText === ".carousel .panels > *"){
        // ss.cssRules[i].style.width = this.options.panelWidth +"%";
        ss.cssRules[i].style.setProperty("width"        , width +"%" , "");
        ss.cssRules[i].style.setProperty("margin-left"  , margin +"px" , "");
        ss.cssRules[i].style.setProperty("margin-right" , margin +"px" , "");
      }
    }
  }

  MAIN.prototype.autoload_ajax = function(base_pathinfo){
    if(typeof $$ajax !== "undefined"){
      this.load_template(base_pathinfo);
      return;
    }
    var head = document.getElementsByTagName("head");
    var base = (head) ? head[0] : document.body;
    var js   = document.createElement("script");
    var src  = base_pathinfo.dir + "ajax.js";
    var query = [];
    for(var i in base_pathinfo.query){
      query.push(i);
    }
    js.src = src +"?"+ query.join("");
    js.onload = (function(base_pathinfo,res){
      this.load_template(base_pathinfo);
    }).bind(this,base_pathinfo);
    base.appendChild(js);
  };

  MAIN.prototype.load_template = function(base_pathinfo){
    var lib = new LIB();
    var url = base_pathinfo.dir + base_pathinfo.file.replace(".js",".html");
    new $$ajax({
      url : url,
      method : "get",
      onSuccess : (function(html){
        this.set_template(html);
        this.setCarousels();

        if(typeof this.options.loaded !== "undefined"){
          this.options.loaded();
        }
        
      }).bind(this)
    });
  };
  MAIN.prototype.set_template = function(html){
    if(!html){return;}
    var target = document.querySelector(this.options.target);
    var panels = target.innerHTML;
    html = this.options.html ? this.options.html : html.replace("{{panels}}" , panels);
    target.innerHTML = html;
    var panels_area = target.querySelector(this.options.panelsSelector);
    if(!panels_area || !this.options.html){return;}
    panels_area.innerHTML = this.options.html;
  };

  MAIN.prototype.setCarousels = function(){
    var carousels = document.querySelectorAll(this.options.baseSelector);
    if(!carousels || !carousels.length){return;}
    // 複数の表示に対応
    for(var i=0; i<carousels.length; i++){
      if(this.options.autoScroll === true){
        carousels[i].setAttribute("data-carousel-number" , i);
        this.setAutoScroll_next(carousels[i]);
      }
      this.setButtons(carousels[i]);
      var res = this.setPanels(carousels[i]);
      if(!res){continue;}
      this.setPagenations(carousels[i]);
    }
    this.setCurrentPagenations();
    this.setEvent_panels();
    this.setPagenation_active();
  };

  MAIN.prototype.setEvent = function(){
    var lib = new LIB();
    lib.event(window , "mousedown" , (function(e){this.dragStart(e)}).bind(this));
    lib.event(window , "mousemove" , (function(e){this.dragMove(e)}).bind(this));
    lib.event(window , "mouseup"   , (function(e){this.dragEnd(e)}).bind(this));
    lib.event(window , "touchstart", (function(e){this.dragStart(e)}).bind(this));
    lib.event(window , "touchmove" , (function(e){this.dragMove(e)}).bind(this));
    lib.event(window , "touchend"  , (function(e){this.dragEnd(e)}).bind(this));
  };

  MAIN.prototype.setEvent_panels = function(){
    var panel_parent = this.getElm_panelParent();
    if(panel_parent){
      new LIB().event(panel_parent , "transitionend" , (function(e){
        parent = e.target;
        if(parent.hasAttribute("data-animation")){
          parent.removeAttribute("data-animation","1");
        }

        this.setSort_activePanel();
        var marginLeft = this.getNextPanel_marginLeft();
        parent.style.setProperty("margin-left" , marginLeft + "px" , "");
        this.setPanelAnimation();
        parent.style.removeProperty("margin-left");
      }).bind(this));
    }
  };
  

  MAIN.prototype.setOptions = function(options){
    var base_options = JSON.parse(JSON.stringify(__options));
    if(options && Object.keys(options).length){
      for(var i in options){
        base_options[i] = options[i];
      }
    }
    return base_options;
  };


  // ----------
  // Intial-Setting
  MAIN.prototype.setPanels = function(base){
    if(!base){return;}
    var parent = base.querySelector(":scope " + this.options.panelsSelector);
    var panels = parent.querySelectorAll(":scope > *");
    if(!panels || !panels.length){return false;}

    // set-initial
    for(var i=0; i<panels.length; i++){
      this.setPanel(panels[i] , i);
    }
    // set-active : 最初は先頭をactiveにする
    panels[0].setAttribute("data-active" , "1");

    // set-sort-active-panel
    this.setSort_activePanel();
    this.setActivePanel_viewCenter_now();

    return true;
  };

  MAIN.prototype.setPanel = function(panel , num){
    if(panel.hasAttribute("data-panel")){return;}
    panel.setAttribute("data-panel" , num);
    if(!panel.classList.contains(this.options.panelClass)){
      panel.classList.add(this.options.panelClassName);
    }
    panel.style.setProperty("width"  , this.options.panelWidthRate +"%" ,"");
  };

  // 現在activeのpanelを中心に持ってくるように、並びの入れ替えを行う
  // oxxxx -> xxoxx
  // oxxx  -> xoxx
  MAIN.prototype.setSort_activePanel = function(){
    var parent = this.getElm_panelParent();
    var panels = this.getElm_panels(parent);
    
    // 総panel数の取得
    var total_count = panels.length;

    // active-panelの現在位置
    var current_num = this.getActivePanel_num(panels);

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
    panels = panels ? panels : this.getElm_panels();
    var num = this.getActivePanel_num(panels);
    if(num === null || typeof panels[num] === "undefined"){
      return null;
    }
    else{
      return panels[num];
    }
  };
  MAIN.prototype.getActivePanel_num = function(panels){
    panels = panels ? panels : this.getElm_panels();
    var current_num = null;
    for(var i=0; i<panels.length; i++){
      if(panels[i].getAttribute("data-active") === "1"){
        current_num = i;
        break;
      }
    }
    return current_num;
  };

  MAIN.prototype.setActivePanel_viewCenter_now = function(){
    var base   = this.getElm_base();
    var parent = this.getElm_panelParent(base);
    var panels = this.getElm_panels(parent);
    if(!panels || !panels.length){return;}

    // get-info : 初期の移動アニメーションをさせない処理
    var marginLeft    = this.getNextPanel_marginLeft(base , parent , panels);
    parent.style.setProperty("margin-left" , marginLeft + "px" , "");
    this.setPanelAnimation();
    parent.style.removeProperty("margin-left");
  };

  MAIN.prototype.getCurrentMargin_panelParent = function(panel_parent){
    panel_parent = panel_parent ? panel_parent : this.getElm_panelParent();
    if(panel_parent === null){return null;}
    return Number(getComputedStyle(panel_parent, null).getPropertyValue("margin-left").replace("px",""));
  };
  MAIN.prototype.getNextPanel_marginLeft = function(base , parent , panels){
    base              = base   ? base   : this.getElm_base();
    parent            = parent ? parent : this.getElm_panelParent(base);
    panels            = panels ? panels : this.getElm_panels(parent);

    var current_panel = this.getActivePanel_elm(panels);
    var parent_margin = this.getCurrentMargin_panelParent(parent);
    var base_width    = base.offsetWidth;
    var active_width  = current_panel.offsetWidth;
    var inner_left    = Math.floor(base_width/2) - Math.floor(active_width / 2);
    var active_left   = current_panel.offsetLeft;
    var center_pos    = active_left - inner_left + (parent_margin * -1);
    return center_pos * -1;
  };


  // get-element
  MAIN.prototype.getElm_base = function(){
    return document.querySelector(this.options.target +" "+ this.options.baseSelector);
  };
  MAIN.prototype.getElm_panelParent = function(base){
    base = base ? base : this.getElm_base();
    if(!base){return null;}
    return base.querySelector(":scope "+ this.options.panelsSelector);
  };
  MAIN.prototype.getElm_panels = function(panel_parent){
    panel_parent = panel_parent ? panel_parent : this.getElm_panelParent();
    return panel_parent.querySelectorAll(":scope > ."+ this.options.panelClassName);
  };
  MAIN.prototype.getElm_pagenationArea = function(base){
    if(this.options.pagenationElement){
      return this.options.pagenationElement;
    }
    return document.querySelector(this.options.pagenationSelector);
  };
  MAIN.prototype.getElm_pagenations = function(pagenation_area){
    pagenation_area = pagenation_area ? pagenation_area : this.getElm_pagenationArea();
    if(!pagenation_area){return null;}
    return pagenation_area.querySelectorAll(":scope > *");
  }




  // Button (left,right)
  MAIN.prototype.setButtons = function(base){
    if(!base){return}

    var button_left = base.querySelector(".button[data-button='prev']");
    if(!button_left){
      button_left = document.createElement("div");
      button_left.setAttribute("class"       , "button");
      button_left.setAttribute("data-button" , "prev");
      base.insertBefore(button_left , base.firstElementChild);
    }
    new LIB().event(button_left , "click" , (function(e){this.animButton_prev(e)}).bind(this));
    
    var button_right = base.querySelector(".button[data-button='next']");
    if(!button_right){
      button_right = document.createElement("div");
      button_right.setAttribute("class"       , "button");
      button_right.setAttribute("data-button" , "next");
      base.insertBefore(button_right , base.firstElementChild);
    }
    new LIB().event(button_right , "click" , (function(e){this.animButton_next(e)}).bind(this));
  };

  // ->に移動
  MAIN.prototype.animButton_prev = function(e){
    var panels = this.getElm_panels();

    // auto-scrollを一時停止
    var base = new LIB().upperSelector(panels[0] , this.options.baseSelector);
    this.stopAutoScroll(base);

    // 現在activeの取得
    var current_num = this.getActivePanel_num();
    if(current_num === null){return;}

    // 次の項目を取得 (次が無い場合は、リストの先頭を取得)
    var prev_num = current_num >= 1 ? current_num -1 : panels.length-1;

    // 次の項目にactiveを移動
    panels[current_num].removeAttribute("data-active");
    panels[prev_num].setAttribute("data-active","1");

    // 移動
    this.setPanelAnimation();

    // autoscroll 再開
    this.setAutoScroll(base);
  };

  // <-に移動
  MAIN.prototype.animButton_next = function(e){
    var panels = this.getElm_panels();

    // auto-scrollを一時停止
    var base = new LIB().upperSelector(panels[0] , this.options.baseSelector);
    this.stopAutoScroll(base);

    // 現在activeの取得
    var current_num = this.getActivePanel_num(panels);
    if(current_num === null){return;}

    // 次の項目を取得 (次が無い場合は、リストの先頭を取得)
    var next_num = typeof panels[current_num + 1] !== "undefined" ? current_num + 1 : 0;

    // 次の項目にactiveを移動
    panels[current_num].removeAttribute("data-active");
    panels[next_num].setAttribute("data-active","1");

    // 移動
    this.setPanelAnimation();

    // autoscroll 再開
    this.setAutoScroll(base);
  };

  MAIN.prototype.setPanelAnimation = function(){
    var base   = this.getElm_base();
    var parent = this.getElm_panelParent(base);
    var panels = this.getElm_panels(parent);

    // 現在activeの取得
    var current_num = this.getActivePanel_num(panels);
    if(current_num === null){return;}

    // set css-animation
    var marginLeft = this.getNextPanel_marginLeft(base , parent , panels);
    var ss = this.getStyleSheet();
    // style値のセット
    for(var i=0; i<ss.cssRules.length; i++){
      if(ss.cssRules[i].selectorText === '.carousel .panels[data-animation="1"]'){
        ss.cssRules[i].style.setProperty("margin-left" , marginLeft +"px" , "");
        break;
      }
    }
    
    // animation-play
    if(!parent.hasAttribute("data-animation")){
      parent.setAttribute("data-animation","1");
    }

    // pagenation
    this.setPagenation_active(base);
  };
  MAIN.prototype.setPanelAnimation_silent = function(parent){
    parent = parent ? parent : this.getElm_panelParent();
    if(parent.hasAttribute("data-animation")){
      parent.removeAttribute("data-animation","1");
    }

    this.setSort_activePanel();
    var marginLeft = this.getNextPanel_marginLeft();
    parent.style.setProperty("margin-left" , marginLeft + "px" , "");
  }





  // ----------
  // Drag
  MAIN.prototype.dragStart = function(e){
    var target = e.target;
    if(!target){return;}
    if(!new LIB().upperSelector(target　,　this.options.baseSelector)){return;}

    var base = new LIB().upperSelector(target,this.options.baseSelector);
    if(!base){return;}
    var parent = this.getElm_panelParent(base);
    if(!parent){return;}

    var pageX = typeof e.touches === "undefined" ? e.pageX : e.touches[0].pageX;

    this.drag = {
      target      : parent,
      startPos    : pageX,
      marginLeft  : Number(getComputedStyle(parent, null).getPropertyValue("margin-left").replace("px",""))
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
    this.drag.target.style.setProperty("margin-left" , cssMarginLeft +"px" , "");
    this.drag.target.setAttribute("data-animation","0");

    // auto-scrollを一時停止
    this.stopAutoScroll(base);
  };

  MAIN.prototype.dragMove = function(e){
    if(!this.drag || !this.drag.target || typeof this.drag.target === "undefined"){return;}
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

    

    // activeフラグをセット -----
    // - 画面中央のpanelを取得
    var center_panel = this.getElm_centerPanel(this.drag.target,this.drag.direct);
    if(center_panel){
      // 現在のactive-panel
      var panels = this.getElm_panels(this.drag.target);
      var active_panel = this.getActivePanel_elm(panels);
      if(active_panel && active_panel.hasAttribute("data-active")){
        active_panel.removeAttribute("data-active")
      }
      center_panel.setAttribute("data-active" , "1");
    }

    // 既存座標が直接指定の場合の対処法
    var currentMarginLeft = Number(getComputedStyle(this.drag.target, null).getPropertyValue("margin-left").replace("px",""));
    if(currentMarginLeft){
      var ss = this.getStyleSheet();
      for(var i=0; i<ss.cssRules.length; i++){
        if(ss.cssRules[i].selectorText === '.carousel .panels[data-animation="1"]'){
          ss.cssRules[i].style.setProperty("margin-left" , currentMarginLeft +"px" , "");
          break;
        }
      }
      this.drag.target.style.removeProperty("margin-left");
    }

    // autoscroll 再開
    var base = new LIB().upperSelector(this.drag.target , this.options.baseSelector);
    this.setAutoScroll(base);

    // キャッシュデータを削除
    this.drag = null;

    // センタリングアニメ
    this.setPanelAnimation();

  };

  MAIN.prototype.getElm_centerPanel = function(panel_parent , direct){
    panel_parent = panel_parent ? panel_parent : this.getElm_panelParent();
    if(!panel_parent){return;}
    var base         = new LIB().upperSelector(panel_parent , this.options.baseSelector);
    var baseSizeRate = 0.3;
    var panels       = this.getElm_panels(panel_parent);
    if(!panels || !panels.length){return;}
    var target_panel = null;
    for(var i=0; i<panels.length; i++){
      // direct : <- next 
      if(direct === "next"
      && 0 <= panels[i].offsetLeft
      && panels[i].offsetLeft <= base.offsetWidth * (1.0 - baseSizeRate)){
        target_panel = panels[i];
        break;
      }

      // direct : prev ->
      else if(direct === "prev"
      && base.offsetWidth * baseSizeRate <= panels[i].offsetLeft + panels[i].offsetWidth
      && panels[i].offsetLeft + panels[i].offsetWidth <= base.offsetWidth){
        target_panel = panels[i];
        break;
      }
    }
    return target_panel;
  };


  // ----------
  // Pagenation
  MAIN.prototype.setPagenations = function(base){
    if(!base){return;}
    var pagenation_parent = this.getElm_pagenationArea(base);
    if(!pagenation_parent){return;}
    var panels = base.querySelectorAll(":scope "+ this.options.panelsSelector +" > ."+ this.options.panelClassName);
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
    var base = this.getElm_base();
    if(!base){return;}
    // 現在active-panelのactive-flgを削除
    var parent        = parent ? parent : this.getElm_panelParent(base);
    var panels        = panels ? panels : this.getElm_panels(parent);
    var current_panel = this.getActivePanel_elm(panels);
    if(current_panel.hasAttribute("data-active")){
      current_panel.removeAttribute("data-active");
    }

    // 対象のpanelにactive-flgをセット
    var panel_target = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName +"[data-panel='"+num+"']");
    if(!panel_target){return;}
    panel_target.setAttribute("data-active","1");
    this.setPanelAnimation();
  };

  MAIN.prototype.setCurrentPagenations = function(){
    var bases = document.querySelectorAll(this.options.baseSelector);
    if(!bases || !bases.length){return;}
    for(var i=0; i<bases.length; i++){
      this.setCurrentPagenation(bases[i]);
    }
  };
  MAIN.prototype.setCurrentPagenation = function(base){
    if(!base){return;}
    var panel_target = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName +":nth-child(2)");
    if(!panel_target){return;}
    var currentNumber = panel_target.getAttribute("data-number");
    if(!currentNumber){return;}
    var pagenation_target = base.querySelector(":scope .pagenation .point[data-number='"+currentNumber+"']");
    if(!pagenation_target){return;}
    var points = base.querySelectorAll(":scope .pagenation .point");
    if(!points || !points.length){return;}
    for(var i=0; i<points.length; i++){
      if(points[i].getAttribute("data-number") === currentNumber){
        points[i].setAttribute("data-current" , "1");
      }
      else{
        points[i].removeAttribute("data-current");
      }
    }
    this.options.currentNumber = Number(currentNumber);
  }

  MAIN.prototype.getPagenationMotion = function(){
    if(!this.options.pagenationElement){return;}
    var base = new LIB().upperSelector(this.options.pagenationElement , this.options.baseSelector);
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClassName +":first-child");
    if(!first){return;}
    var currentPosition = this.options.pagenationElement.offsetLeft;
    if(currentPosition < -10){
      first.style.setProperty("margin-left", (first.offsetLeft + 20) + "px" , "");//(currentPosition / 4)
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
      this.setCurrentPagenations();
      this.options.pagenationElement = null;

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  };
  MAIN.prototype.setPagenation_active = function(base){
    base = base ? base : this.getElm_base();
    var panel_parent = this.getElm_panelParent(base);
    var panels       = this.getElm_panels(panel_parent);
    var current_elm = this.getActivePanel_elm(panels);
    if(current_elm === null){return;}
    var current_num = current_elm.getAttribute("data-panel");
    if(current_num === null){return;}
    var pagenation_area = this.getElm_pagenationArea();
    var pagenations = this.getElm_pagenations(pagenation_area);

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
  MAIN.prototype.setAutoScroll_next = function(base){
    if(!base){return;}
    var carousel_number = base.getAttribute("data-carousel-number");
    if(!carousel_number){return;}
    if(typeof this.options.autoScrollflg[carousel_number] !== "undefined"){
      clearTimeout(this.options.autoScrollflg[carousel_number]);
    }

    this.options.autoScrollflg[carousel_number] = setTimeout((function(base){
      this.autoScrollMotion(base);
    }).bind(this,base),this.options.autoScrollTime);
  };
  
  MAIN.prototype.autoScrollMotion = function(base){
    var nextButton = base.querySelector(":scope .button[data-button='next']");
    if(!nextButton){return;}
    nextButton.click();

    this.setAutoScroll_next(base);
  };

  // autoscrollを再開
  MAIN.prototype.setAutoScroll = function(base){
    if(this.options.autoScroll !== true){return;}
    base = base ? base : this.getElm_base();
    var carousel_number = base.getAttribute("data-carousel-number");
    this.options.autoScrollflg[carousel_number] = setTimeout((function(base){
      this.autoScrollMotion(base);
    }).bind(this,base) , this.options.autoScrollTime);
  };

  // auto-scrollを一時停止
  MAIN.prototype.stopAutoScroll = function(base){
    if(this.options.autoScroll === true){
      var carousel_number = base.getAttribute("data-carousel-number");
      clearTimeout(this.options.autoScrollflg[carousel_number]);
    }
  };


  return MAIN;
})();