"use strict";

const image_link = {
    "cloud": "images/pc-64x64.png",
    "vm": "images/cloud-9-64x64.png",
    "db": "images/database.png"
}

const files = [
    "data/take1.json",
    "data/take2.json"
]

// json 계속 쓰고, 여기서 계속 읽기
let fileindex = 0;

render_page(`data/take${fileindex++%2}.json`);

// FOR LIVE OVERVIEW
// let timer = setInterval(() => {
//     let filename = `data/take${fileindex++%2}.json`; 
//     d3.selectAll('g').remove();
//     d3.selectAll("path").remove();
//     render_page(filename);
// }, 1000);

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
        let svg = d3.select("body").select("svg");
        let edges = svg.selectAll("path")
        .data(links)
        .enter().append("path")
        .attr("class", d => d.status == 0? "link_ok": "link_bad")
        .attr("d", d => `M${d.source.x} ${d.source.y}`+ " " + `L${d.target.x} ${d.target.y}`)
        
        // vertex
        let vertex = svg.selectAll("node")
                        .data(nodes)
                        .enter().append("g")
                        .attr("transform", d => `translate(${d.x},${d.y})`)
                        .attr("class", d => links.some((v, i) => v.status == 1 && (v.source === d || v.target === d))? 
                                            "node_bad": "node_ok")
                        .call(d3.drag()
                                .on("start", dragstart)
                                .on("drag", dragged)
                                .on("end", dragend));

        vertex.append("image")
            .attr("xlink:href", d => image_link[d.type])
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

        var zoom_handler = d3.zoom()
            .on("zoom", zoom_actions);

        zoom_handler(svg);
        function zoom_actions(){
            g.attr("transform", d3.event.transform);
        }
    })
}