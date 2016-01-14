;
(function (d3) {
    d3.util = {};
    d3.util.getXYFromTranslate = function (translateString) {
        var split = translateString.split(",");
        var x = split[0] ? ~~split[0].split("(")[1] : 0;
        var y = split[1] ? ~~split[1].split(")")[0] : 0;
        return [x, y];
    };

    function minimap() {
        var opts = {
            width: 0,
            height: 0,
            target: null,
            x: 0,
            y: 0,
            frameX: 0,
            frameY: 0,
            base: null,
            zoom: null,
            scale: 1,
            minimapScale: 0.15,
            containerHeight: 0,
            containerWidth: 0,
            inContainer: false
        }

        function factory(selection) {
            opts.base = selection;

            var container = selection.append("g")
                .attr("class", "minimap")
                .call(opts.zoom);

            opts.zoom.on("zoom.minimap", function () {
                opts.scale = d3.event.scale;
            });

            minimap.node = container.node();

            var frame = container.append("g")
                .attr("class", "frame");

            frame.append("rect")
                .attr("class", "background")
                .attr("width", opts.width)
                .attr("height", opts.height)

            var drag = d3.behavior.drag()
                .on("dragstart.minimap", function () {
                    var frameTranslate = d3.util.getXYFromTranslate(
                        frame.attr("transform")
                    );
                    opts.frameX = frameTranslate[0];
                    opts.frameY = frameTranslate[1];
                })
                .on("drag.minimap", function () {
                    d3.event.sourceEvent.stopImmediatePropagation();
                    opts.frameX += d3.event.dx;
                    opts.frameY += d3.event.dy;
                    if (opts.inContainer) {
                        var tbound = 0,
                            bbound = (opts.containerHeight * 1 / opts.minimapScale) - opts.height * 1 / opts.scale,
                            lbound = 0,
                            rbound = (opts.containerWidth * 1 / opts.minimapScale) - opts.width * 1 / opts.scale;
                        opts.frameX = Math.max(Math.min(opts.frameX, rbound), lbound);
                        opts.frameY = Math.max(Math.min(opts.frameY, bbound), tbound);
                    }

                    frame.attr("transform",
                        "translate(" + opts.frameX + "," + opts.frameY + ")");
                    var translate = [
                        (-opts.frameX * opts.scale),
                        (-opts.frameY * opts.scale)
                    ];
                    opts.target.attr("transform",
                        "translate(" + translate +
                        ")scale(" + opts.scale + ")");
                    opts.zoom.translate(translate);
                });

            frame.call(drag);

            factory.render = function () {
                opts.scale = opts.zoom.scale();
                container.attr("transform",
                    "translate(" + opts.x + "," + opts.y +
                    ")scale(" + opts.minimapScale + ")");

                var node = opts.target.node().cloneNode(true);
                node.removeAttribute("id");
                opts.base.selectAll(".minimap .panCanvas").remove();
                container.selectAll('.graph-canvas').remove();
                minimap.node.appendChild(node);

                var targetTransform = d3.util.getXYFromTranslate(
                    opts.target.attr("transform"));
                frame.attr("transform",
                        "translate(" + (-targetTransform[0] / opts.scale) +
                        "," + (-targetTransform[1] / opts.scale) + ")")
                    .select(".background")
                    .attr("width", opts.width / opts.scale)
                    .attr("height", opts.height / opts.scale);

                d3.select(node).attr("transform", "translate(1,1)");
            };

            return factory;
        }

        function accessor(key) {
            return function (value) {
                if (!arguments.length) return opts[key];
                opts[key] = value;
                return factory;
            }
        }

        for (var n in opts) {
            if (opts.hasOwnProperty(n)) {
                factory[n] = accessor(n);
            }
        }

        factory.target = function (value) {
            if (!arguments.length) {
                return opts.target;
            }
            opts.target = value;
            opts.width = parseInt(value.attr("width"), 10);
            opts.height = parseInt(value.attr("height"), 10);
            return factory;
        };

        return factory;
    }

    d3.minimap = minimap;
})(d3)