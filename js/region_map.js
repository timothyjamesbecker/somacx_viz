function region_map_dom(id,classes,colors){
    $('<div id="region_map"></div>').appendTo(id);
    region_map_graph('#region_map',classes,colors);
}

function region_map_graph(id,classes,colors){
    var margin = {top: -5, right: -5, bottom: -5, left: -5},
        track_w = 1200 - margin.left - margin.right,
        track_h = 400 - margin.top - margin.bottom;

    //replace this with some fancy track loading/processing tools
    var weighted_ranges = [{x:0, y:track_h-200,w:300,h:200,label:'gene'},
                           {x:400,y:track_h-100,w:30,h:100,label:'gene'},
                           {x:600,y:track_h-50,w:50,h:50,label:'gene'}];

    var selected = true;

    var dragbarw = 10;

    var zoom = d3.behavior.zoom()
        .scaleExtent([1, 10])
        .on("zoom", zoomed);

    // var drag = d3.behavior.drag()
    //     .origin(function(d) { return d; })
    //     .on("dragstart", dragstarted)
    //     .on("drag", dragged)
    //     .on("dragend", dragended);

    var drag = d3.behavior.drag().origin(Object).on("drag", drag_move),
        dragright = d3.behavior.drag().origin(Object).on("drag", r_drag_resize),
        dragtop = d3.behavior.drag().origin(Object).on("drag", t_drag_resize);

    var svg = d3.select(id).append("svg")
        .attr("width", track_w)
        .attr("height", track_h)
        .style('border','solid 1px #aaa');
        // .append("g")
        // .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
        // .call(zoom);

    var newg = svg.selectAll('g')
        .data(weighted_ranges)
        .enter();

    var dragrect = newg.append("rect")
        .attr('id',function(d,i){ return d.label+'_'+i+'_range_rect_main'; })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .attr("height", function(d) {return d.h; })
        .attr("width", function(d) {return d.w; })
        .attr("fill-opacity", 0.1)
        .attr("cursor", "move")
        .call(drag);

    var dragbarright = newg.append("rect")
        .attr('id',function(d,i){ return d.label+'_'+i+'_range_rect_right'; })
        .attr("x", function(d) { return d.x + d.w - (dragbarw/2); })
        .attr("y", function(d) { return d.y + (dragbarw/2); })
        .attr('ry',dragbarw/2)
        .attr("height", function(d){ return Math.max(dragbarw,d.h-dragbarw); })
        .attr("width", dragbarw)
        .attr("fill", "white")
        .attr("fill-opacity", 0.5)
        .attr("cursor", "ew-resize")
        .call(dragright);

    var dragbartop = newg.append("rect")
        .attr('id',function(d,i){ return d.label+'_'+i+'_range_rect_top'; })
        .attr("x", function(d) { return d.x + (dragbarw/2); })
        .attr("y", function(d) { return d.y - (dragbarw/2); })
        .attr('ry',dragbarw/2)
        .attr("height", dragbarw)
        .attr("width", function(d){ return Math.max(dragbarw,d.w-dragbarw); })
        .attr("fill", "white")
        .attr("fill-opacity", 0.5)
        .attr("cursor", "ns-resize")
        .call(dragtop);

    function drag_move(d) {
        if(selected) {
            var main  = d3.select(this);
            var id_base = '#'+main.attr('id').split('_main')[0];
            var right = d3.select(id_base+'_right');
            var top   = d3.select(id_base+'_top');
            main
                .attr("x", d.x = Math.max(0, Math.min(track_w - d.w, d3.event.x)))
            right
                .attr("x",d.x + d.w - (dragbarw/2))
            top
                .attr("x",d.x + (dragbarw/2))
        }
    }

    function r_drag_resize(d) {
        if(selected) {
            var dragx = Math.max(d.x + (dragbarw/2), Math.min(track_w, d.x + d.w + d3.event.dx));
            d.w = dragx - d.x;
            var right = d3.select(this);
            var id_base = '#'+right.attr('id').split('_right')[0];
            var main  = d3.select(id_base+'_main');
            var top   = d3.select(id_base+'_top');
            right
                .attr("x", dragx-(dragbarw/2));
            main
                .attr("width",d.w);
            top
                .attr("width", Math.max(dragbarw,d.w-dragbarw));
        }
    }

    function t_drag_resize(d) {
        if(selected) {
            var oldy = d.y;
            d.y = Math.max(0, Math.min(d.y + d.h - (dragbarw / 2), d3.event.y));
            d.h = Math.max(0,d.h + (oldy - d.y));
            var top = d3.select(this);
            var id_base = '#'+top.attr('id').split('_top')[0];
            var main  = d3.select(id_base+'_main');
            var right   = d3.select(id_base+'_right');
            top
                .attr("y",d.y - (dragbarw / 2));
            main
                .attr("y",d.y)
                .attr("height",d.h);
            right
                .attr("y",d.y + (dragbarw/2))
                .attr("height", Math.max(dragbarw,d.h-dragbarw));
        }
    }

    //set up a soom and
    function zoomed() {
        container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function dragstarted(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("dragging", true);
    }

    function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    }

    function dragended(d) {
        d3.select(this).classed("dragging", false);
    }
}