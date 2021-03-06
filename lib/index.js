var util = require('./util');
var Hash = require('hashish');
var legend = require('./legend')({util:util});
var interaction = undefined;

var config = {
    padding : {
        left : 10,
        top : 20,
        bottom : 30
    },
    axispadding : {
        left : 50,  // yaxis
        bottom : 20 // xaxis
    }
};
exports.displayConfig = function(params) {
    if (params !== undefined) {
        Hash(config).update(params);
    }
};
exports.setInteraction = function(obj) {
    interaction = obj;
    interaction.config = config;
}
exports.setCanvas = function(el,that) {
    that.canvas = el;
    // transfer inline style to wrapping div
    var style = $(el).attr('style');
    var wrappingDiv = document.createElement('div');
    $(wrappingDiv).attr('style',style);
    $(el).removeAttr('style');

    wrappingDiv.id = 'chartWrappingDiv';
    wrappingDiv.height = that.canvas.height;
    $(that.canvas).wrap(wrappingDiv);
    that.ctx = el.getContext('2d');
    that.ctx.fillStyle = that.color.bg;
    that.ctx.fillRect(0,0,that.canvas.width,that.canvas.height);
};
exports.legendClear = function() {
    legend.clear(this.legend_el);
};
exports.setSource = function(source) {
    var id = source.id;    
    this.buffer[id].width = this.canvas.width;
    this.buffer[id].height = this.canvas.height;
    $(this.buffer[id]).css('position','absolute');
    $(this.canvas).before(this.buffer[id]);
    var onDataGraph = function(data,flags) {
        // timestamp
        data.date = new Date();

        if ((source.dataset === undefined) || (flags && (flags.multiple == true) && (flags.clear && flags.clear == true))) {
            source.dataset = [];
            
        }
        source.dataset.push(data); 

        var windowsize = source.windowsize || data.windowsize || 10;
        var datatodisplay = util.cropData(source.dataset,windowsize);
        var startx = util.getStartX(datatodisplay.length,windowsize,this.canvas.width); 
        var spacing = util.getSpacing(windowsize,this.canvas.width);

        var yaxises = legend.update(datatodisplay,this.color.line);
        if (this.legend_el !== undefined) 
            legend.updateHTML({el:this.legend_el});

        this.ctx.fillStyle = this.color.bg;
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);    

        if (flags && flags.multiple && (flags.multiple === true)) {
            Hash(yaxises).forEach(function(axis,key) {
                axis.range = util.rangeY(datatodisplay,key); 
            });    
            util.drawYaxisMultiple(this.canvas,this.ctx,yaxises,config);
//            util.drawHorizontalGrid(this.canvas.width,this.canvas.height,this.ctx);
//            util.drawVerticalGrid(datatodisplay,this.ctx,spacing,startx,this.canvas.height);
            
            util.draw_multiple({startx:startx,datatodisplay:datatodisplay,spacing:spacing,buffer:this.buffer[id],bufferctx:this.bufferctx[id],yaxises:yaxises});
        } else {
            var range = util.rangeY(datatodisplay) 
//            util.drawHorizontalGrid(this.canvas.width,this.canvas.height,this.ctx);
            util.drawXaxis({datatodisplay:datatodisplay,ctx:this.ctx,spacing:spacing,startx:startx,height:this.canvas.height,width:this.canvas.width,config:config,gridcolor:this.color.grid,xlabel:this.color.xlabel,xline:this.color.xline});
            util.draw({startx:startx,datatodisplay:datatodisplay,spacing:spacing,buffer:this.buffer[id],bufferctx:this.bufferctx[id],yaxises:yaxises,config:config,rendermode:source.rendermode || this.rendermode || "line"});
            util.clip({ctx:this.bufferctx[id],config:config,height:this.buffer[id].height,type:'clear',clipcolor:this.color.bg});
            util.clip({ctx:this.ctx,config:config,height:this.canvas.height,type:'fill',clipcolor:this.color.bg});
            util.drawYaxis({canvas:this.canvas,ctx:this.ctx,range:range,config:config,yline:this.color.yline,ylabel:this.color.ylabel});
    
            source.displayData = util.getDisplayPoints({startx:startx,datatodisplay:datatodisplay,spacing:spacing,height:this.buffer[id].height,yaxises:yaxises,config:config});
        }
    
        if (interaction !== undefined) {
            interaction.redraw();
        }        
    };
    source.on('data',onDataGraph.bind(this));
};
