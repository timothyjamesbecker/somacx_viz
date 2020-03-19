//assuming you have an rgba string
function get_rgba_as_array(){
    return false;
}

function get_size_prob_exp(size,prob){
    return false;
}

function hover_color(obj,default_color,set_color){
    obj.mouseenter(function() {
        $(this).css("background-color",set_color);
    }).mouseleave(function() {
        $(this).css("background-color",default_color);
    });
}

//build the DOM for the var_map
function var_map_dom(id,types,colors){
    //append the multi-line container here
    var svg = d3.select(id).append('svg');//placeholder
    //var_map controls on the lower section where d3 2D multiline will be above
    var var_map_node = $('<div id="var_map"></div>').appendTo(id);
    //add each containing type column
    for(var j = 0; j < types.length; j++){
        var div  = '<span class="var_map_row" id="var_map_'+types[j]+'"></span>';
        $(div).appendTo('#var_map');
        //type label
        var label = '<span class="'+types[j]+' var_map_label" type="'+types[j]+'" index="'+j+'"'+
                    ' style="color:rgb(255,255,255);">'+types[j].toUpperCase()+' </span>';
        $(label).appendTo('#var_map_'+types[j]); //will handle mouse event attach with d3 spline
        //ln_label
        var ln = '<span class="var_map_ln" id="var_map_ln_'+types[j]+'"></span>';
        $(ln).appendTo('#var_map_'+types[j]);
    }
    var_map_graph(id,types,colors); //then call the d3
}

//assume that the id is the var_map_row_id adn e is an enumeration of the spin_sets for that row
function var_size_prob_set(id,type,e){
    var new_span = $('<div class="var_map_spin_set" id="var_map_spin_set_'+type+e.toString()+'"></div>')
    new_span.appendTo(id);

    var size_mul = $('<input class="var_map_mul" name="value" id="#size_mul_'+type+e.toString()+'"></input>')
        .appendTo('#var_map_spin_set_'+type+e.toString())
        .spinner({
            step:  0.1,
            min:   0.1,
            max:   10.0,
            stop: function(event,ui){
                console.log(event);
            }
    });
    size_mul.spinner('value',0.5);

    // $('.ui-spinner-button').click(function() {
    //     $(this).siblings('input').change();
    // });

    var size_mag = $('<input class="var_map_mag" name="value" id="#size_mag_'+type+e.toString()+'"></input>')
        .appendTo('#var_map_spin_set_'+type+e.toString())
        .spinner({
        step : 1,
        min: 0,
        max: 9
    });
    size_mag.spinner('value',0);

    var prob_mul = $('<input class="var_map_mul" name="value" id="#prob_mul_'+type+e.toString()+'"></input>')
        .appendTo('#var_map_spin_set_'+type+e.toString())
        .spinner({
        step:  0.1,
        min:   0.1,
        max:   10.0
    });
    prob_mul.spinner('value',0.5);

    var prob_mag = $('<input class="var_map_mag" name="value" id="#prob_mag_'+type+e.toString()+'"></input>')
        .appendTo('#var_map_spin_set_'+type+e.toString())
        .spinner({
        step : 1,
        min: 0,
        max: 9
    });
    prob_mag.spinner('value',0);
    return {'size_mul':size_mul,'size_mag':size_mag,
            'prob_mul':prob_mul,'prob_mag':prob_mag,
            'size':size_mul.spinner('value')*Math.pow(10,size_mag.spinner('value')),
            'prob':prob_mul.spinner('value')*Math.pow(10,-1.0*prob_mag.spinner('value'))};
}

function size_prob_to_spin_set(size_prob_set){
    var size = size_prob_set['size_mag']
}

//attach this to the selection of .multi_line or var_map_labels
//and the mouseon,mouseout,click will be bidirectionally linked
function var_click(obj){
    var self = d3.select(obj);
    var type = self.attr('type');
    var active_line = self.attr('index');
    if(self.attr('edit')==0){
        d3.selectAll('.multi_line,.var_map_label')
            .attr('edit',0)
            .style('opacity',0.4)
            .style('stroke-width','6px');
        d3.selectAll('.'+type)
            .attr('edit',1)
            .style('opacity',1.0)
            .style('stroke-width','10px');
    }else{
        d3.selectAll('.'+type)
            .attr('edit',0)
            .style('opacity',0.4)
            .style('stroke-width','6px');
    }
    return active_line;
}

function var_over(obj){
    var self = d3.select(obj);
    var active_line = self.attr('index');
    d3.selectAll('.multi_line','var_map')
}

