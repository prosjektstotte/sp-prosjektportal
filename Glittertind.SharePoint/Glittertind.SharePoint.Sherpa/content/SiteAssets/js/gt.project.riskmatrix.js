var GT;
(function (GT) {
    var Project;
    (function (Project) {
        var RiskMatrix;
        (function (RiskMatrix) {
            var __RISKS = [], __VIEWS = [], __CURRENT_VIEW = null;
            var __CONFIG = {
                RISK_LIST_NAME: "Usikkerhet",
                CONTAINER: "#gt-riskmatrix",
                VIEW_SELECTOR: "#gt-riskmatrix-viewselector",
                POST_ACTION_CHECKBOX: "#gt-riskmatrix-postaction",
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
            var CSSStyles = "\n    <style type=\"text/css\">\n    #gt-riskmatrix{margin-bottom:20px}#gt-riskmatrix svg.riskSVG .dss-risk-legendtext{font-size:13px}\n    #gt-riskmatrix svg.riskSVG rect:hover{opacity:.9}#gt-riskmatrix svg.riskSVG a text{font-size:15px;font-size:1.5vw;transition:all .2s}\n    @media screen and (min-width:1440px){#gt-riskmatrix svg.riskSVG a text{font-size:20px}}\n    @media screen and (max-width:1035px){#gt-riskmatrix svg.riskSVG a text{font-size:15px}}\n    #gt-riskmatrix svg.riskSVG a:hover text{font-size:20px;font-size:1.7vw}\n    </style>\n    ";
            var RiskItem = (function () {
                function RiskItem(fieldValues) {
                    this.Id = fieldValues.ID;
                    this.Title = fieldValues.Title;
                    this.Text = fieldValues.GtRiskAction;
                    this.Consequence = fieldValues.GtRiskConsequence;
                    this.Probability = fieldValues.GtRiskProbability;
                    this.RiskFactor = fieldValues.GtRiskFactor;
                    this.ProbabilityPostAction = fieldValues.GtRiskProbabilityPostAction;
                    this.ConsequencePostAction = fieldValues.GtRiskConsequencePostAction;
                    this.RiskFactiorPostAction = fieldValues.GtRiskFactiorPostAction;
                }
                ;
                RiskItem.prototype.getX = function (c) {
                    var x = (c.SHOW_LEGEND) ?
                        ((c.W / c.NUM_COLS) * (c.POST_ACTION ? this.ConsequencePostAction : this.Consequence)) + (c.W / 10) - 18 :
                        ((c.W / c.NUM_COLS) * (c.POST_ACTION ? this.ConsequencePostAction : this.Consequence)) - (c.W / 10) - 9;
                    if (this.Id >= 10) {
                        x -= 10;
                    }
                    if ([1, 5, 7].indexOf(this.Placement) !== -1) {
                        x -= (c.W / 20);
                    }
                    else if ([2, 6, 8].indexOf(this.Placement) !== -1) {
                        x += (c.W / 20);
                    }
                    return x;
                };
                ;
                RiskItem.prototype.getY = function (c) {
                    var y = (c.SHOW_LEGEND) ?
                        c.H - (((c.H / c.NUM_ROWS * (c.POST_ACTION ? this.ProbabilityPostAction : this.Probability))) - (c.H / 10) + (c.H / c.NUM_ROWS) - 2) :
                        c.H - (((c.H / c.NUM_ROWS) * (c.POST_ACTION ? this.ProbabilityPostAction : this.Probability)) - (c.H / c.NUM_ROWS) + (c.HALF_ROW_HEIGHT) - 10);
                    if ([3, 5, 6].indexOf(this.Placement) !== -1) {
                        y -= (c.H / 18);
                    }
                    else if ([4, 7, 8].indexOf(this.Placement) !== -1) {
                        y += (c.H / 18);
                    }
                    return y;
                };
                ;
                RiskItem.prototype.getSum = function (c) {
                    return c.POST_ACTION ? (this.Probability * this.Consequence) : (this.ProbabilityPostAction * this.ConsequencePostAction);
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
                function MatrixConfig($__container, postAction) {
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
                    this.POST_ACTION = postAction;
                }
                return MatrixConfig;
            }());
            ;
            /**
             * Get risks
             *
             * @param {string} viewQuery View Query
             */
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
                        return new RiskItem(fieldValues);
                    });
                    def.resolve(__RISKS);
                }, def.reject);
                return def.promise();
            }
            ;
            /**
             * Get views
             */
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
            /**
             * Render View Selector
             */
            function RenderViewSelector() {
                var $__viewSelector = jQuery(__CONFIG.VIEW_SELECTOR);
                GetViews().then(function (views) {
                    var _outHtml = views
                        .filter(function (v) { return v.Title !== ""; })
                        .map(function (v) { return "<option value=\"" + v.ID + "\">" + v.Title + "</option>"; }).join("");
                    $__viewSelector
                        .html(_outHtml)
                        .on("change", function () {
                        var viewId = $__viewSelector.val(), view = __VIEWS.filter(function (v) { return v.ID === viewId; })[0];
                        RenderMatrix(view);
                        __CURRENT_VIEW = view;
                    });
                });
            }
            ;
            /**
             * Render Matrix
             *
             * @param {View} view The view
             * @param {boolean} postAction Use post action values
             */
            function RenderMatrix(view, postAction) {
                if (view === void 0) { view = null; }
                if (postAction === void 0) { postAction = false; }
                var $__container = jQuery(__CONFIG.CONTAINER), __ = new MatrixConfig($__container, postAction);
                $__container
                    .fadeTo("fast", 0)
                    .empty()
                    .append(CSSStyles);
                var viewQuery = view ? view.ViewQuery : "";
                GetRisks(viewQuery).then(function (risks) {
                    if (__.POST_ACTION) {
                        risks = risks.filter(function (risk) {
                            return (risk.ConsequencePostAction !== null && risk.ProbabilityPostAction !== null);
                        });
                    }
                    risks.forEach(function (risk) {
                        var placement = 0, identicalRisks = jQuery.grep(risks, function (e) {
                            return __.POST_ACTION
                                ? (e.ConsequencePostAction === risk.ConsequencePostAction && e.ProbabilityPostAction === risk.ProbabilityPostAction)
                                : (e.Consequence === risk.Consequence && e.Probability === risk.Probability);
                        });
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
                        .attr("onclick", function (d) { return "SP.UI.ModalDialog.showModalDialog({ url: '" + _spPageContextInfo.webServerRelativeUrl + "/Lists/Usikkerhet/DispForm.aspx?ID=" + d.Id + "' })"; })
                        .attr("xlink:href", "#")
                        .attr("cursor", "pointer")
                        .attr("dx", function (d) { return d.getX(__); })
                        .attr("dy", function (d) { return d.getY(__); })
                        .attr("id", function (d) { return "risklink" + d.Id; })
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
                        .html(function (d) { return "Alvorlighetsgrad: " + d.Consequence; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX)
                        .html(function (d) { return "Sannsynlighet: " + d.Probability; });
                    txt.append("tspan").attr("dy", 22).attr("x", textPosX).attr("style", "font-weight:bold")
                        .html(function (d) { return "Sum Risiko: " + d.getSum(__); });
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
            /**
             * Handle resize
             */
            function HandleResize() {
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
                        jQuery(__CONFIG.CONTAINER).empty();
                        jQuery(__CONFIG.CONTAINER).css("opacity", "0");
                        timeout = false;
                        var postAction = (jQuery(__CONFIG.POST_ACTION_CHECKBOX + ":checked").length) ? true : false;
                        RenderMatrix(__CURRENT_VIEW, postAction);
                    }
                }
                ;
            }
            ;
            /**
             * Initializes the Risk Matrix
             */
            function _init() {
                var $__container = jQuery(__CONFIG.CONTAINER);
                $__container.css("transition", "all .3s");
                HandleResize();
                RenderMatrix();
                RenderViewSelector();
                jQuery(__CONFIG.POST_ACTION_CHECKBOX).change(function (event) {
                    $__container.empty();
                    RenderMatrix(__CURRENT_VIEW, event.target["checked"]);
                });
            }
            ;
            ExecuteOrDelayUntilBodyLoaded(_init);
        })(RiskMatrix = Project.RiskMatrix || (Project.RiskMatrix = {}));
    })(Project = GT.Project || (GT.Project = {}));
})(GT || (GT = {}));
;
