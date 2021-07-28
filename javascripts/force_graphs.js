"use strict";

// hyperparameters
const image_link = {
	"cloud": "images/cloud.png",
	"vm": "images/server.png",
	"db": "images/db.png",
    "cluster": "images/cluster.png"
}

const files = [
	"data/take1.json",
	"data/take2.json"
]

const ICONWIDTH = 64;
const ICONHEIGHT = 64;

const GROUP_LOCATION = {
    "Web Server 1": {x: 0, y:0},
    "WAS Server 1":{x: 300, y:0},
    "NAS":{x: 450, y: 150},
    "Queue Server 1":{x: 300, y:300},
    "Engine Server 1":{x: 600, y:300},
    "DB Server 1":{x: 600, y:0},
    "Batch Server 1":{x: 900, y:0},
}

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
let jsonfile = "data/take4.json";

d3.json(jsonfile, function(data){
    console.log(jsonfile);
    console.log(data);

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

    let isConnected = (a, b) => linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index ;   
    let groupFill = (d, i) => color(d.key);
    let getGroup = n => n.group;

    // groups
    let offset =0, groups, groupPath;
    // group is expanded or not (boolean)
    let expand = {};

    // init here
    init();

    // start of init declaration
    function init(jsonfile){
        
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
            .attr('class', d => `link ${getStatus(d.tps)}`)
            .attr('marker-end', d => `url(#${getStatus(d.tps)})`)
            .attr("class", link => getStatus(link.tps));
    
        // linktext
        linkText = g.append("g")
            .attr("class", "linktexts")
            .selectAll("text")
            .data(net.links)
            .enter().append("text")
            .attr("font-family", "Arial, Helvetica, sans-serif")
            .attr("fill", "white")
            .style("font", "normal 12px Arial")
            .text(link => link.tps)
            .attr("class", link => getStatus(link.tps));
        
        // grouptext
        groupText = g.append("g")
            .attr("class", "grouptexts")
            .selectAll("text")
            .data(groups)
            .enter().append("text")
            .attr("opacity", g => expand[g.key] ? 1 : 0)
            .text(g => g.key);

        // node
        nodeElements = g.append('g')
            .attr('class','nodes')
            .selectAll('.node')
            .data(net.nodes)
            .enter().append('g')
            .attr('class', 'node')
        
        nodeElements.append("image")
            .attr("xlink:href", d => image_link[d.type])
            .attr("x", d => -ICONWIDTH / 2)
            .attr("y", d => -ICONHEIGHT / 2)    
            .attr("width", ICONWIDTH)
            .attr("height", ICONHEIGHT);

        circle = nodeElements
            .append('circle')
            .attr('class','circle')
            .attr("r", d => d.size)
            .attr("fill", d => color(d.group));
        
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
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline','middle')
            .append('tspan')
            .attr('dx', d => "40px")
            .attr('dy', d => "18px")
            .text(node => node.label);  
        
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
                    .on('click',function(d){
                        expand[d.key] = !expand[d.key];
                        init();
                    })
        
                nodeElements
                    .attr("transform", d => `translate(${d.x},${d.y})`)
                    .attr('x', node => node.x)
                    .attr('y', node => node.y);
                textElements
                    .attr('x', node => node.x)
                    .attr('y', node => node.y);
                linkElements
                    .attr('d', d => 'M'+d.source.x+','+d.source.y+'L'+(d.target.x)+','+(d.target.y));
                linkText
                    .attr("x", d => 0.3 * d.source.x + 0.7 * d.target.x)
                    .attr("y", d => 0.3 * d.source.y + 0.7 * d.target.y);
                groupText
                    .attr("x", g => g.values.length <= 1 ? g.values[0].x: 
                        (g.values.reduce((a, b) => a.x < b.x? a.x: b.x) + g.values.reduce((a, b) => a.x > b.x? a.x: b.x)) / 2)
                    .attr("y", g => g.values.length <= 1 ? g.values[0].y - ICONHEIGHT/2:
                    g.values.reduce((a, b) => a.y < b.y? a.y: b.y) - ICONHEIGHT);
        })
        
        nodeElements
            .on("mouseover", function(d) { set_highlight(d);})
            .on("mousedown", function(d) { 
                d3.event.stopPropagation();
                focus_node = d;
                set_focus(d)
                if (highlight_node === null) set_highlight(d)})
            .on("mouseout", function(d) {
                exit_highlight();
            })
            .on("click",function(d){
                d3.event.stopPropagation();
                setExpand(d);
            });
    
        simulation.force("link")
                .links(net.links)
                .distance( d => d.source.group == d.target.group ? 150 : 300);
        

        // other functions 
        function getStatus(tps){
            if(tps > 100){
                return "danger";
            } else if (tps > 60) {
                return "warning";
            } else {
                return "normal";
            }
        }

        function setExpand(d){
            expand[d.group] = !expand[d.group];
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
    
        function set_focus(d){
            if (highlight_trans < 1) {
                circle.style("opacity", o => isConnected(d, o) ? 1 : highlight_trans);
                linkElements.style("opacity", o => o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans);
            }
        }
    
        function set_highlight(d) {
            svg.style("cursor", "pointer");
            if (focus_node!==null) d = focus_node;
            highlight_node = d;
            if (highlight_color != "white"){
                circle.style(towhite, o => isConnected(d, o) ? highlight_color : "white");
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

    //add zoom capabilities
    let zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    zoom_handler(svg);
    function zoom_actions(){
        g.attr("transform", d3.event.transform);
    }

    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
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
                        'type': 'cluster',
                        'size': 30,
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
				tempL = {'source':soIn,
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