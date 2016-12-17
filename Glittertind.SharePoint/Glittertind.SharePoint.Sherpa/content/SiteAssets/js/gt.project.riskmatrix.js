var GT;
(function (GT) {
    var Project;
    (function (Project) {
        var RiskMarix;
        (function (RiskMarix) {
            var __RISKS = new Array();
            /**
             * Config variables for the risk matrix
             */
            var __CONFIG = {
                RISK_LIST_NAME: "Usikkerhet",
                COLUMN_CONSEQUENCE: "GtRiskConsequence",
                COLUMN_PROBABILITY: "GtRiskProbability",
                COLUMN_RISKFACTOR: "GtRiskFactor",
                COLUMN_RISKACTION: "GtRiskAction",
                COLUMN_RISKPROXIMITY: "GtRiskProximity",
                COLUMN_ID: "ID",
                COLUMN_TITLE: "Title",
                CONTAINER: "#gt-riskmatrix",
                NUM_COLUMNS: 6,
                NUM_ROWS: 6,
                STATUS_BLUE: "#3867c8",
                STATUS_RED: "#d94a5e",
                STATUS_ORANGE: "#f5a164",
                STATUS_LIGHTGREEN: "#9acd62",
                STATUS_YELLOW: "#FFE654",
                STATUS_GREEN: "#55AA55",
                TEXT_BLUE: "#002e5e",
                LEGEND_TEXT: [
                    "Høyst sannsynlig",
                    "Meget sannsynlig",
                    "Sannsynlig",
                    "Lite sannsynlig",
                    "Usannsynlig",
                    "Ufarlig",
                    "Mindre farlig",
                    "Farlig",
                    "Kritisk",
                    "Katastrofalt",
                ]
            };
            var RiskItem = (function () {
                function RiskItem(id, title, text, consequence, probability, riskFactor) {
                    this.Id = id;
                    this.Title = title;
                    this.Text = text;
                    this.Consequence = consequence;
                    this.Probability = probability;
                    this.RiskFactor = riskFactor;
                }
                return RiskItem;
            }());
            ;
            function _render($__container) {
                var autoWidth = $__container.parent().width() * 0.9, autoHeight = autoWidth / 2, containerWidth = $__container.data("width") || autoWidth, containerHeight = $__container.data("height") || autoHeight, showLegend = ($__container.data("showlegend") === false) ? false : true;
                RenderMatrix($__container, containerWidth, containerHeight, showLegend);
            }
            ;
            function GetRisks(viewXml) {
                var def = jQuery.Deferred(), ctx = SP.ClientContext.get_current(), list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME);
                var query = new SP.CamlQuery();
                query.set_viewXml(viewXml);
                var items = list.getItems(query);
                ctx.load(items);
                ctx.executeQueryAsync(function () {
                    def.resolve(items.get_data().map(function (d) {
                        var fieldValues = d.get_fieldValues();
                        return new RiskItem(fieldValues[__CONFIG.COLUMN_ID], fieldValues[__CONFIG.COLUMN_TITLE], fieldValues[__CONFIG.COLUMN_RISKACTION], fieldValues[__CONFIG.COLUMN_CONSEQUENCE], fieldValues[__CONFIG.COLUMN_PROBABILITY], fieldValues[__CONFIG.COLUMN_RISKFACTOR]);
                    }));
                }, def.reject);
                return def.promise();
            }
            ;
            function GetViews() {
                var def = jQuery.Deferred(), ctx = SP.ClientContext.get_current(), list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME), views = list.get_views();
                ctx.load(views);
                ctx.executeQueryAsync(function () {
                    def.resolve(views.get_data());
                }, def.reject);
                return def.promise();
            }
            ;
            function RenderMatrix($__container, containerWidth, containerHeight, showLegend) {
                GetRisks("<View></View>").then(function (risks) {
                    risks.forEach(function (risk) {
                        var placement = 0;
                        var identicalRisks = jQuery.grep(risks, function (e) {
                            return e.Consequence === risk.Consequence && e.Probability === risk.Probability;
                        });
                        if (identicalRisks.length > 1) {
                            for (var ir = 0; ir < identicalRisks.length; ir++) {
                                identicalRisks[ir].Placement = placement;
                                placement++;
                            }
                        }
                    });
                    var w = containerWidth;
                    var h = containerHeight;
                    var hp = h + 30;
                    var wp = w + 20;
                    var numCols = (showLegend) ? __CONFIG.NUM_COLUMNS : __CONFIG.NUM_COLUMNS - 1;
                    var numRows = (showLegend) ? __CONFIG.NUM_ROWS : __CONFIG.NUM_ROWS - 1;
                    var colWidth = w / numCols;
                    var rowHeight = h / numRows;
                    var halfRowHeight = rowHeight / 2;
                    var xScale = d3["scale"].linear()
                        .domain([0.5, 5.5])
                        .range([w / numCols, w]);
                    var yScale = d3["scale"].linear()
                        .domain([0.5, 5.5])
                        .range([h - (h / numRows), 0]);
                    var svg = d3.select(__CONFIG.CONTAINER)
                        .append("svg")
                        .attr("width", w)
                        .attr("height", h)
                        .attr("class", "riskSVG")
                        .attr("style", "overflow:visible;");
                    var riskbg = d3.select(".riskSVG");
                    var startx = 0;
                    var starty = 0;
                    var i = 0;
                    var fill;
                    var ltIndex = 0;
                    while (i < (numCols * numRows)) {
                        var fillArr = (showLegend === true) ?
                            [
                                0, 3, 2, 1, 1, 1,
                                0, 4, 3, 2, 1, 1,
                                0, 5, 4, 3, 2, 1,
                                0, 5, 5, 4, 3, 2,
                                0, 5, 5, 5, 4, 3,
                                6, 0, 0, 0, 0, 0,
                            ]
                            :
                                [
                                    3, 2, 1, 1, 1,
                                    4, 3, 2, 1, 1,
                                    5, 4, 3, 2, 1,
                                    5, 5, 4, 3, 2,
                                    5, 5, 5, 4, 3,
                                ];
                        switch (fillArr[i]) {
                            case 0:
                                // Legend text
                                var l = riskbg.append("text");
                                l.attr("class", "dss-risk-legendtext")
                                    .attr("id", "RiskLegendItem" + ltIndex)
                                    .attr("dx", function () {
                                    if (ltIndex < 5) {
                                        return 5;
                                    }
                                    else {
                                        return (colWidth * (ltIndex - 3) - (colWidth)) + 20;
                                    }
                                })
                                    .attr("dy", function () {
                                    if (ltIndex < 5) {
                                        return (rowHeight * (ltIndex + 1)) - (halfRowHeight) + 5;
                                    }
                                    else {
                                        return (h - halfRowHeight) + 5;
                                    }
                                })
                                    .text(__CONFIG.LEGEND_TEXT[ltIndex]);
                                ltIndex++;
                                fill = "none";
                                break;
                            case 1:
                                fill = __CONFIG.STATUS_RED;
                                break;
                            case 2:
                                fill = __CONFIG.STATUS_ORANGE;
                                break;
                            case 3:
                                fill = __CONFIG.STATUS_YELLOW;
                                break;
                            case 4:
                                fill = __CONFIG.STATUS_LIGHTGREEN;
                                break;
                            case 5:
                                fill = __CONFIG.STATUS_GREEN;
                                break;
                            default:
                                fill = "none";
                                break;
                        }
                        if (i % numCols === 0 && i !== 0) {
                            starty += (rowHeight);
                            startx = 0;
                        }
                        riskbg.append("rect")
                            .attr("fill", fill)
                            .attr("stroke", "#cccccc")
                            .attr("opacity", 1)
                            .attr("width", colWidth)
                            .attr("height", rowHeight)
                            .attr("x", startx)
                            .attr("y", starty)
                            .attr("id", "rect" + i);
                        startx += (w / numCols);
                        i++;
                    }
                    var a = svg.selectAll("g").data(risks).enter().append("a");
                    a
                        .attr("onclick", function (d) { return ""; })
                        .attr("xlink:href", "#")
                        .attr("class", "dss-modalLink")
                        .attr("cursor", "pointer")
                        .attr("dx", function (d) { return getX(d); })
                        .attr("dy", function (d) { return getY(d); })
                        .attr("id", function (d) { return "risklink" + d.Id; })
                        .append("text")
                        .attr("fill", __CONFIG.STATUS_BLUE)
                        .attr("id", function (d) { return "circle" + d.Id; })
                        .attr("dx", function (d) { return getX(d); })
                        .attr("dy", function (d) { return getY(d); })
                        .text(function (d) { return d.Id; })
                        .on("mouseover", function (d) { d3.select("#risktext" + d.Id)["style"]("display", "block"); })
                        .on("mouseout", function (d) { d3.select("#risktext" + d.Id)["style"]("display", "none"); });
                    var textPosX = wp;
                    var textPosY = 0;
                    if ($__container.data("textposition")) {
                        var pos = $__container.data("textposition");
                        if (pos = "bottom") {
                            textPosX = 0;
                            textPosY = hp;
                            $__container.css("padding-bottom", "75px");
                        }
                    }
                    var group = svg.selectAll("g")
                        .data(risks)
                        .enter()
                        .append("g")
                        .attr("x", textPosX)
                        .attr("y", textPosY)
                        .attr("style", "display:none")
                        .attr("id", function (d) { return "risktext" + d.Id; });
                    var txt = group.append("text")
                        .attr("x", textPosX)
                        .attr("y", textPosY)
                        .attr("font-family", "'open_sansregular','Segoe UI','sans-serif'")
                        .attr("fill", "black");
                    txt.append("tspan").attr("x", textPosX).attr("style", "font-weight:bold")
                        .html(function (d) { return d.Title; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                        .html(function (d) { return d.Text; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                        .html(function (d) { return "Alvorlighetsgrad: " + d.Consequence; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                        .html(function (d) { return "Sannsynlighet: " + d.Probability; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX).attr("style", "font-weight:bold")
                        .html(function (d) { return "Sum Risiko: " + getRiskSum(d); });
                    if (showLegend) {
                        d3.select(".riskSVG")
                            .append("g").call(d3["svg"].axis()["scale"](xScale).orient("top").ticks(5))
                            .attr("fill", "none")
                            .attr("stroke", "#333").attr("stroke-width", "1")
                            .attr("shape-rendering", "crispEdges")
                            .append("g").call(d3["svg"].axis()["scale"](yScale).orient("left").ticks(5))
                            .attr("fill", "none")
                            .attr("stroke", "#333")
                            .attr("shape-rendering", "crispEdges");
                    }
                    svg.selectAll("path, line, text")
                        .attr("stroke", "none");
                    svg.selectAll("text")
                        .attr("fill", __CONFIG.TEXT_BLUE);
                    $__container.css("opacity", "1");
                    function getX(d) {
                        var x = (showLegend) ?
                            ((w / numCols) * d.Consequence) + (w / 10) - 18 :
                            ((w / numCols) * d.Consequence) - (w / 10) - 9;
                        if (d.Id >= 10) {
                            x -= 10;
                        }
                        if (d.Placement === 1) {
                            x -= (w / 20);
                        }
                        else if (d.Placement === 2) {
                            x += (w / 20);
                        }
                        return x;
                    }
                    function getY(d) {
                        var y = (showLegend) ?
                            h - (((h / numRows * d.Probability)) - (h / 10) + (h / numRows) - 2) :
                            h - (((h / numRows) * d.Probability) - (h / numRows) + (halfRowHeight / 2));
                        if (d.Placement === 3) {
                            y -= (h / 18);
                        }
                        if (d.Placement === 4) {
                            y += (h / 18);
                        }
                        return y;
                    }
                    function getRiskSum(d) { return (d.Probability * d.Consequence); }
                });
            }
            ;
            function init() {
                var $__container = jQuery(__CONFIG.CONTAINER);
                $__container.css("transition", "all .3s");
                var rtime, timeout = false, delta = 200;
                jQuery(window).resize(function () {
                    rtime = new Date();
                    if (timeout === false) {
                        timeout = true;
                        setTimeout(resizeend, delta);
                    }
                });
                function resizeend() {
                    if (new Date() - rtime < delta) {
                        setTimeout(resizeend, delta);
                    }
                    else {
                        $__container.empty();
                        $__container.css("opacity", "0");
                        timeout = false;
                        _render($__container);
                    }
                }
                _render($__container);
            }
            RiskMarix.init = init;
            ;
            ExecuteOrDelayUntilBodyLoaded(init);
        })(RiskMarix = Project.RiskMarix || (Project.RiskMarix = {}));
    })(Project = GT.Project || (GT.Project = {}));
})(GT || (GT = {}));
;
