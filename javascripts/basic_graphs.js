"use strict";

// load data
let nodes = [{
    "id": 1,
    "ip": "1.1.1.1",
    "r": 20,
    "x": 200,
    "y": 300
}, {
    "id": 2,
    "ip": "1.1.1.2",
    "r": 30,
    "x": 300,
    "y": 300
}, {
    "id": 3,
    "ip": "1.1.1.3",
    "r": 15,
    "x": 450,
    "y": 200
}, {
    "id": 4,
    "ip": "1.1.1.4",
    "r": 20,
    "x": 450,
    "y": 400
}];

let links = [{
    "source": 1,
    "target": 2
}, {
    "source": 2,
    "target": 3
}, {
    "source": 2,
    "target": 4
}];

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
let svg = d3.select("body").select("svg");
let edges = svg.selectAll("path")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`)
    .style("stroke", "blue")
    .style("stroke-width", "1px");

const ICONWIDTH = 64;
const ICONHEIGHT = 64;

// vertex
let vertex = svg
    .selectAll("node")
    .data(nodes)
    .enter().append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("class", "node")
    .call(d3.drag()    
            .on("start", dragstart)
            .on("drag", dragged)
            .on("end", dragend));

vertex.append("image")
        .attr("xlink:href", "images/pc-64x64.png")
        .attr("x", d => -ICONWIDTH / 2)
        .attr("y", d => -ICONHEIGHT / 2)    
        .attr("width", ICONWIDTH)
        .attr("height", ICONHEIGHT);

vertex.append("text")
        .attr("class", "node_detail")
        .attr("dx", d => 0)
        .attr("dy", d => ICONHEIGHT)
        .text(d => d.ip);

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

function dragstart() {
    console.log("drag started!");
}

function dragend() {
    console.log("drag ended!");
}