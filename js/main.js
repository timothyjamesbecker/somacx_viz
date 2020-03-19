//start the var_map_container which is one of three bidriectional tools
var var_map_types  = ["sub_pre","ins","del","dup","inv","tra","sub_post"];
var var_map_colors = ['rgb(228,26,28)','rgb(55,126,184)','rgb(77,175,74)','rgb(152,78,163)','rgb(255,127,0)','rgb(153,153,153)','rgb(166,86,40)','rgb(247,129,191)','rgb(255,255,51)']
var var_map_bin    = {"sub_pre":3,"ins":4,"del":18,"dup":6,"inv":5,"tra":12,"sub_post":3}
var var_map_rows = {};
$(function(){
    //(a) append the master controls here
    //(b) append the tabbed container here

    $('<div id="tabs"></div>').appendTo("body");
    $('<ul id="tab_controller">\n' +
        '    <li class="tab_list"><a href="#tab_var_map">var map</a></li>\n' +
        '    <li class="tab_list"><a href="#tab_region_map">region map</a></li>\n' +
        '    <li class="tab_list"><a href="#tab_clone_tree">clone tree</a></li>\n' +
        '    </ul>').appendTo("#tabs");
    $('<div id="tab_var_map"></div>').appendTo("#tabs");
    $('<div id="tab_region_map"></div>').appendTo("#tabs");
    $('<label id="file_upload"><input type="file">upload</label>').appendTo('#tab_region_map');
    $('<div id="tab_clone_tree"></div>').appendTo("#tabs");
    $('#tabs').tabs()//{event:"mouseover"};

    //(c) append the var_map_tab
    var_map_dom("#tab_var_map",var_map_types,var_map_colors);
    for(var j = 0; j < var_map_types.length; j++){
        var_map_rows[var_map_types[j]] = [];
        for(var i = 0; i < var_map_bin[var_map_types[j]]; i++){
            var_map_rows[var_map_types[j]].push(var_size_prob_set("#var_map_ln_"+var_map_types[j],var_map_types[j],i));
        }
    }

    //(d) append the genelist/region editor tab
    //want to be able to upload gene_lists and check into the gene_map (maybe even building gene_map functionality)
    region_map_dom('#tab_region_map',[],[]);

    //(e) append the clone tree editor tab
    clone_tree_dom('#tab_clone_tree');
});

// /place holder for full JSON file data output
var obj = {a: 123, b: "4 5 6"};
$(function(){
    var container_node = $('<div id="container"></div>').appendTo("body");
    var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
    $('<a href="data:' + data + '" download="data.json">download</a>').appendTo('#container');
});

// place holder for region-based file and annotation uploading
$(document).on('change', '#file_upload', function(event) {
    var reader = new FileReader();
    reader.onload = function(event) {
        var jsonObj = JSON.parse(event.target.result);
        alert(jsonObj.name);
    }
    reader.readAsText(event.target.files[0]);
});

