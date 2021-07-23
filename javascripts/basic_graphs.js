"use strict";

const image_link = {
    "cloud": "images/pc-64x64.png",
    "vm": "images/cloud-9-64x64.png",
    "db": "images/database.png",
}

const files = [
    "data/take1.json",
    "data/take2.json"
]

// json 계속 쓰고, 여기서 계속 읽기
let fileindex = 0;

// render_page(`data/take${fileindex++%2}.json`);
render_page(`data/take2.json`);
// FOR LIVE OVERVIEW
// let timer = setInterval(() => {
//     let filename = `data/take${fileindex++%2}.json`; 
//     d3.selectAll('g').remove();
//     d3.selectAll("path").remove();
//     render_page(filename);
// }, 1000);


let rectWidth = 80,
    rectHeight = 30;
let markerWidth =10,
	markerHeight =6,
	cRadius =40, // play with the cRadius value
	refX =70, //refX = cRadius + markerWidth,
	refY =0, //refY = -Math.sqrt(cRadius),
	drSub = cRadius + refY;
let offset =0, groups, groupPath;

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
    console.log(Object.getOwnPropertyNames(expand));
    console.log("data at fnct: ", data);
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
					'type':'cloud',
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

// main logic
function render_page(jsonfile){
    console.log(jsonfile);

    d3.json(jsonfile, function(data){
        let nodes = data["nodes"];
        let links = data["links"];
        const ICONWIDTH = 64;
        const ICONHEIGHT = 64;
        
        // preprocessing
        links.some(function(v, i) {
            nodes.some(function(w, j) {
                if (v.source == w.id) {
                    v.source = w;
                }
                if (v.target == w.id) {
                    v.target = w;
                }
            });
            v.index = ++i;
        });

        // set edges, vertex
        let canvas = document.getElementById('canvas');
        let w=canvas.clientWidth, h=canvas.clientHeight;
        let color = d3.scaleOrdinal(d3.schemeSet3);
        let svg = d3.select(canvas).append('svg')
            .attr('width', w)
            .attr('height', h);



        
        // whole graph
        let g = svg.append("g")
                   .attr("class", "viz")


        let net, genCH;
        let expand = {};
        let getGroup = n => n.group;

        net = network(data, net, getGroup, expand);
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

        let groupFill = function(d, i) {
            console.log("groupFill: ", d.key);    
            return color(d.key); 
        };
        console.log("net: ", net);
        console.log("expand: ", expand);
        // let svg = d3.select(canvas)
        // let svg = d3.select("body").select("svg");

        let convexHull = g.append('g').attr('class','hull');
	    // simulation setup with all forces
	    let linkForce = d3
		    .forceLink()
		    .id(function (link) { return link.id })
		    .strength(function (link) { return 0.1 })

        let inpos = [], counterX = 1, inposY=[], counterY=1;
        let simulation = d3
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
        svg.append("svg:defs")
            .selectAll("marker")
            .data(["cloud", "db"])
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

        // edges
        let edges = g.append('g')
                    .attr('class','links')
                    .selectAll('path')
                    .data(net.links)
                    .enter()
                    .append('path')
		            .attr('class',function(d){return 'link '+d.type;})
                    .attr('marker-end', function(d){
                        return 'url(#'+d.type+')';
                    });
        // let edges = svg.selectAll("path")
        // .data(links)
        // .enter().append("path")
        // .attr("class", d => d.status == 0? "link_ok": "link_bad")
        // .attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`)
        
        let vertex = g.append('g')
                    .attr('class','nodes')
                    .selectAll('.node')
                    .data(net.nodes)
                    .enter().append('g')
                    .attr('class', 'node');
        
        let circle = vertex.filter(function(d){return d.type=='cloud';}).append('circle')
                    .attr('class','circle')
                    .attr("r", function(d){return d.size;})
                    .attr("fill", function(d){ return color(d.group);});
        
        // vertex
        // let vertex = svg.selectAll("node")
        //                 .data(nodes)
        //                 .enter().append("g")
        //                 .attr("transform", d => `translate(${d.x},${d.y})`)
        //                 .attr("class", d => links.some((v, i) => v.status == 1 && (v.source === d || v.target === d))? 
        //                                     "node_bad": "node_ok")
        //                 .call(d3.drag()
        //                         .on("start", dragstart)
        //                         .on("drag", dragged)
        //                         .on("end", dragend));

        
        vertex.append("image")
            // .attr("xlink:href", d => image_link[d.type])
            .attr("xlink:href", function (d){
                console.log("d: ", d);
                console.log("href:", image_link[d.type]);
                return image_link[d.type];
            })
            .attr("x", d => -ICONWIDTH / 2)
            .attr("y", d => -ICONHEIGHT / 2)    
            .attr("width", ICONWIDTH)
            .attr("height", ICONHEIGHT);

        vertex.append("text")
            .attr("class", "node_detail")
            .attr("dx", d => 0)
            .attr("dy", d => ICONHEIGHT)
            .text(d => d.ip);

        vertex.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended));
        

        simulation.nodes(net.nodes).on('tick', () => {
            genCH = convexHull.selectAll("path")
                .data(groups)
                // .attr("d", groupPath)
                .attr("d", function(x){
                    console.log("genCH: Data x: ", x);
                    return groupPath(x);
                })
                .enter()
                .insert("path", "circle")
                .style("fill", "yellow")
                .style("stroke", groupFill)
                .style("stroke-width", 140)
                .style("stroke-linejoin", "round")
                .style("opacity", .5)
                .on('click',function(d){
                expand[d.key] = false;
                // render_page(jsonfile);
                })
                .attr("d", groupPath);
        
            vertex
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";   })
                // .attr('x', function (node) { console.log(node); return node.x })
                // .attr('y', function (node) { return node.y })
            // textElements
            //     .attr('x', function (node) { return node.x })
            //     .attr('y', function (node) { return node.y })
            edges
                .attr('d', function(d){
                let dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
                let val1 = 'M'+d.source.x+','+d.source.y+'L'+(d.target.x+40)+','+(d.target.y+rectHeight/2);
                
                let val = 'M'+d.source.x+','+d.source.y+'A'+(dr-drSub)+','+(dr-drSub)+' 0 0,1 '+d.target.x+','+d.target.y;
                
                let val2 = 'M'+d.source.x+','+d.source.y+'L'+(d.target.x)+','+(d.target.y);
                if(d.type=='cloud') return val2;
                else return val1;
                });
            })
        // change position when dragged
        function dragged(d) {
            console.log("dragged!");
            d.x = d3.event.x;
            d.y = d3.event.y;

            // change node position
            let node = d3.select(this);
            node.attr("transform", d => `translate(${d.x},${d.y})`)
            
            // change link position
            let link = edges.filter((v, i) => (v.source.id == d.id || v.target.id == d.id));
            link.attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`);
        }

        function dragstarted() {
            console.log("drag started!");
        }

        function dragended() {
            console.log("drag ended!");
        }

        var zoom_handler = d3.zoom()
            .on("zoom", zoom_actions);

        zoom_handler(svg);
        function zoom_actions(){
            g.attr("transform", d3.event.transform);
        }
    })
}