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

console.log(nodes);
console.log(links);
console.info(d3.select("body").select("svg"));

// set edges, vertex
let svg = d3.select("body").select("svg");
let edges = svg.selectAll("path")
    .data(links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`)
    .style("stroke", "blue")
    .style("storke-width", "1px");

let vertex = svg.selectAll("circle")
    .data(nodes)
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", d => d.r)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .style("fill", "red");


// vertex
vertex.call(d3.drag()
    .on("start", dragstart)
    .on("drag", dragged)
    .on("end", dragend));


// change position when dragged
function dragged(d) {
    d.x = d3.event.x;
    d.y = d3.event.y;

    let node = d3.select(this);
    node.attr("cx", d.x)
        .attr("cy", d.y);
    let link = edges.filter(function(v, i) {
        if (v.source.id == d.id || v.target.id == d.id) {
            return true;
        }
    });
    link.attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`);
}

function dragstart() {

}

function dragend() {

}