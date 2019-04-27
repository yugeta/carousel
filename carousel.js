/**
 * Name   : Carousel
 * Since  : 2019.04.25
 * Author : Yugeta Koji
 * 
 * # Nest
 * .carousel
 * ├ .panels
 * │ └  .panel
 * └ control
 *   ├ .button[data-button="prev"]
 *   └ .button[data-button="next"]
 * 
 * # Function
 * button     : click left-right-button
 * drag       : mouse-drag
 * pointer    : click point-link
 * autoScroll : timing
 * 
 */

;$$carousel = (function(){

  var $$event = function(target, mode, func){
		if (typeof target.addEventListener !== "undefined"){
      target.addEventListener(mode, func, false);
    }
    else if(typeof target.attachEvent !== "undefined"){
      target.attachEvent('on' + mode
      , function(){func.call(target , window.event)});
    }
  };

  var $$upperSelector = function(elm , selectors) {
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

  var $$ = function(options){
    this.setOptions(options);

    switch(document.readyState){
      case "complete":
        this.start();
        break;
      case "interactive":
        $$event(window
          , "DOMContentLoaded"
          , (function(e){this.start(e)}).bind(this));
        break;
      default:
        $$event(window
          , "load"
          , (function(e){this.start(e)}).bind(this));
        break;
    }
  };

  $$.prototype.start = function(){console.log(this.options);
    var carousels = document.querySelectorAll(this.options.baseSelector);
    if(!carousels || !carousels.length){return;}

    for(var i=0; i<carousels.length; i++){
      this.setButtons(carousels[i].querySelector(".control"));
      this.setPagenation(carousels[i]);
      var res = this.setPanels(carousels[i]);
      if(!res){continue;}
    }
    this.setCurrentPagenations();
    $$event(window
      , "mousedown"
      , (function(e){this.dragStart(e)}).bind(this));
    $$event(window
      , "mousemove"
      , (function(e){this.dragMove(e)}).bind(this));
    $$event(window
      , "mouseup"
      , (function(e){this.dragEnd(e)}).bind(this));
    $$event(window
      , "touchstart"
      , (function(e){this.dragStart(e)}).bind(this));
    $$event(window
      , "touchmove"
      , (function(e){this.dragMove(e)}).bind(this));
    $$event(window
      , "touchend"
      , (function(e){this.dragEnd(e)}).bind(this));
    
    if(this.options.autoScroll === true){
      for(var i=0; i<carousels.length; i++){
        carousels[i].setAttribute("data-carousel-number" , i);
        this.setAutoScroll_next(carousels[i]);
      }
    }
  }



  // Options
  $$.prototype.options = {
    baseSelector   : ".carousel"
  , panelsSelector : ".panels"
  , panelClass     : "panel"
  , moveTarget     : null
  , moveCount      : 30
  , dragElement    : null
  , dragTranslationRate : 0.3
  , dragInertiaSpeed : 10
  , currentNumber  : 0
  , pagenationElement : null
  , autoScroll     : true
  , autoScrollflg  : {}
  , autoScrollTime : 2000
  };

  $$.prototype.setOptions = function(options){
    if(!options || !Object.keys(options).length){return;}
    for(var i in options){
      this.options[i] = options[i];
    }
  };



  // Intial-Setting
  $$.prototype.setPanels = function(base){
    if(!base){return;}
    var parent = base.querySelector(":scope " + this.options.panelsSelector);
    var panels = parent.querySelectorAll(":scope > *");
    if(!panels || panels.length <= 1){
      return false;
    }
    for(var i=0; i<panels.length; i++){
      panels[i].setAttribute("class" , this.options.panelClass);
      panels[i].setAttribute("data-number" , i);
    }
    // count-2(x2)
    if(panels.length <= 2){
      var count = panels.length;
      for(var i=0; i<count; i++){
        var newElm = panels[i].cloneNode(true);
        newElm.setAttribute("data-clone" , "1");
        panels[i].setAttribute("data-number" , i);
        parent.appendChild(newElm);
      }
    }
    // count-3over
    else{
      var firstPanel = parent.firstElementChild;
      var lastPanel  = parent.lastElementChild;
      parent.insertBefore(lastPanel , firstPanel);
    }
    return true;
  };

  // Button (left,right)
  $$.prototype.setButtons = function(base){
    if(!base){return}

    var button_left = base.querySelector(".button[data-button='prev']");
    if(!button_left){
      button_left = document.createElement("div");
      button_left.setAttribute("class"       , "button");
      button_left.setAttribute("data-button" , "prev");
      base.insertBefore(button_left , base.firstElementChild);
    }
    $$event(button_left
      , "click"
      , (function(e){this.clickControlButton(e)}).bind(this));
    
    var button_right = base.querySelector(".button[data-button='next']");
    if(!button_right){
      button_right = document.createElement("div");
      button_right.setAttribute("class"       , "button");
      button_right.setAttribute("data-button" , "next");
      base.insertBefore(button_right , base.firstElementChild);
    }
    $$event(button_right
      , "click"
      , (function(e){this.clickControlButton(e)}).bind(this));
  };

  $$.prototype.clickControlButton = function(e){
    if(this.options.moveTarget !== null){return;}

    var button = e.currentTarget;
    if(!button){return}

    var direction = button.getAttribute("data-button");
    if(!direction){return}

    var base = $$upperSelector(button , this.options.baseSelector);
    if(!base){return}

    var panels = base.querySelectorAll(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass);
    if(!panels || !panels.length){return}

    if(this.options.autoScroll === true){
      var carousel_number = base.getAttribute("data-carousel-number");
      clearTimeout(this.options.autoScrollflg[carousel_number]);
    }

    this.options.moveTarget       = base;
    this.options.moveCurrentCount = 0;
    this.options.moveUnit         = 100 / this.options.moveCount;
    switch(direction){
      case "prev":
        this.animButton_right();
        break;
      case "next":
        this.animButton_left();
        break;
    }
  };

  $$.prototype.animButton_left = function(){
    var base = this.options.moveTarget;
    if(!this.options.moveTarget){return;}
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.moveUnit * this.options.moveCurrentCount + 100;
    if((200 - value) >= this.options.moveUnit){
      first.style.setProperty("margin-left" , (value * -1) + "%" , "");
      setTimeout((function(){this.animButton_left()}).bind(this),10);
    }
    else{
      this.options.moveTarget = null;
      first.style.removeProperty("margin-left");
      var parent = base.querySelector(":scope "+this.options.panelsSelector);
      parent.appendChild(first);
      this.setCurrentPagenation(base);

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }

  $$.prototype.animButton_right = function(){
    var base = this.options.moveTarget;
    if(!this.options.moveTarget){return;}
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.moveUnit * this.options.moveCurrentCount - 100;
    if((100 - value) > this.options.moveUnit + 100){
      first.style.setProperty("margin-left" , (value) + "%" , "");
      setTimeout((function(){this.animButton_right()}).bind(this) , 10);
    }
    else{
      this.options.moveTarget = null;
      first.style.removeProperty("margin-left");
      var parent = base.querySelector(":scope " + this.options.panelsSelector);
      parent.insertBefore(parent.lastElementChild , first);
      this.setCurrentPagenation(base);

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }



  // Drag
  $$.prototype.dragStart = function(e){
    var target = e.target;
    if(!target){return;}
    if($$upperSelector(target,".carousel .control *")){return;}
    var base = $$upperSelector(target,this.options.baseSelector);
    if(!base){return;}
    this.options.dragElement  = base;
    this.options.dragPosition = e.pageX;
    this.options.baserWidth   = base.offsetWidth;

    if(this.options.autoScroll === true){
      var carousel_number = base.getAttribute("data-carousel-number");
      clearTimeout(this.options.autoScrollflg[carousel_number]);
    }
  };
  $$.prototype.dragMove = function(e){
    if(!this.options.dragElement){return;}
    var firstPanel = this.options.dragElement.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    if(!firstPanel){return;}
    this.options.dragDiff = e.pageX - this.options.dragPosition;
    var x = (-1 * this.options.baserWidth + this.options.dragDiff);
    if(x < this.options.baserWidth * -2){
      x = this.options.baserWidth * -2;
    }
    else if(x > 0){
      x = 0;
    }
    firstPanel.style.setProperty("margin-left"
      , x + "px"
      , "");
  };
  $$.prototype.dragEnd = function(e){
    if(!this.options.dragElement){return;}
    this.options.dragElement_motion = this.options.dragElement;
    this.options.dragElement = null;
    this.options.moveCurrentCount = 0;
    var direct = null;
    // to-left
    if(this.options.dragDiff < (this.options.baserWidth * this.options.dragTranslationRate * -1)){
      this.dragMotion_left();
    }
    // to-right
    else if(this.options.dragDiff > (this.options.baserWidth * this.options.dragTranslationRate)){
      this.dragMotion_right();
    }
    // to-current
    else if(this.options.dragDiff !== 0){
      if(this.options.dragDiff < 0){
        this.dragMotionBack_right();
      }
      else if(this.options.dragDiff > 0){
        this.dragMotionBack_left();
      }
    }
  };
  $$.prototype.dragMotion_left = function(){
    var base = this.options.dragElement_motion;
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.dragDiff - (this.options.dragInertiaSpeed * this.options.moveCurrentCount);
    if(this.options.baserWidth + value  > this.options.dragInertiaSpeed * 1.5){
      first.style.setProperty("margin-left" , ((-1 * this.options.baserWidth) + value) + "px" , "");
      setTimeout((function(){this.dragMotion_left()}).bind(this) , 10);
    }
    else{
      this.options.dragElement_motion = null;
      first.style.removeProperty("margin-left");
      var parent = base.querySelector(":scope " + this.options.panelsSelector);
      parent.appendChild(first);
      this.setCurrentPagenation(base);

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }
  $$.prototype.dragMotion_right = function(){
    var base = this.options.dragElement_motion;
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.dragDiff + (this.options.dragInertiaSpeed * this.options.moveCurrentCount);
    if(this.options.baserWidth - value  > this.options.dragInertiaSpeed * 1.5){
      first.style.setProperty("margin-left" , ((-1 * this.options.baserWidth) + value) + "px" , "");
      setTimeout((function(){this.dragMotion_right()}).bind(this) , 10);
    }
    else{
      this.options.dragElement_motion = null;
      first.style.removeProperty("margin-left");
      var parent = base.querySelector(":scope " + this.options.panelsSelector);
      parent.insertBefore(parent.lastElementChild , first);
      this.setCurrentPagenation(base);

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }
  $$.prototype.dragMotionBack_left = function(){
    var base = this.options.dragElement_motion;
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.dragDiff - (this.options.dragInertiaSpeed * this.options.moveCurrentCount);
    if(value  > this.options.dragInertiaSpeed * 1.5){
      first.style.setProperty("margin-left" , (value - base.offsetWidth) + "px" , "");
      setTimeout((function(){this.dragMotionBack_left()}).bind(this) , 10);
    }
    else{
      this.options.dragElement_motion = null;
      first.style.removeProperty("margin-left");

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }
  $$.prototype.dragMotionBack_right = function(){
    var base = this.options.dragElement_motion;
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
    this.options.moveCurrentCount++;
    var value = this.options.dragDiff + (this.options.dragInertiaSpeed * this.options.moveCurrentCount);
    if(value  < -this.options.dragInertiaSpeed * 1.5){
      first.style.setProperty("margin-left" , (value - base.offsetWidth) + "px" , "");
      setTimeout((function(){this.dragMotionBack_right()}).bind(this) , 10);
    }
    else{
      this.options.dragElement_motion = null;
      first.style.removeProperty("margin-left");

      if(this.options.autoScroll === true){
        this.setAutoScroll_next(base);
      }
    }
  }


  // Pagenation
  $$.prototype.setPagenation = function(base){
    if(!base){return;}
    var pagenation_parent = base.querySelector(":scope .control .pagenation");
    if(!pagenation_parent){
      var div = document.createElement("div");
      div.setAttribute("class" , "pagenation");
      base.querySelector(".control").appendChild(div);
    }
    var panels = base.querySelectorAll(":scope "+ this.options.panelsSelector +" > *");
    if(!panels || !panels.length){return;}
    for(var i=0; i<panels.length; i++){
      var div = document.createElement("div");
      div.setAttribute("class" , "point");
      div.setAttribute("data-number" , i);
      $$event(div , "click" , (function(e){this.clickPagenation(e)}).bind(this));
      pagenation_parent.appendChild(div);
    }
  };

  $$.prototype.clickPagenation = function(e){
    var point_target = e.currentTarget;
    if(!point_target){return;}
    if(point_target.getAttribute("data-current") === "1"){return;}
    var number = point_target.getAttribute("data-number");
    if(!number){return;}
    var base = $$upperSelector(point_target , this.options.baseSelector);
    if(!base){return;}
    var panel_target = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+"[data-number='"+number+"']");
    if(!panel_target){return;}
    this.options.pagenationElement = panel_target;
    this.getPagenationMotion();

    if(this.options.autoScroll === true){
      var carousel_number = base.getAttribute("data-carousel-number");
      clearTimeout(this.options.autoScrollflg[carousel_number]);
    }
  };

  $$.prototype.setCurrentPagenations = function(){
    var bases = document.querySelectorAll(this.options.baseSelector);
    if(!bases || !bases.length){return;}
    for(var i=0; i<bases.length; i++){
      this.setCurrentPagenation(bases[i]);
    }
  };
  $$.prototype.setCurrentPagenation = function(base){
    if(!base){return;}
    var panel_target = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":nth-child(2)");
    if(!panel_target){return;}
    var currentNumber = panel_target.getAttribute("data-number");
    if(!currentNumber){return;}
    var pagenation_target = base.querySelector(":scope .control .pagenation .point[data-number='"+currentNumber+"']");
    if(!pagenation_target){return;}
    var points = base.querySelectorAll(":scope .control .pagenation .point");
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

  $$.prototype.getPagenationMotion = function(){
    if(!this.options.pagenationElement){return;}
    var base = $$upperSelector(this.options.pagenationElement , this.options.baseSelector);
    var first = base.querySelector(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass+":first-child");
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
      var panels = base.querySelectorAll(":scope "+this.options.panelsSelector+" > ."+this.options.panelClass);
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
          var currentFirst = parent.querySelector(":scope > ."+this.options.panelClass+":first-child");
          var currentLast  = parent.querySelector(":scope > ."+this.options.panelClass+":last-child");
          parent.insertBefore(currentLast , currentFirst);
        }
      }
      else{
        for(var i=0; i<(order - 1); i++){
          var currentFirst = parent.querySelector(":scope > ."+this.options.panelClass+":first-child");
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

  // AutoScroll
  $$.prototype.setAutoScroll_next = function(base){
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
  
  $$.prototype.autoScrollMotion = function(base){
    var nextButton = base.querySelector(":scope .control .button[data-button='next']");
    if(!nextButton){return;}
    nextButton.click();

    this.setAutoScroll_next(base);
  };

  return $$;
})();