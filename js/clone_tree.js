/*adapt the compute tree structure to the viz tree structure
 c is a clone tree:
 clone_tree={tree:{id1:[id2,id4],id2:[],id3:[],id4:[]},
             nodes:{id1:{clone1},id2:{clone2},...
             alive:{id1:true,...
             depth:{id1:0,id2:1,...
             freq:{id1:10,...*/
function viz_tree(c){
    var T = {},
        root = Object.keys(c.tree).sort()[0];
    function dft(T,id) {
        if(c.tree[id].length<1){ //base case one is a leaf of the tree
            var t = {'name':id,'data':c.nodes[id]};
            t.data.alive = c.alive[id];
            t.data.freq  = c.freq[id];
            t.data.depth = c.depth[id];
            T.children.push(t);
        } else {
            if(id==root){ //base case two is the root node
                T.name = id;
                T.data = c.nodes[id];
                T.data.alive = c.alive[id];
                T.data.freq  = c.freq[id];
                T.data.depth = c.depth[id];
                T.meta = {'n':c.n,'m':c.m,'d':c.d,'cycle':c.cycle, 'out_dir':c.out_dir,
                          'ref_path':c.ref_path,'vcf_list':c.vcf_list,'past':c.past,
                          'new':c.new, 'gs':c.gs,'genome_list':c.genome_list,'max_depth':0,
                          'node_ids':Object.keys(c.tree).sort(),'freq':c.freq,'depth':c.depth};
                if(c.tree[id].length>0){ T.children = []; }
                for(var i = 0; i < c.tree[id].length; i++){
                    dft(T,c.tree[id][i]);
                }
            }else { //general case is an inner node
                var t = {'name':id,'data':c.nodes[id]};
                t.data.alive = c.alive[id];
                t.data.freq  = c.freq[id];
                t.data.depth = c.depth[id];
                t.children = [];
                T.children.push(t);
                for(var i = 0; i < c.tree[id].length; i++){
                    dft(t,c.tree[id][i]);
                }
            }
        }
    } //make the dft call to build the new tree T
    dft(T,root);
    for(var i = 0; i < T.meta.node_ids.length; i++){ //max_depth
        if(T.meta.depth[T.meta.node_ids[i]]>T.meta.max_depth){
            T.meta.max_depth = T.meta.depth[T.meta.node_ids[i]];
        }
    }
    return T;
}

/*adapt the viz tree structure to the compute clone tree
  json struture that can then be used with the soMaCX python engine
  T = {name:id,data:{alive:true,depth:0,branch:0.2,decay:0.001,freq:10,model:0.5,node_id:id},children=[]}
  ...
 */
function cpu_tree(T){
    //d,n,m,cycle,gs,genome_list
    var c = {'ref_path':T.meta.ref_path,'vcf_list':T.meta.vcf_list, 'out_dir':T.meta.out_dir,
             'past':T.meta.past,'new':T.meta.new,'root_id':T.name, 'm':T.meta.m,'n':T.meta.n,
             'd':T.meta.d,'cycle':T.meta.cycle,'gs':T.meta.gs,'genome_list':T.meta.genome_list,
             'nodes':{},'tree':{},'alive':{},'freq':{},'depth':{}};
    var ids = T.meta.node_ids;
    function dft(d,S){
        d.nodes[S.name] = {'model':S.data.model,'branch':S.data.branch,'decay':S.data.decay,
                           'node_id':S.data.node_id,'depth':S.data.depth};
        d.tree[S.name]  = [];
        d.alive[S.name] = S.data.alive;
        d.freq[S.name] = S.data.freq;
        d.depth[S.name] = S.data.depth;
        if('children' in S && S.children!=null) {
            S.children.forEach(function(e){d.tree[S.name].push(e.name);});
            for (var i = 0; i < S.children.length; i++) {
                dft(d,S.children[i]);
            }
        }
        if('_children' in S && S._children!=null) {
            S._children.forEach(function(e){d.tree[S.name].push(e.name);});
            for (var i = 0; i < S._children.length; i++) {
                dft(d,S._children[i]);
            }
        }
    }
    dft(c,T);
    return c;
}

