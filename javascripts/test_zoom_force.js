let dataku = {
    'nodes':[{'id':'A',
          'label':'A',
          'type':'resource',
          'size':40,
          'group':'a',
              x:0,
              y:0
             },{
               'id':'B',
          'label':'B',
          'type':'property',
          'size':40,
          'group':'a'
             },{
               'id':'C',
          'label':'C',
          'type':'resource',
          'size':40,
          'group':'x',
           'link': 'http://google.com'
             },{
               'id':'D',
          'label':'D',
          'type':'property',
          'size':40,
          'group':'x'
             },{
               'id':'E',
          'label':'E',
          'type':'resource',
          'size':40,
          'group':'x'
             },{
               'id':'F',
          'label':'F',
          'type':'resource',
          'size':40,
          'group':'a'
             },{
               'id':'Q',
          'label':'Q',
          'type':'resource',
          'size':40,
          'group':'q'
             },{
               'id':'W',
          'label':'Wjk',
          'type':'resource',
          'size':40,
          'group':'q'
             },{
               'id':'Z',
          'label':'Z',
          'type':'resource',
          'size':40,
          'group':'q'
             }],
    'links':[{
      'source':'A',
          'target':'B',
          'type':'property',
          'distance':80,
          'strength':1
    },{
      'source':'E',
          'target':'B',
          'type':'property',
          'distance':80,
          'strength':1
    },{
      'source':'E',
          'target':'F',
          'type':'resource',
          'distance':300,
          'strength':1
    },{
      'source':'A',
          'target':'F',
          'type':'resource',
          'distance':300,
          'strength':1
    },{
      'source':'A',
          'target':'C',
          'type':'resource',
          'distance':300,
          'strength':1
    },{
      'source':'F',
          'target':'B',
          'type':'property',
          'distance':300,
          'strength':1
    },{
      'source':'Q',
          'target':'F',
          'type':'resource',
          'distance':300,
          'strength':1
    },{
      'source':'Q',
          'target':'E',
          'type':'resource',
          'distance':300,
          'strength':1
    },{
      'source':'W',
          'target':'Q',
          'type':'resource',
          'distance':300,
          'strength':1
    }]
  };
  
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
  
let g = svg.append("g")
        .attr("class", "viz");

let net, convexHull,genCH, linkElements, nodeElements, textElements, circle, simulation, linkForce,args;
  
let expand = {};
  
let linkedByIndex = {};
      dataku.links.forEach(function(d) {
      linkedByIndex[d.source + "," + d.target] = true;
      });

function isConnected(a, b) {
    return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
}

function hasConnections(a) {
    for (let property in linkedByIndex) {
        	s = property.split(",");
            if ((s[0] == a.index || s[1] == a.index) && linkedByIndex[property]) return true;
        }
    return false;
}
  
let groupFill = function(d, i) {return color(d.key); };
function getGroup(n) { return n.group; }
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
					'type':'resource',
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
  
d3
.selectAll('.cb')
.on('click',function(e){
	d3.event.stopPropagation();
	let manahide = this.children[0].getAttribute('id');
    if(manahide=='cb1'){
    	console.log(document.getElementById('cb1').checked);
    	if(document.getElementById('cb1').checked){
        	nodeElements.selectAll('.square').style('visibility','hidden');
        	linkElements.style('visibility',function(x){
        	return (x.type=='property'?'hidden':'visible');
        	});
    	} else {
			nodeElements.selectAll('.square').style('visibility','visible');
			linkElements.style('visibility','visible');
      	}
    }
});
  
function hideLinkAlso(){}
  
let offset =0, groups, groupPath;

