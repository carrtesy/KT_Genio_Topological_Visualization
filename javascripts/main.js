"use strict";

// hyperparameters
const image_link = {
	"cloud": "images/cloud.png",
	"vm": "images/server.png",
	"db": "images/db.png",
    "cluster": "images/cluster.png",
    "server-cluster": "images/server-cluster.png",
    "db-cluster": "images/db-cluster.png",
};

const ICONWIDTH = 64;
const ICONHEIGHT = 64;

const GROUP_TYPE = {
    "Web Layer": "server-cluster",
    "WAS Layer": "server-cluster",
    "NAS": "db-cluster",
    "Batch Layer": "server-cluster",
    "DB Layer": "db-cluster",
    "Core Layer": "server-cluster",
    "Ansible Core 1": "server-cluster",
    "Ansible Core 2": "server-cluster",
    "Ansible Core 3": "server-cluster",
    "Proxy Server": "server-cluster"
};

const GROUP_LOCATION = {
    "Web Layer": {x: 0, y: 100},
    "WAS Layer":{x: 300, y: 100},
    "NAS":{x: 450, y: 0},
    "Batch Layer":{x: 600, y:0},
    "DB Layer":{x: 600, y:200},
    "Core Layer":{x: 800, y:200},
    "Ansible Core 1":{x: 800, y:0},
    "Ansible Core 2":{x: 600, y:300},
    "Ansible Core 3":{x: 800, y:300},
    "Proxy Server":{x: 900, y:300}
};

// outlines
let canvas = document.getElementById('canvas');
let w=canvas.clientWidth, h=canvas.clientHeight;
let color = d3.scaleOrdinal(d3.schemeSet3);
let svg = d3.select(canvas).append('svg')
        	.attr('width', w)
        	.attr('height', h);

// markers
let markerWidth =10,
markerHeight =6,
cRadius =40, // play with the cRadius value
refX =70, //refX = cRadius + markerWidth,
refY =0, //refY = -Math.sqrt(cRadius),
drSub = cRadius + refY;


// other settings
let tocolor = "fill";
let towhite = "stroke";
let outline = false;

if (outline) {
	tocolor = "stroke"
	towhite = "fill"
}
  
let focus_node = null, highlight_node = null;
let highlight_color = "blue";
let highlight_trans = 0.1;
let default_node_color = "#ccc";
let default_link_color = "#888";

// load dataset
// logic to load data
let jsonfile = "data/init.json";

