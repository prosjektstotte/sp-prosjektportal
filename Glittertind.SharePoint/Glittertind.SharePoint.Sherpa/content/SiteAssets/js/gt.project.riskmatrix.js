var GT;
(function (GT) {
    var Project;
    (function (Project) {
        var RiskMarix;
        (function (RiskMarix) {
            var __RISKS = [], __VIEWS = [];
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
                VIEWSELECTOR: "#gt-riskmatrix-viewselector",
                NUM_COLUMNS: 6,
                NUM_ROWS: 6,
                STATUS_FILL: [
                    "none",
                    "#d94a5e",
                    "#f5a164",
                    "#FFE654",
                    "#9acd62",
                    "#55AA55"
                ],
                STATUS_BLUE: "#3867c8",
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
                ;
                RiskItem.prototype.getX = function (c) {
                    var x = (c.SHOW_LEGEND) ?
                        ((c.W / c.NUM_COLS) * this.Consequence) + (c.W / 10) - 18 :
                        ((c.W / c.NUM_COLS) * this.Consequence) - (c.W / 10) - 9;
                    if (this.Id >= 10) {
                        x -= 10;
                    }
                    if (this.Placement === 1) {
                        x -= (c.W / 20);
                    }
                    else if (this.Placement === 2) {
                        x += (c.W / 20);
                    }
                    return x;
                };
                ;
                RiskItem.prototype.getY = function (c) {
                    var y = (c.SHOW_LEGEND) ?
                        c.H - (((c.H / c.NUM_ROWS * this.Probability)) - (c.H / 10) + (c.H / c.NUM_ROWS) - 2) :
                        c.H - (((c.H / c.NUM_ROWS) * this.Probability) - (c.H / c.NUM_ROWS) + (c.HALF_ROW_HEIGHT / 2));
                    if (this.Placement === 3) {
                        y -= (h / 18);
                    }
                    if (this.Placement === 4) {
                        y += (h / 18);
                    }
                    return y;
                };
                ;
                RiskItem.prototype.getSum = function () {
                    return (this.Probability * this.Consequence);
                };
                return RiskItem;
            }());
            ;
            var View = (function () {
                function View() {
                }
                return View;
            }());
            ;
            var MatrixConfig = (function () {
                function MatrixConfig($__container) {
                    this.AUTO_WIDTH = $__container.parent().width() * 0.9;
                    this.AUTO_HEIGHT = this.AUTO_WIDTH / 2;
                    this.SHOW_LEGEND = ($__container.data("showlegend") === false) ? false : true;
                    this.W = $__container.data("width") || this.AUTO_WIDTH;
                    this.H = $__container.data("height") || this.AUTO_HEIGHT;
                    this.HP = this.H + 30;
                    this.WP = this.W + 20;
                    this.NUM_COLS = (this.SHOW_LEGEND) ? __CONFIG.NUM_COLUMNS : __CONFIG.NUM_COLUMNS - 1;
                    this.NUM_ROWS = (this.SHOW_LEGEND) ? __CONFIG.NUM_ROWS : __CONFIG.NUM_ROWS - 1;
                    this.COL_WIDTH = this.W / this.NUM_COLS;
                    this.ROW_HEIGHT = this.H / this.NUM_ROWS;
                    this.HALF_ROW_HEIGHT = this.ROW_HEIGHT / 2;
                }
                return MatrixConfig;
            }());
            function GetRisks(viewQuery) {
                if (viewQuery === void 0) { viewQuery = ""; }
                var def = jQuery.Deferred(), ctx = SP.ClientContext.get_current(), list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME);
                var query = new SP.CamlQuery();
                query.set_viewXml("<View><Query>" + viewQuery + "</Query></View>");
                var items = list.getItems(query);
                ctx.load(items);
                ctx.executeQueryAsync(function () {
                    __RISKS = items.get_data().map(function (d) {
                        var fieldValues = d.get_fieldValues();
                        return new RiskItem(fieldValues[__CONFIG.COLUMN_ID], fieldValues[__CONFIG.COLUMN_TITLE], fieldValues[__CONFIG.COLUMN_RISKACTION], fieldValues[__CONFIG.COLUMN_CONSEQUENCE], fieldValues[__CONFIG.COLUMN_PROBABILITY], fieldValues[__CONFIG.COLUMN_RISKFACTOR]);
                    });
                    def.resolve(__RISKS);
                }, def.reject);
                return def.promise();
            }
            ;
            function GetViews() {
                var def = jQuery.Deferred(), ctx = SP.ClientContext.get_current(), list = ctx.get_web().get_lists().getByTitle(__CONFIG.RISK_LIST_NAME), views = list.get_views();
                ctx.load(views);
                ctx.executeQueryAsync(function () {
                    __VIEWS = views.get_data().map(function (v) {
                        return {
                            ID: v.get_id().toString(),
                            Title: v.get_title(),
                            ServerRelativeUrl: v.get_serverRelativeUrl(),
                            ViewQuery: v.get_viewQuery()
                        };
                    });
                    def.resolve(__VIEWS);
                }, def.reject);
                return def.promise();
            }
            ;
            function RenderViewSelector($__viewSelector) {
                GetViews().then(function (views) {
                    console.log(views);
                    var _outHtml = views
                        .filter(function (v) { return v.Title !== ""; })
                        .map(function (v) { return ("<option value=\"" + v.ID + "\">" + v.Title + "</option>"); }).join("");
                    $__viewSelector
                        .html(_outHtml)
                        .on("change", function () {
                        var viewId = $__viewSelector.val(), view = __VIEWS.filter(function (v) { return v.ID === viewId; })[0];
                        RenderMatrix(view);
                    });
                });
            }
            ;
            function RenderMatrix(view) {
                if (view === void 0) { view = null; }
                var $__container = jQuery(__CONFIG.CONTAINER), __ = new MatrixConfig($__container);
                $__container
                    .fadeTo("fast", 0)
                    .empty();
                var viewQuery = view ? view.ViewQuery : "";
                GetRisks(viewQuery).then(function (risks) {
                    risks.forEach(function (risk) {
                        var placement = 0;
                        var identicalRisks = risks.filter(function (e) { return e.Consequence === risk.Consequence && e.Probability === risk.Probability; });
                        if (identicalRisks.length > 1) {
                            for (var ir = 0; ir < identicalRisks.length; ir++) {
                                identicalRisks[ir].Placement = placement;
                                placement++;
                            }
                        }
                    });
                    var xScale = d3["scale"].linear()
                        .domain([0.5, 5.5])
                        .range([__.W / __.NUM_COLS, __.W]);
                    var yScale = d3["scale"].linear()
                        .domain([0.5, 5.5])
                        .range([__.H - (__.H / __.NUM_ROWS), 0]);
                    var svg = d3.select(__CONFIG.CONTAINER)
                        .append("svg")
                        .attr("width", __.W)
                        .attr("height", __.H)
                        .attr("class", "riskSVG")
                        .attr("style", "overflow:visible;");
                    var riskbg = d3.select(".riskSVG"), startx = 0, starty = 0, i = 0, fill, ltIndex = 0;
                    while (i < (__.NUM_COLS * __.NUM_ROWS)) {
                        var fillArr = (__.SHOW_LEGEND === true) ?
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
                        if (fillArr[0] === 0) {
                            var l = riskbg.append("text");
                            l.attr("class", "risk-legendText")
                                .attr("id", "RiskLegendItem" + ltIndex)
                                .attr("dx", function () {
                                if (ltIndex < 5) {
                                    return 5;
                                }
                                else {
                                    return (__.COL_WIDTH * (ltIndex - 3) - (__.COL_WIDTH)) + 20;
                                }
                            })
                                .attr("dy", function () {
                                if (ltIndex < 5) {
                                    return (__.ROW_HEIGHT * (ltIndex + 1)) - (__.HALF_ROW_HEIGHT) + 5;
                                }
                                else {
                                    return (__.H - __.HALF_ROW_HEIGHT) + 5;
                                }
                            })
                                .text(__CONFIG.LEGEND_TEXT[ltIndex]);
                            ltIndex++;
                        }
                        fill = __CONFIG.STATUS_FILL[fillArr[i]];
                        if (i % __.NUM_COLS === 0 && i !== 0) {
                            starty += (__.ROW_HEIGHT);
                            startx = 0;
                        }
                        riskbg.append("rect")
                            .attr("fill", fill)
                            .attr("stroke", "#cccccc")
                            .attr("opacity", 1)
                            .attr("width", __.COL_WIDTH)
                            .attr("height", __.ROW_HEIGHT)
                            .attr("x", startx)
                            .attr("y", starty)
                            .attr("id", "rect" + i);
                        startx += (__.W / __.NUM_COLS);
                        i++;
                    }
                    var a = svg.selectAll("g").data(risks).enter().append("a");
                    a
                        .attr("onclick", function (d) { return ""; })
                        .attr("xlink:href", "#")
                        .attr("class", "dss-modalLink")
                        .attr("cursor", "pointer")
                        .attr("dx", function (d) { return d.getX(__); })
                        .attr("dy", function (d) { return d.getY(__); })
                        .attr("id", function (d) { return ("risklink" + d.Id); })
                        .append("text")
                        .attr("fill", __CONFIG.STATUS_BLUE)
                        .attr("id", function (d) { return "circle" + d.Id; })
                        .attr("dx", function (d) { return d.getX(__); })
                        .attr("dy", function (d) { return d.getY(__); })
                        .text(function (d) { return d.Id; })
                        .on("mouseover", function (d) { d3.select("#risktext" + d.Id)["style"]("display", "block"); })
                        .on("mouseout", function (d) { d3.select("#risktext" + d.Id)["style"]("display", "none"); });
                    var textPosX = __.WP, textPosY = 0;
                    if ($__container.data("textposition")) {
                        var pos = $__container.data("textposition");
                        if (pos = "bottom") {
                            textPosX = 0;
                            textPosY = __.HP;
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
                        .html(function (d) { return ("Alvorlighetsgrad: " + d.Consequence); });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                        .html(function (d) { return ("Sannsynlighet: " + d.Probability); });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX).attr("style", "font-weight:bold")
                        .html(function (d) { return ("Sum Risiko: " + d.getSum()); });
                    if (__.SHOW_LEGEND) {
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
                    $__container.fadeTo("fast", 1);
                });
            }
            ;
            function HandleResize($__container) {
                var rtime, timeout = false, delta = 200;
                jQuery(window).resize(function () {
                    rtime = new Date();
                    if (timeout === false) {
                        timeout = true;
                        setTimeout(_resizeend, delta);
                    }
                });
                function _resizeend() {
                    if (new Date() - rtime < delta) {
                        setTimeout(_resizeend, delta);
                    }
                    else {
                        timeout = false;
                        RenderMatrix();
                    }
                }
                ;
            }
            ;
            function init() {
                var $__container = jQuery(__CONFIG.CONTAINER), $__viewSelector = jQuery(__CONFIG.VIEWSELECTOR);
                $__container.css("transition", "all .3s");
                HandleResize($__container);
                RenderMatrix();
                RenderViewSelector($__viewSelector);
            }
            RiskMarix.init = init;
            ;
            ExecuteOrDelayUntilBodyLoaded(init);
        })(RiskMarix = Project.RiskMarix || (Project.RiskMarix = {}));
    })(Project = GT.Project || (GT.Project = {}));
})(GT || (GT = {}));
;