function clone_tree_dom(id){
    //start with one big containing clone tree and then work on the layout
    var clone_tree_node = $('<div id="clone_tree"></div>').appendTo(id);
    clone_tree_graph('#clone_tree','#tabs');
}

function get_tree_root(t){
    while(t.parent){ t = t.parent; }
    return t;
}

//r is the root and t is the start node
function inc_ancestor_freq(r,t,i){
    while(t.parent){
        t.parent.data.freq = t.parent.data.freq+i;
        r.meta.freq[t.parent.name] = r.meta.freq[t.parent.name]+i;
        t = t.parent;
    }
}

//r is the root and t is the start node
function dec_ancestor_freq(r,t,i){
    while(t.parent){
        t.parent.data.freq = t.parent.data.freq-i;
        r.meta.freq[t.parent.name] = r.meta.freq[t.parent.name]-i;
        t = t.parent;
    }
}

function subtree_size(t){
    var j = 1;
    if('children' in t && t.children!=null) {
        for (var i = 0; i < t.children.length; i++) {
            j = j + subtree_size(t.children[i]);
        }
    }
    if('_children' in t && t._children!=null) {
        for (var i = 0; i < t._children.length; i++) {
            j = j + subtree_size(t._children[i]);
        }
    }
    return j;
}

function subtree_ids(t){
    var x = [t.name];
    if('children' in t && t.children!=null) {
        for (var i = 0; i < t.children.length; i++) {
            x = x.concat(subtree_ids(t.children[i]));
        }
    }
    if('_children' in t && t._children!=null) {
        for (var i = 0; i < t._children.length; i++) {
            x = x.concat(subtree_ids(t._children[i]));
        }
    }
    return x;
}