d3.json(jsonfile, function(data){
    // add graph
    let g = svg.append("g")
            .attr("class", "viz");

    let net, convexHull, genCH;
    let linkElements, linkText;
    let nodeElements, textElements;
    let groupText, circle, simulation, linkForce, args;


    let linkedByIndex = {};
    data.links.forEach(function(d) {
        linkedByIndex[d.source + "," + d.target] = true;
    });

    let isConnected = (a, b) => linkedByIndex[a.index + "," + b.index] 
                                || linkedByIndex[b.index + "," + a.index] 
                                || a.index == b.index ;   
    let groupFill = (d, i) => color(d.key);
    let getGroup = n => n.group;

    // groups
    let offset = 0, groups, groupPath;
    // group is expanded or not (boolean)
    let expand = {};

    // init here
    init();

    // add zoom capabilities
    let zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);
    function zoom_actions(){
        g.attr("transform", d3.event.transform);
    }
    zoom_handler(svg);

    // update links
    let fileindex = 0;
    let timer = setInterval(() => {
        let filename = `data/diffs/diff${fileindex++%4}.json`; 
        update(filename);
    }, 1000);

    // start of init declaration
    function init(){
        
        // Reset Palette Here
        if(simulation){
            linkElements.remove();
            nodeElements.remove();
            genCH.remove();
            convexHull.remove();
            textElements.remove();
            groupText.remove();
            linkText.remove();
        }

        net = network(data, net, getGroup, expand);
        
        groups = d3.nest().key(d=>d.group).entries(net.nodes);
        groupPath = function(d){
            // convex hull for 1, 2 points / and more then 3 points
            let tmp = d.values.map(i => [i.x + offset, i.y + offset]);
            if (d.values.length == 1){
                tmp.push([tmp[0][0], tmp[0][1]]);
                tmp.push([tmp[0][0], tmp[0][1]]);
                return "M" + d3.polygonHull(tmp).join("L") + "Z";
            } else if (d.values.length == 2){
                let tmp = d.values.map(i => [i.x + offset, i.y + offset]);
                tmp.push([tmp[0][0], tmp[0][1]]);
                return "M" + d3.polygonHull(tmp).join("L") + "Z";
            } else {
                return "M" + d3.polygonHull(d.values.map( i => [i.x+offset, i.y+offset])).join("L") + "Z";
            }
        }

        convexHull = g.append('g').attr('class','hull');
        
        // simulation setup with all forces
        linkForce = d3
            .forceLink()
            .id( link => link.id)
            .strength( link => 0.1)
    
        let inpos = [], counterX = 1, inposY=[], counterY = 1;
        
        simulation = d3
            .forceSimulation()
            .force('link', linkForce)
            .force('forceX', d3.forceX( function(d) {
                
                console.log(d);
                console.log(d.group);
                console.log(GROUP_LOCATION[d.group]);
                return inpos[d.group] = GROUP_LOCATION[d.group].x;
            }))
            .force('forceY', d3.forceY( function(d) {
                return inpos[d.group] = GROUP_LOCATION[d.group].y;
            }))
            .force('charge', d3.forceManyBody().strength(-501))
            .force('center', d3.forceCenter(w / 2, h / 2))
            .force("gravity", d3.forceManyBody(1));
    
        // arrow head for line
        svg.append("svg:defs").selectAll("marker")
            .data(["normal", "warning", "danger"])
            .enter().append("svg:marker")
            .attr("id", String)
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", refX)
            .attr("refY", refY)
            .attr("markerWidth", markerWidth)
            .attr("markerHeight", markerHeight)
            .attr("orient", "auto")
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");
    
        // link
        linkElements = g.append('g')
            .attr('class','links')
            .selectAll('path')
            .data(net.links).enter().append('path')
            .attr('class', link => `link ${getStatus(link.tps)}`)
            .attr('marker-end', link => `url(#${getStatus(link.tps)})`)
            .attr("class", link => getStatus(link.tps))
            .attr("id", link => `link${link.source}${link.target}`);
    
        // linktext
        linkText = g.append("g")
            .attr("class", "linktexts")
            .selectAll("text")
            .data(net.links)
            .enter().append("text")
            .text(link => link.tps)
            .attr("class", link => getStatus(link.tps));
        
        // grouptext
        groupText = g.append("g")
            .attr("class", "grouptexts")
            .selectAll("text")
            .data(groups)
            .enter().append("text")
            .text(group => group.key);

        // node
        nodeElements = g.append('g')
            .attr('class','nodes')
            .selectAll('.node')
            .data(net.nodes)
            .enter().append('g')
            .attr('class', 'node')
        
        nodeElements.append("image")
            .attr("xlink:href", node => image_link[node.type])
            .attr("x", -ICONWIDTH / 2)
            .attr("y", -ICONHEIGHT / 2)    
            .attr("width", ICONWIDTH)
            .attr("height", ICONHEIGHT);

        circle = nodeElements
            .append('circle')
            .attr('class','circle')
            .attr("r", node => node.size)
            .attr("fill", node => color(node.group));
        
        nodeElements.call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        // text to node
        textElements = g.append("g")
            .attr("class", "texts")
            .selectAll("text")
            .data(net.nodes)
            .enter().append('text')
            .append('tspan')
            .attr('dx', "40px")
            .attr('dy', "18px")
            .text(node => node.label)
            .attr("opacity", node => expand[node.group] ? 1 : 0);
        
        // simulation
        simulation
            .nodes(net.nodes)
            .on('tick', () => {
                genCH = convexHull.selectAll("path")
                    .data(groups)
                    .attr("d", groupPath)
                    .enter().insert("path", "circle")
                    .style("fill", groupFill)
                    .style("stroke", groupFill)
                    .style("stroke-width", 140)
                    .style("stroke-linejoin", "round")
                    .style("opacity", .5)
                    .on('click',function(group){
                        expand[group.key] = !expand[group.key];
                        init();
                    })
        
                nodeElements
                    .attr("transform", node => `translate(${node.x},${node.y})`)
                    .attr('x', node => node.x)
                    .attr('y', node => node.y);
                textElements
                    .attr('x', node => node.x)
                    .attr('y', node => node.y);
                linkElements
                    .attr('d', link => `M${link.source.x},${link.source.y}L${link.target.x},${link.target.y}`)
                linkText
                    .attr("x", link => 0.3 * link.source.x + 0.7 * link.target.x)
                    .attr("y", link => 0.3 * link.source.y + 0.7 * link.target.y);
                groupText
                    .attr("x", group => group.values.length <= 1 ? group.values[0].x: 
                        (group.values.reduce((a, b) => a.x < b.x? a.x: b.x) + group.values.reduce((a, b) => a.x > b.x? a.x: b.x)) / 2)
                    .attr("y", group => group.values.length <= 1 ? group.values[0].y - ICONHEIGHT/2:
                    group.values.reduce((a, b) => a.y < b.y? a.y: b.y) - ICONHEIGHT);
        })
        
        nodeElements
            .on("mouseover", function(node) { set_highlight(node);})
            .on("mousedown", function(node) { 
                d3.event.stopPropagation();
                focus_node = node;
                set_focus(node);
                if (highlight_node === null) set_highlight(node);})
            .on("mouseout", function(node) {
                exit_highlight();
            })
            .on("click",function(node){
                d3.event.stopPropagation();
                setExpand(node);
            });
    
        simulation.force("link")
                .links(net.links)
                .distance(link => link.source.group == link.target.group ? 150 : 300);
        

        // other helper functions 
        function setExpand(node){
            expand[node.group] = !expand[node.group];
            init();
        }
        
        function exit_highlight(){
            highlight_node = null;
            if (focus_node===null){
                svg.style("cursor","move");
                if (highlight_color!="white"){
                    circle.style(towhite, "white");
                    linkElements.attr("class", link => getStatus(link.tps));
                }
            }
        }
    
        function set_focus(node){
            if (highlight_trans < 1) {
                circle.style("opacity", o => isConnected(node, o) ? 1 : highlight_trans);
                linkElements.style("opacity", o => o.source.index == node.index || o.target.index == node.index ? 1 : highlight_trans);
            }
        }
    
        function set_highlight(node) {
            svg.style("cursor", "pointer");
            if (focus_node!==null) node = focus_node;
            highlight_node = node;
            if (highlight_color != "white"){
                circle.style(towhite, o => isConnected(node, o) ? highlight_color : "white");
            }
        }
    
        function dragstarted(d) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
    
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }
    
        function dragended(d) {
            if (!d3.event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        


        // end of init()
    }

    function update(file){
        d3.json(file, function(diff){
            
            for(let i = 0; i < diff.links.length ; i++){
                let update_info = diff.links[i];
                let link =  net.links
                            .filter(lk => (lk.source.id == update_info.source) && (lk.target.id == update_info.target))[0];
                
                for (const [key, value] of Object.entries(update_info)) {
                    if(["source", "target"].indexOf(key) < 0){  
                        link[key] = value;
                    }
                }

                linkElements
                .attr('class', link => `link ${getStatus(link.tps)}`)
                .attr('marker-end', link => `url(#${getStatus(link.tps)})`)
                .attr("class", link => getStatus(link.tps))
                .attr("id", link => `link${link.source}${link.target}`);

                linkText
                .text(link => link.tps)
                .attr("class", link => getStatus(link.tps));
            }
        })
    }

    function getStatus(tps){
        if(tps > 100){
            return "danger";
        } else if (tps > 60) {
            return "warning";
        } else {
            return "normal";
        }
    }
});