function var_out(obj){
    var self = d3.select(ob);
    var active_line = self.attr('index');
    d3.selectAll('.multi_line','var_map')
}

/* D3 place holder */
function var_map_graph(id,classes,colors) {
    //coordinate space------------------------------------------------------------
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 1350 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom,
        xmin = 1,
        xmax = 3e8,
        ymin = 1e-9,
        ymax = 1e-5;

    var axisName=['SV size bp','p / bp'];
    var genome_size = 3e9; //will get gs object to sum up like: {chr1:250e8,chr2,...}

    //[line1 ->[x1,y1],[x2,y2],...[xn1,yn1],
    // line2 ->[x1,y1],[x2,y2],...[xn2,yn2],...]
    var raw_data = [[[1,1e-7],[5,2e-8],[10,3e-8]],
                    [[50,1e-6],[1.12e2,1e-7],[1.002e3,3.67e-8]],
                    [[50,0.8e-6],[1.23e2,0.1e-7],[1.1e3,3e-8],[2.3e3,2e-8],[1.12e4,1e-8],[1e5,5e-9],[5e5,2e-9]],
                    [[1e3,1.6e-7],[5e3,5.2e-8],[1e4,3.1e-9],[1e5,0.7e-8]],
                    [[1e3,0.9e-7],[5e3,6.1e-8],[1.1e4,3e-9]],
                    [[1e3,1e-8],[5.1e3,2e-8],[1e4,1e-8]],
                    [[1,1e-6],[3,2e-7],[5,3e-8]]];
    var full_data = [];
    for(var i = 0; i < raw_data.length;i++){
        var row = [];
        for(var j = 0; j < raw_data[i].length; j++){
            row.push({'i':i,'x':raw_data[i][j][0],'y':raw_data[i][j][1]});
        }
        full_data.push(row);
    }
    var points = full_data;

    // setup x
    var xValue = function(d) { return d.x; }, // data -> value
        xScale = d3.scale.log()
            .domain([xmin,xmax])
            .range([1,width]),
        xMap  = function(d)  { return xScale(xValue(d)); }, // data -> display
        xAxis = d3.svg.axis().scale(xScale)
            .tickSize(-height)
            .tickPadding(10)
            .tickSubdivide(true)
            .orient('bottom');
    // setup y
    var yValue = function(d) { return d.y;}, // data -> value
        yScale = d3.scale.log()
            .domain([ymax,ymin])
            .range([1,height]), // value -> display
        yMap  = function(d)  { return yScale(yValue(d)); }, // data -> display
        yAxis = d3.svg.axis().scale(yScale)
            .tickSize(-width)
            .tickPadding(10)
            .tickSubdivide(true)
            .orient('left');
    //coordinate space------------------------------------------------------------

    // add tooltip
    var tooltip = d3.select(id).append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    // persitant variables
    var dragged  = null;
    var active_line = null;
    var selected = points[0][0];
    //line definitions
    var line = d3.svg.line()
        .interpolate('monotone')
        .x(function(d) { return xMap(d); })
        .y(function(d) { return yMap(d); });

    //append svg to body
    var svg = d3.select('svg')
        .attr('width', width+margin.left+margin.right)
        .attr('height', height+margin.top+margin.bottom).append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('tabindex', 1);


    // append rect
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('class','var_map_rect')
        .on('mousedown', mousedown);

    //need a way to dynamically style all of these rect that get generated
    //svg.select('g').select('rect').attr('class','var_map_rect');

    // append line
    var path = svg.selectAll('.multi_line')
        .data(points)
        .enter()
        .append("path")
        .attr('class',function(d,i){ return classes[i]; })
        .attr('type',function(d,i){ return classes[i]; })
        .attr('edit',0)
        .attr('index',function(d,i){ return i; })
        .style('fill','none')
        .style('stroke',function(d,i){ return colors[i]; })
        .style('stroke-width','5px')
        .style('opacity',0.4)
        .classed('multi_line',true)
        .on('mouseover',function(d) {
            var self = d3.select(this);
            if(self.attr('edit')==0) {
                self.style({'stroke-width': '7px', 'opacity': 0.7});
            }
        })
        .on('mouseout',function(d){
            var self = d3.select(this);
            if(self.attr('edit')==0) {
                self.style({'stroke-width': '5px', 'opacity': 0.4});
            }
        })
        .on('click',function(){
            active_line = var_click(this);
        })
        .call(redraw);

    // map mouse actions
    d3.select(window)
        .on("mousemove", mousemove)
        .on("mouseup", mouseup)
        .on("keydown", keydown);
    svg.node().focus();

    // add x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(axisName[0]);

    // add y-axis
    svg.append("g")
        .attr("class", "y axis")
        .attr('transform', 'translate(0,0)')
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(axisName[1]);

    //attach the lower column mouse events
    var var_map_label = d3.selectAll('.var_map_label')
        .attr('edit',0)
        .style('background-color',function(d) {
            return colors[d3.select(this).attr('index')];
        })
        .style('opacity',0.4)
        .on('mouseover',function(d) {
            var self = d3.select(this);
            if(self.attr('edit')==0) {
                self.style('opacity',0.7);
            }
        })
        .on('mouseout',function(d){
            var self = d3.select(this);
            if(self.attr('edit')==0) {
                self.style('opacity',0.4);
            }
        })
        .on('click',function(){
            active_line = var_click(this);
        });

    // function that redraws path on mouse clicks and change to form
    function redraw() {
        var path = svg.selectAll("path").attr("d",line);
        var circle = svg.selectAll("circle").data(function(){
            var a = []
            for(var i = 0; i < points.length; i++){
                for(var j = 0; j < points[i].length;j++) {
                    a.push(points[i][j]);
                }
            }
            return a;
        });
        circle.enter()
            .append('circle')
            .attr('cx',function(d){ return xScale(xValue(d)); })
            .attr('cy',function(d)  { return yScale(yValue(d)); })
            .attr('r',4)
            .attr('index',function(d){ return d.i; })
            // .attr('class',function(d){ return classes[d.i]; })
            .classed('var_map_circle',true)
            .style('fill',function(d){ return colors[d.i]; })
            .style('stroke',function(d){ return colors[d.i]; })
            .style('stroke-width','5px')
            .style('opacity',0.5)
            .on("mouseover", function(d) {
                if(active_line==d.i) {
                    d3.select(this)
                        .style('opacity', 0.9)
                        .attr('r', 6);
                }
            })
            .on("mouseout", function(d) {
                if(active_line==d.i) {
                    d3.select(this)
                        .style('opacity', 0.5)
                        .attr('r', 4);
                }
            });
        circle.classed("selected", function(d) { return d === selected; })
            .attr('cx',function(d)  { return xScale(xValue(d)); })
            .attr('cy',function(d)  { return yScale(yValue(d)); })
            .attr('r',4)
            .attr('index',function(d){ return d.i; })
            // .attr('class',function(d){ return classes[d.i]; })
            .style('fill',function(d){ return colors[d.i]; })
            .style('stroke',function(d){ return colors[d.i]; })
            .style('stroke-width','5px')
            .style('opacity',0.5)
        circle.exit().remove();

        if (d3.event) {
            d3.event.preventDefault();
            d3.event.stopPropagation();
        }
        circle.on("mousedown", function(d) {
            if(active_line==d.i) {
                selected = dragged = d;
                redraw();
            }
        })

    }

    //mouse click will add a new circle
    function mousedown(){
        //console.log(active_line);
        var m = selected = d3.mouse(svg.node());
        var point = {};
        point.x = xScale.invert(Math.max(0, Math.min(width,m[0])));
        point.y = yScale.invert(Math.max(0, Math.min(height,m[1])));
        point.i = active_line;
        if(active_line!=null) {
            points[active_line].push(point);
            //sort points by the x-axis which is the SV size bins
            points[active_line].sort(function (a, b) {
                if (a.x < b.x) { return -1; }
                if (a.x > b.x) { return 1; }
                return 0;
            });
            redraw();
        }
    }

    //mouse drag
    function mousemove() {
        if (!dragged) return;
        var m = d3.mouse(svg.node());
        dragged.x = xScale.invert(Math.max(0, Math.min(width,m[0])));
        dragged.y = yScale.invert(Math.max(0, Math.min(height,m[1])));
        //console.log(dragged);
        if(!isNaN(dragged.y) && !isNaN(dragged.x)){
            points[dragged.i].sort(function(a,b){
                if(a.x<b.x){ return -1 };
                if(a.x>b.x){ return 1 };
                return 0;
            })
            redraw();
        }
    }

    //mouse release
    function mouseup() {
        if (!dragged) return;
        mousemove();
        dragged = null;
    }

    //key press events
    function keydown() {
        if (!selected) return;
        switch (d3.event.keyCode) {
            case 8: // backspace
            case 46: { // delete
                var x = points[active_line].indexOf(selected);
                points[active_line].splice(x, 1);
                selected = points[active_line].length ? points[active_line][x > 0 ? x - 1 : 0] : null;
                redraw();
                break;
            }
        }
    }

}
