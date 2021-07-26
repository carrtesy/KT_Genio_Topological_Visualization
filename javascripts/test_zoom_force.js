let dataku = {
    'nodes':[{'id':'A',
          'label':'A',
          'type':'db',
          'size':40,
          'group':'a',
              x:0,
              y:0
             },{
               'id':'B',
          'label':'B',
          'type':'cloud',
          'size':40,
          'group':'a'
             },{
               'id':'C',
          'label':'C',
          'type':'db',
          'size':40,
          'group':'x',
           'link': 'http://google.com'
             },{
               'id':'D',
          'label':'D',
          'type':'cloud',
          'size':40,
          'group':'x'
             },{
               'id':'E',
          'label':'E',
          'type':'db',
          'size':40,
          'group':'x'
             },{
               'id':'F',
          'label':'F',
          'type':'db',
          'size':40,
          'group':'a'
             },{
               'id':'Q',
          'label':'Q',
          'type':'db',
          'size':40,
          'group':'q'
             },{
               'id':'W',
          'label':'Wjk',
          'type':'db',
          'size':40,
          'group':'q'
             },{
               'id':'Z',
          'label':'Z',
          'type':'db',
          'size':40,
          'group':'q'
             }],
    'links':[{
      'source':'A',
          'target':'B',
          'type':'cloud',
          'distance':80,
          'strength':1
    },{
      'source':'E',
          'target':'B',
          'type':'cloud',
          'distance':80,
          'strength':1
    },{
      'source':'E',
          'target':'F',
          'type':'db',
          'distance':300,
          'strength':1
    },{
      'source':'A',
          'target':'F',
          'type':'db',
          'distance':300,
          'strength':1
    },{
      'source':'A',
          'target':'C',
          'type':'db',
          'distance':300,
          'strength':1
    },{
      'source':'F',
          'target':'B',
          'type':'cloud',
          'distance':300,
          'strength':1
    },{
      'source':'Q',
          'target':'F',
          'type':'db',
          'distance':300,
          'strength':1
    },{
      'source':'Q',
          'target':'E',
          'type':'db',
          'distance':300,
          'strength':1
    },{
      'source':'W',
          'target':'Q',
          'type':'db',
          'distance':300,
          'strength':1
    }]
  };


"use strict";

// load dataset
// logic to load data

// hyperparameters
const image_link = {
	"cloud": "images/pc-64x64.png",
	"vm": "images/cloud-9-64x64.png",
	"db": "images/database.png",
}

const files = [
	"data/take1.json",
	"data/take2.json"
]

const ICONWIDTH = 64;
const ICONHEIGHT = 64;


// outlines
let canvas = document.getElementById('canvas');
let w=canvas.clientWidth, h=canvas.clientHeight;
let color = d3.scaleOrdinal(d3.schemeSet3);
let svg = d3.select(canvas).append('svg')
        	.attr('width', w)
        	.attr('height', h);

let rectWidth = 80,
    rectHeight = 30;

let markerWidth =10,
	markerHeight =6,
	cRadius =40, // play with the cRadius value
	refX =70, //refX = cRadius + markerWidth,
	refY =0, //refY = -Math.sqrt(cRadius),
	drSub = cRadius + refY;
  
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
//let default_node_color = "rgb(3,190,100)";
let default_link_color = "#888";



// add graph
let g = svg.append("g")
        .attr("class", "viz");

let net, convexHull,genCH, linkElements, nodeElements, textElements, circle, simulation, linkForce, args;
  
let expand = {};
  
let linkedByIndex = {};
dataku.links.forEach(function(d) {
	linkedByIndex[d.source + "," + d.target] = true;
});

let isConnected = (a, b) => linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index ;   
let groupFill = (d, i) => color(d.key);
let getGroup = n => n.group;


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

	if(Object.getOwnPropertyNames(expand).length==0){
		for(let j=0; j<data.nodes.length; j++){
			groupIndex=cekGroup(data.nodes[j]);
			expand[groupIndex]=true;
		}
		nodes = data.nodes;
		links = data.links;
	} else {
		for(let k=0; k<data.nodes.length; k++){
			cnode=data.nodes[k];
			groupIndex=cekGroup(cnode);
			if(expand[groupIndex]){
				mappedNodes.push(cnode);
				//if expand true, nodes condition expand
			} else {
				if(!newNodes[groupIndex]){
					tempN={
					'id':groupIndex,
					'label':'domain '+groupIndex,
					'type':'db',
					'size':30,
					'group':groupIndex
						}; 
					newNodes[groupIndex]=tempN;
					mappedNodes.push(tempN);
				}
				// if expand false, nodes condition collapse
			}
		//iterate through all data.nodes
		}
	
      
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
				'strength':1}
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