// function that returns network json
function network(data, prev, cekGroup, expand){
	let cnode,
		groupIndex,
		mappedNodes=[],
		mappedLinks=[],
		clink,
		tempN, 
		tempL=[],
		newNodes=[],
		soIn,
		taIn,
		lw=0,
		newLinks=[];
    let nodes, links;

	if(Object.getOwnPropertyNames(expand).length==0){
        // INIT
		for(let j=0; j<data.nodes.length; j++){
			groupIndex=cekGroup(data.nodes[j]);
			expand[groupIndex]=true;
		}
		nodes = data.nodes;
		links = data.links;
	} else {
        // RESET

        // nodes
		for(let k=0; k<data.nodes.length; k++){
			cnode=data.nodes[k];
			groupIndex=cekGroup(cnode);
            
            //if expand true, nodes condition expand
			if(expand[groupIndex]){
				mappedNodes.push(cnode);
			}
            // if expand false, nodes condition collapse
            else {
				if(!newNodes[groupIndex]){
					tempN={
                        'id': groupIndex,
                        'label': groupIndex,
                        'type': GROUP_TYPE[groupIndex],
                        'size': 64,
                        'group':groupIndex
					};
					newNodes[groupIndex]=tempN;
					mappedNodes.push(tempN);
				}
			}
		}
	
        // links
    	for(let x=0;x<data.links.length;x++){
        	clink = data.links[x];
			soIn = cekGroup(clink.source);
			taIn = cekGroup(clink.target);
			tempL={};
			// if(!expand[soIn] && expand[taIn]) {
			//   tempL.source = newNodes[soIn];
			// }
        
			if(expand[soIn]&&expand[taIn]){
				//console.log('if1');
				//tempL=clink;
				soIn = clink.source.id;
				taIn = clink.target.id;
			} else if(!expand[soIn] && expand[taIn]) {
				//console.log('if2');
				//tempL.source = newNodes[soIn];
				soIn = soIn;
				taIn = clink.target.id;
			} else if(expand[soIn] && !expand[taIn]){
				//console.log('if3');
				//tempL.target = newNodes[taIn];
				taIn = taIn;
				soIn = clink.source.id;
			} else if(!expand[soIn] && !expand[taIn]){
				//console.log('if4');
				//tempL=null;
				if(soIn==taIn){soIn='';taIn='';}
			}
        	console.log(soIn, taIn);
        	if(soIn!=''&&taIn!=''){
				tempL = {
                    'source':soIn,
                    'target':taIn,
                    'type':clink.type,
                    'distance':150,
                    'strength':1,
                    "tps": clink.tps
                }
				mappedLinks.push(tempL);
        	}
		}
      	console.log(mappedLinks);
      	nodes=mappedNodes;
      	links=mappedLinks;
    	// endof if expand not empty
    }

    return {nodes:nodes, links:links};
}