// start of init
function init(){
	if(simulation){
		linkElements.remove();
		nodeElements.remove();
		genCH.remove();
		convexHull.remove();
		textElements.remove();
	}
	net = network(dataku, net, getGroup, expand);
	groups = d3.nest().key(function(d) { return d.group; }).entries(net.nodes);
	groupPath = function(d) {
		let txt;
		if(d.values.length==1){
			return "M0,0L0,0L0,0Z";
		} else {
			return "M" + 
			d3.polygonHull(d.values.map(function(i) {return [i.x+offset, i.y+offset]; }))
			.join("L")
			+ "Z";
		} 
	};

	convexHull = g.append('g').attr('class','hull');
	// simulation setup with all forces
	linkForce = d3
		.forceLink()
		.id(function (link) { return link.id })
		.strength(function (link) { return 0.1 })
  
  	let inpos = [], counterX = 1, inposY=[], counterY=1;
	simulation = d3
	.forceSimulation()
	.force('link', linkForce)
	.force('forceX', d3.forceX(function(d){
		if(inpos[d.group]){
		console.log(inpos);
		return inpos[d.group];
		} else {
		inpos[d.group]=w/counterX;
		console.log(inpos);
		counterX++;
		return inpos[d.group];
		}
	}))
	.force('forceY', d3.forceY(function(d){
		if(inposY[d.group]){
		console.log(inposY);
		return inposY[d.group];
		} else {
		inposY[d.group]=h/(Math.random()*(d.group.length-0+1)+1);
		console.log(inposY);
		return inposY[d.group];
		}
	}))
    .force('charge', d3.forceManyBody().strength(-501))
    .force('center', d3.forceCenter(w / 2, h / 2))
    .force("gravity", d3.forceManyBody(1));
  
    // arrow head for line
    svg.append("svg:defs").selectAll("marker")
        .data(["resource", "property"])
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
  
	linkElements = g.append('g').attr('class','links').selectAll('path').data(net.links).enter().append('path')
		.attr('class',function(d){return 'link '+d.type;})
		.attr('marker-end', function(d){
			return 'url(#'+d.type+')';
		});
  
	nodeElements = g.append('g').attr('class','nodes').selectAll('.node')
		.data(net.nodes)
		.enter().append('g')
		.attr('class', 'node');
	// .append('circle')
	// .attr("r", cRadius)
	// .attr("fill", function(d){ return color(d.group);});
	circle = nodeElements.filter(function(d){return d.type=='resource';}).append('circle')
		.attr('class','circle')
		.attr("r", function(d){return d.size;})
		.attr("fill", function(d){ return color(d.group);});
	nodeElements.filter(function(d){return d.type=='property';}).append('rect')
		.attr('class','square')
		.attr('width',rectWidth)
		.attr('height',rectHeight)
		.attr("fill", function(d){ return d3.hsl(color(d.group)).darker(2);});

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
		.attr('dx',function(d) {
		if(d.type=='property'){
			return '40px';
		}
		})
		.attr('dy',function(d) {
		if(d.type=='property'){
			return '18px';
		}
		})
		.text(function (node) { return  node.label });  
    
    simulation.nodes(net.nodes).on('tick', () => {
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
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";   })
			// .attr('x', function (node) { console.log(node); return node.x })
			// .attr('y', function (node) { return node.y })
		textElements
			.attr('x', function (node) { return node.x })
			.attr('y', function (node) { return node.y })
		linkElements
			.attr('d', function(d){
			let dx = d.target.x - d.source.x,
			dy = d.target.y - d.source.y,
			dr = Math.sqrt(dx * dx + dy * dy);
			let val1 = 'M'+d.source.x+','+d.source.y+'L'+(d.target.x+40)+','+(d.target.y+rectHeight/2);
			
			let val = 'M'+d.source.x+','+d.source.y+'A'+(dr-drSub)+','+(dr-drSub)+' 0 0,1 '+d.target.x+','+d.target.y;
			
			let val2 = 'M'+d.source.x+','+d.source.y+'L'+(d.target.x)+','+(d.target.y);
			if(d.type=='resource') return val2;
			else return val1;
			});
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
  
	simulation.force("link").links(net.links).distance(function(d){
		if(d.source.group==d.target.group) return 85;
		else return 180;
		// if(d.type=='resource') return 300;
  		// else return 150;
    	// return d.distance;
   	});
    
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
				linkElements.style("stroke", function(o) {return (isNumber(o.score) && o.score>=0)?color(o.score):default_link_color});
			} 
      	}
  	}
  
  	function set_focus(d){
  		if (highlight_trans < 1) {
    		circle.style("opacity", function(o) {
        		return isConnected(d, o) ? 1 : highlight_trans;
      		});
  
    		linkElements.style("opacity", function(o) {
        		return o.source.index == d.index || o.target.index == d.index ? 1 : highlight_trans;
    		});
    	}
	}
  
  	function set_highlight(d){
    	svg.style("cursor","pointer");
    	// circle.style('opacity',0.7);
    	if (focus_node!==null) d = focus_node;
    	highlight_node = d;
    	if (highlight_color!="white"){
        	circle.style(towhite, function(o) {
            return isConnected(d, o) ? highlight_color : "white";
        });
  //             linkElements.style("stroke", function(o) {
  // 		      return o.source.index == d.index || o.target.index == d.index ? highlight_color : ((isNumber(o.score) && o.score>=0)?color(o.score):default_link_color);
               // });
      	}
  	}
   
    function linkToPage(d){
		if(d.link){
			console.log('link');
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
    // endof init()
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