let offset =0, groups, groupPath;

// start of init
function init(){
	// Reset Palette Here
	if(simulation){
		linkElements.remove();
		nodeElements.remove();
		genCH.remove();
		convexHull.remove();
		textElements.remove();
	}

	net = network(dataku, net, getGroup, expand);
	groups = d3.nest().key(d=>d.group).entries(net.nodes);
	groupPath = d =>
		d.values.length == 1? "M0,0L0,0L0,0Z": 
		"M" + d3.polygonHull(d.values.map( i => [i.x+offset, i.y+offset])).join("L") + "Z";
	

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
		.force('forceX', d3.forceX(function(d){
			if(inpos[d.group]){
				return inpos[d.group];
			} else {
				inpos[d.group]=w/counterX++;
				return inpos[d.group];
			}
		}))
		.force('forceY', d3.forceY(function(d){
			if(inposY[d.group]){
				return inposY[d.group];
			} else {
				inposY[d.group]=h/(Math.random()*(d.group.length-0+1)+1);
				return inposY[d.group];
			}
		}))
		.force('charge', d3.forceManyBody().strength(-501))
		.force('center', d3.forceCenter(w / 2, h / 2))
		.force("gravity", d3.forceManyBody(1));
  
    // arrow head for line
    svg.append("svg:defs").selectAll("marker")
        .data(["db", "cloud"])
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
  
	linkElements = g.append('g')
		.attr('class','links')
		.selectAll('path')
		.data(net.links).enter().append('path')
		.attr('class', d => `link ${d.type}`)
		.attr('marker-end', d => `url(#${d.type})`);
  
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
		.filter(d => d.type === "db")
		.append('circle')
		.attr('class','circle')
		.attr("r", d => d.size)
		.attr("fill", d => color(d.group));
	

	nodeElements.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended));

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
					expand[d.key] = false;
					init();
				})
				.attr("d", groupPath);
	
			nodeElements
				.attr("transform", d => `translate(${d.x},${d.y})`)
				.attr('x', node => node.x)
				.attr('y', node => node.y);
			textElements
				.attr('x', node => node.x)
				.attr('y', node => node.y);
			linkElements
				.attr('d', d => 'M'+d.source.x+','+d.source.y+'L'+(d.target.x)+','+(d.target.y));
  	})
    
    nodeElements
		.on("mouseover", function(d) { set_highlight(d);})
		.on("mousedown", function(d) { 
    		d3.event.stopPropagation();
        	focus_node = d;
    		console.log('mousedown');
    		set_focus(d)
    		if (highlight_node === null) set_highlight(d)})
		.on("mouseout", function(d) {
			exit_highlight();
		})
		.on("click",function(d){
			d3.event.stopPropagation();
			console.log('click');
			setExpand(d);
			linkToPage(d);
		});
  
	simulation.force("link")
			.links(net.links)
			.distance( d => d.source.group == d.target.group ? 85 : 180);
    
    function setExpand(d){
		expand[d.id] = !expand[d.id];
		init();
    }
    
    function exit_highlight(){
    	highlight_node = null;
    	if (focus_node===null){
			svg.style("cursor","move");
			if (highlight_color!="white"){
				circle.style(towhite, "white");
				linkElements.style("stroke", o => (isNumber(o.score) && o.score>=0)? color(o.score): default_link_color);
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
    	linkElements.style("stroke", 
			o => (o.source.index == d.index || o.target.index == d.index) ? 
				highlight_color : ((isNumber(o.score) && o.score >= 0) ? color(o.score) : default_link_color));
  	}
   
    function linkToPage(d){
		if(d.link){
			window.open(d.link);
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
  
init();

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