//d3.json load modified to read the actual python json clone_tree.tree
function clone_tree_graph(id,width_id) {
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = $(width_id).width() - (margin.left + margin.right),
        height = 800 - (margin.top + margin.bottom);

    var i = 0,
        duration = 250,
        root;

    function add_node(d,i) {
        var S = get_tree_root(d); //follow parents back to root
        var meta = S.meta;        //root has the meta data
        var ps = S.meta.node_ids[S.meta.node_ids.length-1].split('_');
        if(ps.length<=1){ ps.push('0'); } //base case for only a root

        var t = {'name':'','data':{}};
        t.data.alive   = d.data.alive;   //status from parent for now
        t.data.freq    = 1;              //new nodes are leaves by default
        t.data.depth   = d.data.depth+1; //one more than parent
        t.data.model   = d.data.model;   //model from parent for now
        t.data.branch  = d.data.branch;  //branch from parent for now
        t.data.decay   = d.data.decay;   //decay from parent
        t.data.node_id = ps[0]+'_'+(parseInt(ps[1])+1);
        t.name = t.data.node_id;

        //pushing into the tree
        if('children' in d && d.children!=null) {
            d.children.push(t);
        }
        else{
            if('_children' in d && d._children!=null) {
                d._children.push(t);
            } else{ d.children = [t]; }
        }

        //update the meta-data and freq
        S.meta.node_ids.push(t.data.node_id);
        S.meta.n++;
        S.meta.m++;
        if(S.meta.max_depth<t.data.depth) {
            S.meta.max_depth = t.data.depth;
            S.meta.cycle++;
        }
        S.meta.depth[t.name] = t.data.depth;
        S.meta.freq[t.name] = t.data.freq;
        update(d);
        inc_ancestor_freq(S,t,1);
    }

    function remove_node(d,i){
        console.log('deleting node '+d.name);
        console.log(d);
        if (d.parent){ //can't delete root node
            //update meta data freq and depth and n,m,cycle...
            var S = get_tree_root(d); //follow parents back to root
            var node_ids = subtree_ids(d);
            var j = node_ids.length;
            while(node_ids.length>0){
                for(var ii = 0; ii < S.meta.node_ids.length; ii++){
                    if(node_ids[node_ids.length-1] == S.meta.node_ids[ii]){
                        S.meta.node_ids.splice(ii,1);
                        delete S.meta.freq[node_ids[node_ids.length-1]];
                        delete S.meta.depth[node_ids[node_ids.length-1]];
                        S.meta.n--;
                        S.meta.m--;
                        //still need to handle the cycle update...
                        break;
                    }
                }
                node_ids.pop();
            }
            dec_ancestor_freq(S,d,j);
            var max_depth = 0; //recalculate max_depth again
            for(var ii = 0; ii < S.meta.node_ids.length; ii++){ //max_depth
                if(S.meta.depth[S.meta.node_ids[ii]]>max_depth){
                    max_depth = S.meta.depth[S.meta.node_ids[ii]];
                }
            }
            S.meta.cycle = S.meta.cycle - (S.meta.max_depth-max_depth);//depth differential
            S.meta.max_depth = max_depth;
            //update the graph components
            var c_i = 0;              //find child index
            for (var ii = 0; ii < d.parent.children.length; ii++) {
                if (d.parent.children[ii].name === d.name) {
                    c_i = ii;
                    break;
                }

            }
            d.parent.children.splice(c_i,1);
            update(d);
        }
    }

    var menu = [
        {
            title: 'Add Node',
            action: function(d,i){ add_node(d,i); }
        },
        {
            title: 'Remove Node',
            action: function(d,i) {remove_node(d,i); }
        }
    ];

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function (d) {
            return [d.y, d.x];
        });

    var svg = d3.select(id).append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .call(d3.behavior.zoom().on("zoom",function(){
            var xy = d3.event.translate;
            xy[0] = xy[0] + 2*margin.left;
            xy[1] = xy[1] + 2*margin.top;
            svg.attr("transform","translate("+xy[0]+","+xy[1]+")"+" scale("+d3.event.scale+")")
        }))
        .append("g")
        .attr("transform", "translate(" + 2*margin.left + "," + margin.top + ")");

    d3.json("data/clone_tree.json", function (error, ct) {
        if (error) throw error;
        console.log(ct);
        root = viz_tree(ct);                    //object reference is the root
        root.x0 = height / 2;
        root.y0 = 0;

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        //root.children.forEach(collapse); //collapse the children
        update(root);
    });
    d3.select(self.frameElement).style("height", height+"px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);
        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 180;
        });
        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });
        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d){
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .attr('name',function(d){ return d.name });
        nodeEnter.append("circle")
            .attr("r", 1e-6)
            .style("fill", function (d) {
                return d._children ? "#0" : "#fff";
            })
            .on('mouseover',mouse_over)
            .on('mouseout',mouse_out)
            .on("click", left_click)        //toggle children off and on
            .on('contextmenu', d3.contextMenu(menu));  //context menu or add node?

        nodeEnter.append("text")
            .attr("x", function (d) {
                return d.children || d._children ? 0 : 10;
            })
            .attr("y", function (d) {
                return d.children || d._children ? -1*(d.data.freq/(root.meta.n*1.0))*30-10 : 0;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.name.split('_')[1];
            })
            .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });
        nodeUpdate.select("circle")
            .attr("r", 5)
            .style("fill", function (d) {
                return d._children ? "#0" : "#fff";
            });
        nodeUpdate.select("text")
            .attr("x", function (d) {
                return d.children || d._children ? 0 : 10;
            })
            .attr("y", function (d) {
                return d.children || d._children ? -1*(d.data.freq/(root.meta.n*1.0))*30-10: 0;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();
        nodeExit.select("circle")
            .attr("r", 1e-6);
        nodeExit.select("text")
            .attr("x", function (d) {
                return d.children || d._children ? 0 : 10;
            })
            .attr("y", function (d) {
                return d.children || d._children ? -1*(d.data.freq/(root.meta.n*1.0))*30-10 : 0;
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .style("fill-opacity", 1e-6);

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width",function(d){
                return (d.target.data.freq/(root.meta.n*1.0))*50;
            })
            .style("stroke",function(d){
                return 'hsla('+(360-(d.target.data.freq/(root.meta.n*1.0))*200)+', 70%, 50%,0.75)';
            });

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function mouse_over(d){
        var self = d3.select(this);
        self.attr('r',12)
            .attr("y", function (d) {
                return d.children || d._children ? -1*(d.data.freq/(root.meta.n*1.0))*30-10 : 0;
            });
    }

    function mouse_out(d){
        var self = d3.select(this);
        self.attr('r',5);
    }

    // Toggle children on click.
    function left_click(d){
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
}
