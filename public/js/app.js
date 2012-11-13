 
$(function(){


  Memo = Backbone.Model.extend({

    idAttribute:"_id",

    defaults : {
      x:50,
      y:50,
      z:0,
      width:150,
      height:150,
      color : "#E9E74A",
      body:'memo'
    },
    setTopLeft : function(x, y){
      this.set({x:x, y:y});
    },
    setDim : function(w,h) {
      this.set({width:w, height:h});
    }
  });

  MemoList = Backbone.Collection.extend({
    model : Memo,
    url: "../api/memos"
  });

  window.ProjectViews  = window.ProjectViews || { zmax:0, colorlist:["#D0E17D", "#36A9CE", "#EF5AA1", "#AE86BC", "#FFDF25", "#F9A55B", "#BFB4AF"]};

  ProjectViews.MemoView = Backbone.View.extend({

    template : _.template($('#memoTemplate').html()),

    events : {
      'mouseenter memo' : 'hoveringStart',
      'mouseleave' : 'hoveringEnd',
      'mousedown .drag' : 'draggingStart',
      'mousedown .resize' : 'resizingStart',
      'mousedown .change-color' : 'changingColor',
      'mousedown .delete' : 'deleting',
      'blur .shape' : 'saveMemobody'
     },

    initialize : function(){
      $('#page').mousemove(this,this.mousemove).mouseup(this,this.mouseup);
      this.model.on("change", this.render, this);
      this.model.on("destroy", this.remove, this);
    },

    render : function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    mousemove:function(e){
      if(!e||!e.data) return;
      var self=e.data;
      if(self.dragging){
        self.model.setTopLeft(e.pageX- self.initialX,e.pageY- self.initialY);}
      else if(self.resizing){
        self.model.setDim(e.pageX- self.model.get('x') < 80? 80: e.pageX- self.model.get('x') , e.pageY- self.model.get('y') < 80 ? 80: e.pageY- self.model.get('y'));
      }
      //console.log("resizing:" + self.resizing + ",dragging:" + self.dragging + ",x:" + self.model.get("x") + ",y:" + self.model.get("y"));
    },

    saveMemobody : function(){
      this.model.set({ body : this.$(".shape").html() });
      this.model.save();
    },

    mouseup : function(e){
      if(!e||!e.data)return;
      var self=e.data;
      if(self.dragging || self.resizing ){
        console.log(self.model.get("_id"));
        self.model.save();
      }
      self.dragging=self.resizing=false;
    },

    hoveringStart : function(){
      this.$(".control").removeClass("hide");
    },

    hoveringEnd : function(){
      this.$(".control").addClass("hide");
    },

    draggingStart : function(e) {
      ProjectViews.zmax++;
      this.model.set({z:ProjectViews.zmax});
      this.dragging=true;
      this.initialX = e.pageX - this.model.get("x");
      this.initialY = e.pageY - this.model.get("y");
      return false;
    },

    resizingStart : function(){
      ProjectViews.zmax++;
      this.model.set({z:ProjectViews.zmax});
      this.resizing = true;
      return false;
    },

    changingColor : function(){
      var cl = ProjectViews.colorlist;
      var color = cl[(cl.indexOf(this.model.get("color")) + 1) % cl.length];
      this.model.set({ color : color });
      this.model.save();
    },

    deleting : function(){
      this.model.destroy();
    },

    remove : function(){
      this.$el.remove();
    }

  });

  ProjectViews.MemoListView = Backbone.View.extend({

    el:$("#page"),

    events : {
      "dblclick" : "addMemo"
    },

    initialize : function(){
      this.collection.bind("add", this.appendMemo, this);
      ProjectViews.zmax = 0;
      var self = this;
      this.collection.fetch({ success : function(){ 
        self.render();
      }});
      
    },

    render : function(){
      var maxmodel = _.max(this.collection.models, function(model){ return model.get("z");});
      ProjectViews.zmax = maxmodel ? maxmodel.get("z") : 0;
      //console.log("maxmodel:" + maxmodel);
      //console.log("ProjectViews.zmax:" + ProjectViews.zmax);
      _(this.collection.models).each(function(model){
        this.appendMemo(model);
      }, this);
    },

    addMemo : function(e){
      var memo = new Memo();
      ProjectViews.zmax++
      memo.set({z:ProjectViews.zmax});
      if (e) {
        var x = e.pageX;
        var y = e.pageY;
        memo.setTopLeft(x,y);
      }
      this.collection.create(memo, {wait:true});
    },

    appendMemo : function(memo){
      var memoView = new ProjectViews.MemoView({model:memo});
      this.$el.append(memoView.render().el);
    }
  });

  var memoList = new MemoList();

  var memoListView = new ProjectViews.MemoListView({ collection : memoList });

});
